---
id: datagrid-summaries
title: Summaries
group: datagrid
path: /components/datagrid/summaries
order: 110
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

## Configure summaries

<live-demo id="datagrid-summaries" height="660px" src="summaries.md.ts"></live-demo>

## Remote data sources

Set a numeric column's `displayFormat` (for example `N0`, `N2` or `C2€`) and
optional `locale` to format both group and total summaries consistently
with its data cells. Raw aggregate results remain numeric; the source does not
format them. Counts (`count` and `distinct`) stay plain counts, even on currency
or percentage columns. Row-dependent `getText`/lookup/`formatValue` callbacks
are not used for summaries. See [Formatting](?!=/data/formatting#display-formats-on-fields-and-columns).

The source computes totals across the complete filtered result, before paging. See [Queries, grouping and summaries](?!=/data/data-source/queries#demand-driven-total-summaries) for the shared request/response contract.

## API reference

See [`SummaryDefinition`](?!=/api-reference/SummaryDefinition),
[`SummaryContext`](?!=/api-reference/SummaryContext), and
[`SummaryType`](?!=/api-reference/SummaryType).
