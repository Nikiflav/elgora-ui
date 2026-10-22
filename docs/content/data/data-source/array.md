---
id: datasource-array
title: ArrayDataSource
group: data
parent: datasource
path: /data/data-source/array
order: 31
description: Edit a local product list with independent new-row sessions and change notifications.
sectionRedirects:
  - query-cache-and-invalidation|/data/data-source/caching#arraydatasource-cache
  - observe-changes|/data/data-source/caching#observe-changes
---

# ArrayDataSource

ArrayDataSource reads and edits the supplied array directly. Existing objects
retain their references; new rows are plain objects. There is no server request,
batch save or undo history.

## Product list

Use **Add product**, **Edit** and **Delete**. The form collects input until **OK**.
A new product stays outside the list until its session is inserted; **Cancel**
discards the draft. Expand **Change notifications** to see the event kind, row
and current values.

<live-demo id="datasource-array-products" height="470px" src="array.md.ts"></live-demo>

The demo's form validation belongs to the UI; it is not an ArrayDataSource business
rule. Direct changes to the public array or its objects do not emit `changed`.
Use the mutation methods when consumers need notifications.

## Configure defaults and identities

```ts
import { ArrayDataSource } from "elgora-ui";

type Product = { id: number; name: string; price: number; stock: number };
const products: Product[] = [
    { id: 1, name: "Wireless keyboard", price: 49, stock: 12 }
];
let nextId = products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
const source = new ArrayDataSource(products, {
    defaults: () => ({ name: "", price: 0, stock: 0 }),
    createRowId: () => nextId++
});
```

`idField` defaults to `id`. The generated identity overrides the same member in
defaults and cannot be changed through `update()`. Factories may be asynchronous;
multiple drafts can coexist. Duplicate identities are rejected, including identities
reserved by another pending session.

API: [ArrayDataSource](?!=/api-reference/ArrayDataSource),
[ArrayDataSourceOptions](?!=/api-reference/ArrayDataSourceOptions).

## Read and edit

```ts
const page = await source.loadData({
    filter: ["stock", ">", 0], skip: 0, top: 10, requireTotalCount: true
});
const edited = await source.update(products[0], { price: 45 });
if (!edited.success) showError(edited.error);

const draft = await source.createNewRow();
await source.update(draft.row, { name: "Mouse", price: 23, stock: 8 });
const inserted = await draft.insert();
if (!inserted.success) showError(inserted.error);
await source.delete(products[0]);
```

API: [loadData](?!=/api-reference/ArrayDataSource#loadData),
[update](?!=/api-reference/ArrayDataSource#update),
[delete](?!=/api-reference/ArrayDataSource#delete),
[createNewRow](?!=/api-reference/ArrayDataSource#createNewRow),
[NewRowSession](?!=/api-reference/NewRowSession).

Update/delete operate on the source's actual row reference, not a newly constructed
object with the same ID. Pending rows can be updated but must be cancelled rather
than deleted. Repeated successful insert/cancel calls are harmless; switching from
an inserted session to cancel, or from a cancelled session to insert, rejects.

## Local query processing

`loadData()` filters and sorts before paging; total summaries use the complete
filtered result, not just the returned page. Sorting never reorders the supplied
array, and returned pages have their own array container while retaining row references.
The grid provides local grouping through
[LocalGroupingDataSource](?!=/api-reference/LocalGroupingDataSource).

For calculated fields, prefer a synchronous accessor when the value is already
available locally:

```ts
import type { DataField } from "elgora-ui";

type OrderLine = { quantity: number; price: number };
const amount: DataField<OrderLine> = {
    name: "amount", dataType: "number",
    getValue: row => row.quantity * row.price
};
```

Async accessors and custom summary callbacks are also supported and awaited in
order. Accessors and summary callbacks must not change source data. A local query
may read a field once per row and reuse that value for several summaries,
including group and total summaries. Completed query results can be reused until
the source is invalidated; see [cache invalidation](?!=/data/data-source/caching).

See [DataField](?!=/api-reference/DataField) and
[SummaryDefinition](?!=/api-reference/SummaryDefinition).

## Related topics

- [Local processing and cache invalidation](?!=/data/data-source/caching)
- [Queries, grouping and summaries](?!=/data/data-source/queries)
