---
id: datagrid-expansion
title: Expansion and restoring state
group: datagrid
parent: datagrid-grouping
path: /components/datagrid/grouping/expansion
order: 101
description: Expand levels, collapse groups and transfer opaque expansion snapshots across refreshes.
api:
  - DataGrid
  - GridExpansionState
---

# Expansion and restoring state

Use the buttons and Grouping context menu in the [grouping demo](?!=/components/datagrid/grouping) to try these commands.

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

## Saving and restoring expansion

`getExpansionState()` returns an independent [GridExpansionState](?!=/api-reference/GridExpansionState)
snapshot with an `expandedGroupKeys` array. Keys are opaque: retain them as returned
instead of constructing or decoding them. The snapshot contains no nodes, rows or
query caches and can be serialized as JSON.

```ts
const saved = grid.getExpansionState();
await grid.collapseAllGroups();
await grid.setExpansionState(saved);

await grid.setExpansionState({ expandedGroupKeys: [] }); // collapse every group
```

Try **Save expansion**, change the groups' expansion, then **Restore expansion**
in the demo. Setting a state replaces the current state, rather than merging it.
Missing groups are ignored. Expanded descendants below a collapsed parent are
retained without implicitly opening that parent; reopening it reveals their state.
Both returned and submitted snapshots are copied, so later array changes cannot
affect the grid or an in-flight restore.

Restoration uses the same complete grouped-metadata `loadData()` request as
expand-all. Data rows remain viewport-paged. The old expansion remains in place
until metadata loading and validation succeed; failed restoration rejects and is
retryable. Replacing the view or disposing the grid cancels outstanding restores.
An active row edit must finish successfully first.

Reuse a snapshot only with the same source and grouping fields, order and
intervals. The snapshot does not identify its source or validate compatibility.
Tree-mode expansion is not included: its snapshot is empty, and applying a
nonempty group snapshot to a tree or ungrouped view rejects.

After successful editing, insertion, deletion or source change notifications
(including DataTable undo/redo), the grid automatically transfers expansion to
the replacement row view. Existing groups stay in their saved state; groups
created by a changed field value are not opened automatically. Missing groups
are dropped after restoration. Explicit query/source/grouping changes reset
expansion; use these methods explicitly if you want a compatible state restored.
This snapshot does not preserve selection or scroll position.

API: [getExpansionState()](?!=/api-reference/DataGrid#getExpansionState),
[setExpansionState()](?!=/api-reference/DataGrid#setExpansionState).
