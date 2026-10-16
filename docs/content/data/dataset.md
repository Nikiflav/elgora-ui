---
id: dataset
title: DataSet
group: data
path: /data/dataset
order: 10
description: Edit related tables locally, run business rules in transactions, undo changes and save one batch.
next: /core/undo-coordinator
api:
  - DataSet
  - DataTable
  - DataRow
  - DataEditContext
  - DataRowChangeEvent
---

# DataSet

A DataSet holds the working data for an application screen. Its named tables implement
the DataSource contract, while DataRow objects retain their identity across edits,
rollback and undo/redo. Edits are local until the application saves the accumulated changes.

Use it when several views should share pending edits, calculated fields and one data
history. A remote source can still be used directly; a DataSet is useful when the
application wants a local batch-edit workspace.

## Try an order editor

The sales order has a header in `salesOrders` and its lines in `salesOrderLines`.
Click **Edit** or **Add line** to open a form. **OK** accepts the form locally;
**Cancel** discards its input. A business rule calculates the line amount and updates
the total in the order header. One **Undo** reverses the accepted edit and both totals.
Deleting a line also updates the order total and can be undone.

**Save order** sends the accumulated changes to a simulated server. Successful saving
accepts the data, maps temporary line IDs and clears the data undo history. Under
**Behind the scenes**, enable **Simulate server rejection** to see a failed save
retain the local changes. A new line is pending until **OK** inserts it; **Cancel**
cancels its session. Undoing insertion restores the draft: use **Resume draft** to
finish or cancel it before saving.

<live-demo id="dataset-order-editor" height="650px"></live-demo>

