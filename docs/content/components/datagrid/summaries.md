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

Summaries add useful totals to grouped data. Built-in types include `count`,
`sum`, `min`, `max`, and `distinct`. Custom summaries can maintain their own
accumulator state.

<live-demo id="datagrid-summaries" height="360px"></live-demo>

```js
const customAverage = {
  name: "average",
  text: "Average",
  start: () => ({ sum: 0, count: 0 }),
  accumulate: (state, value) => ({ sum: state.sum + value, count: state.count + 1 }),
  finalize: state => state.count ? state.sum / state.count : 0
};
```

## API reference

See [`SummaryDefinition`](?!=/api-reference/SummaryDefinition),
[`SummaryContext`](?!=/api-reference/SummaryContext), and
[`SummaryType`](?!=/api-reference/SummaryType).
