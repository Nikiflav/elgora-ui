import type { RowIdentity } from "../RowIdentity";
import type { MutationResult } from "../DataSource";
import type { DataTable } from "./DataTable";


/** Persistence state, independent of whether a new row's editing session is inserted. */
export type DataRowState = "unchanged" | "added" | "modified" | "deleted";

/**
 * Represents one table row with current values, accepted values and persistence state.
 * Read values with getValue() and change them with setValue() or table.update().
 * Objects, arrays and dates are stored and returned by reference; field values are not cloned.
 * Replace a field value to track an edit. In-place changes are not tracked or rolled back.
 * @example
 * const row = table.getRow(1)!;
 * await row.setValue("quantity", 3);
 * console.log(row.getOriginal("quantity"), row.getValue("quantity"));
 */
export class DataRow {
    private _values: Record<string, unknown>;
    private _originalValues?: Record<string, unknown>;
    private _state: DataRowState;

    /** Owning table, including while the row is pending, cancelled or removed. Use isPending to check session membership. */
    readonly table: DataTable;

    /** Creates row storage. Register rows through table.importRows() or createNewRow(). */
    constructor(table: DataTable, values: Record<string, unknown>, state: DataRowState = "unchanged") {
        this.table = table;
        this._values = { ...values };
        this._state = state;
    }

    /** Current identity; server mapping updates the key without replacing this row. */
    get key(): RowIdentity { return this._values[this.table.idField] as RowIdentity; }
    /** Current persistence state, e.g. an added row remains added after local insert. */
    get state(): DataRowState { return this._state; }

    /**
     * True while this row belongs to a pending new-row session and is excluded from table queries.
     * Insert or cancel makes it false; undo/redo and rollback restore it with the session state.
     * False does not guarantee table membership: a cancelled or removed row is not pending either.
     * @example
     * if (!event.row.isPending) {
     *     await event.context.setValue(relatedRow, "amount", total);
     * }
     */
    get isPending(): boolean { return this.table._isPending(this); }

    /** Reads the current field value without copying it. Example: row.getValue("quantity"). */
    getValue(field: string): unknown { return this._values[field]; }

    /** Reads the accepted value. An added row has no accepted original version. */
    getOriginal(field: string): unknown {
        return this._state === "added" ? undefined : (this._originalValues ?? this._values)[field];
    }

    /** Checks a field against its original snapshot; all present fields of an added row are new. */
    isModified(field: string): boolean {
        if (this._state === "added") return Object.prototype.hasOwnProperty.call(this._values, field);
        return !!this._originalValues && !this.table._equals(field, this._originalValues[field], this._values[field]);
    }

    /** Returns a new field container without cloning its values; object-valued fields retain their references. */
    toObject(): Record<string, unknown> { return { ...this._values }; }

    /**
     * Returns modified field values when an original snapshot exists; otherwise returns all values.
     * Use table.getChanges() to obtain persistence entries for changed rows only.
     * @example
     * await row.setValue("quantity", 3);
     * row.changes(); // { quantity: 3 }
     */
    changes(): Record<string, unknown> {
        if (!this._originalValues) return this.toObject();
        return Object.fromEntries(Object.keys(this._values)
            .filter(field => this.isModified(field))
            .map(field => [field, this._values[field]]));
    }

    /** Edits through the owning table. Example: await row.setValue("quantity", 3). */
    setValue(field: string, value: unknown): Promise<MutationResult> {
        return this.table.update(this, { [field]: value });
    }

    /** @internal Applies an owned patch after source validation; captures original values on first edit. */
    _applyValues(values: Record<string, unknown>): string[] {
        const fields = Object.keys(values).filter(field => !this.table._equals(field, this._values[field], values[field]));
        if (!fields.length) return [];
        if (this._state === "unchanged") {
            this._originalValues = { ...this._values };
            this._state = "modified";
        }
        this._values = { ...this._values };
        for (const field of fields) this._values[field] = values[field];
        return fields;
    }

    /** @internal Replaces accepted values when importing refreshed data; row identity stays unchanged. */
    _replaceValues(values: Record<string, unknown>): void {
        this._values = { ...values };
        this._originalValues = undefined;
        this._state = "unchanged";
    }

    /** @internal Marks deletion; values remain available for rejectChanges(). */
    _markDeleted(): void { this._state = "deleted"; }

    /** @internal Accepts the current version and releases the lazy original snapshot. */
    _acceptChanges(): void {
        this._originalValues = undefined;
        this._state = "unchanged";
    }

    /** @internal Restores accepted values. The table separately removes unsaved added rows. */
    _rejectChanges(): void {
        if (this._originalValues) this._values = { ...this._originalValues };
        this._originalValues = undefined;
        this._state = "unchanged";
    }

    /** @internal Copies row containers and state without cloning field values. */
    _snapshot(): DataRowSnapshot {
        return { values: { ...this._values }, originalValues: this._originalValues && { ...this._originalValues }, state: this._state };
    }

    /** @internal Restores a captured version without invoking edits or business rules. */
    _restore(snapshot: DataRowSnapshot): void {
        this._values = { ...snapshot.values };
        this._originalValues = snapshot.originalValues && { ...snapshot.originalValues };
        this._state = snapshot.state;
    }

    /** @internal Applies a prevalidated server mapping without generating a user edit. */
    _changeId(key: RowIdentity): void { this._values[this.table.idField] = key; }
}

/** @internal Row containers captured for rollback; field values are retained without cloning. */
export interface DataRowSnapshot {
    values: Record<string, unknown>;
    originalValues?: Record<string, unknown>;
    state: DataRowState;
}
