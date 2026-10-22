---
id: datagrid-grouping
title: Grouping and intervals
navTitle: Grouping
group: datagrid
path: /components/datagrid/grouping
order: 100
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
sectionRedirects:
  - expand-and-collapse-groups|/components/datagrid/grouping/expansion#expand-and-collapse-groups
  - saving-and-restoring-expansion|/components/datagrid/grouping/expansion#saving-and-restoring-expansion
  - grouped-loaddata-queries|/data/data-source/queries#grouped-loaddata-queries
  - group-values-and-keys|/data/data-source/queries#group-values-and-null-semantics
---

# Grouping

Grouping turns a flat result into an expandable hierarchy. Configure
`groupColumns` for the initial state, then let users add, remove, and reorder
groups from the group panel or column context menu.

<live-demo id="datagrid-grouping" height="475px" src="grouping.md.ts"></live-demo>

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

## Related topics

- [Expansion and restoring state](?!=/components/datagrid/grouping/expansion)
- [Queries, grouping and summaries](?!=/data/data-source/queries)

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
