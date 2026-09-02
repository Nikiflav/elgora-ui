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
  - DataColumn
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

The renderer below returns a native element for the status text. `Ready` cells
use a soft green base color, while `Delayed` cells use a muted red one. The
status text is also rendered in uppercase. Select one or more cells to see the
selection border and background tint applied without changing the renderer's
text.

<live-demo id="datagrid-custom-cell-rendering" height="360px"></live-demo>

```js
const grid = new DataGrid({
  data: new ArrayDataSource(rows),
  columns: [
    {
      name: "status",
      caption: "Status",
      customCellStyle: cell => ({
        className: "elg-text-uppercase",
        style: { "--elg-grid-cell-bg": cell.value === "Ready" ? "#d9f2e3" : "#f7dfdf" }
      }),
      renderCell: cell => e("strong", { ui: ["fw-600"] }, cell.text)
    }
  ]
});
```

`renderCell` receives a `DataCell` with the column, original row, raw value,
and display text. It may return an `HTMLElement`, a Component, a virtual node,
or a string. Returning `undefined` uses the default renderer.

`customCellStyle` affects the outer `.elg-gridcell`, not only the returned
content. This is important because the grid can then apply state styling to a
custom green or red background. The renderer does not need to know how
selection or hover colors are implemented.

## API reference

See [`DataColumn`](?!=/api-reference/DataColumn), [`DataCell`](?!=/api-reference/DataCell),
and [`DataCellStyle`](?!=/api-reference/DataCellStyle) for the complete
renderer and style contracts.
