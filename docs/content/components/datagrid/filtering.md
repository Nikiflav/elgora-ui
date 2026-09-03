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
