---
id: datasource-overview
title: Overview
group: data
parent: datasource
path: /data/data-source/overview
order: 1
description: Read and optionally edit data through a storage-independent contract.
---

# DataSource

A DataSource connects a view to its working data. It can read an array, call an
HTTP API or expose a DataTable. Consumers work with the same query contract
without depending on the storage implementation.

Start with [ArrayDataSource](?!=/data/data-source/array) for local records, or
[Custom remote source](?!=/data/data-source/remote) for a paged catalog.
Both examples use a simple table so the data-source behavior is visible without
requiring a DataGrid.

## Reading data

Only `loadData(args)` is required:

```ts
import type { DataSource } from "elgora-ui";

type Product = { id: number; name: string; price: number };
const source: DataSource<Product> = {
    async loadData(args) {
        const page = await api.getProducts({
            filter: args.filter, skip: args.skip, top: args.top,
            signal: args.abortSignal
        });
        return {
            args,
            dataItems: page.items,
            totalCount: args.requireTotalCount ? page.totalCount : undefined
        };
    }
};
```

The `api` in this snippet is an application-owned client. See the remote example
for a complete implementation with a simulated endpoint.

API: [DataSource.loadData](?!=/api-reference/DataSource#loadData),
[QueryArgs](?!=/api-reference/QueryArgs), [DataResult](?!=/api-reference/DataResult).

The query may contain filtering, sorting, paging, grouping and summary requests.
Return the original `args` with the result. When requested, `totalCount` describes
all matching rows or groups **before paging**, not the size of the returned page.
Total summaries similarly cover the complete filtered set. A remote source can
omit count/summary computation when those values are not requested.

See [DataFilter](?!=/data/filter) for filter structures, local evaluation and an
interactive FilterEditor example.

For grouping, a supported query returns `groups` (including an empty array for
no matches). If grouping is unsupported, return neither `groups` nor `dataItems`
for that request. [LocalGroupingDataSource](?!=/api-reference/LocalGroupingDataSource)
can then request flat data and provide local grouping. A remote fallback must
make the complete matching data available; a single server page cannot produce
complete groups or totals.

## Optional capabilities

| Capability | Purpose |
| --- | --- |
| update(row, values) | Apply a field patch to an existing or pending row |
| delete(row) | Delete a confirmed row |
| createNewRow() | Initialize a pending editing session |
| changed | Notify consumers when working data changes |
| undoCoordinator | Expose history owned by the source/application |
| getRowId(row) | Provide a stable row identity |
| hasChildren(row) | Declare hierarchical data and per-row expandability |

Missing mutation methods mean the corresponding operation is unavailable.
An adapter must preserve that distinction rather than advertise methods that
its underlying source cannot execute.

API: [DataSource](?!=/api-reference/DataSource),
[MutationResult](?!=/api-reference/MutationResult),
[DataSourceChanged](?!=/api-reference/DataSourceChanged).

## New rows

A new-row session owns the actual draft row. Initialize it, edit it through
the source, and explicitly insert or cancel:

```ts
if (!source.createNewRow || !source.update) return;
const draft = await source.createNewRow();
const edited = await source.update(draft.row, { name: "Wireless mouse", price: 23 });
if (!edited.success) throw new Error(edited.error);
const inserted = await draft.insert();
if (!inserted.success) showError(inserted.error);
// Instead of inserting, while still pending: await draft.cancel();
```

Drafts are excluded from ordinary queries until insertion. Session state is
`pending`, `inserted` or `cancelled`. Expected update/delete/insert validation
failures resolve with `success: false`; initialization, cancellation and unexpected
failures reject their Promises. Await commands and check their results before
closing an editor or starting a dependent operation.

API: [NewRowSession](?!=/api-reference/NewRowSession),
[insert](?!=/api-reference/NewRowSession#insert),
[cancel](?!=/api-reference/NewRowSession#cancel).

## Notifications and persistence

`changed` describes working-data changes, not necessarily server persistence.
Consumers subscribe and dispose their subscription when destroyed. ArrayDataSource
notifies for edits to pending rows too; a consumer can update an open form without
adding the draft to its table.

DataSource does not prescribe a batch-save API. A remote implementation can persist
from its mutation methods; ArrayDataSource changes memory immediately. Use
[DataSet](?!=/data/dataset) for local batch edits, business rules, transactions and
undo/redo, then save the accumulated dataset changes explicitly.
