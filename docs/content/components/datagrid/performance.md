---
id: datagrid-performance
title: Virtualization and performance
group: components
parent: datagrid
path: /components/datagrid/performance
order: 62
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

<live-demo id="datagrid-performance" height="360px"></live-demo>

Use a `DataSource` for paging or remote loading, keep custom renderers focused,
and avoid recreating expensive objects during every cell render. The grid also
supports abortable data requests through the source query contract.

## API reference

See [`DataGrid`](?!=/api-reference/DataGrid), [`DataSource`](?!=/api-reference/DataSource),
and [`VirtualList`](?!=/api-reference/VirtualList).
