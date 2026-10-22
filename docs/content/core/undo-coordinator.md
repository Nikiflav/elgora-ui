---
id: undo-coordinator
title: Undo and redo
group: fundamentals
path: /core/undo-coordinator
order: 50
description: Combine data and view actions into one chronological undo journal with separate history scopes.
api:
  - UndoCoordinator
  - UndoHistory
  - UndoOperation
  - UndoBaselineEvent
---

# Undo and redo

UndoCoordinator is the single owner of undo/redo execution. Individual history scopes
record already-applied operations, but cannot independently undo or clear them.
One chronological journal can combine DataSet edits with view and application actions.

## Try shared data and view histories

Edit the amount and leave the field or click Apply amount, then toggle the view. Undo reverses whichever action happened last.
Save data clears only the dataset scope; view operations remain undoable. Watch the
scope flags and the per-scope baseline log.

<live-demo id="undo-shared-history" height="440px" src="undo-coordinator.md.ts"></live-demo>

## Create a coordinator and a history scope

```ts
import { UndoCoordinator } from "elgora-ui";

const coordinator = new UndoCoordinator();
const viewHistory = coordinator.createHistory("view");
let compact = false;

function toggleCompact() {
    coordinator.ensureIdle(); // check before changing application state
    const before = compact;
    const after = !before;
    compact = after;
    repaint();
    viewHistory.record({
        label: "Toggle compact view",
        undo: () => { compact = before; repaint(); },
        redo: () => { compact = after; repaint(); }
    });
}
```

record() does not execute the action: it records an action that has already succeeded.
Capture before/after values rather than reading mutable state inside a later redo.
Operations may return void or Promise<void>. A failed replay must leave application
state unchanged so it can safely be retried.

## One chronological journal, multiple scopes

```ts
const dataset = new DataSet({ undoCoordinator: coordinator });
const orders = dataset.createTable("orders", [{ id: 1, quantity: 2 }]);

await orders.rows[0].setValue("quantity", 5); // dataset scope
toggleCompact();                           // view scope

await coordinator.undo(); // view
await coordinator.undo(); // data and all its business effects
await coordinator.redo(); // data
await coordinator.redo(); // view
```

Use only coordinator.undo(), coordinator.redo() and coordinator.clear(history).
Scopes expose canUndo and canRedo, but neither selects which global action is next.
Duplicate scope names do not imply shared state.

A new record after undo removes the complete global redo branch, including entries
from other scopes. This keeps chronology consistent.

## Saving establishes a new baseline

```ts
await dataset.saveChanges(changes => api.save(changes));
// On success DataSet clears its own history; view history is preserved.

// For a custom non-DataSet scope after successful persistence:
coordinator.clear(customDataHistory);
```

clear(history) removes both applied and redo entries belonging to that scope.
It does not undo data and does not signal returnedToBaseline. Do not clear before
persistence succeeds: failed saves must retain the user's ability to undo.

## Returning to a scope's baseline

returnedToBaseline fires after undo removes the last applied operation in a scope.
Other scopes may still have applied operations. Redo followed by undo can reach
the same scope baseline again.

```ts
const subscription = viewHistory.returnedToBaseline.subscribe(() => {
    console.log("All view actions are undone");
});

// Baseline events currently use the synchronous ObservableEvent contract.
// Register any asynchronous external cleanup synchronously:
viewHistory.returnedToBaseline.subscribe(e => {
    e.waitUntil(clearExternalPreviewCache());
});
```

The coordinator waits for registered baseline work before accepting another action.
Do not edit the dataset, record, clear or replay history in a baseline handler:
the coordinator is busy. DataSet already restores its recorded data; it does not
need rejectChanges() when its history reaches the baseline.

The waitUntil API here belongs to UndoBaselineEvent. It is separate from DataSet
business events, whose async subscribers are awaited directly through invokeAsync().

## Async operations and failure handling

```ts
customDataHistory.record({
    label: "Restore local document",
    async undo() { await restoreLocalDocument(before); },
    async redo() { await restoreLocalDocument(after); },
    afterReplay() { repaintDocument(); }
});

try {
    const changed = await coordinator.undo(); // false when no action exists
} catch (error) {
    showError(error);
}
```

During replay busy is true. Concurrent undo/redo, record and clear are rejected.
DataSet also guards its edits against coordinator replay, saving and active transactions.
Use ensureIdle() before changing application state, not only before recording it.

If undo or redo fails, the journal position remains unchanged. The operation must
itself preserve or restore its previous state. In contrast, afterReplay and baseline
observers run after the replay position is committed: an observer error rejects the
call but does not reverse the completed action or move the cursor back.

For remote persistence, an undo callback cannot erase a server request that already
committed. Decide separately whether your application supports compensating server
operations. DataSet's standard history is for local edits before save.

## Update toolbar state

```ts
const subscription = coordinator.changed.subscribe(() => {
    undoButton.disabled = coordinator.busy || !coordinator.canUndo;
    redoButton.disabled = coordinator.busy || !coordinator.canRedo;
});
// Render the initial state as well, then dispose the subscription with the owning view.
```

Each scope also exposes changed with record, undo, redo and clear notifications.
Unlike DataSet events, [UndoHistory.changed](?!=/api-reference/UndoHistory) passes
the notification name directly to its subscriber, not an object with a `kind` property:

| Value | Meaning |
| --- | --- |
| `record` | An already-applied operation was added; the global redo branch is discarded |
| `undo` | One operation belonging to this scope was undone |
| `redo` | One operation belonging to this scope was redone |
| `clear` | Applied and redo entries for this scope were removed without replay |

[UndoCoordinator.changed](?!=/api-reference/UndoCoordinator) has no payload:
read `busy`, `canUndo` and `canRedo` from the coordinator.
The demo log shows these scope values and separate baseline notifications.

Observers must not synchronously mutate the journal. Dispose subscriptions when
their UI consumer is destroyed.

## DataSet integration

DataTable exposes its dataset's coordinator through the DataSource contract, so
different components can use the same journal. A successful DataSet transaction
records one operation, even if business rules changed several rows and tables.
Replay restores stored row versions and emits reset notifications, without
rerunning business rules.

Read [DataSet](?!=/data/dataset) for pending new rows, validation, transactions and save.

## API reference

- [UndoCoordinator](?!=/api-reference/UndoCoordinator) — shared journal and replay commands
- [UndoHistory](?!=/api-reference/UndoHistory) — scope state and notifications
- [UndoOperation](?!=/api-reference/UndoOperation) — undo, redo and post-replay callbacks
- [UndoBaselineEvent](?!=/api-reference/UndoBaselineEvent) — asynchronous baseline cleanup
- [DataSet](?!=/api-reference/DataSet) — automatic data history integration

[UndoCoordinator API](?!=/api-reference/UndoCoordinator)
