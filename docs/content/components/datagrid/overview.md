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
  - DataGridColumn
  - GridCell
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
  data: rows,
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

## Explore DataGrid features

Continue with the focused topics:

- [Columns and layout](?!=/components/datagrid/columns)
- [Sorting](?!=/components/datagrid/sorting)
- [Filtering](?!=/components/datagrid/filtering)
- [Grouping](?!=/components/datagrid/grouping)
- [Summaries](?!=/components/datagrid/summaries)
- [Selection](?!=/components/datagrid/selection)
- [Data sources](?!=/components/datagrid/data-sources)
- [Custom cell rendering](?!=/components/datagrid/custom-cell-rendering)
- [Context menus](?!=/components/datagrid/context-menus)
- [Virtualization and performance](?!=/components/datagrid/performance)

## API reference

See the [`DataGrid` API reference](?!=/api-reference/DataGrid),
[`DataGridOptions`](?!=/api-reference/DataGridOptions),
[`ArrayDataSource`](?!=/api-reference/ArrayDataSource),
[`DataSource`](?!=/api-reference/DataSource), and
[`SummaryDefinition`](?!=/api-reference/SummaryDefinition).
