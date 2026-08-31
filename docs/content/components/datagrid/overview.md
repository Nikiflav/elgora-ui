---
id: datagrid-overview
title: Overview
group: components
parent: datagrid
path: /components/datagrid/overview
order: 50
description: Display, group, summarize, and interact with tabular data.
toc: true
api:
  - DataGrid
  - DataGridOptions
  - ArrayDataSource
  - DataSource
  - DataColumn
  - SummaryDefinition
keywords:
  - data grid
  - grid
  - grouping
  - summaries
---

# DataGrid

`DataGrid` is a virtualized table component for working with large data sets.
It supports configurable columns, grouped rows, summaries, selection, context
menus, and data sources that can load or query rows on demand.

## Grouped data

The demo below uses an `ArrayDataSource` with 100,000 generated orders. Three
columns are grouped and numeric summaries are calculated for each group.

<live-demo id="datagrid-overview" height="420px"></live-demo>

The component is configured with a data source, columns, grouping, and group
summaries:

```js
const grid = new DataGrid({
  data: new ArrayDataSource(rows),
  columns: [
    { name: "customer", editorType: "text" },
    { name: "quantity", editorType: "number" },
    { name: "totalAmount", editorType: "number" }
  ],
  groupColumns: ["customer"],
  groupSummary: [{ field: "totalAmount", summaryType: "sum" }]
});

grid.refresh();
grid.mount(document.getElementById("app"));
```

## Hierarchical data

For parent/child data, configure the `ArrayDataSource` with its `parentField`.
The dedicated [tree data topic](?!=/components/datagrid/tree) demonstrates a
file-system style hierarchy.

## API reference

See the [`DataGrid` API reference](?!=/api-reference/DataGrid),
[`DataGridOptions`](?!=/api-reference/DataGridOptions),
[`ArrayDataSource`](?!=/api-reference/ArrayDataSource),
[`DataSource`](?!=/api-reference/DataSource), and
[`SummaryDefinition`](?!=/api-reference/SummaryDefinition).
