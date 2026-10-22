---
id: datagrid-performance
title: Virtualization and performance
group: datagrid
path: /components/datagrid/performance
order: 150
description: Render large datasets efficiently with virtual rows, paging, and reusable cell content.
toc: true
api:
  - DataGrid
  - VirtualList
  - DataSource
keywords:
  - virtualization
  - performance
  - large data
  - paging
---

# Virtualization and performance

DataGrid virtualizes its body and requests only the rows needed for the
viewport. This keeps the DOM small even when the logical dataset contains many
records.

<live-demo id="datagrid-performance" height="376px" src="performance.md.ts"></live-demo>

Use a `DataSource` for paging or remote loading, keep custom renderers focused,
and avoid recreating expensive objects during every cell render. The grid also
supports abortable data requests through the source query contract.

## Rendering is not query processing

Virtualization bounds DOM work; it does not make a full local sort, group or
aggregate free. For large remote data, implement paging and grouped metadata in
the source rather than relying on a complete flat-data fallback. Expanding all
groups loads metadata, not every rendered leaf row.

For in-memory sources, reuse the source and its query caches across viewport
requests. Use mutation methods or explicit cache invalidation after external
changes. Keep value accessors pure and avoid expensive allocations inside cell
renderers. Stable VNode keys preserve content identity when cells are patched.

See [queries and grouping](?!=/data/data-source/queries),
[local processing and cache invalidation](?!=/data/data-source/caching), and
[expansion behavior](?!=/components/datagrid/grouping/expansion).

## API reference

See [`DataGrid`](?!=/api-reference/DataGrid), [`DataSource`](?!=/api-reference/DataSource),
and [`VirtualList`](?!=/api-reference/VirtualList).
