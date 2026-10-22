---
id: datagrid-custom-cell-rendering
title: Appearance and custom rendering
group: datagrid
path: /components/datagrid/custom-cell-rendering
order: 130
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

# Appearance and custom rendering

DataGrid uses the root class `elg-data-grid`, row classes `elg-data-grid-row-*`
and cell classes `elg-data-grid-cell-*`. These are separate from the `elg-grid`
layout utility. Cell color tokens such as `--elg-data-grid-cell-bg` keep their names.

Use `renderCell` when the default text representation is not enough. The
renderer returns the content for the cell, while DataGrid continues to own
selection, hover, dragging, and other cell states.

## Borders, hover and cursor

These options change presentation, not selection or editing capabilities:

```ts
grid.setOptions({
    showBorder: false,
    cellBorders: "none",
    showRowHover: true,
    cursor: "default"
});
```

| Option | Values and default |
| --- | --- |
| showBorder | Outer frame; true by default, including the group panel |
| cellBorders | none, rows (default) or all |
| showRowHover | Row hover background; false by default |
| showSelection | Selection highlighting; true by default, independent of selection state |
| cursor | default (default), pointer or text |

Cell border modes reserve the same geometry, using transparent separators when
hidden, so changing modes does not resize cells or shift an editor. Selection and
error indicators remain independent of ordinary separators. Pending new rows
retain their separate status; see [new rows](?!=/components/datagrid/editing/new-rows).

Use semantic tokens and CSS custom properties rather than theme-specific color
overrides. The DataGrid token prefix is --elg-data-grid-, distinct from the layout
grid's --elg-grid- variables. Try the border controls in the
[editing demo](?!=/components/datagrid/editing#array-and-lookup).

## Custom content and state-aware styling

Use `customCellStyle` to style the outer grid cell. In particular,
`--elg-data-grid-cell-bg` is the base background used by DataGrid when it mixes a
cell state such as selection with the custom color.

The renderer below returns a VNode for the status text. `Ready` cells
use a soft green base color, while `Delayed` cells use a muted red one. The
status text is also rendered in uppercase. Select one or more cells to see the
selection border and background tint applied without changing the renderer's
text.

<live-demo id="datagrid-custom-cell-rendering" height="376px" src="custom-cell-rendering.md.ts"></live-demo>

`renderCell` receives a `GridCell` with the column, raw value, display text,
the render-ready `gridRow`, and the original `rowData` when the cell belongs to
a data row. Group rows do not have one original data row, so `rowData` is
undefined; use `value`, `text`, and `gridRow` instead. The renderer must return
a virtual node. The VNode becomes the content inside the grid cell wrapper, so
DataGrid can preserve its own selection, hover, and interaction behavior.

`customCellStyle` affects the outer `.elg-data-grid-cell`, not only the returned
content. This is important because the grid can then apply state styling to a
custom green or red background. The renderer does not need to know how
selection or hover colors are implemented.

## API reference

See [`DataGridColumn`](?!=/api-reference/DataGridColumn), [`GridCell`](?!=/api-reference/GridCell),
[`DataViewField`](?!=/api-reference/DataViewField), [`DataCell`](?!=/api-reference/DataCell),
and [`DataCellStyle`](?!=/api-reference/DataCellStyle) for the complete
renderer and style contracts.
