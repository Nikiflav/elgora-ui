---
id: datagrid-filtering
title: Filtering
group: components
parent: datagrid
path: /components/datagrid/filtering
order: 54
description: Filter local or remote DataGrid data with structured filter expressions.
toc: true
api:
  - DataGrid
  - DataFilter
  - FilterFunctionRegistry
keywords:
  - filtering
  - filter row
  - data filter
---

# Filtering

The `filter` option uses a serializable expression that can be evaluated by a
local data source or forwarded to a server. Enable `showFilterRow` when the
grid should expose a filtering surface.

The filter row provides a quick text editor for every data column. Text columns
use `contains` by default; number and other typed columns use equality. Press
Enter or leave the input to apply the value. The filter button in the row
header opens the full `FilterEditor`, where compound `AND`/`OR` expressions can
be reviewed and edited in one place.

Number and date/datetime columns also support ranges. Use `1..100` for a closed
range, `500..` for values greater than or equal to `500`, or `..500` for values
less than or equal to `500`. Date ranges use the same syntax, for example
`today..` and `..10.12.26`.

<live-demo id="datagrid-filtering" height="360px"></live-demo>

The example starts with an explicit `contains` filter. Application code can
change it at any time:

```js
grid.setOptions({ filter: ["product", "contains", "monitor"] });
grid.setOptions({ filter: ["and", ["region", "=", "East"], ["total", ">", 400]] });
```

## API reference

See [`DataFilter`](?!=/api-reference/DataFilter),
[`DataGridOptions`](?!=/api-reference/DataGridOptions), and
[`FilterFunctionRegistry`](?!=/api-reference/FilterFunctionRegistry).
