---
id: datagrid-summaries
title: Summaries
group: components
parent: datagrid
path: /components/datagrid/summaries
order: 56
description: Display numeric and custom aggregate values for grouped DataGrid rows.
toc: true
api:
  - DataGrid
  - SummaryType
  - SummaryDefinition
  - SummaryContext
keywords:
  - summaries
  - aggregates
  - sum
  - count
---

# Summaries

Summaries add useful aggregate values to grouped data and to the complete
result set. Built-in types include `count`, `sum`, `avg`, `min`, `max`, and
`distinct`. Custom summaries can maintain their own accumulator state.

The group and total summaries are independent settings. A group summary is
calculated for each group, while a total summary is calculated for the complete
filtered result, even when the grid is grouped or paged. The context menu keeps
both settings in sync when a summary is selected there, but they can still be
configured differently in code when that is useful.

The demo shows both cases. The first grid uses `sum` for both levels, so the
footer can display the value without a label. The second grid uses `sum` for
groups and `avg` for the total. In that case the footer includes `avg:` so the
meaning of the value is explicit.

## Remote data sources

`totalSummary` is a demand-driven part of the `loadData(args)` contract. The
grid includes it only when the total footer needs to be loaded or refreshed.
When the property is absent, a remote data source should skip the aggregate
query and omit `DataResult.totalSummary` from its response.

When `args.totalSummary` is present, the returned values must describe the
complete filtered result, not only the current page or the currently expanded
group. The request may contain more than one summary, including different
summary types for the same field:

```js
async loadData(args) {
  const response = await api.query({
    filter: args.filter,
    orderby: args.orderby,
    skip: args.skip,
    top: args.top,
    totalSummary: args.totalSummary
  });

  return {
    args,
    dataItems: response.items,
    totalCount: args.requireTotalCount ? response.totalCount : undefined,
    totalSummary: args.totalSummary?.length
      ? response.totalSummary
      : undefined
  };
}
```

This keeps paging and aggregation independent: `dataItems` may be one page,
while `totalSummary` represents the whole filtered dataset.

<live-demo id="datagrid-summaries" height="660px"></live-demo>

```js
// Same aggregation for groups and the footer.
groupSummary: [{ field: "total", summaryType: "sum" }],
totalSummary: [{ field: "total", summaryType: "sum" }]

// Different aggregations: group totals are sums, the footer is an average.
groupSummary: [{ field: "total", summaryType: "sum" }],
totalSummary: [{ field: "total", summaryType: "avg" }]
```

## API reference

See [`SummaryDefinition`](?!=/api-reference/SummaryDefinition),
[`SummaryContext`](?!=/api-reference/SummaryContext), and
[`SummaryType`](?!=/api-reference/SummaryType).
