---
id: datagrid-custom-cell-rendering
title: Custom cell rendering
group: components
parent: datagrid
path: /components/datagrid/custom-cell-rendering
order: 70
description: Customize DataGrid cell content and appearance while keeping grid states theme-aware.
toc: true
api:
  - DataGrid
  - DataGridColumn
  - GridCell
  - DataCell
  - DataCellStyle
keywords:
  - data grid
  - custom cell
  - renderer
  - cell style
  - selection
---

# Custom cell rendering

Use `renderCell` when the default text representation is not enough. The
renderer returns the content for the cell, while DataGrid continues to own
selection, hover, dragging, and other cell states.

## Custom content and state-aware styling

Use `customCellStyle` to style the outer grid cell. In particular,
`--elg-grid-cell-bg` is the base background used by DataGrid when it mixes a
cell state such as selection with the custom color.

The renderer below returns a VNode for the status text. `Ready` cells
use a soft green base color, while `Delayed` cells use a muted red one. The
status text is also rendered in uppercase. Select one or more cells to see the
selection border and background tint applied without changing the renderer's
text.

<live-demo id="datagrid-custom-cell-rendering" height="360px"></live-demo>

```js
const grid = new DataGrid({
  data: rows,
  columns: [
    {
      name: "status",
      caption: "Status",
      customCellStyle: cell => ({
        className: "elg-text-uppercase",
        style: { "--elg-grid-cell-bg": cell.value === "Ready" ? "#d9f2e3" : "#f7dfdf" }
      }),
      renderCell: cell => v("strong", { ui: ["fw-600"] }, cell.text)
    }
  ]
});
```

`renderCell` receives a `GridCell` with the column, raw value, display text,
the render-ready `gridRow`, and the original `rowData` when the cell belongs to
a data row. Group rows do not have one original data row, so `rowData` is
undefined; use `value`, `text`, and `gridRow` instead. The renderer must return
a virtual node. The VNode becomes the content inside the grid cell wrapper, so
DataGrid can preserve its own selection, hover, and interaction behavior.

`customCellStyle` affects the outer `.elg-gridcell`, not only the returned
content. This is important because the grid can then apply state styling to a
custom green or red background. The renderer does not need to know how
selection or hover colors are implemented.

## API reference

See [`DataGridColumn`](?!=/api-reference/DataGridColumn), [`GridCell`](?!=/api-reference/GridCell),
[`DataColumn`](?!=/api-reference/DataColumn), [`DataCell`](?!=/api-reference/DataCell),
and [`DataCellStyle`](?!=/api-reference/DataCellStyle) for the complete
renderer and style contracts.
