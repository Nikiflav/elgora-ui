---
id: datagrid-tree
title: Tree data
group: datagrid
path: /components/datagrid/tree
order: 120
description: Render hierarchical parent and child rows in a DataGrid.
toc: true
api:
  - DataGrid
  - ArrayDataSource
  - DataSource
keywords:
  - data grid
  - tree
  - hierarchy
  - parent child
---

# Tree data

A `DataGrid` can display hierarchical rows when its data source identifies the
parent of each row. This is useful for file systems, organizational charts,
categories, and other nested data.

## Parent and child rows

The demo uses `parentField: "parentId"`. Root rows have a null parent and child
rows refer to their parent by id.

<live-demo id="datagrid-tree" height="420px" src="tree.md.ts"></live-demo>

See the [`DataGrid` API reference](?!=/api-reference/DataGrid),
[`ArrayDataSource`](?!=/api-reference/ArrayDataSource), and
[`DataSource`](?!=/api-reference/DataSource).
