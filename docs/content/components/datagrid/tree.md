---
id: datagrid-tree
title: DataGrid tree data
group: components
parent: datagrid
path: /components/datagrid/tree
order: 60
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

# DataGrid tree data

A `DataGrid` can display hierarchical rows when its data source identifies the
parent of each row. This is useful for file systems, organizational charts,
categories, and other nested data.

## Parent and child rows

The demo uses `parentField: "parentId"`. Root rows have a null parent and child
rows refer to their parent by id.

<live-demo id="datagrid-tree" height="420px"></live-demo>

```js
const data = new ArrayDataSource(rows, { parentField: "parentId" });

const grid = new DataGrid({
  data,
  columns: [
    { name: "name", editorType: "text" },
    { name: "type", editorType: "text" },
    { name: "modified", editorType: "date" }
  ],
  stickyGroupRows: true
});

grid.mount(document.getElementById("app"));
```

See the [`DataGrid` API reference](?!=/api-reference/DataGrid),
[`ArrayDataSource`](?!=/api-reference/ArrayDataSource), and
[`DataSource`](?!=/api-reference/DataSource).
