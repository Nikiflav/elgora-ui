---
id: dataset-sessions
title: New-row sessions
group: data
parent: dataset-group
path: /data/dataset/new-rows
order: 53
description: Initialize pending domain rows, then explicitly insert or cancel their sessions.
api:
  - NewRowSession
  - DataTable
---

# New-row sessions

These examples use the orders table from
[Tables, rows and change tracking](?!=/data/dataset/tables). The session belongs to
the source; [DataGrid's session commands](?!=/components/datagrid/editing/new-rows)
add checks for retained invalid UI input.

## New-row sessions

```ts
const draft = await orders.createNewRow();
await orders.update(draft.row, { quantity: 2, price: 15 });

draft.state;                 // "pending"
draft.row.table === orders;   // true, including while pending
draft.row.isPending;          // true
orders.rows.includes(draft.row); // false
const result = await draft.insert();
if (!result.success) console.error(result.error);

// After success, the same row is in orders.rows, still with state "added".
// draft.row.isPending is now false.
// Alternatively, while pending:
// await draft.cancel();
```

API: [DataTable.createNewRow()](?!=/api-reference/DataTable#createNewRow), [update()](?!=/api-reference/DataTable#update), [NewRowSession](?!=/api-reference/NewRowSession): [insert()](?!=/api-reference/NewRowSession#insert), [cancel()](?!=/api-reference/NewRowSession#cancel), [state](?!=/api-reference/NewRowSession#state); [DataRow.table](?!=/api-reference/DataRow#table), [isPending](?!=/api-reference/DataRow#isPending).

Pending rows are excluded from queries, counts, summaries and save payloads. Several
sessions can coexist. Rules for a pending row may edit that row but not other rows.
Insertion rules can update related rows after the session reaches the inserted state.

Use row.isPending to check for a pending session without allocating and searching a
row list. It becomes false on either insert or cancel and follows undo/redo and rollback.
False alone does not guarantee membership: cancelled and removed rows are not pending.

Insert and cancel are individually idempotent. Insert after cancel, or cancel after
insert, rejects. A rejected insert leaves the session pending. Creation and cancellation
failures reject their Promises because those methods do not return MutationResult.

Creation, field edits and local insert each have their own undo entry. Undoing creation
cancels its session; redo restores the same row and session. Undoing insert makes it
pending again.
