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

## Tabular data

The demo below uses an `ArrayDataSource` with 100,000 generated orders. It starts
without grouping or sorting. Click a column header to sort, or drag a column
into the group panel to group the rows. Numeric summaries are configured for
groups when grouping is applied.

<live-demo id="datagrid-overview" height="420px"></live-demo>

The minimal configuration specifies a data source and columns:

```js
const grid = new DataGrid({
  data: rows,
  columns: [
    { name: "customer", dataType: "string" },
    { name: "quantity", dataType: "number" },
    { name: "totalAmount", dataType: "number" }
  ]
});

grid.refresh();
grid.mount(document.getElementById("app"));
```

## Hierarchical data

For parent/child data, configure the `ArrayDataSource` with its `parentField`.
The dedicated [tree data topic](?!=/components/datagrid/tree) demonstrates a
file-system style hierarchy.

## Explore DataGrid features

Scrollbars default to `scrollbarMode: "thin"`: a thin thumb stays visible and expands
within `scrollbarHoverDistance` (default `50px`) of its edge or while dragging,
but stays thin during scrolling.
Use `"auto"` to hide them at rest or `"always"` for full
width. The [Scroll Engine demo](?!=/components/scroll-engine) compares all three modes.

Continue with the focused topics:

- [Columns and layout](?!=/components/datagrid/columns)
- [Sorting](?!=/components/datagrid/sorting)
- [Filtering](?!=/components/datagrid/filtering)
- [Grouping](?!=/components/datagrid/grouping)
- [Summaries](?!=/components/datagrid/summaries)
- [Selection](?!=/components/datagrid/selection)
- [Cell editing](?!=/components/datagrid/editing)
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
