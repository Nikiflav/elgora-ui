import { UndoCoordinator, type UndoHistory } from "../../core/UndoCoordinator";
import { DataTransaction } from "./DataTransaction";
import type { MutationResult } from "../DataSource";
import type { RowIdentity } from "../RowIdentity";
import type { ChangeSet, KeyMapping } from "../ChangeSet";
import { DataTable, type DataTableOptions } from "./DataTable";
export { DataTable, type DataTableOptions } from "./DataTable";
export { DataRow, type DataRowState } from "./DataRow";

/**
 * Generates a unique identity for a new row. Receives the table requesting the identity.
 * Return a string or finite number, directly or asynchronously.
 * @example
 * const createRowId: NewRowIdFactory = table => table.name + "-" + crypto.randomUUID();
 */
export type NewRowIdFactory = (table: DataTable) => RowIdentity | Promise<RowIdentity>;
/** Configuration shared by the dataset's tables. */
export interface DataSetOptions {
    /** Shared application coordinator. If omitted, this dataset creates its own coordinator. */
    undoCoordinator?: UndoCoordinator;
    /**
     * Used by tables without their own createRowId. Receives the requesting DataTable.
     * @example
     * createRowId: table => table.name + "-" + crypto.randomUUID()
     */
    createRowId?: NewRowIdFactory;
}
/** Transport changes grouped by table name; update entries contain changed fields only. */
export type DataSetChanges = Record<string, ChangeSet>;
/** Result of saving the complete batch. Mappings apply to successfully inserted rows, grouped by table. */
export type DataSetSaveChangesResult =
    | { success: true; keyMappings?: Record<string, KeyMapping[]> }
    | { success: false; error: string; fieldErrors?: Record<string, string> };
/** Persists one batch for all changed tables; resolve success only after the complete batch is saved. */
export type DataSetSaveHandler = (changes: DataSetChanges) => Promise<DataSetSaveChangesResult>;

/**
 * Manages named tables and saves their pending changes as one application-defined batch.
 * Edit rows through their tables, then call saveChanges() to persist and accept the batch.
 * Use rejectChanges() to restore accepted values without sending a request.
 * Before saving, finish active field edits and explicitly insert each new-row session
 * that should be included. To discard edits, cancel pending sessions before rejecting.
 * saveChanges(), acceptChanges() and rejectChanges() throw if any table has a pending
 * session or an unfinished createNewRow() request. They never insert or cancel it automatically.
 * Each successful edit and its business effects form one undo operation; failed edits add none.
 * Undo/redo restores recorded versions without rerunning business rules.
 * Saving, accepting, rejecting or importing refreshed rows clears this dataset's history only.
 * @example
 * const dataset = new DataSet({ createRowId: () => crypto.randomUUID() });
 * const orders = dataset.createTable("orders", [{ id: 1, quantity: 2 }]);
 * await orders.rows[0].setValue("quantity", 3);
 * await dataset.undoCoordinator.undo();
 * await dataset.undoCoordinator.redo();
 */
export class DataSet {
    private readonly registry = new Map<string, DataTable>();
    private saving = false;
    private activeTransaction?: DataTransaction;
    private publishing = false;
    /** Coordinator shared with tables; call undo()/redo() here, never on individual history scopes. */
    readonly undoCoordinator: UndoCoordinator;
    /** This dataset's history scope; save/discard clears only this scope. */
    readonly undoHistory: UndoHistory;
    /** Default identity generator passed the requesting table; table-level generators take priority. */
    readonly createRowId?: NewRowIdFactory;

    /** Configures identity generation; no factory is needed for read-only/existing rows. */
    constructor(options: DataSetOptions = {}) {
        this.createRowId = options.createRowId;
        this.undoCoordinator = options.undoCoordinator ?? new UndoCoordinator();
        this.undoHistory = this.undoCoordinator.createHistory("dataset");
    }

    /** Registered tables in creation order; modifying this list cannot change the dataset. */
    get tables(): readonly DataTable[] { return [...this.registry.values()]; }

    /** True while persistence and acceptance are running; editing is blocked during that time. */
    get isSaving(): boolean { return this.saving; }

