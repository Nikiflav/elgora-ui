---
id: dataset
title: DataSet overview
navTitle: Overview
group: data
path: /data/dataset
order: 50
description: Edit related tables locally, run business rules in transactions, undo changes and save one batch.
api:
  - DataSet
  - DataTable
  - DataRow
  - DataEditContext
  - DataRowChangeEvent
parent: dataset-group
sectionRedirects:
  - api-reference|/data/dataset#related-topics
  - create-a-dataset-and-tables|/data/dataset/tables#create-a-dataset-and-tables
  - read-values-and-track-edits|/data/dataset/tables#read-values-and-track-edits
  - equality-and-object-valued-fields|/data/dataset/tables#equality-and-object-valued-fields
  - transactions|/data/dataset/rules#transactions
  - validation-and-business-rules|/data/dataset/rules#validation-and-business-rules
  - event-kinds|/data/dataset/rules#event-kinds
  - asynchronous-rules|/data/dataset/rules#asynchronous-rules
  - cyclic-rules|/data/dataset/rules#cyclic-rules
  - new-row-sessions|/data/dataset/new-rows#new-row-sessions
  - save-accept-and-reject|/data/dataset/saving#save-accept-and-reject
  - undo-and-redo|/data/dataset/saving#undo-and-redo
  - queries-and-local-caches|/data/data-source/caching#datatable-cache
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

<live-demo id="dataset-order-editor" height="650px" src="dataset.md.ts"></live-demo>

Expand **Behind the scenes** to inspect the save payload and event log. Business entries
show the transaction label, table, row ID and old → new field values, including derived
line and header totals. Lifecycle entries show the row values; committed UI notifications
show the resulting row or table snapshot. Server entries include the request and ID mappings.
Business events ("BEFORE" and "AFTER") are distinct from committed UI notifications
("UI"). Their `kind` values are listed in
[Event kinds](?!=/data/dataset/rules#event-kinds). The contracts are
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

## Related topics

- [Tables, rows and change tracking](?!=/data/dataset/tables)
- [Transactions and business rules](?!=/data/dataset/rules)
- [New-row sessions](?!=/data/dataset/new-rows)
- [Saving, accepting and rejecting changes](?!=/data/dataset/saving)
- [Local processing and cache invalidation](?!=/data/data-source/caching)
