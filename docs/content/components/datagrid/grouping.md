---
id: datagrid-grouping
title: Grouping
group: components
parent: datagrid
path: /components/datagrid/grouping
order: 55
description: Group rows by one or more columns, intervals, and interactive group chips.
toc: true
api:
  - DataGrid
  - GroupInterval
  - GroupIntervalDefinition
keywords:
  - grouping
  - group rows
  - intervals
  - group panel
---

# Grouping

Grouping turns a flat result into an expandable hierarchy. Configure
`groupColumns` for the initial state, then let users add, remove, and reorder
groups from the group panel or column context menu.

<live-demo id="datagrid-grouping" height="360px"></live-demo>

Dates and numbers can use built-in intervals. Application-specific buckets can
be registered with `groupIntervals` and resolved by `getGroupValue`.

```js
grid.setOptions({ groupColumns: ["region", "product"] });
```

## API reference

See [`DataGrid`](?!=/api-reference/DataGrid),
[`GroupInterval`](?!=/api-reference/GroupInterval), and
[`GroupIntervalDefinition`](?!=/api-reference/GroupIntervalDefinition).
