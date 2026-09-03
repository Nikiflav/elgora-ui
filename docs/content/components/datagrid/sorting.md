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

The header shows the current direction. The example starts with a two-column
sort and allows the normal column menu to replace or clear it.

```js
grid.setOptions({ orderBy: [["region", "asc"], ["total", "desc"]] });
```

## API reference

See [`DataGridOptions`](?!=/api-reference/DataGridOptions) and
[`DataGrid`](?!=/api-reference/DataGrid).
