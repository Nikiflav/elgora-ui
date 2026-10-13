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

<live-demo id="datagrid-columns" height="455px"></live-demo>

The demo combines explicitly sized columns with an automatic Product column and
pinned columns. Switch the width mode and resize the container to compare the
behavior. Column headers can also be resized and reordered directly.

## Column width modes

`columnWidthMode` controls how spare container space is distributed:

| Mode | Behavior |
| --- | --- |
| `fixed` | Keeps configured or content-measured base widths without stretching. |
| `stretch-auto` | Proportionally stretches only columns without a configured width. This is the default. |
| `stretch-all` | Proportionally stretches all data columns, including explicitly sized and pinned columns. |

The row header keeps its width in all modes. Stretch modes only expand: when the
base widths exceed the viewport, horizontal scrolling remains available. For
example, widths of 100 and 200 become 200 and 400 in a 600px viewport without a row
header. Proportions are always calculated from base widths, not the previous
stretched result, so repeated container resizing does not accumulate changes.

```ts
grid.setOptions({ columnWidthMode: "stretch-all" });
```

Manual resizing updates a column's base width. In `stretch-auto`, this removes it
from the automatic pool; in `stretch-all`, it continues participating in the
proportional distribution. `getColumn().width` stores the configured base width,
which may differ from the currently stretched width shown on screen. Returning
to `fixed` restores base widths. Use `autoSizeColumn(name)` to return a manually
sized column to content measurement.

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
