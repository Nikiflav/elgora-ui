import type { FilterFunctionRegistry } from "./filter";
import type { RowIdentity } from "./RowIdentity";
import type { DataSource, QueryArgs, DataResult, MutationResult, NewRowSession, DataSourceChanged } from "./DataSource";
import { ObservableEvent } from "../core/ElgoraUI";
import { LocalQueryEngine, localQueryEngine } from "./LocalQueryEngine";

/** Identity, defaults and query configuration for an editable in-memory array. */
export interface ArrayDataSourceOptions<T> {
    parentField?: string;
    /** Identity field for new rows. Default: id. Existing rows are edited by reference. */
    idField?: string;
    filterFunctions?: FilterFunctionRegistry;
    /** Initial values for new plain-object rows. A factory runs independently for every session. */
    defaults?: Partial<T> | (() => Partial<T> | Promise<Partial<T>>);
    /** Generates a string or finite number identity; defaults to crypto.randomUUID(). */
    createRowId?: (source: ArrayDataSource<T>) => RowIdentity | Promise<RowIdentity>;
}

/**
 * Reads and edits the supplied array directly, preserving existing row references.
 * New rows are plain objects and remain outside the array until their session is inserted.
 * Each command emits changed after success. No undo history or server persistence is provided.
 * Filtered/sorted rows and totals are cached (up to eight entries per cache).
 * Confirmed-row mutations invalidate automatically; direct array/object edits and
 * changes to external callback dependencies require invalidateCache().
 */
export class ArrayDataSource<T> implements DataSource<T> {
    readonly array: Array<T>;
    /** Notifications for successful edits, including pending-row edits. */
    readonly changed = new ObservableEvent<DataSourceChanged<T>>();
    private readonly pendingRows = new Map<T, RowIdentity>();
    private readonly reservedKeys = new Set<RowIdentity>();
    private readonly _idField: string;
    /** @internal Shared local query capability. */
    private readonly [localQueryEngine]: LocalQueryEngine<T>;

    /** Query-data version. Successful confirmed-row mutations and invalidateCache() increment it. */
    get revision(): number { return this[localQueryEngine].revision; }

    /**
     * Clears local query caches and notifies consumers with kind "reset".
     * Call after changing the public array/rows directly, or external values used
     * by field accessors, filter functions or custom summaries. Grid refresh alone
     * does not invalidate cached queries. Pending-row changes do not affect queries.
     * @example
     * products[0].price = 42;
     * source.invalidateCache();
     */
    invalidateCache(): void {
        this.clearQueryCaches();
        this.changed.invoke({ kind: "reset" });
    }

    private clearQueryCaches(): void {
        this[localQueryEngine].invalidate();
    }

    /** Only assigned when `options.parentField` is given, so plain flat arrays don't get flagged as hierarchical. */
    getRowId?: (row: T) => any;
    hasChildren?: (row: T) => Promise<boolean>;

    constructor(array: Array<T>, private readonly options: ArrayDataSourceOptions<T> = {}) {
        this.array = array;
        this[localQueryEngine] = new LocalQueryEngine(() => this.array, undefined,
            { parentField: options.parentField, filterFunctions: () => options.filterFunctions });

        const idField = this._idField = options?.idField ?? "id";
        if (options?.parentField) {
            const parentField = options.parentField;
            this.getRowId = (row: T) => (row as any)[idField];
            this.hasChildren = async (row: T) => {
                const id = this.getRowId!(row);
                return this.array.some(item => (item as any)[parentField] === id);
            };
        }
    }

    loadData(args: QueryArgs): Promise<DataResult<T>> {
        return this[localQueryEngine].loadData(args);
    }

    async indexOfRow(row: T): Promise<number> {
        return this.array.indexOf(row);
    }

