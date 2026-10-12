import { ObservableEvent } from "../../core/ElgoraUI";
import { AsyncObservableEvent } from "../../core/AsyncObservableEvent";
import {
    type DataSource, type DataSourceChanged, type DataResult,
    type QueryArgs, type MutationResult, type NewRowSession
} from "../DataSource";
import { ArrayDataSource } from "../ArrayDataSource";
import type { RowIdentity } from "../RowIdentity";
import type { ChangeSet, KeyMapping } from "../ChangeSet";
import type { DataSet, NewRowIdFactory } from "./DataSet";
import { DataRow } from "./DataRow";
import type { DataTransaction } from "./DataTransaction";
import { DataEditContext, type DataRowChangeEvent } from "./DataEditContext";

/** Configures identity lookup and initial values for new rows. */
export interface DataTableOptions {
    /** Identity field. Default: id. String and numeric keys are both supported. */
    idField?: string;
    /**
     * Initial field values for each new row; object-valued fields retain their references.
     * A factory runs for every session and may be asynchronous. createRowId supplies the identity.
     * @example
     * defaults: () => ({ quantity: 0, createdAt: new Date(), ownerId: currentUser.id })
     */
    defaults?: Record<string, unknown> | ((table: DataTable) => Record<string, unknown> | Promise<Record<string, unknown>>);
    /**
     * Synchronous, side-effect-free comparison used for edits and accepted-value differences.
     * Defaults to Object.is. Equal values retain the current reference and emit no business events.
     * Must be reflexive, symmetric and transitive. A thrown exception aborts an edit.
     * In-place object changes cannot be detected because field values are not cloned.
     * @example
     * equals: (field, a, b) => field === "code"
     *     ? String(a).toLowerCase() === String(b).toLowerCase()
     *     : Object.is(a, b)
     */
    equals?: (field: string, a: unknown, b: unknown) => boolean;
    /**
     * Generates new-row identities for this table, overriding the dataset generator.
     * Receives this table and may return a Promise. Example: createRowId: () => crypto.randomUUID().
     */
    createRowId?: NewRowIdFactory;
}

/**
 * Stores rows indexed by identity and exposes them through the DataSource contract.
 * update() and delete() change local data; getChanges() returns the batch for persistence.
 * New-row sessions remain outside queries until insert() and can be discarded with cancel().
 * @example
 * const table = dataset.createTable("orders", [], { createRowId: () => crypto.randomUUID() });
 * const newRowSession = await table.createNewRow();
 * await newRowSession.row.setValue("quantity", 2);
 * await newRowSession.insert();
 * // dataset.saveChanges(...) persists the inserted row.
 */
export class DataTable implements DataSource<DataRow> {
    private _rows = new Map<RowIdentity, DataRow>();
    private _pendingRows = new Map<RowIdentity, DataRow>();
    private creating = 0;
    private sessions = new WeakMap<DataRow, { state: NewRowSession<DataRow>["state"] }>();
    private defaults: DataTableOptions["defaults"];
    private equals: NonNullable<DataTableOptions["equals"]>;
    private createRowId?: NewRowIdFactory;
    /** Field containing each row's unique identity; defaults to id. */
    readonly idField: string;

    /**
     * Reports local row changes, including edits in pending sessions.
     * Subscribe to repaint consumers; dispose the returned subscription when no longer needed.
     * @example
     * const subscription = table.changed.subscribe(event => console.log(event.kind, event.row?.key));
     */
    readonly changed = new ObservableEvent<DataSourceChanged<DataRow>>();
    /**
     * Before update, insertion, deletion or cancellation, inside the current transaction.
     * reject() aborts the complete edit and stops dispatch. Async handlers are awaited in subscription order.
     * Creation reports rowChanged after defaults and identity have been initialized.
     * @example
     * table.rowChanging.subscribe(e => {
     *     if (e.kind === "update" && Number(e.values.quantity) < 0)
     *         e.reject("Quantity must be nonnegative", { quantity: "Must be nonnegative" });
     * });
     */
    readonly rowChanging = new AsyncObservableEvent<DataRowChangeEvent>();
    /**
     * After a mutation, inside the transaction; also reports creation and pending-row edits.
     * Derived edits join the same undo operation. Never emitted during replay, import or acceptance.
     * Async handlers are awaited in subscription order. Await or return derived edits before the next rule.
     * Pending-row rules can initialize that row, but cannot modify other rows until insertion.
     * @example
     * table.rowChanged.subscribe(async e => {
     *     if (e.fields.includes("quantity"))
     *         await e.context.setValue(e.row, "total", Number(e.row.getValue("quantity")) * 10);
     * });
     * @example
     * table.rowChanged.subscribe(async e => {
     *     if (e.fields.includes("code")) {
     *         const price = await lookupPrice(e.row.getValue("code"));
     *         await e.context.setValue(e.row, "price", price);
     *     }
     * });
     */
    readonly rowChanged = new AsyncObservableEvent<DataRowChangeEvent>();
    /** Shared dataset coordinator; undo/redo must be executed through it. */
    get undoCoordinator() { return this.dataSet.undoCoordinator; }

