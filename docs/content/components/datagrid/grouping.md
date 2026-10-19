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

<live-demo id="datagrid-grouping" height="376px"></live-demo>

Dates and numbers can use built-in intervals. Application-specific buckets can
be registered with `groupIntervals` and resolved by `getGroupValue`.

```js
grid.setOptions({ groupColumns: ["region", "product"] });
```

## Group values and keys

Grouping uses the field's actual values without converting them according to
`dataType`. The source should provide a consistent value type per grouped field.
If a source mixes numbers and numeric text and considers them equivalent, normalize
them in the source before grouping. The grid does not convert `"01"` into `1`.

`null` and `undefined` form one missing-value group, represented by `null`.
Empty text (`""`) forms a separate group, as it does in databases that distinguish
NULL from empty strings. `0` and `false` are neither missing nor empty text.
Group labels show `(No value)` and `(Empty text)` respectively.
Dates are not automatically converted to ISO strings. Use date intervals for
date buckets (for example, numeric month `2`), or `getGroupValue` for an explicit
application-specific grouping value. Nonempty values, including callback results,
retain their types and identity; return stable scalar buckets for complex values.

Internal row keys extend the parent's key with one URI-escaped segment:

```text
$/Bulgaria/Sofia
$/Bulgaria/       empty-text subgroup under Bulgaria
$/Bulgaria/~      missing-value subgroup under Bulgaria
$//Sofia          Sofia under an empty-text parent
$/~/Sofia         Sofia under a missing-value parent
$/%7E             the literal text ~ (not a missing value)
$/A%2FB           the literal value A/B
$/%252F           the literal text %2F
```

Field names and type tags are unnecessary in these keys: `groupColumns` defines
the levels and the source supplies a consistent type. String conversion and URI
escaping are used only to build the key, not to change the grouped value.
Internal string keys are rendering identities, not a public group lookup API.

With an ArrayDataSource or DataTable, the local grouping adapter caches complete group results
before paging. Source mutations invalidate these results through the source
revision. After modifying rows or captured external values directly, call
[ArrayDataSource.invalidateCache()](?!=/api-reference/ArrayDataSource#invalidateCache)
or [DataTable.invalidateCache()](?!=/api-reference/DataTable#invalidateCache);
refreshing the grid alone does not invalidate cached data. See
[query cache and invalidation](?!=/data/data-source/array#query-cache-and-invalidation).

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

## Loading groups

Expanding a group loads its children before publishing the expanded state.
If loading fails, the group stays collapsed and can be retried. Concurrent
requests for the same page share one request. Changing the filter, sorting or
grouping replaces the row view and cancels its outstanding queries; disposing
the grid cancels them too. Late responses cannot restore the obsolete view.

Custom remote sources should pass `QueryArgs.abortSignal` to their transport:

```ts
const response = await fetch(url, { signal: args.abortSignal });
```

An individual viewport waiter can stop waiting without cancelling a page still
needed by another caller. See [QueryArgs](?!=/api-reference/QueryArgs) for the
source query contract.

## API reference

See [`DataGrid`](?!=/api-reference/DataGrid),
[`GroupInterval`](?!=/api-reference/GroupInterval), and
[`GroupIntervalDefinition`](?!=/api-reference/GroupIntervalDefinition).
