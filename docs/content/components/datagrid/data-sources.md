---
id: datagrid-data-sources
title: Connecting data
group: datagrid
path: /components/datagrid/data-sources
order: 20
description: Connect DataGrid to local arrays, asynchronous loaders, and remote data contracts.
toc: true
api:
  - DataSource
  - ArrayDataSource
  - GridDataSource
  - DataGrid
keywords:
  - data source
  - async
  - paging
  - remote data
---

# Connecting data

The grid consumes a `DataSource` contract rather than depending on a specific
storage technology. `ArrayDataSource` is useful for local data; an application
can implement `loadData()` for an API, database, or service layer.

<live-demo id="datagrid-data-sources" height="376px" src="data-sources.md.ts"></live-demo>

The same grid options work with both local and remote sources. Queries carry
filtering, sorting, grouping, paging, and an `AbortSignal` for cancelled loads.

## Editing an array source

ArrayDataSource implements the optional editing methods of DataSource.
`update()` changes the actual row object, and `delete()` removes it from the supplied
array. Changes are immediate and local; there is no batch save or undo history.
Use [DataSet](?!=/data/dataset) when you need transactions, undo or a batch to persist.

```ts
import { ArrayDataSource } from "elgora-ui";

type Line = { id: number; product: string; quantity: number };
const rows: Line[] = [{ id: 1, product: "Keyboard", quantity: 2 }];
let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
const source = new ArrayDataSource(rows, {
    defaults: () => ({ product: "", quantity: 1 }),
    createRowId: () => nextId++
});

const result = await source.update(rows[0], { quantity: 3 });
if (!result.success) console.error(result.error);

const draft = await source.createNewRow();
await source.update(draft.row, { product: "Mouse", quantity: 2 });
// The draft is not yet in rows, query results, counts or summaries.
const inserted = await draft.insert();
if (!inserted.success) console.error(inserted.error);
// Alternatively, while still pending: await draft.cancel();

await source.delete(rows[0]);
```

API: [ArrayDataSourceOptions](?!=/api-reference/ArrayDataSourceOptions),
[update()](?!=/api-reference/ArrayDataSource#update),
[delete()](?!=/api-reference/ArrayDataSource#delete),
[createNewRow()](?!=/api-reference/ArrayDataSource#createNewRow),
[NewRowSession](?!=/api-reference/NewRowSession).

New rows are plain objects. The identity field defaults to `id`; configure
`idField` for another member. The generated identity overrides a default value
for that member and cannot be changed through `update()`. Multiple drafts can
coexist; duplicate identities are rejected. Defaults and identity factories can
be asynchronous. Insertion keeps the same row reference and identity.

The [changed event](?!=/api-reference/ArrayDataSource#changed) reports `create`,
`update`, `insert`, `delete` and `cancel`. Equal-value updates and repeated
successful insert/cancel calls emit no additional event. Direct external edits
to the public array or its objects do not emit this event.

## Grouping adapters preserve editing capabilities

[LocalGroupingDataSource](?!=/api-reference/LocalGroupingDataSource) delegates
`update`, `delete`, `createNewRow`, row identity and hierarchy methods only when
the wrapped source supplies them. A read-only source therefore stays read-only.
New-row sessions belong to the original source, not to the adapter.

The adapter exposes the original `changed` event and `undoCoordinator`.
Wrapping a DataTable preserves its dataset transactions and history; wrapping
an ArrayDataSource does not introduce history or persistence.

## API reference

See [`DataSource`](?!=/api-reference/DataSource),
[`ArrayDataSource`](?!=/api-reference/ArrayDataSource), and
[`GridDataSource`](?!=/api-reference/GridDataSource).
