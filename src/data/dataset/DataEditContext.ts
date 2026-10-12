import type { DataTransaction } from "./DataTransaction";
import type { DataTable } from "./DataTable";
import type { DataRow } from "./DataRow";
import type { MutationResult, NewRowSession, DataSourceChanged } from "../DataSource";

/** Business-rule notification delivered inside the current transaction, never during undo/redo. */
export interface DataRowChangeEvent {
    /**
     * The local operation being validated or processed by a business rule.
     *
     * - create: createNewRow() initialized a pending row. It is not in table.rows or query/save
     *   results yet. Only rowChanged emits this kind, after identity and defaults are available.
     * - update: one or more field values change, on either a confirmed or pending row.
     *   rowChanging sees proposed values; rowChanged sees applied values.
     * - insert: NewRowSession.insert() includes the pending row in its table.
     *   rowChanging sees isPending === true; rowChanged sees isPending === false.
     *   This is local insertion, not a server save; the row remains in added state.
     * - delete: table.delete() marks a confirmed row deleted, or removes an unsaved added row.
     *   Pending rows must be cancelled instead of deleted.
     * - cancel: NewRowSession.cancel() discards a pending row without inserting it.
     *   rowChanging sees the pending session; rowChanged sees the cancelled session.
     *
     * create and insert are separate steps: a user can fill in a created draft, then insert
     * it or cancel it. Lifecycle kinds have empty fields; only update identifies changed fields.
     * Business events do not emit reset and are not invoked during undo/redo or import.
     * @example
     * table.rowChanged.subscribe(async e => {
     *     if (e.kind === "create") {
     *         await e.context.setValue(e.row, "quantity", 1); // initialize the draft
     *     } else if (e.kind === "insert") {
     *         await updateRelatedTotals(e.context); // the row now participates in table queries
     *     }
     * });
     */
    readonly kind: Exclude<DataSourceChanged<DataRow>["kind"], "reset">;
    readonly row: DataRow;
    /** Names of fields that actually change for update; empty for create, insert, delete and cancel. */
    readonly fields: readonly string[];
    /** Previous values of changed fields for updates; the row's values for lifecycle operations. */
    readonly oldValues: Readonly<Record<string, unknown>>;
    /** Proposed values before an update, applied values after it; field values are not cloned. */
    readonly values: Readonly<Record<string, unknown>>;
    readonly context: DataEditContext;
    /** Rejects the complete transaction. Example: e.reject("Quantity must be positive"). */
    reject(error: string, fieldErrors?: Record<string, string>): void;
}

/** One causal step, retained across asynchronous business-rule continuations. */
interface ChangeStep { row: DataRow; fields: readonly string[]; }

/**
 * Transaction-bound access to the same dataset, tables and rows, without copying them.
 * Use event.context for derived edits; ordinary row.setValue() cannot join an active transaction.
 * The context expires when its transaction completes.
 * Re-entering a changed field in the same causal chain rejects the edit as a cycle.
 * Equal values do not re-enter the chain. Independent sequential edits remain allowed.
 * Async subscribers are awaited sequentially. Await derived edits before reading their results.
 * Chains longer than 100 steps are rejected as a safety limit.
 * @example
 * orders.rowChanged.subscribe(async e => {
 *     if (e.fields.includes("quantity"))
 *         await e.context.setValue(e.row, "total", Number(e.row.getValue("quantity")) * 10);
 * });
 */
export class DataEditContext {
    /** @internal Created by the transaction or a business event. */
    constructor(readonly transaction: DataTransaction, private readonly chain: readonly ChangeStep[] = []) {}

    /** Looks up an existing table. Example: context.getTable("orders"). */
    getTable(name: string): DataTable | undefined {
        this.transaction._ensureActive();
        return this.transaction.dataSet.getTable(name);
    }

    /** Changes a field and tracks the operation even when the event handler does not await it. */
    setValue(row: DataRow, field: string, value: unknown): Promise<MutationResult> {
        return this.update(row, { [field]: value });
    }

    /** Applies several fields in this transaction. Example: context.update(row, { price: 5 }). */
    update(row: DataRow, values: Record<string, unknown>): Promise<MutationResult> {
        this._checkTarget(row);
        return this.transaction._track(row.table.update(row, values, this.transaction, this));
    }

    /** Deletes a confirmed row in this transaction. */
    delete(row: DataRow): Promise<MutationResult> {
        this._checkTarget(row);
        return this.transaction._track(row.table.delete(row, this.transaction, this));
    }

    /** Creates a pending row in the specified table. Example: context.createNewRow(items). */
    createNewRow(table: DataTable): Promise<NewRowSession<DataRow>> {
        this._checkTarget();
        return this.transaction._track(table.createNewRow(this.transaction, this));
    }

    /** Includes a pending session in the table, without persisting it to a server. */
    insert(session: NewRowSession<DataRow>): Promise<MutationResult> {
        this._checkTarget(session.row);
        return this.transaction._track(session.row.table._insertNewRow(session.row, this.transaction, this));
    }

    /** Discards a pending session in the same transaction. */
    cancel(session: NewRowSession<DataRow>): Promise<void> {
        this._checkTarget(session.row);
        return this.transaction._track(session.row.table._cancelNewRow(session.row, this.transaction, this));
    }

    /** @internal Prevents pending-row rules from modifying other rows before insertion. */
    _checkTarget(row?: DataRow): void {
        this.transaction._ensureActive();
        if (this.chain.some(step => step.row.isPending && step.row !== row))
            throw new Error("Failed to apply business rule. A pending-row rule cannot modify other rows.");
    }

    /** @internal Extends this immutable causal chain; checks only fields that actually change. */
    _enter(row: DataRow, fields: readonly string[], kind = "update"): DataEditContext {
        this._checkTarget(row);
        const changedFields = fields.length ? fields : ["$" + kind];
        if (this.chain.length >= 100 || this.chain.some(step => step.row === row &&
            changedFields.some(field => step.fields.includes(field))))
            throw new Error("Failed to apply business rule. Cyclic change detected in table '" +
                row.table.name + "', row '" + String(row.key) + "', fields '" + fields.join(", ") + "'.");
        return new DataEditContext(this.transaction, [...this.chain, { row, fields: changedFields }]);
    }
}
