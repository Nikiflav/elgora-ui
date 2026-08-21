import { Utils } from "../../core/Utils";
import { DataFilter, evalFilter } from "../../data/filter";
import { DataColumn, DataColumnUtils, GroupInterval, GroupIntervalDefinition, OrderByToken, SummaryDefinition, SummaryType } from "./DataColumn";
import type { FilterFunctionRegistry } from "../../data/filter";



/** A single page/query request made against a DataSource. */
export interface QueryArgs {
    filter?: DataFilter;
    orderby?: OrderByToken[];
    /** Field names to include; omit to fetch all fields. */
    select?: string[];
    skip?: number;
    top?: number;
    /** Column to bucket rows by; when set, the result carries `groups` instead of `dataItems`. */
    groupColumn?: string;
    /** Interval requested for groupColumn; arbitrary strings may be server-defined. */
    groupInterval?: GroupInterval;
    /** Aggregations to compute per group, per field. */
    groupSummary?: { field: string, summaryType: SummaryType }[];
    /** Value to match against the data source's parent-reference field; present only in hierarchical (parent/child) mode. */
    parentId?: any;
    /** Whether the caller needs an accurate total row/group count back. */
    requireTotalCount?: boolean;
    abortSignal?: AbortSignal;
}

/** A single group bucket produced when a QueryArgs.groupColumn is set. */
export type GroupItem = {
    groupField: string;
    groupValue: any;
    count: number;
    /** Aggregated values, keyed by field name, per QueryArgs.groupSummary. */
    summaryValues?: Record<string, any>;
};

type SummaryAccumulator = {
    definition: SummaryDefinition<any, any, any>;
    state: any;
};

function isNumericSummary(summaryType: SummaryType): boolean {
    return summaryType === "sum" || summaryType === "min" || summaryType === "max";
}

const standardSummaries: Record<string, SummaryDefinition<any, any, any>> = {
    count: {
        name: "count",
        text: "Count",
        start: () => 0,
        accumulate: state => state + 1,
        finalize: state => state
    },
    distinct: {
        name: "distinct",
        text: "Distinct",
        start: () => new Set<any>(),
        accumulate: (state, value) => state.add(value),
        finalize: state => state.size
    },
    sum: {
        name: "sum",
        text: "Sum",
        start: () => ({ value: 0, hasValue: false }),
        accumulate: (state, value) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                state.value += value;
                state.hasValue = true;
            }
        },
        finalize: state => state.hasValue ? state.value : undefined
    },
    min: {
        name: "min",
        text: "Minimum",
        start: () => ({ value: Infinity, hasValue: false }),
        accumulate: (state, value) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                state.value = Math.min(state.value, value);
                state.hasValue = true;
            }
        },
        finalize: state => state.hasValue ? state.value : undefined
    },
    max: {
        name: "max",
        text: "Maximum",
        start: () => ({ value: -Infinity, hasValue: false }),
        accumulate: (state, value) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                state.value = Math.max(state.value, value);
                state.hasValue = true;
            }
        },
        finalize: state => state.hasValue ? state.value : undefined
    }
};

/** The response to a QueryArgs request: either flat data rows or, when grouping, group buckets. */
export interface DataResult<TRow> {
    totalCount?: number;
    args: QueryArgs;
    dataItems?: TRow[];
    /** Used exclusively when args.groupColumn is set. */
    groups?: GroupItem[];
}
/** Represents data row ID. */
export type RowIdentity = string | number;

/** Query-level access to row data, with optional native grouping support. */
export interface DataSource<TRow> {
    /**
     * Loads a page of rows or grouped records.
     *
     * When `args.groupColumn` is not provided, the datasource should return
     * `dataItems` containing the requested page of rows. When grouping is
     * requested and the datasource supports it, it should return `groups`,
     * where each group contains its key, row count, and any requested
     * `groupSummary` values. A supported grouped query may legitimately
     * return `groups: []` when no rows match the query; callers must not
     * interpret that as a request to perform grouping locally.
     *
     * For a grouped request that the datasource does not handle, it should
     * return a result with both `dataItems` and `groups` undefined.
     * `LocalGroupingDataSource` uses that response as the signal to issue a
     * second flat request, then performs grouping and supported summaries
     * locally. The server should not return a partial flat page for the
     * grouped request because the local datasource will make that flat
     * request itself.
     *
     * `skip` and `top` apply to the returned rows or groups. `totalCount`,
     * when requested, must describe the complete result before pagination.
     * Implementations should preserve `args` in the returned `DataResult` so
     * consumers can associate a response with the query that produced it.
     *
     * @param args Query, filtering, grouping, pagination, and summary options.
     * @returns The loaded rows or groups and optional total count.
     */
    loadData(args: QueryArgs): Promise<DataResult<TRow>>;
    
