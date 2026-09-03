---
id: datagrid-columns
title: Columns and layout
group: components
parent: datagrid
path: /components/datagrid/columns
order: 52
description: Configure column captions, widths, alignment, visibility, and layout behavior.
toc: true
api:
  - DataGrid
  - DataGridOptions
  - DataColumn
keywords:
  - columns
  - resize
  - reorder
  - pinning
  - layout
---

# Columns and layout

Columns define how a DataGrid reads, displays, and lays out each field. Use
captions for user-facing labels and keep field names focused on the data model.

<live-demo id="datagrid-columns" height="360px"></live-demo>

The demo combines captions, fixed widths, alignment, hidden columns, and fixed
columns. Column headers can also be resized and reordered directly.

```js
const grid = new DataGrid({
  data: new ArrayDataSource(rows),
  columns: [
    { name: "product", caption: "Product", width: 220 },
    { name: "quantity", caption: "Qty", width: 80, textAlign: "end" },
    { name: "total", caption: "Total", width: 110, textAlign: "end" }
  ],
  fixedLeftColumns: 1
});
```

Use `setColumnOptions()` for a single column and `setOptions()` for layout-wide
changes such as `visibleColumns`, `fixedLeftColumns`, and `fixedRightColumns`.

## API reference

See [`DataColumn`](?!=/api-reference/DataColumn) and
[`DataGridOptions`](?!=/api-reference/DataGridOptions).
