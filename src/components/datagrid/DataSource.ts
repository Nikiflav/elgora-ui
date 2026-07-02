import { Utils } from "../../core/Utils";
import { DataFilter, evalFilter } from "../../data/filter";
import { DataColumn, OrderByToken, SummaryType } from "./DataColumn";



export interface QueryArgs {
    filter?: DataFilter;
    orderby?: OrderByToken[];
    select?: string[];
    skip?: number;
    top?: number;
    groupColumn?: string;
    groupSummary?: { field: string, summaryType: SummaryType }[];
    requireTotalCount?: boolean;
    abortSignal?: AbortSignal;
}

export type GroupItem = {
    groupField: string;
    groupValue: any;
    count: number;
    summaryValues?: Record<string, any>;
};

export interface DataResult<TRow> {
    totalCount?: number;
    args: QueryArgs;
    dataItems?: TRow[];
    groups?: GroupItem[]; // Used exclusively when args.groupBy is present
}

export interface DataSource<TRow> {
    loadData(args: QueryArgs): Promise<DataResult<TRow>>;
    getRowKey?(row: TRow): any;
    get supportsGrouping(): boolean;
}

export class LocalGroupingDataSource<TRow> implements DataSource<TRow> {



    constructor(
        private ds: DataSource<TRow>,
        private getValue: (row: TRow, column: string) => Promise<any>
    ) {

    }

    async loadData(args: QueryArgs): Promise<DataResult<TRow>> {

        if (!this.ds.supportsGrouping && args.groupColumn) {

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


            const flatResult = await this.ds.loadData(flatArgs);

            const map = new Map<any, GroupItem>();
            for (let r of flatResult.dataItems!) {
                const groupValue = (await this.getValue(r, args.groupColumn!)) ?? '';
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
            groups.sort((a, b) => {
                return a.groupValue < b.groupValue ? -1 : 1;
            })
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

    getRowKey(row: TRow): any {
        return this.ds.getRowKey?.(row);
    }

    get supportsGrouping(): boolean {
        return true;
    }
}

export class ArrayDataSource<T> implements DataSource<T> {
    readonly array: Array<T>;

    // Switch to true so the grid can natively group local arrays!
    get supportsGrouping(): boolean {
        return false;
    }

    constructor(array: Array<T>) {
        this.array = array;
    }

    async loadData(args: QueryArgs): Promise<DataResult<T>> {
        // 1. Filter and sort.
        let workingSet = args.filter ? this.array.filter(item => evalFilter(<any>item, args.filter!)) : [...this.array];
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