---
id: dataset-rules
title: Transactions and business rules
group: data
parent: dataset-group
path: /data/dataset/rules
order: 52
description: Validate and calculate related data atomically with awaited business events and rollback.
api:
  - DataTransaction
  - DataEditContext
  - DataRowChangeEvent
---

# Transactions and business rules

The examples continue with the dataset and orders table from
[Tables, rows and change tracking](?!=/data/dataset/tables). Try the complete
[sales order example](?!=/data/dataset) to see rules, local acceptance and saving together.

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
