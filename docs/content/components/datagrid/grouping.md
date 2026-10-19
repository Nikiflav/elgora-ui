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

<live-demo id="datagrid-grouping" height="420px"></live-demo>

Dates and numbers can use built-in intervals. Application-specific buckets can
be registered with `groupIntervals`; each interval defines its own `getGroupValue`.

```js
grid.setOptions({ groupColumns: ["region", "product"] });
```

For example, group amounts into named size buckets:

```ts
grid.setOptions({
    groupIntervals: [{
        name: "amountSize",
        text: "Amount size",
        getGroupValue: (_row, value) => value == null ? null : value >= 100 ? "Large" : "Small"
    }],
    columns: [{ name: "amount", dataType: "number", groupInterval: "amountSize" }],
    groupColumns: ["amount"]
});
```

`getGroupValue` belongs to the interval definition, not the field. The query sends
`{ field: "amount", interval: "amountSize" }`, so a remote source can implement
the same buckets without receiving a JavaScript callback.

## Expand and collapse groups

Right-click a column header or its chip in the group panel and open **Grouping**.
The submenu contains **Group by …** / **Ungroup …** and **Interval** for built-in
and custom intervals. Grouped fields also offer these commands:

- **Expand to this level** opens every group at this level and every parent level.
  Deeper levels retain their expansion state; previously collapsed descendants
  stay collapsed, and previously expanded descendants become visible again.
- **Collapse this level** closes groups at this level without changing parent
  or descendant expansion states. It does not load additional group metadata.

For `Region → Product`, expanding to Product opens both levels. Collapsing
Product leaves regions open and shows their collapsed product groups. These
commands affect all groups at the chosen level, not a single group value.
Expansion uses one metadata request and one structural update, not a sequence
of per-level commands. Both actions finish active row editing first and use the
same failure/cancellation handling as the API methods below.

The commands are available by default, only for grouped fields in non-tree mode.
If `standardContextMenuItems` is an explicit list, include `"expandGroupsToLevel"`
and/or `"collapseGroupsAtLevel"` to enable them. `"groupColumn"` controls the
group/ungroup and interval commands. **Grouping** is omitted when none of its
commands is available; sorting and **Summary** remain outside this submenu. See
[GridStandardContextMenuItem](?!=/api-reference/GridStandardContextMenuItem).

Use **Expand all** and **Collapse all** in the demo. The product-level button
expands level 1 without opening a collapsed region; open a region to reveal its
retained child state.

```ts
await grid.expandAllGroups();    // every grouping level
await grid.collapseAllGroups();  // every grouping level
await grid.expandAllGroups(1);   // product level; region state is retained
await grid.collapseAllGroups(0); // regions; child states are retained
```

The optional index is zero-based in `groupColumns`, not a row index. Invalid
indices reject. These methods affect grouping, not hierarchical/tree data.
They finish an active edit first; failed validation or an unfinished edit prevents
the operation. Loading errors reject without publishing a partially expanded tree.
Changing the data view or disposing the grid cancels outstanding work.

Expand-all requests complete nested group metadata through the source's ordinary
`loadData()` contract and updates visible indices once. It does not fetch all leaf
data rows; normal viewport paging still loads only rows needed for rendering.
Collapse-all changes known expansion states without loading group metadata.

API: [expandAllGroups()](?!=/api-reference/DataGrid#expandAllGroups),
[collapseAllGroups()](?!=/api-reference/DataGrid#collapseAllGroups).

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
date buckets (for example, numeric month `2`), or a custom interval for an explicit
application-specific grouping value. Nonempty values, including interval results,
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