    /** Imports initial accepted values. Example: dataset.createTable("orders", [{ id: "A" }]). */
    constructor(readonly dataSet: DataSet, readonly name: string,
        values: readonly Record<string, unknown>[] = [], options: DataTableOptions = {}) {
        this.idField = options.idField ?? "id";
        this.defaults = typeof options.defaults === "function" ? options.defaults : { ...options.defaults };
        this.equals = options.equals ?? ((_field, a, b) => Object.is(a, b));
        this.createRowId = options.createRowId;
        const keys = new Set<RowIdentity>();
        for (const valuesItem of values) {
            const row = new DataRow(this, valuesItem);
            if (!isRowIdentity(row.key) || keys.has(row.key))
                throw new Error("Failed to create table. Existing rows require unique string/number identities.");
            keys.add(row.key);
            this._rows.set(row.key, row);
        }
    }

    /** Confirmed rows, including deleted entries awaiting acceptance; returns a copied list. */
    get rows(): readonly DataRow[] { return [...this._rows.values()]; }

    /** Finds a confirmed row by current ID. Pending rows are owned by their session handles. */
    getRow(key: RowIdentity): DataRow | undefined { return this._rows.get(key); }

    /** Stable/current row ID for the DataSource contract. Mapping preserves the row reference. */
    getRowId(row: DataRow): RowIdentity {
        if (row.table !== this) throw new Error("Failed to get row identity. Row belongs to another table.");
        return row.key;
    }

    /**
     * Imports refreshed values by ID, preserving row references and, by default, local edits.
     * Example: table.importRows(serverPage). Pending IDs cannot be overwritten by imports.
     * Identity validation completes for the entire batch before any existing row changes.
     * A nonempty import clears the dataset's complete history scope to prevent stale replay.
     */
    importRows(values: readonly Record<string, unknown>[], preserveChanges = true): DataRow[] {
        this.dataSet.ensureEditable("import rows");
        const incoming = values.map(item => ({ ...item }));
        const keys = new Set<RowIdentity>();
        for (const item of incoming) {
            const key = item[this.idField];
            if (!isRowIdentity(key) || keys.has(key)) throw new Error("Failed to import rows. Imported rows require unique string/number identities.");
            if (this._pendingRows.has(key)) throw new Error("Failed to import rows. Cannot import over a pending row identity.");
            keys.add(key);
        }
        const result = incoming.map(item => {
            const key = item[this.idField] as RowIdentity;
            let row = this._rows.get(key);
            if (row) {
                if (row.state === "unchanged" || !preserveChanges) row._replaceValues(item);
            } else {
                row = new DataRow(this, item);
                this._rows.set(key, row);
            }
            return row;
        });
        if (incoming.length) {
            this.dataSet._clearHistory();
            this.changed.invoke({ kind: "reset" });
        }
        return result;
    }

