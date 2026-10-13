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
  - DataViewField
  - DataGridColumn
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

Grid definitions use [DataGridColumn](?!=/api-reference/DataGridColumn), which
extends [DataViewField](?!=/api-reference/DataViewField) and
[DataField](?!=/api-reference/DataField). Common labels, value access and formatting
can be shared with other views; width, alignment, resize/reorder, context menus
and custom cell rendering belong to the grid column.
See [Fields and presentation](?!=/data/fields) for the three layers.

<live-demo id="datagrid-columns" height="360px"></live-demo>

The demo combines captions, fixed widths, alignment, hidden columns, and fixed
columns. Column headers can also be resized and reordered directly.

```js
const grid = new DataGrid({
  data: rows,
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

See [`DataGridColumn`](?!=/api-reference/DataGridColumn),
[`DataViewField`](?!=/api-reference/DataViewField) and
[`DataGridOptions`](?!=/api-reference/DataGridOptions).
