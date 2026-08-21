import { Utils } from "../../core/Utils";
import { DataFilter, evalFilter } from "../../data/filter";
import { DataColumn, DataColumnUtils, GroupInterval, OrderByToken, SummaryType } from "./DataColumn";



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
        private getColumn?: (column: string) => DataColumn<TRow> | undefined
    ) {

    }

    async loadData(args: QueryArgs): Promise<DataResult<TRow>> {

        if (args.groupColumn) {

            const column = this.getColumn?.(args.groupColumn);
            const hasCustomGroupValue = !!column?.getGroupValue;
            const serverArgs: QueryArgs = { ...args };
            if (hasCustomGroupValue) {
                delete serverArgs.groupColumn;
                delete serverArgs.groupInterval;
            }

            const serverResult = hasCustomGroupValue ? undefined : await this.ds.loadData(serverArgs);
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
            for (let r of flatResult.dataItems!) {
                const groupValue = column
                    ? await DataColumnUtils.getGroupValue(column, r)
                    : (await this.getValue(r, args.groupColumn!)) ?? '';
                let group = map.get(groupValue);
                if (!group) {
                    group = {
                        groupField: args.groupColumn!,
                        groupValue: groupValue,
                        count: 0
                    };
                    map.set(groupValue, group);
                }
                group.count++;
                if (args.groupSummary) {
                    group.summaryValues = group.summaryValues || {};
                    for (let g of args.groupSummary) {
                        // TODO: Calculate summary for each group
                        group.summaryValues[g.field] = group.summaryValues[g.field] || 0;
                        group.summaryValues[g.field] += await this.getValue(r, g.field);
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

    /** Only assigned when `options.parentField` is given, so plain flat arrays don't get flagged as hierarchical. */
    getRowId?: (row: T) => any;
    hasChildren?: (row: T) => Promise<boolean>;

    constructor(array: Array<T>, options?: { parentField?: string, idField?: string }) {
        this.array = array;

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
        if (args.filter) workingSet = workingSet.filter(item => evalFilter(<any>item, args.filter!));
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