    /**
     * Creates a pending added row using table.createRowId or the dataset's default generator.
     * The generator receives this table. Its result must be unique among stored and pending rows.
     * insert() includes the row in queries and persistence changes; cancel() discards it.
     * Keep the returned session handle until it is inserted or cancelled.
     * Await this call before saving or accepting/rejecting changes; an unfinished identity
     * request blocks those operations, as does a session whose state is still pending.
     * @example
     * const newRowSession = await table.createNewRow();
     * await table.update(newRowSession.row, { quantity: 3 });
     * await newRowSession.insert();
     */
    async createNewRow(transaction?: DataTransaction, context?: DataEditContext): Promise<NewRowSession<DataRow>> {
        this.dataSet.ensureEditable("create new row", transaction);
        const factory = this.createRowId ?? this.dataSet.createRowId;
        if (!factory) throw new Error("Failed to create new row. Configure createRowId on the table or dataset before creating a row.");
        this.creating++;
        try {
            const key = await factory(this);
            const defaults = typeof this.defaults === "function" ? await this.defaults(this) : this.defaults;
            return await this.dataSet._mutate("create new row", transaction, async tx => {
                if (!isRowIdentity(key)) throw new Error("Failed to create new row. createRowId must return a finite number or string.");
                if (this._rows.has(key) || this._pendingRows.has(key)) throw new Error("Failed to create new row. Duplicate row key: " + String(key) + ".");
                const row = new DataRow(this, { ...defaults, [this.idField]: key }, "added");
                const sessionState = { state: "cancelled" as NewRowSession<DataRow>["state"] };
                this.sessions.set(row, sessionState);
                this.capture(tx, row);
                sessionState.state = "pending";
                this._pendingRows.set(key, row);
                const newRowSession: NewRowSession<DataRow> = Object.freeze({
                    row,
                    get state() { return sessionState.state; },
                    insert: () => this._insertNewRow(row),
                    cancel: () => this._cancelNewRow(row)
                });
                const scope = (context ?? tx.context)._enter(row, [], "create");
                await this.business(this.rowChanged, tx, scope, "create", row, [], {}, row.toObject());
                tx._notify(this, { kind: "create", row });
                return newRowSession;
            });
        } finally { this.creating--; }
    }

    /** @internal Inserts the table-owned session using an explicit or automatic transaction. */
    async _insertNewRow(row: DataRow, transaction?: DataTransaction, context?: DataEditContext): Promise<MutationResult> {
        return this.dataSet._mutate<MutationResult>("insert new row", transaction, async tx => {
            const session = this.sessions.get(row);
            if (!session || session.state === "cancelled") throw new Error("Failed to insert new row. Cannot insert a cancelled session.");
            if (session.state === "inserted") return { success: true };
            const scope = (context ?? tx.context)._enter(row, [], "insert");
            const oldValues = row.toObject();
            await this.business(this.rowChanging, tx, scope, "insert", row, [], oldValues, oldValues);
            this.capture(tx, row);
            this._pendingRows.delete(row.key);
            this._rows.set(row.key, row);
            session.state = "inserted";
            await this.business(this.rowChanged, tx, scope, "insert", row, [], oldValues, row.toObject());
            tx._notify(this, { kind: "insert", row });
            return { success: true };
        }, result => result);
    }

    /** @internal Cancels the table-owned session using an explicit or automatic transaction. */
    async _cancelNewRow(row: DataRow, transaction?: DataTransaction, context?: DataEditContext): Promise<void> {
        return this.dataSet._mutate("cancel new row", transaction, async tx => {
            const session = this.sessions.get(row);
            if (!session || session.state === "inserted") throw new Error("Failed to cancel new row. Cannot cancel an inserted session.");
            if (session.state === "cancelled") return;
            const scope = (context ?? tx.context)._enter(row, [], "cancel");
            const oldValues = row.toObject();
            await this.business(this.rowChanging, tx, scope, "cancel", row, [], oldValues, oldValues);
            this.capture(tx, row);
            this._pendingRows.delete(row.key);
            session.state = "cancelled";
            await this.business(this.rowChanged, tx, scope, "cancel", row, [], oldValues, row.toObject());
            tx._notify(this, { kind: "cancel", row });
        });
    }

    /** Updates field values without cloning them, in an automatic transaction; use tx.update() to join a larger edit. */
    async update(row: DataRow, values: Record<string, unknown>, transaction?: DataTransaction, context?: DataEditContext): Promise<MutationResult> {
        return this.dataSet._mutate<MutationResult>("update row", transaction, async tx => {
            if (!this.active(row) || row.state === "deleted")
                return tx._fail({ success: false, error: "Failed to update row. Row is not editable in this table." });
            if (Object.prototype.hasOwnProperty.call(values, this.idField) && values[this.idField] !== row.key)
                return tx._fail({ success: false, error: "Failed to update row. Update cannot change '" + this.idField + "'." });
            const patch = { ...values };
            const fields = Object.keys(patch).filter(field => !this._equals(field, row.getValue(field), patch[field]));
            if (!fields.length) return { success: true };
            const scope = (context ?? tx.context)._enter(row, fields);
            const oldValues = Object.fromEntries(fields.map(field => [field, row.getValue(field)]));
            const newValues = Object.fromEntries(fields.map(field => [field, patch[field]]));
            await this.business(this.rowChanging, tx, scope, "update", row, fields, oldValues, newValues);
            this.capture(tx, row);
            row._applyValues(newValues);
            tx._notify(this, { kind: "update", row, fields });
            await this.business(this.rowChanged, tx, scope, "update", row, fields, oldValues, newValues);
            return { success: true };
        }, result => result);
    }