    /** Returns a stable identity for a row, used as its render key and, in hierarchical mode, as the parentId for its children. */
    getRowId?(row: TRow): RowIdentity;

    /** Presence marks this source as hierarchical (parent/child) and disables groupColumns; answers per-row expandability. */
    hasChildren?(row: TRow): Promise<boolean>;
}

export class LocalGroupingDataSource<TRow> implements DataSource<TRow> {



    constructor(
        private ds: DataSource<TRow>,
        private getValue: (row: TRow, column: string) => Promise<any>,
        private getColumn?: (column: string) => DataColumn<TRow> | undefined,
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

            flatArgs.select = Array.from(select);


            // A flat response may be only the requested page; reload without paging so
            // client-side fallback grouping sees the complete filtered set.
            const flatResult = await this.ds.loadData(flatArgs);

            const map = new Map<any, GroupItem>();
            const summaryStates = new Map<any, Map<string, SummaryAccumulator>>();
            for (let r of flatResult.dataItems ?? []) {
                const groupValue = column
                    ? await DataColumnUtils.getGroupValue(column, r, this.customIntervals)
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
                                || summaryColumn.editorType === "number"
                                || (!summaryColumn.editorType && typeof value === "number");
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
                totalCount: map.size
            };
        }
        return this.ds.loadData(args);
    }

    getRowId(row: TRow): any {
        return this.ds.getRowId?.(row);
    }

}

/** DataSource implementation backed by an in-memory array. */
export class ArrayDataSource<T> implements DataSource<T> {
    readonly array: Array<T>;
    private _parentField?: string;
    private _filterFunctions?: FilterFunctionRegistry;

    /** Only assigned when `options.parentField` is given, so plain flat arrays don't get flagged as hierarchical. */
    getRowId?: (row: T) => any;
    hasChildren?: (row: T) => Promise<boolean>;

    constructor(array: Array<T>, options?: { parentField?: string, idField?: string, filterFunctions?: FilterFunctionRegistry }) {
        this.array = array;
        this._filterFunctions = options?.filterFunctions;

        const idField = options?.idField ?? "id";
        if (options?.parentField) {
            const parentField = this._parentField = options.parentField;
            this.getRowId = (row: T) => (row as any)[idField];
            this.hasChildren = async (row: T) => {
                const id = this.getRowId!(row);
                return this.array.some(item => (item as any)[parentField] === id);
            };
        }
    }

    async loadData(args: QueryArgs): Promise<DataResult<T>> {
        // 1. Filter and sort.
        let workingSet = this._parentField && args.parentId !== undefined
            ? this.array.filter(item => (item as any)[this._parentField!] === args.parentId)
            : [...this.array];
        if (args.filter) workingSet = workingSet.filter(item => evalFilter(<any>item, args.filter!, this._filterFunctions));
        if (args.orderby) {
            workingSet.sort((a, b) => {
                for (const token of args.orderby!) {
                    const aVal = (a as any)[token[0]];
                    const bVal = (b as any)[token[0]];
                    const desc = token[1] === "desc";
                    if (aVal < bVal) return desc ? 1 : -1;
                    if (aVal > bVal) return desc ? -1 : 1;
                }
                return 0;
            });
        }

        const result: DataResult<T> = {
            args: args
        };
        if (args.requireTotalCount) {
            result.totalCount = workingSet.length;
        }

        const skip = args.skip ?? 0;
        const top = args.top ?? workingSet.length;
        result.dataItems = workingSet.slice(skip, skip + top);

        return result;
    }

    async indexOfRow(row: T): Promise<number> {
        return this.array.indexOf(row);
    }
}
