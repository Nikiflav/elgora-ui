import type { DataSource, QueryArgs, DataResult, GroupItem } from "./DataSource";
import { getLocalQueryEngine } from "./LocalQueryEngine";
import { createGroupValueGetter, normalizeGroupValue, type GroupIntervalDefinition } from "./grouping";
import type { DataField } from "./DataField";
import { calculateSummaryResults, SummaryCalculator, type SummaryDefinition } from "./summary";
import { isPromiseLike } from "./localProcessing";
import { LocalQueryCache, LocalQueryKeys } from "./LocalQueryCache";

/**
 * Delegates supported queries to its source and supplies local grouping/summary fallback.
 * Complete local group/summary results are cached for ArrayDataSource and DataTable,
 * following its revision. Each adapter retains up to eight query results; field
 * metadata and callback identities participate in the keys. Changes to captured
 * external data require source.invalidateCache(). Remote results are not cached.
 */
export class LocalGroupingDataSource<TRow> implements DataSource<TRow> {
    private readonly queryKeys = new LocalQueryKeys();
    private readonly queryCache = new LocalQueryCache<DataResult<TRow>>();
    private sourceRevision = -1;
    /** Exposed only when the wrapped source supports new-row sessions. */
    readonly createNewRow?: DataSource<TRow>["createNewRow"];
    /** Exposed only when the wrapped source supports updates. */
    readonly update?: DataSource<TRow>["update"];
    /** Exposed only when the wrapped source supports deletion. */
    readonly delete?: DataSource<TRow>["delete"];
    /** Delegated row identity and hierarchy capabilities, without inventing unsupported ones. */
    readonly getRowId?: DataSource<TRow>["getRowId"];
    readonly hasChildren?: DataSource<TRow>["hasChildren"];
    /** The original event, including pending-row notifications; no second event or subscription. */
    get changed(): DataSource<TRow>["changed"] { return this.ds.changed; }
    /** The source's shared coordinator; the grouping adapter owns no separate history. */
    get undoCoordinator(): DataSource<TRow>["undoCoordinator"] { return this.ds.undoCoordinator; }
    constructor(
        private ds: DataSource<TRow>,
        private getValue: (row: TRow, column: string) => any | Promise<any>,
        private getColumn?: (column: string) => DataField<TRow> | undefined,
        private customIntervals?: GroupIntervalDefinition<TRow>[],
        private customSummaries?: SummaryDefinition<TRow, any, any>[]
    ) {
        this.createNewRow = ds.createNewRow?.bind(ds);
        this.update = ds.update?.bind(ds);
        this.delete = ds.delete?.bind(ds);
        this.getRowId = ds.getRowId?.bind(ds);
        this.hasChildren = ds.hasChildren?.bind(ds);
    }

    async loadData(args: QueryArgs): Promise<DataResult<TRow>> {
        // Remote sources retain their own cache policy. Built-in local sources
        // explicitly provide the revision-controlled engine capability.
        const engine = getLocalQueryEngine(this.ds);
        if (!engine || (!args.groupBy?.length && !args.totalSummary?.length))
            return this.loadUncached(args);
        const revision = engine.revision;
        if (this.sourceRevision !== revision) {
            this.queryCache.clear();
            this.sourceRevision = revision;
        }
        // Definitions can be patched in place by the grid. Capture the relevant
        // metadata/callback identities, rather than the column object's identity.
        const names = new Set([...args.groupBy?.map(group => group.field) ?? [], ...args.groupSummary?.map(summary => summary.field) ?? [],
            ...args.totalSummary?.map(summary => summary.field) ?? []]);
        const fields = [...names].filter((name): name is string => name !== undefined).map(name => {
            const field = this.getColumn?.(name);
            return [name, field?.name, field?.dataType, field?.groupInterval,
                this.queryKeys.value(field?.getValue)];
        });
        const configuration = [fields, this.customIntervals?.map(interval =>
            [interval.name, this.queryKeys.value(interval.getGroupValue)]), this.customSummaries?.map(summary =>
            [summary.name, summary.dependsOnOrder, this.queryKeys.value(summary.start),
                this.queryKeys.value(summary.accumulate), this.queryKeys.value(summary.finalize)])];
        const key = this.queryKeys.query(args, configuration);
        let result = this.queryCache.get(key);
        if (!result) {
            result = await this.loadUncached({ ...args, skip: undefined, top: undefined, requireTotalCount: true });
            // A mutation/manual reset while an async accessor ran must not publish
            // an obsolete calculation into the current cache. Failed work never gets here.
            if (revision === engine.revision && !args.abortSignal?.aborted) this.queryCache.set(key, result);
        }
        const skip = args.skip ?? 0;
        const page = <T>(items: T[]) => items.slice(skip, skip + (args.top ?? items.length));
        return { ...result, args,
            totalCount: args.groupBy?.length || args.requireTotalCount ? result.totalCount : undefined,
            dataItems: result.dataItems ? page(result.dataItems) : undefined,
            groups: result.groups ? page(result.groups).map(copyGroup) : undefined,
            totalSummary: result.totalSummary?.map(summary => ({ ...summary })) };
    }

