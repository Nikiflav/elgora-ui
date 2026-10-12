import type { DataSource, QueryArgs, DataResult, GroupItem } from "./DataSource";
import { ArrayDataSource } from "./ArrayDataSource";
import { getFieldGroupValue, type GroupIntervalDefinition } from "./grouping";
import { getFieldDataType, type DataField } from "./DataField";
import { calculateSummaryResults, isNumericSummary, standardSummaries,
    type SummaryAccumulator, type SummaryDefinition } from "./summary";

/** Delegates supported queries to its source and supplies local grouping/summary fallback. */
export class LocalGroupingDataSource<TRow> implements DataSource<TRow> {



    constructor(
        private ds: DataSource<TRow>,
        private getValue: (row: TRow, column: string) => Promise<any>,
        private getColumn?: (column: string) => DataField<TRow> | undefined,
        private customIntervals?: GroupIntervalDefinition<TRow>[],
        private customSummaries?: SummaryDefinition<TRow, any, any>[]
    ) {

    }

    async loadData(args: QueryArgs): Promise<DataResult<TRow>> {
        if (args.groupColumn) {

            const column = this.getColumn?.(args.groupColumn);
            const serverResult = await this.ds.loadData(args);
            if (serverResult?.groups) return serverResult;

            // Load all items in memory and then group them.
            const flatArgs: QueryArgs = { ...args };
            delete flatArgs.groupColumn;
            delete flatArgs.groupSummary;
            delete flatArgs.skip;
            delete flatArgs.top;

            const select = new Set<string>();
            select.add(args.groupColumn!);
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
            const totalSummary = args.totalSummary?.length
                ? await calculateSummaryResults(
                    flatResult.dataItems ?? [],
                    args.totalSummary,
                    this.getValue,
                    this.getColumn,
                    this.customSummaries
                )
                : undefined;

            const map = new Map<any, GroupItem>();
            const summaryStates = new Map<any, Map<string, SummaryAccumulator>>();
            for (let r of flatResult.dataItems ?? []) {
                const groupValue = column
                    ? await getFieldGroupValue(column, r, this.customIntervals)
                    : (await this.getValue(r, args.groupColumn!)) ?? '';
                let group = map.get(groupValue);
                if (!group) {
                    group = {
                        groupField: args.groupColumn!,
                        groupValue: groupValue,
                        count: 0
                    };
                    map.set(groupValue, group);
                    summaryStates.set(groupValue, new Map());
                }
                group.count++;
                if (args.groupSummary) {
                    group.summaryValues = group.summaryValues || {};
                    const states = summaryStates.get(groupValue)!;
                    for (let g of args.groupSummary) {
                        const value = await this.getValue(r, g.field);
                        let state = states.get(g.field);
                        if (!state) {
                            const definition = standardSummaries[g.summaryType]
                                ?? this.customSummaries?.find(x => x.name === g.summaryType);
                            if (!definition) continue;
                            state = {
                                definition,
                                state: await definition.start({ field: g.field, groupValue, row: r, value })
                            };
                            states.set(g.field, state);
                        }

                        if (isNumericSummary(g.summaryType)) {
                            const summaryColumn = this.getColumn?.(g.field);
                            const numericColumn = !summaryColumn
                                || getFieldDataType(summaryColumn) === "number"
                                || (!summaryColumn.dataType && !summaryColumn.editorType && typeof value === "number");
                            if (!numericColumn || typeof value !== "number" || !Number.isFinite(value))
                                continue;
                        }

                        const context = { field: g.field, groupValue, row: r, value };
                        const nextState = await state.definition.accumulate(state.state, value, r, context);
                        if (nextState !== undefined) state.state = nextState;
                    }
                }
            }

            if (args.groupSummary) {
                for (const [groupValue, states] of summaryStates) {
                    const group = map.get(groupValue)!;
                    for (const summary of args.groupSummary) {
                        const state = states.get(summary.field);
                        if (!state) continue;

                        const value = await state.definition.finalize(
                            state.state,
                            { field: summary.field, groupValue }
                        );
                        if (value !== undefined)
                            group.summaryValues![summary.field] = value;
                    }
                }
            }
            let groups = Array.from(map.values());
            const token = args.orderby?.find(x => (typeof x === "string" ? x : x[0]) === args.groupColumn);
            const desc = Array.isArray(token) && token[1] === "desc";
            groups.sort((a, b) => {
                if (a.groupValue === b.groupValue) return 0;
                const result = a.groupValue < b.groupValue ? -1 : 1;
                return desc ? -result : result;
            });
            if (args.skip || args.top) {
                groups = groups.slice(args.skip ?? 0, (args.skip ?? 0) + (args.top ?? groups.length));
            }

            return {
                args: args,
                groups: groups,
                totalCount: map.size,
                totalSummary
            };
        }

        const result = await this.ds.loadData(args);
        if (args.totalSummary?.length && this.ds instanceof ArrayDataSource) {
            const allResult = await this.ds.loadData({
                ...args,
                skip: undefined,
                top: undefined,
                totalSummary: undefined
            });
            result.totalSummary = await calculateSummaryResults(
                allResult.dataItems ?? [],
                args.totalSummary,
                this.getValue,
                this.getColumn,
                this.customSummaries
            );
        }
        return result;
    }

    getRowId(row: TRow): any {
        return this.ds.getRowId?.(row);
    }

}
