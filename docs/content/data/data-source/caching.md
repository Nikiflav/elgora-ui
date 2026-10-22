---
id: datasource-caching
title: Local processing and cache invalidation
group: data
parent: datasource
path: /data/data-source/caching
order: 35
description: Reuse local query work safely and invalidate after mutations or external dependency changes.
api:
  - ArrayDataSource
  - DataTable
  - LocalGroupingDataSource
---

# Local processing and cache invalidation

ArrayDataSource and DataTable keep bounded query caches; LocalGroupingDataSource reuses grouped results against the source revision. Keep accessors and summaries pure. Returned page arrays are independent containers, but row objects and field values are not cloned.

## ArrayDataSource cache

ArrayDataSource caches complete filtered/sorted row lists and total summaries.
Changing `skip`, `top` or `requireTotalCount` reuses the complete result instead
of processing the array again. Each local cache retains at most eight queries,
evicting the least recently used entry. Returned page arrays and summary records
are separate containers; row objects and object-valued results retain their references.

Successful updates to confirmed rows, `newRowSession.insert()` and `delete()`
increment [revision](?!=/api-reference/ArrayDataSource#revision) and invalidate the
caches before emitting `changed`. Failed operations and equal-value updates do
not invalidate. Pending-row creation, edits and cancellation do not invalidate
normal queries because pending rows are excluded from them.

Direct changes to the public array or its objects are **not tracked**. Explicitly
invalidate after those changes:

```ts
products[0].price = 42;
products.push({ id: nextId++, name: "Monitor", price: 199, stock: 4 });
source.invalidateCache();
```

[invalidateCache()](?!=/api-reference/ArrayDataSource#invalidateCache) increments
the revision, clears local query results and emits `{ kind: "reset" }`. Connected
grids can then reload. Refreshing a grid alone does not invalidate the source.
Also call this method when changing external data captured by an accessor,
filter function or custom summary, or replacing a configured filter function.

LocalGroupingDataSource uses the ArrayDataSource revision to cache complete group
results, counts and summaries independently for each adapter. It detects changes
to relevant field metadata and callback identities; captured external values still
require source invalidation. Paging through groups does not regroup the rows.
The adapter also supports [DataTable's local revision and caches](?!=/data/data-source/caching#datatable-cache),
but does not cache remote sources.
Failed/cancelled calculations and calculations completed after a revision change
are not stored in the query-result cache.

## Observe changes

```ts
const subscription = source.changed.subscribe(event => {
    if (event.kind === "insert" || event.kind === "delete" || event.kind === "reset") reloadProductList();
    if (event.kind === "update") updateProductDisplay(event.row, event.fields);
});
// When the consumer is destroyed:
subscription.dispose();
```

The event kinds are `create`, `update`, `insert`, `delete`, `cancel` and `reset`.
Only update supplies changed field names. Equal-value updates emit no event.
`create` means a draft was initialized; `insert` means it joined the array.

API: [changed](?!=/api-reference/ArrayDataSource#changed),
[DataSourceChanged](?!=/api-reference/DataSourceChanged).

For related tables, reversible business rules or a batch to send to a server, use
[DataSet](?!=/data/dataset) instead.

## DataTable cache

DataTable queries read DataRow values directly. Filtering, sorting and summaries
do not convert rows into plain objects or replace their references. Pending and
deleted rows are excluded from pages, counts and summaries.

```ts
const lines = dataset.getTable("salesOrderLines")!;
const page = await lines.loadData({
    filter: ["quantity", ">", 0],
    orderby: [["quantity", "desc"]],
    skip: 0, top: 20, requireTotalCount: true,
    totalSummary: [{ field: "quantity", summaryType: "sum" }]
});
// Totals cover all matching rows, before paging.
console.log(page.totalSummary, page.dataItems?.[0]?.getValue("quantity"));
```

API: [DataTable.loadData()](?!=/api-reference/DataTable#loadData),
[QueryArgs](?!=/api-reference/QueryArgs),
[DataRow.getValue()](?!=/api-reference/DataRow#getValue).

Complete filtered/sorted row lists and totals are cached in bounded local caches
(up to eight entries each). The grid's LocalGroupingDataSource also caches complete
group results against the table's
[revision](?!=/api-reference/DataTable#revision), so paging does not regroup the table.
Sorting reads each sort field once per row before comparing keys. Row objects and
field values are not cloned; returned pages have independent array containers.

Confirmed-row updates, insertion and deletion invalidate queries **at the point
the working data changes**, before rowChanged business handlers run. A query inside
a transaction therefore sees the current working values, including derived edits
already applied. Queries do not provide an isolated snapshot across asynchronous
mutations. UI `changed` notifications remain deferred until successful commit.

Rollback, undo/redo, import, acceptance/rejection and server ID mapping also
invalidate automatically. Revision numbers advance on invalidation; undo does not
restore an earlier revision number. Pending-only edits and equal-value updates do
not invalidate confirmed-row queries. Failed/cancelled async calculations, or
calculations completed after the revision changed, are not cached.

Use [DataTable.invalidateCache()](?!=/api-reference/DataTable#invalidateCache)
while the dataset is idle after changing external dependencies captured by custom
accessors/summaries, or after an in-place object modification. It increments the
revision and emits `{ kind: "reset" }`, but does not record an edit or undo operation.
In-place object changes are still not tracked for persistence or rollback; normally
replace a field through `setValue()` instead. Refreshing a grid alone does not
invalidate table caches. Dependencies captured from another table are not detected
automatically; stored calculated fields should be updated through business rules.
