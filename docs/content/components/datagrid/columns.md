---
id: datagrid-columns
title: Columns and sizing
group: datagrid
path: /components/datagrid/columns
order: 30
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

# Columns and sizing

Columns define how a DataGrid reads, displays, and lays out each field. Use
captions for user-facing labels and keep field names focused on the data model.

Grid definitions use [DataGridColumn](?!=/api-reference/DataGridColumn), which
extends [DataViewField](?!=/api-reference/DataViewField) and
[DataField](?!=/api-reference/DataField). Common labels, value access and formatting
can be shared with other views; width, alignment, resize/reorder, context menus
and custom cell rendering belong to the grid column.
See [Fields and presentation](?!=/data/fields) for the three layers.

<live-demo id="datagrid-columns" height="520px" src="columns.md.ts"></live-demo>

The demo combines explicitly sized columns with an automatic Product column and
pinned columns. Switch the width mode and resize the container to compare the
behavior. Use **Manual resize** to compare resizing only one column with changing
its neighbor too. Column headers can also be reordered directly.

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

`getColumn().width` stores a base width, which may differ from the stretched width
shown on screen. Returning to `fixed` restores base widths. Use
`autoSizeColumn(name)` to return a manually sized column to content measurement.

Automatic measurement has an 80px minimum and includes the text in loaded body
rows and the visible total footer. Footer labels for multiple aggregates are
included too. Totals arriving later, or changing after a query, may grow an auto
column but do not shrink its measured data baseline. Hidden footers are excluded.
The grid measures loaded rows, not the entire dataset. A nonempty data cell does
not force a long caption to fit; the caption remains a fallback for empty cells.
Explicit widths (including widths below 80px) and manual resizing retain their
own behavior. Use `autoSizeColumn(name)` to measure again after manual sizing.

## Manual column resizing

`columnResizeMode` controls dragging a header separator independently of
`columnWidthMode`:

| Resize mode | Behavior |
| --- | --- |
| `next-column` | Exchanges width with the next visible data column. All other columns stay still and the pair's total width is unchanged. |
| `independent` | Changes only the dragged column. The inner table can grow or shrink; the outer grid container keeps its width. Horizontal scrolling appears when needed. |

When omitted, `columnResizeMode` follows the width mode: `next-column` for
`stretch-auto` and `stretch-all`, and `independent` for `fixed`. An explicit resize
mode overrides that choice. Set it to `undefined` to restore the automatic choice.
The choice depends on the configured width mode, not CSS percentages or whether
a horizontal scrollbar is currently visible.

```ts
grid.setOptions({ columnResizeMode: "independent" });
grid.setOptions({ columnResizeMode: undefined }); // follow columnWidthMode again
```

The next column is the next **visible data column**, including pinned columns;
hidden columns and the row header do not participate. The last visible column
resizes independently because it has no neighbor. Interactive widths are bounded
by 40–800 CSS pixels; a pair stops when either column reaches its bound. Existing
widths outside those bounds do not jump into range when a drag starts.

Dragging changes only the affected columns' base widths and removes them from the
automatic pool in `stretch-auto`. In `stretch-all`, their proportional weights
are updated. Other columns retain their configured widths and auto eligibility.
Rendered widths remain stable during dragging, after release and on repaint;
shrinking independently does not immediately refill the freed space.

An actual viewport-width change or an explicit layout rebuild (for example,
changing column widths, visibility, pinning or width mode) resumes normal
`columnWidthMode` distribution from the base widths. Escape, window blur and
touch cancellation restore the layout from before the gesture. Clicking a
separator without moving it does not configure a width or disable auto sizing.

The vertical scrollbar starts below the entire fixed table header, including
the filter row and sticky group/tree rows, keeping the last column's right-hand
resize handle accessible even while the scrollbar is expanded.

API: [ColumnResizeMode](?!=/api-reference/ColumnResizeMode),
[DataGridOptions.columnResizeMode](?!=/api-reference/DataGridOptions#columnResizeMode).

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
