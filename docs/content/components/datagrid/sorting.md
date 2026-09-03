---
id: datagrid-sorting
title: Sorting
group: components
parent: datagrid
path: /components/datagrid/sorting
order: 53
description: Sort one or more DataGrid columns and control sort state programmatically.
toc: true
api:
  - DataGrid
  - DataGridOptions
  - OrderByToken
keywords:
  - sorting
  - order by
  - multi-column sort
---

# Sorting

Sorting can be changed from the column context menu or configured with
`orderBy`. Use a string for ascending order or a tuple for an explicit
direction.

<live-demo id="datagrid-sorting" height="360px"></live-demo>

The example starts with a two-column sort. Try the following interactions:

- Click a column header to cycle through ascending, descending, and clear. This
  behavior is enabled by `sortOnHeaderClick` (true by default).
- Hold `Shift` while clicking a header to add the column to the current sort or
  update only that column. The other sort columns and their priorities remain
  unchanged.
- Open a column's context menu and choose `Sort Ascending`, `Sort Descending`,
  or `Clear sorting`. `Clear sorting` is not shown for grouped columns because
  a grouped column must remain sorted. Holding `Shift` while choosing an action
  applies it only to the current column; without `Shift`, the selected column
  becomes the only sort criterion.

Dragging a header still reorders the column and does not trigger sorting. When
multiple columns are sorted, each header shows its sort priority.

```js
grid.setOptions({ orderBy: [["region", "asc"], ["total", "desc"]] });
```

## API reference

See [`DataGridOptions`](?!=/api-reference/DataGridOptions) and
[`DataGrid`](?!=/api-reference/DataGrid).