Expand **Behind the scenes** to inspect the save payload and event log. Business entries
show the transaction label, table, row ID and old → new field values, including derived
line and header totals. Lifecycle entries show the row values; committed UI notifications
show the resulting row or table snapshot. Server entries include the request and ID mappings.
Business events ("BEFORE" and "AFTER") are distinct from committed UI notifications
("UI"). Their `kind` values are listed in
[Event kinds](#event-kinds) below. The contracts are
[DataRowChangeEvent](?!=/api-reference/DataRowChangeEvent) and
[DataSourceChanged](?!=/api-reference/DataSourceChanged).

The form keeps its inputs separate from the working data until **OK**. Editing an
existing line and inserting a new one share the same acceptance path:

```ts
const result = await dataset.transaction("Accept order line", async tx => {
    await tx.update(lines, row, { product, quantity, price });
    if (newRowSession) await tx.insert(newRowSession);
});
if (!result.success) {
    showFormError(result.error); // keep the form open for correction
}
```

API: [DataSet.transaction()](?!=/api-reference/DataSet#transaction),
[DataTransaction.update()](?!=/api-reference/DataTransaction#update),
[insert()](?!=/api-reference/DataTransaction#insert),
[NewRowSession](?!=/api-reference/NewRowSession),
[MutationResult](?!=/api-reference/MutationResult).

Accepting the form does not contact the server. **Save order** later calls
[DataSet.saveChanges()](?!=/api-reference/DataSet#saveChanges) with the complete
batch from both tables. Cancelling an existing-line form needs no rollback because
its inputs have not been applied; cancelling a new-line form calls
[NewRowSession.cancel()](?!=/api-reference/NewRowSession#cancel).

## Create a dataset and tables

Create tables through the dataset so they participate in its save batch and transactions.
Table names must be unique. Initial imported rows are accepted, with state unchanged.
The identity field defaults to id; identities are strings or finite numbers.

```ts
import { DataSet } from "elgora-ui";

const dataset = new DataSet({
    createRowId: table => table.name + "-" + crypto.randomUUID()
});
let lastOrderId = 0;
const orders = dataset.createTable("orders", [
    { id: 1, quantity: 2, price: 10, total: 20 }
], {
    idField: "id",
    createRowId: table => lastOrderId = table.rows.reduce(
        (max, row) => Math.max(max, Number(row.key)), lastOrderId
    ) + 1,
    defaults: () => ({
        quantity: 1,
        price: 0,
        total: 0,
        createdAt: new Date()
    })
});
const totals = dataset.createTable("totals", [{ id: "screen", amount: 20 }]);

dataset.getTable("orders") === orders;
orders.dataSet === dataset;
```

API: [DataSet](?!=/api-reference/DataSet), [createTable()](?!=/api-reference/DataSet#createTable), [getTable()](?!=/api-reference/DataSet#getTable), [DataSetOptions](?!=/api-reference/DataSetOptions), [DataTableOptions](?!=/api-reference/DataTableOptions).

defaults may be an object, a function, or an asynchronous function. The function runs
for every new row. createRowId can also be asynchronous, and a table-level generator
overrides the dataset generator. The generated identity takes precedence over an
identity supplied in defaults.

## Read values and track edits

```ts
const order = orders.getRow(1)!;
const result = await order.setValue("quantity", 5);
if (!result.success) {
    console.error(result.error, result.fieldErrors);
}

order.getValue("quantity");    // 5
order.getOriginal("quantity"); // 2
order.isModified("quantity");  // true
order.toObject();              // new field container; values are not cloned
order.changes();               // { quantity: 5 }
orders.getChanges();           // [{ type: "update", key: 1, data: { quantity: 5 } }]
```

API: [DataRow](?!=/api-reference/DataRow): [setValue()](?!=/api-reference/DataRow#setValue), [getValue()](?!=/api-reference/DataRow#getValue), [getOriginal()](?!=/api-reference/DataRow#getOriginal), [isModified()](?!=/api-reference/DataRow#isModified), [toObject()](?!=/api-reference/DataRow#toObject), [changes()](?!=/api-reference/DataRow#changes); [DataTable.getChanges()](?!=/api-reference/DataTable#getChanges), [MutationResult](?!=/api-reference/MutationResult).

Rows have four persistence states:

| State | Meaning |
| --- | --- |
| unchanged | Accepted data without tracked edits |
| modified | An existing row was edited; transport includes differing fields |
| added | A new row not yet accepted after persistence |
| deleted | A confirmed row marked for removal |

Changing a field back to an equal accepted value removes that field from the update
payload. The row may retain modified state even when getChanges() has no update for it.
Deleting an unsaved added row removes it without creating a server delete request.

## Transactions

An ordinary setValue(), update(), delete(), create, insert or cancel has its own
transaction. Group several operations explicitly when they represent one action:

```ts
const result = await dataset.transaction("Set order quantities", async tx => {
    await tx.context.setValue(order, "quantity", 5);
    const other = tx.context.getTable("orders")!.getRow(2);
    if (other) await tx.context.update(other, { quantity: 10, price: 12 });
});
if (!result.success) console.error(result.error);
```

API: [DataSet.transaction()](?!=/api-reference/DataSet#transaction), [DataTransaction](?!=/api-reference/DataTransaction), [DataEditContext](?!=/api-reference/DataEditContext): [setValue()](?!=/api-reference/DataEditContext#setValue), [update()](?!=/api-reference/DataEditContext#update), [getTable()](?!=/api-reference/DataEditContext#getTable).

All direct edits and their business effects become one undo operation. Before the
first change to each affected row, the transaction records its values, accepted
values, state, membership and new-row session status.

Changes are visible to reads while the transaction is running. UI notifications are
deferred until success; this is not read isolation. Unrelated writes, imports and
saves are blocked, including across await. Use the context to join the transaction.

Validation rejection returns success: false. Exceptions reject the Promise.
Both restore the complete edit and add no history. Rollback cannot reverse external
side effects: do not persist to the server from a business-rule subscription.

## Validation and business rules

rowChanging runs before an update, insertion, deletion or cancellation.
rowChanged runs after the mutation, inside the same transaction, including new-row
creation. Creation is reported after defaults and the identity are initialized.

```ts
orders.rowChanging.subscribe(e => {
    if (e.fields.includes("quantity") && Number(e.values.quantity) < 0) {
        e.reject("Quantity must be nonnegative", {
            quantity: "Must be nonnegative"
        });
    }
});

orders.rowChanged.subscribe(async e => {
    if (!e.fields.includes("quantity") && !e.fields.includes("price")) return;
    const amount = Number(e.row.getValue("quantity")) * Number(e.row.getValue("price"));
    await e.context.setValue(e.row, "total", amount);

    // Pending rows must not change other rows until they are inserted.
    if (!e.row.isPending) {
        const screen = e.context.getTable("totals")!.getRow("screen")!;
        await e.context.setValue(screen, "amount", amount);
    }
});
```

API: [DataTable.rowChanging](?!=/api-reference/DataTable#rowChanging), [rowChanged](?!=/api-reference/DataTable#rowChanged), [DataRowChangeEvent](?!=/api-reference/DataRowChangeEvent): [fields](?!=/api-reference/DataRowChangeEvent#fields), [values](?!=/api-reference/DataRowChangeEvent#values), [reject()](?!=/api-reference/DataRowChangeEvent#reject); [DataRow.isPending](?!=/api-reference/DataRow#isPending), [DataEditContext.setValue()](?!=/api-reference/DataEditContext#setValue).

The event supplies kind, row, fields, oldValues, values and context. For updates,
oldValues and values contain the affected fields. Values are readonly field containers,
not cloned objects. reject() stops dispatch and rejects the complete transaction.

### Event kinds

Business events use [DataRowChangeEvent](?!=/api-reference/DataRowChangeEvent).
The following table describes events emitted by DataTable:

| `kind` | Operation | `rowChanging` | `rowChanged` |
| --- | --- | --- | --- |
| `create` | A new pending row is initialized with its identity and defaults | Not emitted | Row is pending; use the context to initialize more fields |
| `update` | One or more field values actually change, including on pending rows | Before applying the values | After applying the values |
| `insert` | A pending session is inserted locally | Row is still pending | Row is confirmed and `isPending` is false |
| `delete` | A confirmed row is marked deleted, or an unsaved added row is removed | Before deletion | After deletion |
| `cancel` | A pending session is cancelled | Row is still pending | Session is cancelled and `isPending` is false |

For `update`, `fields` contains the names that changed. For the other kinds it is
empty: detect the lifecycle operation using `kind`, not `fields`. Equal-value edits
and repeated successful insert/cancel calls do not emit new events.

The order-editor demo updates its header total on a line `total` change, insertion
or deletion. Pending lines do not affect the header until insertion succeeds:

```ts
lines.rowChanged.subscribe(async e => {
    if (e.row.isPending) return;
    if (e.kind !== "insert" && e.kind !== "delete" && !e.fields.includes("total")) return;

    const amount = lines.rows
        .filter(row => row.state !== "deleted")
        .reduce((sum, row) => sum + Number(row.getValue("total")), 0);
    const header = e.context.getTable("salesOrders")!.getRow("SO-1042")!;
    await e.context.setValue(header, "total", Math.round(amount * 100) / 100);
});
```

API: [DataRowChangeEvent.kind](?!=/api-reference/DataRowChangeEvent#kind), [DataRow.isPending](?!=/api-reference/DataRow#isPending), [DataTable.rows](?!=/api-reference/DataTable#rows), [DataEditContext.getTable()](?!=/api-reference/DataEditContext#getTable), [setValue()](?!=/api-reference/DataEditContext#setValue).

For UI consumers, `changed` uses
[DataSourceChanged](?!=/api-reference/DataSourceChanged). It reports the same five
mutation kinds only after transaction success, plus `reset` for undo/redo,
acceptance, rejection and nonempty imports. Business events never emit `reset`
and never rerun during replay. A failed transaction emits no committed UI changes.

The context operates on the actual dataset and rows. It provides getTable(), setValue(),
update(), delete(), createNewRow(), insert() and cancel(). Do not call ordinary
row.setValue() from a rule: it attempts an independent edit. A context expires when
the transaction finishes.

### Asynchronous rules

Business events use [AsyncObservableEvent](?!=/api-reference/AsyncObservableEvent). Subscribers run sequentially in subscription
order, and their returned Promises are awaited. No waitUntil registration is needed.

```ts
orders.rowChanged.subscribe(async e => {
    if (!e.fields.includes("productCode")) return;
    const response = await fetch("/api/prices/" + encodeURIComponent(
        String(e.row.getValue("productCode"))
    ));
    if (!response.ok) throw new Error("Failed to load product price.");
    const product = await response.json();
    await e.context.setValue(e.row, "price", product.price);
});
```

API: [AsyncObservableEvent.subscribe()](?!=/api-reference/AsyncObservableEvent#subscribe), [DataTable.rowChanged](?!=/api-reference/DataTable#rowChanged), [DataRow.getValue()](?!=/api-reference/DataRow#getValue), [DataEditContext.setValue()](?!=/api-reference/DataEditContext#setValue).

Await or return derived edits when subsequent rules depend on them. An exception stops
later subscribers and causes rollback. UI consumers should use changed instead:

```ts
const subscription = orders.changed.subscribe(e => {
    // Runs after successful edits; replay reports kind: "reset".
    repaintOrders();
});
subscription.dispose(); // when the consumer is destroyed
```

API: [DataTable.changed](?!=/api-reference/DataTable#changed), [DataSourceChanged](?!=/api-reference/DataSourceChanged), [ObservableEvent.subscribe()](?!=/api-reference/ObservableEvent#subscribe).

### Cyclic rules

The context remembers the causal chain, including asynchronous continuations.
A real change that re-enters the same row and field in that chain is rejected:
quantity → total → quantity. Equal values are harmless, and independent sequential
edits to a field are allowed. Chains of more than 100 steps are also rejected.

## Equality and object-valued fields

The default comparison is `Object.is`. Objects, arrays and dates are stored by reference
and are not cloned. Replace a field value to track a change; modifying the contents
of the same object is not tracked or reversed by undo.

```ts
const locations = dataset.createTable("locations", [], {
    equals: (field, a, b) => {
        if (field !== "position") return Object.is(a, b);
        const left = a as { latitude: number; longitude: number } | undefined;
        const right = b as typeof left;
        return left === right || (!!left && !!right &&
            left.latitude === right.latitude && left.longitude === right.longitude);
    }
});
```

API: [DataSet.createTable()](?!=/api-reference/DataSet#createTable), [DataTableOptions.equals](?!=/api-reference/DataTableOptions#equals).

equals is synchronous and must be side-effect-free, reflexive, symmetric and transitive.
It is used both to detect edits and to compare with accepted values. Equal values do
not replace the existing reference, raise business events or add history.

## New-row sessions

```ts
const draft = await orders.createNewRow();
await orders.update(draft.row, { quantity: 2, price: 15 });

draft.state;                 // "pending"
draft.row.table === orders;   // true, including while pending
draft.row.isPending;          // true
orders.rows.includes(draft.row); // false
const result = await draft.insert();
if (!result.success) console.error(result.error);

// After success, the same row is in orders.rows, still with state "added".
// draft.row.isPending is now false.
// Alternatively, while pending:
// await draft.cancel();
```

API: [DataTable.createNewRow()](?!=/api-reference/DataTable#createNewRow), [update()](?!=/api-reference/DataTable#update), [NewRowSession](?!=/api-reference/NewRowSession): [insert()](?!=/api-reference/NewRowSession#insert), [cancel()](?!=/api-reference/NewRowSession#cancel), [state](?!=/api-reference/NewRowSession#state); [DataRow.table](?!=/api-reference/DataRow#table), [isPending](?!=/api-reference/DataRow#isPending).

Pending rows are excluded from queries, counts, summaries and save payloads. Several
sessions can coexist. Rules for a pending row may edit that row but not other rows.
Insertion rules can update related rows after the session reaches the inserted state.

Use row.isPending to check for a pending session without allocating and searching a
row list. It becomes false on either insert or cancel and follows undo/redo and rollback.
False alone does not guarantee membership: cancelled and removed rows are not pending.

Insert and cancel are individually idempotent. Insert after cancel, or cancel after
insert, rejects. A rejected insert leaves the session pending. Creation and cancellation
failures reject their Promises because those methods do not return MutationResult.

Creation, field edits and local insert each have their own undo entry. Undoing creation
cancels its session; redo restores the same row and session. Undoing insert makes it
pending again.

## Undo and redo

```ts
await dataset.undoCoordinator.undo();
await dataset.undoCoordinator.redo();
dataset.undoHistory.canUndo;
dataset.undoHistory.canRedo;
```

API: [UndoCoordinator.undo()](?!=/api-reference/UndoCoordinator#undo), [redo()](?!=/api-reference/UndoCoordinator#redo), [DataSet.undoHistory](?!=/api-reference/DataSet#undoHistory), [UndoHistory.canUndo](?!=/api-reference/UndoHistory#canUndo), [canRedo](?!=/api-reference/UndoHistory#canRedo).

Replay restores recorded row versions without rerunning business rules. Derived
values are already included in the recorded operation. UI observers receive a reset
after restoration. A new successful edit discards the coordinator's global redo branch.
Read [UndoCoordinator](?!=/core/undo-coordinator) for shared data/view histories.

## Save, accept and reject

The application owns persistence. Insert the pending sessions you want included,
check their results, and then send the dataset's batch:

```ts
for (const draft of openDrafts) {
    if (draft.state !== "pending") continue;
    const result = await draft.insert();
    if (!result.success) throw new Error(result.error);
}

const result = await dataset.saveChanges(async changes => {
    const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
    });
    if (!response.ok) throw new Error("Failed to save changes.");
    return response.json();
});
```

API: [NewRowSession.insert()](?!=/api-reference/NewRowSession#insert), [DataSet.saveChanges()](?!=/api-reference/DataSet#saveChanges), [DataSetSaveHandler](?!=/api-reference/DataSetSaveHandler), [DataSetChanges](?!=/api-reference/DataSetChanges), [DataSetSaveChangesResult](?!=/api-reference/DataSetSaveChangesResult).

The payload is grouped by table name. Insert entries include all values; updates
include changed fields; removals carry the key. Expected validation failures resolve
with success: false and optional fieldErrors. Transport failures reject.

Temporary identities can be mapped without replacing DataRow objects:

```ts
return {
    success: true,
    keyMappings: {
        orders: [{ temporaryKey: "orders-client-id", key: 123 }]
    }
};
```

API: [DataSetSaveChangesResult](?!=/api-reference/DataSetSaveChangesResult), [KeyMapping](?!=/api-reference/KeyMapping).

Mappings are validated before any is applied. Related foreign-key fields are not
rewritten automatically. A successful save accepts all confirmed changes and clears
this dataset's history, preserving other coordinator scopes. Failed saves retain
the edits and history.

For external persistence use acceptChanges(); for explicit discard use rejectChanges():

```ts
// When data was successfully persisted outside saveChanges():
dataset.acceptChanges();

// To discard the screen's edits:
for (const draft of openDrafts) {
    if (draft.state === "pending") await draft.cancel();
}
dataset.rejectChanges();
```

API: [DataSet.acceptChanges()](?!=/api-reference/DataSet#acceptChanges), [rejectChanges()](?!=/api-reference/DataSet#rejectChanges), [NewRowSession.cancel()](?!=/api-reference/NewRowSession#cancel).

Save, accept and reject throw while any pending session or unfinished creation remains.
They never choose insert/cancel for the application. A nonempty import of refreshed
data also clears the dataset history to prevent stale replay. A table-level accept,
reject or import clears the whole dataset scope because entries may span tables.

## API reference

See the [DataSet API Reference](?!=/api-reference/DataSet) for the complete contract.