    /** Creates a named table. Example: createTable("orders", [], { idField: "orderId" }). */
    createTable(name: string, values: readonly Record<string, unknown>[] = [], options?: DataTableOptions): DataTable {
        this.ensureEditable("create table");
        if (this.registry.has(name)) throw new Error("Failed to create table. Duplicate table name: " + name + ".");
        const table = new DataTable(this, name, values, options);
        this.registry.set(name, table);
        return table;
    }

    /** Looks up an existing table; missing names return undefined. */
    getTable(name: string): DataTable | undefined { return this.registry.get(name); }

    /** Returns copied change containers without cloning field values, excluding pending sessions. */
    getChanges(): DataSetChanges {
        return Object.fromEntries(this.tables.map(table => [table.name, table.getChanges()] as const)
            .filter(([, changes]) => changes.length));
    }

    /**
     * Accepts values that have already been persisted externally; does not send a request.
     * All new-row sessions must first be inserted or cancelled, and createNewRow() calls awaited.
     * Throws before changing any table if a session or identity request is still pending.
     * Do not accept a newly inserted row unless it was included in the successful external save.
     * saveChanges() performs acceptance automatically after a successful save.
     * @example
     * await persist(dataset.getChanges());
     * dataset.acceptChanges();
     */
    acceptChanges(): void {
        this.ensureEditable("accept changes");
        for (const table of this.tables) table.ensureNoPending("accept changes");
        for (const table of this.tables) table._acceptChanges();
        this._clearHistory();
        for (const table of this.tables) table.changed.invoke({ kind: "reset" });
    }

    /**
     * Restores accepted values and removes confirmed, unsaved insertions without a server request.
     * Explicitly cancel pending new-row sessions first; this method does not cancel them.
     * Throws before changing any table if any new-row session or identity request is pending.
     * @example
     * for (const newRowSession of newRowSessions) {
     *     if (newRowSession.state === "pending") await newRowSession.cancel();
     * }
     * dataset.rejectChanges();
     */
    rejectChanges(): void {
        this.ensureEditable("reject changes");
        for (const table of this.tables) table.ensureNoPending("reject changes");
        for (const table of this.tables) table.rejectChanges();
    }

    /**
     * Sends one dataset-wide batch; failures retain edits, success accepts the new baseline.
     * No changes means no request. Editing is blocked while awaiting the application callback.
     * All ID mappings are validated before applying any; row object references are preserved.
     * Key mappings update row identities only. Related field values must be updated by the application.
     *
     * A Save action should finish active field edits, await outstanding createNewRow() calls,
     * then explicitly insert the sessions to include. Check each insert result before saving.
     * A failed insert must stop the Save action so the user can correct or cancel that row.
     * This method throws before calling save if any table still has a pending session or
     * identity request, even when getChanges() is empty. No sessions are inserted automatically.
     * If several views share the dataset, coordinate their pending sessions before saving.
     * @example
     * await dataset.saveChanges(async changes => api.save(changes));
     * // Success may return { success: true, keyMappings: { orders: [
     * //     { temporaryKey: "client-id", key: 123 }
     * // ] } }.
     * @example
     * // Application-provided UI and persistence callbacks:
     * async function onSaveClick() {
     *     try {
     *         if (!await finishActiveCellEdit()) return;
     *         // newRowSessions contains session handles from completed createNewRow() calls.
     *         for (const newRowSession of newRowSessions) {
     *             if (newRowSession.state !== "pending") continue;
     *             const result = await newRowSession.insert();
     *             if (!result.success) {
     *                 showError(result.error);
     *                 return;
     *             }
     *         }
     *         const result = await dataset.saveChanges(changes => api.save(changes));
     *         if (!result.success) showError(result.error);
     *     } catch (error) {
     *         showError(error instanceof Error ? error.message : String(error));
     *     }
     * }
     * saveButton.addEventListener("click", onSaveClick);
     *
     * // A successful local insert remains in getChanges() if the later save fails.
     * // Correct the data and retry Save, or explicitly reject the confirmed changes.
     */
    async saveChanges(save: DataSetSaveHandler): Promise<DataSetSaveChangesResult> {
        this.ensureEditable("save changes");
        for (const table of this.tables) table.ensureNoPending("save changes");
        const changes = this.getChanges();
        if (!Object.keys(changes).length) { this._clearHistory(); return { success: true }; }
        this.saving = true;
        try {
            const result = await save(changes);
            if (!result.success) return result;
            const mappings = new Map<DataTable, ReturnType<DataTable["_validateKeyMappings"]>>();
            for (const [name, entries] of Object.entries(result.keyMappings ?? {})) {
                const table = this.getTable(name);
                if (!table) throw new Error("Failed to save changes. Unknown table in key mappings: " + name + ".");
                mappings.set(table, table._validateKeyMappings(entries));
            }
            for (const [table, entries] of mappings) table._applyKeyMappings(entries);
            for (const table of this.tables) table._acceptChanges();
            this._clearHistory();
            for (const table of this.tables) table.changed.invoke({ kind: "reset" });
            return result;
        } finally {
            this.saving = false;
        }
    }