    /** Marks an existing row deleted; removes an unsaved added row without a delete entry. */
    async delete(row: DataRow, transaction?: DataTransaction, context?: DataEditContext): Promise<MutationResult> {
        return this.dataSet._mutate<MutationResult>("delete row", transaction, async tx => {
            if (!this.active(row)) return tx._fail({ success: false, error: "Failed to delete row. Row does not belong to this table." });
            if (this._pendingRows.get(row.key) === row) return tx._fail({ success: false, error: "Failed to delete row. Cancel the pending session instead." });
            if (row.state === "deleted") return { success: true };
            const scope = (context ?? tx.context)._enter(row, [], "delete");
            const oldValues = row.toObject();
            await this.business(this.rowChanging, tx, scope, "delete", row, [], oldValues, {});
            this.capture(tx, row);
            if (row.state === "added") this._rows.delete(row.key);
            else row._markDeleted();
            await this.business(this.rowChanged, tx, scope, "delete", row, [], oldValues, {});
            tx._notify(this, { kind: "delete", row });
            return { success: true };
        }, result => result);
    }

    /** Captures row values, session status and list position once per transaction. */
    private capture(tx: DataTransaction, row: DataRow): void {
        if (tx._hasCaptured(row)) return;
        tx._capture(row, this.restorePoint(row), () => this.restorePoint(row));
    }

    /** Captures a replayable row version, membership and session status without cloning values. */
    private restorePoint(row: DataRow): () => void {
        const snapshot = row._snapshot();
        const confirmed = this._rows.get(row.key) === row;
        const pending = this._pendingRows.get(row.key) === row;
        const index = [...(confirmed ? this._rows : this._pendingRows).keys()].indexOf(row.key);
        const session = this.sessions.get(row), state = session?.state;
        return () => {
            this._rows.delete(row.key);
            this._pendingRows.delete(row.key);
            row._restore(snapshot);
            if (session && state) session.state = state;
            if (confirmed || pending) {
                const map = confirmed ? this._rows : this._pendingRows;
                const entries = [...map.entries()];
                entries.splice(index, 0, [row.key, row]);
                map.clear();
                for (const [key, entry] of entries) map.set(key, entry);
            }
        };
    }

    /** Loads confirmed, non-deleted rows. Pending rows never participate in pages, counts or summaries. */
    async loadData(args: QueryArgs): Promise<DataResult<DataRow>> {
        if (args.groupColumn) return { args }; // Return no grouped payload so LocalGroupingDataSource can group a flat query.
        const lookup = new Map<Record<string, unknown>, DataRow>();
        for (const row of this._rows.values())
            if (row.state !== "deleted") lookup.set(row.toObject(), row);
        const query = { ...args, orderby: args.orderby?.map(token => typeof token === "string"
            ? [token, "asc"] as [string, "asc"] : token) };
        const result = await new ArrayDataSource([...lookup.keys()]).loadData(query);
        return { ...result, args, dataItems: result.dataItems?.map(values => lookup.get(values)!) };
    }

    /**
     * Returns confirmed insert/update/remove changes. Pending sessions are excluded.
     * Insert entries contain all field values; update entries contain only modified fields.
     * @example
     * table.getChanges(); // [{ type: "update", key: 1, data: { quantity: 3 } }]
     */
    getChanges(): ChangeSet {
        const result: ChangeSet = [];
        for (const row of this._rows.values()) {
            if (row.state === "unchanged") continue;
            if (row.state === "deleted") result.push({ type: "remove", key: row.key });
            else {
                const values = row.changes();
                if (row.state === "added" || Object.keys(values).length)
                    result.push({ type: row.state === "added" ? "insert" : "update", key: row.key, data: values });
            }
        }
        return result;
    }

    /**
     * Accepts externally persisted values as the new baseline; does not save them.
     * Explicitly insert or cancel this table's pending sessions and await new-row creation first.
     * Throws without accepting changes if any session or identity request is still pending.
     * Clears the complete dataset history scope, including operations involving other tables.
     * @example
     * await persist(table.getChanges());
     * table.acceptChanges();
     */
    acceptChanges(): void {
        this.dataSet.ensureEditable("accept changes");
        this.ensureNoPending("accept changes");
        this._acceptChanges();
        this.dataSet._clearHistory();
        this.changed.invoke({ kind: "reset" });
    }

