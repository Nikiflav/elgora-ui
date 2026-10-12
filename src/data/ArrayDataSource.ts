import { evalFilter, type FilterFunctionRegistry } from "./filter";
import type { ChangeSet, SaveChangesResult } from "./ChangeSet";
import type { RowIdentity } from "./RowIdentity";
import type { DataSource, QueryArgs, DataResult } from "./DataSource";
import { calculateSummaryResults } from "./summary";

/** DataSource implementation backed by an in-memory array. */
export class ArrayDataSource<T> implements DataSource<T> {
    readonly array: Array<T>;
    private _parentField?: string;
    private _filterFunctions?: FilterFunctionRegistry;
    private readonly _idField: string;

    /** Only assigned when `options.parentField` is given, so plain flat arrays don't get flagged as hierarchical. */
    getRowId?: (row: T) => any;
    hasChildren?: (row: T) => Promise<boolean>;

    constructor(array: Array<T>, options?: { parentField?: string, idField?: string, filterFunctions?: FilterFunctionRegistry }) {
        this.array = array;
        this._filterFunctions = options?.filterFunctions;

        const idField = this._idField = options?.idField ?? "id";
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

        if (args.totalSummary?.length) {
            result.totalSummary = await calculateSummaryResults(
                workingSet,
                args.totalSummary,
                async (row, field) => (row as any)[field]
            );
        }

        const skip = args.skip ?? 0;
        const top = args.top ?? workingSet.length;
        result.dataItems = workingSet.slice(skip, skip + top);

        return result;
    }

    async indexOfRow(row: T): Promise<number> {
        return this.array.indexOf(row);
    }

    /**
     * Applies a ChangeSet directly to the backing array.
     *
     * ArrayDataSource uses the change key to find existing rows. Inserted rows
     * keep the supplied key because there is no server that can assign a new
     * identity; therefore the successful result never needs keyMappings.
     *
     * The complete batch is validated before the array is changed, so a bad
     * key does not leave a partially applied in-memory update.
     *
     * @example
     * await source.saveChanges?.([
     *     { type: "update", key: 1, data: { amount: 25 } },
     *     { type: "remove", key: 2 }
     * ]);
     */
    async saveChanges(changes: ChangeSet): Promise<SaveChangesResult> {
        const workingKeys = new Set<RowIdentity>(
            this.array.map(row => (row as any)[this._idField])
        );

        for (const change of changes) {
            if (change.type === "insert") {
                const data = change.data ?? {};
                const key = change.key ?? data[this._idField] as RowIdentity | undefined;
                if (key === undefined) return { success: false, error: `Failed to insert row. Insert is missing key '${this._idField}'.` };
                if (data[this._idField] !== undefined && data[this._idField] !== key)
                    return { success: false, error: `Failed to insert row. Insert key does not match '${this._idField}'.` };
                if (workingKeys.has(key)) return { success: false, error: `Failed to insert row. Duplicate row key: ${String(key)}.` };
                workingKeys.add(key);
                continue;
            }

            if (change.key === undefined || !workingKeys.has(change.key))
                return { success: false, error: `Failed to ${change.type === "remove" ? "delete" : "update"} row. Unknown row key: ${String(change.key)}.` };
            if (change.type === "update" && change.data?.[this._idField] !== undefined
                && change.data[this._idField] !== change.key)
                return { success: false, error: `Failed to update row. Update cannot change '${this._idField}'.` };
            if (change.type === "remove") workingKeys.delete(change.key);
        }

        for (const change of changes) {
            if (change.type === "insert") {
                const data = { ...(change.data ?? {}) } as Record<string, unknown>;
                const key = change.key ?? data[this._idField] as RowIdentity;
                data[this._idField] = key;
                this.array.push(data as T);
                continue;
            }

            const index = this.array.findIndex(row => (row as any)[this._idField] === change.key);
            if (index < 0) continue;
            if (change.type === "remove") this.array.splice(index, 1);
            else Object.assign(this.array[index] as any, change.data ?? {});
        }

        return { success: true };
    }
}