    /**
     * Applies a named edit across tables that succeeds or is rolled back as a whole.
     * Use only the supplied tx for mutations.
     * Validation failure returns success:false; exceptions reject. Both restore all affected rows.
     * UI notifications run only after success. Observer errors do not roll back committed edits.
     * Await context operations. Save, import, acceptance and unrelated edits are blocked while active.
     * tx.context provides dataset access with edits bound to this transaction.
     * All direct and business-rule edits are recorded as one operation on success.
     * @example
     * await dataset.transaction("Change quantities", async tx => {
     *     await tx.update(orders, firstRow, { quantity: 5 });
     *     await tx.update(orders, secondRow, { quantity: 10 });
     * });
     */
    async transaction(label: string, operation: (tx: DataTransaction) => void | MutationResult | Promise<void | MutationResult>): Promise<MutationResult> {
        this.ensureEditable("start transaction");
        const tx = new DataTransaction(this, label);
        this.activeTransaction = tx;
        let result: MutationResult;
        try {
            const returned = await operation(tx);
            if (returned && !returned.success) tx._fail(returned);
            result = await tx._finish();
            if (result.success) this.undoCoordinator.ensureIdle();
            if (!result.success) tx._rollback();
        } catch (error) {
            await tx._settle();
            tx._rollback();
            if (tx._isValidationFailure(error)) result = tx._result();
            else throw error;
        } finally {
            this.activeTransaction = undefined;
        }
        if (result.success) {
            this.publishing = true;
            try {
                const operation = tx._operation();
                if (operation) this.undoHistory.record(operation);
                tx._publish();
            }
            finally { this.publishing = false; }
        }
        return result;
    }

    /** @internal Executes a mutation in its supplied context, or creates an independent transaction. */
    async _mutate<T>(operation: string, transaction: DataTransaction | undefined,
        mutation: (tx: DataTransaction) => T | Promise<T>,
        rejected?: (result: Extract<MutationResult, { success: false }>) => T): Promise<T> {
        this.ensureEditable(operation, transaction);
        if (transaction) return mutation(transaction);
        let value!: T;
        const result = await this.transaction(operation, async tx => { value = await mutation(tx); });
        if (!result.success) {
            if (rejected) return rejected(result);
            throw new Error("Failed to " + operation + ". " + result.error);
        }
        return value;
    }

    /** @internal Establishes a new dataset history baseline without clearing other application scopes. */
    _clearHistory(): void { this.undoCoordinator.clear(this.undoHistory); }

    /** @internal Restores recorded versions without business events or additional history entries. */
    _restoreHistory(restorations: readonly (() => void)[]): void {
        if (this.activeTransaction || this.saving || this.publishing || this.tables.some(table => table._isCreating()))
            throw new Error("Failed to replay dataset changes. A dataset operation is active.");
        for (const restore of restorations) restore();
    }

    /** @internal Rejects foreign or completed transaction contexts. */
    _ensureTransaction(transaction: DataTransaction): void {
        if (transaction !== this.activeTransaction)
            throw new Error("Failed to use transaction. The transaction is not active in this dataset.");
    }

    /** @internal Checks save, transaction ownership and notification reentrancy before mutations. */
    ensureEditable(operation: string, transaction?: DataTransaction): void {
        if (this.saving) throw new Error("Failed to " + operation + ". DataSet is saving changes.");
        if (this.publishing) throw new Error("Failed to " + operation + ". DataSet is notifying observers.");
        this.undoCoordinator.ensureIdle();
        if (transaction) this._ensureTransaction(transaction);
        else if (this.activeTransaction)
            throw new Error("Failed to " + operation + ". A dataset transaction is active. Use its transaction context.");
    }
}
