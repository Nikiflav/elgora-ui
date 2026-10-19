import { prepareFilter, type FilterFunctionRegistry } from "./filter";
import { calculateSummaryResults, type SummaryResult } from "./summary";
import { LocalQueryCache, LocalQueryKeys } from "./LocalQueryCache";
import type { DataSource, QueryArgs, DataResult } from "./DataSource";

/** @internal Capability shared only by built-in, revision-controlled local sources. */
export const localQueryEngine = Symbol("localQueryEngine");

/** @internal Does not infer cache safety merely from a remote source's revision property. */
export function getLocalQueryEngine<TRow>(source: DataSource<TRow>): LocalQueryEngine<TRow> | undefined {
    return (source as DataSource<TRow> & { [localQueryEngine]?: LocalQueryEngine<TRow> })[localQueryEngine];
}

/** @internal Shared filtering, stable sorting, totals and bounded caches; never converts source rows. */
export class LocalQueryEngine<TRow> {
    private _revision = 0;
    private readonly queryKeys = new LocalQueryKeys();
    private readonly rowCache = new LocalQueryCache<TRow[]>();
    private readonly summaryCache = new LocalQueryCache<SummaryResult[]>();
    readonly getValue: (row: TRow, field: string) => any;

    constructor(
        private readonly getRows: () => Iterable<TRow>,
        private readonly readMember?: (row: TRow, field: string) => any,
        private readonly options: { parentField?: string; filterFunctions?: () => FilterFunctionRegistry | undefined } = {}
    ) {
        this.getValue = readMember ?? ((row, field) => (row as any)[field]);
    }

    get revision(): number { return this._revision; }

    /** Clears derived results immediately, independently of deferred UI notifications. */
    invalidate(): void {
        this._revision++;
        this.rowCache.clear();
        this.summaryCache.clear();
    }

    /** Snapshots row membership/order, preserves row/value references and returns independent pages. */
    async loadData(args: QueryArgs): Promise<DataResult<TRow>> {
        const revision = this._revision;
        const rowKey = this.queryKeys.query({ filter: args.filter, orderby: args.orderby, parentId: args.parentId });
        let rows = this.rowCache.get(rowKey);
        if (!rows) {
            const predicate = args.filter?.length
                ? prepareFilter(args.filter, this.options.filterFunctions?.(), this.readMember) : undefined;
            const parentField = this.options.parentField;
            const filterParent = parentField && args.parentId !== undefined;
            const input = this.getRows();
            if (Array.isArray(input)) {
                rows = predicate || filterParent ? input.filter(row =>
                    (!filterParent || this.getValue(row, parentField) === args.parentId) && (!predicate || predicate(row))) : input.slice();
            } else {
                rows = [];
                for (const row of input) {
                    if (filterParent && this.getValue(row, parentField) !== args.parentId) continue;
                    if (!predicate || predicate(row as any)) rows.push(row);
                }
            }
            if (args.orderby?.length) {
                const order = args.orderby.map(token => typeof token === "string"
                    ? { field: token, direction: 1 } : { field: token[0], direction: token[1] === "desc" ? -1 : 1 });
                if (this.readMember) {
                    // Domain/DataRow access is more expensive than plain properties.
                    // Read each sort key once, then sort indices without calling the
                    // accessor O(N log N) times or copying complete value objects.
                    const source = rows;
                    const keys = order.map(({ field }) => source.map(row => this.getValue(row, field)));
                    const indices = source.map((_row, index) => index);
                    indices.sort((a, b) => {
                        for (let i = 0; i < order.length; i++) {
                            const av = keys[i][a], bv = keys[i][b];
                            if (av < bv) return -order[i].direction;
                            if (av > bv) return order[i].direction;
                        }
                        return 0;
                    });
                    rows = indices.map(index => source[index]);
                } else {
                    rows.sort((a, b) => {
                        for (const { field, direction } of order) {
                            const av = (a as any)[field], bv = (b as any)[field];
                            if (av < bv) return -direction;
                            if (av > bv) return direction;
                        }
                        return 0;
                    });
                }
            }
            if (revision === this._revision && !args.abortSignal?.aborted) this.rowCache.set(rowKey, rows);
        }
        const result: DataResult<TRow> = { args };
        if (args.requireTotalCount) result.totalCount = rows.length;
        if (args.totalSummary?.length) {
            const key = rowKey === undefined ? undefined : this.queryKeys.query({ totalSummary: args.totalSummary }, rowKey);
            let summaries = this.summaryCache.get(key);
            if (!summaries) {
                summaries = await calculateSummaryResults(rows, args.totalSummary, this.getValue);
                if (revision === this._revision && !args.abortSignal?.aborted) this.summaryCache.set(key, summaries);
            }
            result.totalSummary = summaries.map(summary => ({ ...summary }));
        }
        const skip = args.skip ?? 0;
        result.dataItems = rows.slice(skip, skip + (args.top ?? rows.length));
        return result;
    }
}