    /**
     * Restores accepted values, removes unsaved added rows and restores deleted rows.
     * Explicitly cancel pending sessions first; throws without changing rows if any remain
     * or a createNewRow() request has not completed.
     * Clears the complete dataset history scope, including operations involving other tables.
     * @example
     * if (newRowSession.state === "pending") await newRowSession.cancel();
     * table.rejectChanges();
     */
    rejectChanges(): void {
        this.dataSet.ensureEditable("reject changes");
        this.ensureNoPending("reject changes");
        for (const row of this.rows) {
            if (row.state === "added") this._rows.delete(row.key);
            else row._rejectChanges();
        }
        this.dataSet._clearHistory();
        this.changed.invoke({ kind: "reset" });
    }

    /**
     * @internal Rejects an operation while a new-row session or identity request is pending.
     * Callers must await row creation and explicitly insert or cancel the returned handles.
     * Does not change session state or row values.
     */
    ensureNoPending(operation: string): void {
        if (this._pendingRows.size || this.creating)
            throw new Error("Failed to " + operation + ". Insert or cancel pending new-row sessions first.");
    }

    /** @internal Accepts after successful dataset save while the save lock is still held. */
    _acceptChanges(): void {
        for (const row of this.rows) {
            if (row.state === "deleted") this._rows.delete(row.key);
            else row._acceptChanges();
        }
    }

    /** @internal Validates the entire mapping without changing rows or indexes, including key swaps. */
    _validateKeyMappings(mappings: readonly KeyMapping[]): Map<DataRow, RowIdentity> {
        const result = new Map<DataRow, RowIdentity>();
        for (const mapping of mappings) {
            const row = this._rows.get(mapping.temporaryKey);
            if (!row || row.state !== "added") throw new Error("Failed to apply key mappings. Unknown inserted key: " + String(mapping.temporaryKey) + ".");
            if (result.has(row)) throw new Error("Failed to apply key mappings. Duplicate temporary key in mapping.");
            if (!isRowIdentity(mapping.key)) throw new Error("Failed to apply key mappings. Invalid mapped row key.");
            result.set(row, mapping.key);
        }
        const finalKeys = new Set<RowIdentity>();
        for (const row of this._rows.values()) {
            const key = result.get(row) ?? row.key;
            if (finalKeys.has(key)) throw new Error("Failed to apply key mappings. Duplicate mapped row key: " + String(key) + ".");
            finalKeys.add(key);
        }
        return result;
    }

    /** @internal Applies a prevalidated mapping and rebuilds the index, preserving all row objects. */
    _applyKeyMappings(mappings: Map<DataRow, RowIdentity>): void {
        const rows = this.rows;
        for (const [row, key] of mappings) row._changeId(key);
        this._rows = new Map(rows.map(row => [row.key, row]));
    }

    /** @internal Uses the table's configured equality consistently for edits and persistence differences. */
    _equals(field: string, a: unknown, b: unknown): boolean { return this.equals(field, a, b); }

    /** @internal Identifies sessions still outside confirmed queries. */
    _isPending(row: DataRow): boolean { return this._pendingRows.get(row.key) === row; }

    /** @internal Blocks replay while asynchronous identity/default generation is still running. */
    _isCreating(): boolean { return this.creating > 0; }

    /** Awaits business subscribers in order; rejection stops dispatch and aborts the transaction. */
    private async business(event: AsyncObservableEvent<DataRowChangeEvent>, tx: DataTransaction,
        context: DataEditContext, kind: DataRowChangeEvent["kind"], row: DataRow, fields: string[],
        oldValues: Record<string, unknown>, values: Record<string, unknown>): Promise<void> {
        await event.invokeAsync({
            kind, row, fields: Object.freeze([...fields]),
            oldValues: Object.freeze({ ...oldValues }), values: Object.freeze({ ...values }), context,
            reject: (message, fieldErrors) => {
                tx._fail({ success: false, error: message, fieldErrors });
                tx._throwIfFailed();
            }
        });
        tx._throwIfFailed();
    }

    /** Rejects foreign, unregistered, cancelled and accepted-deleted row objects. */
    private active(row: DataRow): boolean {
        return row.table === this && (this._rows.get(row.key) === row || this._pendingRows.get(row.key) === row);
    }
}

/** Checks transport-safe identities without coercion; numeric zero and string IDs are valid. */
function isRowIdentity(value: unknown): value is RowIdentity {
    return typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
}