    private async loadUncached(args: QueryArgs): Promise<DataResult<TRow>> {
        if (args.groupBy?.length) {
            // Plain arrays need the adapter's field metadata/custom summaries;
            // do not first calculate raw-property summaries that will be discarded.
            const serverResult = await this.ds.loadData(getLocalQueryEngine(this.ds)
                ? { ...args, totalSummary: undefined } : args);
            if (serverResult?.groups) return serverResult;

            // Load all items in memory and then group them.
            const flatArgs: QueryArgs = { ...args };
            delete flatArgs.groupBy;
            delete flatArgs.groupSummary;
            delete flatArgs.skip;
            delete flatArgs.top;
            delete flatArgs.totalSummary;

            const select = new Set<string>();
            for (const group of args.groupBy) select.add(group.field);
            if (args.groupSummary)
                for (let g of args.groupSummary)
                    select.add(g.field);
            if (args.totalSummary)
                for (let summary of args.totalSummary)
                    select.add(summary.field);

            flatArgs.select = Array.from(select);


            // A flat response may be only the requested page; reload without paging so
            // client-side fallback grouping sees the complete filtered set.
            const flatResult = await this.ds.loadData(flatArgs);
            const totalCalculator = args.totalSummary?.length
                ? new SummaryCalculator(args.totalSummary, this.getValue, this.getColumn, this.customSummaries)
                : undefined;

            type Bucket = { group: GroupItem; children: Map<any, Bucket>; calculator?: SummaryCalculator<TRow> };
            const map = new Map<any, Bucket>();
            const levels = args.groupBy.map(descriptor => {
                const column = this.getColumn?.(descriptor.field);
                // The serializable query owns interval selection, for local and remote alike.
                const field = { ...column, name: descriptor.field, groupInterval: descriptor.interval };
                const getValue = createGroupValueGetter(field, this.customIntervals,
                    column ? getLocalQueryEngine(this.ds)?.getValue ?? this.getValue : this.getValue);
                const token = args.orderby?.find(token => (typeof token === "string" ? token : token[0]) === descriptor.field);
                return { descriptor, getValue, desc: Array.isArray(token) && token[1] === "desc" };
            });
            // Reuse only within a row. Never cache across queries or data changes.
            const values = args.groupSummary?.length ? new Map<string, any>() : undefined;
            for (let r of flatResult.dataItems ?? []) {
                values?.clear();
                const totalPending = totalCalculator?.accumulate(r, values);
                if (isPromiseLike(totalPending)) await totalPending;
                let siblings = map;
                for (const level of levels) {
                    const raw = level.getValue(r);
                    const groupValue = normalizeGroupValue(isPromiseLike(raw) ? await raw : raw);
                    let bucket = siblings.get(groupValue);
                    if (!bucket) {
                        bucket = { group: { groupField: level.descriptor.field, groupValue, count: 0 }, children: new Map() };
                        if (args.groupSummary?.length) bucket.calculator = new SummaryCalculator(args.groupSummary,
                            this.getValue, this.getColumn, this.customSummaries, groupValue);
                        siblings.set(groupValue, bucket);
                    }
                    bucket.group.count++;
                    const pending = bucket.calculator?.accumulate(r, values);
                    if (isPromiseLike(pending)) await pending;
                    siblings = bucket.children;
                }
            }

            const finish = async (siblings: Map<any, Bucket>, index: number): Promise<GroupItem[]> => {
                const groups: GroupItem[] = [];
                for (const { group, children, calculator } of siblings.values()) {
                    if (calculator) group.summaryValues = Object.fromEntries(
                        (await calculator.finalize()).map(summary => [summary.field, summary.value]));
                    if (index + 1 < levels.length) group.groups = await finish(children, index + 1);
                    groups.push(group);
                }
                groups.sort((a, b) => {
                    if (a.groupValue === b.groupValue) return 0;
                    const result = a.groupValue === null ? -1 : b.groupValue === null ? 1
                        : a.groupValue === "" ? -1 : b.groupValue === "" ? 1 : a.groupValue < b.groupValue ? -1 : 1;
                    return levels[index].desc ? -result : result;
                });
                return groups;
            };
            const allGroups = await finish(map, 0);
            const totalSummary = await totalCalculator?.finalize();
            const skip = args.skip ?? 0;
            const groups = allGroups.slice(skip, skip + (args.top ?? allGroups.length));

            return {
                args: args,
                groups: groups,
                totalCount: map.size,
                totalSummary
            };
        }

        if (args.totalSummary?.length && getLocalQueryEngine(this.ds)) {
            // Query/filter/sort once, calculate with the adapter's field access,
            // then apply paging. Remote sources retain full ownership of totals.
            const allResult = await this.ds.loadData({
                ...args,
                skip: undefined,
                top: undefined,
                totalSummary: undefined
            });
            const rows = allResult.dataItems ?? [];
            const totalSummary = await calculateSummaryResults(
                rows,
                args.totalSummary,
                this.getValue,
                this.getColumn,
                this.customSummaries
            );
            const skip = args.skip ?? 0;
            return { ...allResult, args, totalSummary,
                dataItems: rows.slice(skip, skip + (args.top ?? rows.length)) };
        }
        return this.ds.loadData(args);
    }

}

/** Copies metadata containers, not application values or callback results. */
function copyGroup(group: GroupItem): GroupItem {
    return { ...group,
        ...(group.summaryValues ? { summaryValues: { ...group.summaryValues } } : {}),
        ...(group.groups ? { groups: group.groups.map(copyGroup) } : {}) };
}