    /**
     * Applies fields to the actual confirmed or pending row.
     * An equal-value patch emits no notification. The identity cannot be changed.
     * @example
     * await source.update(row, { quantity: 3, price: 20 });
     */
    async update(row: T, values: Record<string, unknown>): Promise<MutationResult> {
        if (!this.array.includes(row) && !this.pendingRows.has(row))
            return { success: false, error: "Failed to update row. Row does not belong to this source." };
        if (row === null || typeof row !== "object")
            return { success: false, error: "Failed to update row. Editing requires an object row." };
        const record = row as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(values, this._idField) && !Object.is(values[this._idField], record[this._idField]))
            return { success: false, error: "Failed to update row. Update cannot change '" + this._idField + "'." };
        const fields = Object.keys(values).filter(field => !Object.is(record[field], values[field]));
        if (!fields.length) return { success: true };
        Object.assign(record, Object.fromEntries(fields.map(field => [field, values[field]])));
        if (!this.pendingRows.has(row)) this.clearQueryCaches();
        this.changed.invoke({ kind: "update", row, fields });
        return { success: true };
    }

    /** Removes a confirmed row from the supplied array. Pending rows must be cancelled instead. */
    async delete(row: T): Promise<MutationResult> {
        if (this.pendingRows.has(row))
            return { success: false, error: "Failed to delete row. Cancel the pending session instead." };
        const index = this.array.indexOf(row);
        if (index < 0)
            return { success: false, error: "Failed to delete row. Row does not belong to this source." };
        this.array.splice(index, 1);
        this.clearQueryCaches();
        this.changed.invoke({ kind: "delete", row });
        return { success: true };
    }

    /**
     * Initializes an independent draft, with defaults and a stable identity.
     * Drafts are excluded from queries, summaries and hierarchy until insert().
     * insert/cancel are individually idempotent; the opposite terminal transition rejects.
     * @example
     * const session = await source.createNewRow();
     * await source.update(session.row, { product: "Keyboard", quantity: 1 });
     * const result = await session.insert();
     * if (!result.success) console.error(result.error);
     */
    async createNewRow(): Promise<NewRowSession<T>> {
        let key: RowIdentity;
        try {
            key = this.options.createRowId ? await this.options.createRowId(this) : crypto.randomUUID();
        } catch (error) {
            throw new Error("Failed to create row. Identity generation failed. " +
                (error instanceof Error ? error.message : String(error)));
        }
        if (typeof key !== "string" && (typeof key !== "number" || !Number.isFinite(key)))
            throw new Error("Failed to create row. Identity must be a string or finite number.");
        if (this.reservedKeys.has(key) || this.hasKey(key))
            throw new Error("Failed to create row. Duplicate row key '" + key + "'.");
        // Reserve before awaiting defaults so concurrent factories cannot reuse the identity.
        this.reservedKeys.add(key);
        let row: T;
        try {
            const defaults = typeof this.options.defaults === "function"
                ? await this.options.defaults() : this.options.defaults;
            row = { ...defaults, [this._idField]: key } as T;
        } catch (error) {
            this.reservedKeys.delete(key);
            throw new Error("Failed to create row. Defaults initialization failed. " +
                (error instanceof Error ? error.message : String(error)));
        }
        this.pendingRows.set(row, key);
        let state: NewRowSession<T>["state"] = "pending";
        const session: NewRowSession<T> = {
            row,
            get state() { return state; },
            insert: async () => {
                if (state === "inserted") return { success: true };
                if (state === "cancelled") throw new Error("Failed to insert row. Session is cancelled.");
                if (!Object.is((row as Record<string, unknown>)[this._idField], key))
                    return { success: false, error: "Failed to insert row. The pending row identity was changed." };
                // The array is public: recheck keys in case another caller modified it directly.
                if (this.hasKey(key))
                    return { success: false, error: "Failed to insert row. Duplicate row key '" + key + "'." };
                this.array.push(row);
                state = "inserted";
                this.pendingRows.delete(row);
                this.reservedKeys.delete(key);
                this.clearQueryCaches();
                this.changed.invoke({ kind: "insert", row });
                return { success: true };
            },
            cancel: async () => {
                if (state === "cancelled") return;
                if (state === "inserted") throw new Error("Failed to cancel row. Session is already inserted.");
                state = "cancelled";
                this.pendingRows.delete(row);
                this.reservedKeys.delete(key);
                this.changed.invoke({ kind: "cancel", row });
            }
        };
        try {
            this.changed.invoke({ kind: "create", row });
        } catch (error) {
            // No caller received the session, so leave no inaccessible draft behind.
            state = "cancelled";
            this.pendingRows.delete(row);
            this.reservedKeys.delete(key);
            throw new Error("Failed to create row. Change notification failed. " +
                (error instanceof Error ? error.message : String(error)));
        }
        return session;
    }

    /** Checks existing records without requiring a configured hierarchy or row-key callback. */
    private hasKey(key: RowIdentity): boolean {
        return this.array.some(row => row !== null && typeof row === "object"
            && (row as Record<string, unknown>)[this._idField] === key);
    }
}
