---
id: datasource-queries
title: Queries, grouping and summaries
group: data
parent: datasource
path: /data/data-source/queries
order: 34
description: Implement one loadData protocol for filtering, paging, grouped metadata and demand-driven totals.
api:
  - QueryArgs
  - DataResult
  - GroupByField
  - GroupItem
  - SummaryDefinition
---

# Queries, grouping and summaries

A source receives QueryArgs and returns a DataResult. Flat queries apply filtering and sorting before skip/top. `requireTotalCount` requests the filtered count before paging. Projection limits returned fields, not the data used to filter or aggregate. Pass abortSignal to remote transport and check it before publishing results.

## Grouped loadData queries

`QueryArgs.groupBy` describes one or more levels, outermost first. A normal
single-level request and an expand-all request use the same contract:

```ts
const args = {
    filter: ["active", "=", true],
    groupBy: [{ field: "country" }, { field: "city" }],
    groupSummary: [{ field: "amount", summaryType: "sum" }],
    requireTotalCount: true
};
const result = await source.loadData(args);
```

```ts
// Example response for two matching records:
const response = {
    args,
    totalCount: 1, // number of outer groups, before paging
    groups: [{
        groupField: "country", groupValue: "Bulgaria", count: 2,
        summaryValues: { amount: 30 },
        groups: [
            { groupField: "city", groupValue: "Sofia", count: 1, summaryValues: { amount: 10 } },
            { groupField: "city", groupValue: "Varna", count: 1, summaryValues: { amount: 20 } }
        ]
    }]
};
```

`count` always counts data records in a bucket, not child groups. Every non-leaf
bucket contains the complete next-level `groups` array; leaf buckets omit it.
The response contains no `dataItems`. `skip`/`top` page only the outer groups;
without `top`, return every outer group. Return an accurate `totalCount` when
requested; expand-all checks it against the complete outer group array.
Total summaries cover all matching data,
not just the returned groups. An interval is explicit in its descriptor:
`{ field: "createdAt", interval: "month" }`; omitting it applies no interval.
For custom buckets, register a named interval in `groupIntervals`. Remote sources
implement the same interval name on the server.

LocalGroupingDataSource constructs all requested levels in one pass over the
filtered rows. Remote sources can use server-side grouping and return the same
tree; the grid has no source-specific expansion path or local-index access.
Sources without grouped-query support return `{ args }`, allowing the local
adapter to request flat data once and group it. For large remote datasets,
implement grouped queries to avoid transferring the complete flat result.

API: [QueryArgs](?!=/api-reference/QueryArgs),
[GroupByField](?!=/api-reference/GroupByField),
[GroupItem](?!=/api-reference/GroupItem).

## Group values and null semantics

Grouping uses the field's actual values without converting them according to
`dataType`. The source should provide a consistent value type per grouped field.
If a source mixes numbers and numeric text and considers them equivalent, normalize
them in the source before grouping. The grid does not convert `"01"` into `1`.

`null` and `undefined` form one missing-value group, represented by `null`.
Empty text (`""`) forms a separate group, as it does in databases that distinguish
NULL from empty strings. `0` and `false` are neither missing nor empty text.
Group labels show `(No value)` and `(Empty text)` respectively.
Dates are not automatically converted to ISO strings. Use date intervals for
date buckets (for example, numeric month `2`), or a custom interval for an explicit
application-specific grouping value. Nonempty values, including interval results,
retain their types and identity; return stable scalar buckets for complex values.

Remote grouped sources return `groupValue: null` for missing values and
`groupValue: ""` for empty text. Compute counts and summaries per group before
paging. Sources whose storage does not distinguish these values cannot recover
that distinction; the grid preserves the values the source returns.

Child queries use ordinary equality or the named interval selector, such as
`{ function: "year", field: "date" }`. No internal key decoding is needed:

```ts
["region", "=", null] // missing group: translate to region IS NULL in SQL
["region", "=", ""]   // empty-text group: compare with an empty string parameter
```

Both filters round-trip through JSON unchanged. Local equality with `null` also
matches missing (`undefined`) fields; inequality with `null` is its inverse
(`IS NOT NULL` in SQL). Other equality comparisons remain type-strict.
These filter rules are not a general implementation of SQL's three-valued logic.

## Demand-driven total summaries

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
