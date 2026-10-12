import type { MutationResult, NewRowSession, DataSourceChanged } from "../DataSource";
import type { DataSet } from "./DataSet";
import type { DataTable } from "./DataTable";
import type { DataRow } from "./DataRow";
import { DataEditContext } from "./DataEditContext";
import type { UndoOperation } from "../../core/UndoCoordinator";

/**
 * Explicit ownership context for a dataset edit that succeeds or is rolled back as a whole.
 * Use its methods inside dataset.transaction(); ordinary table edits cannot join implicitly.
 * Field values are not cloned. Rollback restores previous references, not changes inside objects.
 * @example
 * await dataset.transaction("Change quantities", async tx => {
 *     await tx.update(orders, firstRow, { quantity: 5 });
 *     await tx.update(orders, secondRow, { quantity: 10 });
 * });
 */
export class DataTransaction {
    private restorations = new Map<DataRow, { before: () => void; captureAfter: () => () => void }>();
    /** Dataset access bound to this transaction. */
    readonly context: DataEditContext;
    private notifications: { table: DataTable; event: DataSourceChanged<DataRow> }[] = [];
    private failed?: Extract<MutationResult, { success: false }>;
    private readonly validationAbort = new Error("Failed to apply business rule. Validation rejected the transaction.");
    private pending = new Set<Promise<unknown>>();

    /** @internal Created and owned by DataSet.transaction(). */
    constructor(readonly dataSet: DataSet, readonly label: string) {
        this.context = new DataEditContext(this);
    }

    /** Updates a row in this transaction; an unsuccessful result aborts the complete transaction. */
    update(table: DataTable, row: DataRow, values: Record<string, unknown>): Promise<MutationResult> {
        this._ensureActive();
        return this._track(table.update(row, values, this));
    }

    /** Deletes a confirmed row as part of this transaction. */
    delete(table: DataTable, row: DataRow): Promise<MutationResult> {
        this._ensureActive();
        return this._track(table.delete(row, this));
    }

    /** Creates a pending session in this transaction; rollback cancels the created session. */
    createNewRow(table: DataTable): Promise<NewRowSession<DataRow>> {
        this._ensureActive();
        return this._track(table.createNewRow(this));
    }

    /** Confirms a session locally; rollback restores its previous state and membership. */
    insert(newRowSession: NewRowSession<DataRow>): Promise<MutationResult> {
        this._ensureActive();
        return this._track(newRowSession.row.table._insertNewRow(newRowSession.row, this));
    }

    /** Cancels a session; rollback restores the same pending row and session objects. */
    cancel(newRowSession: NewRowSession<DataRow>): Promise<void> {
        this._ensureActive();
        return this._track(newRowSession.row.table._cancelNewRow(newRowSession.row, this));
    }

    /** @internal Checks ownership and lifetime, including after an asynchronous continuation. */
    _ensureActive(): void { this.dataSet._ensureTransaction(this); }

    /** @internal Avoids repeated snapshots when a row is edited several times. */
    _hasCaptured(row: DataRow): boolean { return this.restorations.has(row); }

    /** @internal Captures each affected row once, before its first mutation. */
    _capture(row: DataRow, restore: () => void, captureAfter: () => () => void): void {
        this._ensureActive();
        if (!this.restorations.has(row)) this.restorations.set(row, { before: restore, captureAfter });
    }

    /** @internal Defers UI observation until the complete transaction has succeeded. */
    _notify(table: DataTable, event: DataSourceChanged<DataRow>): void {
        this._ensureActive();
        this.notifications.push({ table, event });
    }

    /** @internal Remembers validation rejection even when the caller ignores its result. */
    _fail(result: Extract<MutationResult, { success: false }>): MutationResult {
        this._ensureActive();
        this.failed ??= result;
        return result;
    }

    /** @internal Stops processing after a business rule rejects the edit. */
    _throwIfFailed(): void { if (this.failed) throw this.validationAbort; }

    /** @internal Distinguishes expected business rejection from an exception. */
    _isValidationFailure(error: unknown): boolean { return error === this.validationAbort; }

    /** @internal Returns the first validation rejection or success. */
    _result(): MutationResult { return this.failed ?? { success: true }; }

    /** @internal Waits for started context operations so an unawaited operation cannot escape rollback. */
    async _finish(): Promise<MutationResult> {
        while (this.pending.size) await Promise.all([...this.pending]);
        return this.failed ?? { success: true };
    }

    /** @internal Waits for all started operations before restoring a failed transaction. */
    async _settle(): Promise<void> {
        while (this.pending.size) {
            const batch = [...this.pending];
            await Promise.allSettled(batch);
            for (const operation of batch) this.pending.delete(operation);
        }
    }

    /** @internal Restores captured row state and membership in reverse mutation order. */
    _rollback(): void {
        for (const entry of [...this.restorations.values()].reverse()) entry.before();
    }

    /** @internal Captures the completed edit for replay without rerunning business rules. */
    _operation(): UndoOperation | undefined {
        if (!this.notifications.length) return undefined;
        const before = [...this.restorations.values()].map(entry => entry.before);
        const after = [...this.restorations.values()].map(entry => entry.captureAfter());
        const tables = [...new Set(this.notifications.map(entry => entry.table))];
        return {
            label: this.label,
            undo: () => this.dataSet._restoreHistory([...before].reverse()),
            redo: () => this.dataSet._restoreHistory(after),
            afterReplay: () => { for (const table of tables) table.changed.invoke({ kind: "reset" }); }
        };
    }

    /** @internal Delivers committed notifications; observer errors do not reverse the transaction. */
    _publish(): void {
        for (const { table, event } of this.notifications) table.changed.invoke(event);
    }

    /** Tracks context operations, recording asynchronous failures for transaction completion. */
    _track<T>(operation: Promise<T>): Promise<T> {
        this.pending.add(operation);
        operation.then(() => this.pending.delete(operation), () => {}).catch(() => {});
        return operation;
    }
}
