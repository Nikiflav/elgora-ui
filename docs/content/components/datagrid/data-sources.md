---
id: datagrid-data-sources
title: Data sources
group: components
parent: datagrid
path: /components/datagrid/data-sources
order: 58
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

# Data sources

The grid consumes a `DataSource` contract rather than depending on a specific
storage technology. `ArrayDataSource` is useful for local data; an application
can implement `loadData()` for an API, database, or service layer.

<live-demo id="datagrid-data-sources" height="360px"></live-demo>

The same grid options work with both local and remote sources. Queries carry
filtering, sorting, grouping, paging, and an `AbortSignal` for cancelled loads.

## API reference

See [`DataSource`](?!=/api-reference/DataSource),
[`ArrayDataSource`](?!=/api-reference/ArrayDataSource), and
[`GridDataSource`](?!=/api-reference/GridDataSource).
