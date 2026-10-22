---
id: dataset-saving
title: Saving, accepting and rejecting changes
group: data
parent: dataset-group
path: /data/dataset/saving
order: 54
description: Persist a batch, map server identities and distinguish local acceptance from saving.
api:
  - DataSet
  - DataSetChanges
  - DataSetSaveChangesResult
---

# Saving, accepting and rejecting changes

Use the dataset from [Tables, rows and change tracking](?!=/data/dataset/tables).
The openDrafts array below represents session references retained by your
application; it is not an implicit DataSet property. See
[new-row sessions](?!=/data/dataset/new-rows) for creating those references.

## Save, accept and reject

The application owns persistence. Insert the pending sessions you want included,
check their results, and then send the dataset's batch:

```ts
for (const draft of openDrafts) {
    if (draft.state !== "pending") continue;
    const result = await draft.insert();
    if (!result.success) throw new Error(result.error);
}

const result = await dataset.saveChanges(async changes => {
    const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
    });
    if (!response.ok) throw new Error("Failed to save changes.");
    return response.json();
});
```

API: [NewRowSession.insert()](?!=/api-reference/NewRowSession#insert), [DataSet.saveChanges()](?!=/api-reference/DataSet#saveChanges), [DataSetSaveHandler](?!=/api-reference/DataSetSaveHandler), [DataSetChanges](?!=/api-reference/DataSetChanges), [DataSetSaveChangesResult](?!=/api-reference/DataSetSaveChangesResult).

The payload is grouped by table name. Insert entries include all values; updates
include changed fields; removals carry the key. Expected validation failures resolve
with success: false and optional fieldErrors. Transport failures reject.

Temporary identities can be mapped without replacing DataRow objects:

```ts
return {
    success: true,
    keyMappings: {
        orders: [{ temporaryKey: "orders-client-id", key: 123 }]
    }
};
```

API: [DataSetSaveChangesResult](?!=/api-reference/DataSetSaveChangesResult), [KeyMapping](?!=/api-reference/KeyMapping).

Mappings are validated before any is applied. Related foreign-key fields are not
rewritten automatically. A successful save accepts all confirmed changes and clears
this dataset's history, preserving other coordinator scopes. Failed saves retain
the edits and history.

For external persistence use acceptChanges(); for explicit discard use rejectChanges():

```ts
// When data was successfully persisted outside saveChanges():
dataset.acceptChanges();

// To discard the screen's edits:
for (const draft of openDrafts) {
    if (draft.state === "pending") await draft.cancel();
}
dataset.rejectChanges();
```

API: [DataSet.acceptChanges()](?!=/api-reference/DataSet#acceptChanges), [rejectChanges()](?!=/api-reference/DataSet#rejectChanges), [NewRowSession.cancel()](?!=/api-reference/NewRowSession#cancel).

Save, accept and reject throw while any pending session or unfinished creation remains.
They never choose insert/cancel for the application. A nonempty import of refreshed
data also clears the dataset history to prevent stale replay. A table-level accept,
reject or import clears the whole dataset scope because entries may span tables.

## Undo and redo

```ts
await dataset.undoCoordinator.undo();
await dataset.undoCoordinator.redo();
dataset.undoHistory.canUndo;
dataset.undoHistory.canRedo;
```

API: [UndoCoordinator.undo()](?!=/api-reference/UndoCoordinator#undo), [redo()](?!=/api-reference/UndoCoordinator#redo), [DataSet.undoHistory](?!=/api-reference/DataSet#undoHistory), [UndoHistory.canUndo](?!=/api-reference/UndoHistory#canUndo), [canRedo](?!=/api-reference/UndoHistory#canRedo).

Replay restores recorded row versions without rerunning business rules. Derived
values are already included in the recorded operation. UI observers receive a reset
after restoration. A new successful edit discards the coordinator's global redo branch.
Read [UndoCoordinator](?!=/core/undo-coordinator) for shared data/view histories.
