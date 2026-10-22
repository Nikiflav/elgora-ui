---
id: datagrid-new-rows
title: New rows and pending sessions
group: datagrid
parent: datagrid-editing
path: /components/datagrid/editing/new-rows
order: 62
description: Create, insert and cancel explicit new-row sessions, including multiple invalid pending rows.
api:
  - DataGrid
  - NewRowSession
---

# New rows and pending sessions

Use the [cell editing demo](?!=/components/datagrid/editing#array-and-lookup) to add several pending rows and inspect their sessions. The same demo exercises every border mode and the per-session Insert/Cancel commands.

## Adding rows

An editable source with [`createNewRow`](?!=/api-reference/DataSource#createNewRow)
and `update` displays one input row at the end of the result. Its row header shows
`*`. Customize its label through `texts.newRowText`. Merely selecting this
placeholder creates no data. Starting an edit waits for `createNewRow()` before
creating the editor, so defaults, lookup providers and validators receive the real
domain row. Typing during asynchronous initialization is retained.

Confirming cells calls `update(session.row, values)` without inserting the row.
The pending row remains outside the query's filtering, sorting and totals.
Moving to another row attempts `session.insert()` unless the row has rejected
cell input. A row with errors remains pending but does not block navigation or
creation of another new row. All pending rows appear after query rows, each with
`*` in its header and a subtle line along the bottom of its cells; the final empty
placeholder is available for another new row and has no pending-row line.
The bottom border of data cells uses the success color at 30% opacity, including
when cell borders are hidden. Row headers retain the configured grid borders.
Border modes change colors without changing cell dimensions;
selection and error outlines remain independent inside the cells.
Override `--elg-data-grid-pending-row-border-color`
to customize its color. Use the demo's **Cell borders** selector to compare no
separators, row separators, and full cell borders. **Outer border** controls the
grid's surrounding frame independently.
Enter at the bottom boundary
also inserts; Tab does so at the last column. Successful insertion refreshes the
query and presents a fresh placeholder. `cellNavigating.cancel` prevents both the
move and automatic insertion.

A failed insert retains the session and values. Its error is exposed through
[`newRowError`](?!=/api-reference/DataGrid#newRowError) and the input cells' tooltip.
Correct the row and retry. Escape first discards invalid input on the active cell,
whether its editor is open or closed. If that cell has no error, Escape cancels
the whole pending row. The context-menu Cancel new row and explicit
`cancelNewRow(session)` always cancel the whole session. No new session is created
for each subsequent cell. Initialization or insertion in progress blocks another
edit; insertion requests are coalesced.

## Managing new-row sessions

[`newRowSessions`](?!=/api-reference/DataGrid#newRowSessions) is a read-only snapshot
of the pending [`NewRowSession`](?!=/api-reference/NewRowSession) objects created
through this grid. These are the actual source sessions, not grid wrappers. Their
object identity survives view reloads and reordering. Creating another session
does not mutate an earlier snapshot. Completed sessions leave the grid's collection;
references held by the application still expose their terminal `state`.

Use the grid API when UI input must be respected:

```ts
const session = await grid.createNewRow();
await source.update(session.row, { description: "New order line", quantity: 2 });

const inserted = await grid.insertNewRow(session);
if (!inserted) {
    // The session remains pending: correct the input or discard this exact row.
    await grid.cancelNewRow(session);
}
```

[`createNewRow()`](?!=/api-reference/DataGrid#createNewRow) delegates initialization
to the source, registers the session and displays its domain row. Placeholder
editing and paste share the same registration path. It rejects if creation fails,
the source does not support editing, or a conflicting operation is running.

[`insertNewRow(session)`](?!=/api-reference/DataGrid#insertNewRow) finishes a cell
editor belonging to that session, then refuses insertion if the row has retained
invalid input. It delegates domain validation to `session.insert()` and retains
source errors for correction. It does not revalidate every untouched field: enforce
whole-row business rules in the source. [`cancelNewRow(session)`](?!=/api-reference/DataGrid#cancelNewRow)
discards that row's editor, calls `session.cancel()` and clears only its input/errors.
Neither method finishes or cancels an editor belonging to another row; a view
reload is deferred until that editor closes.

Both methods require an explicit session owned by this grid. A foreign or already
completed session rejects with an error. Expected validation/source failures and
conflicting commands return `false`, leaving the row pending. Identical in-flight
commands for the same session share one promise; an insert and cancel cannot run
concurrently. Initialization and paste also block conflicting row commands.

The grid's keyboard navigation, automatic insertion on leaving a pending row,
Escape and Cancel new row context-menu command use these same session-aware paths.
No visible index or implicit selection is used by the public row commands.

### Direct source commands

Calling the source session directly deliberately bypasses grid input handling:

```ts
const [toInsert, toCancel] = grid.newRowSessions;
if (toInsert) await toInsert.insert(); // Domain rules only; does not confirm a grid editor.
if (toCancel) await toCancel.cancel(); // A different pending session; ignores grid input checks.
```

The two commands above address different sessions; an inserted row cannot be cancelled.
For automatic UI updates, the source must emit
[`changed`](?!=/api-reference/DataSource#changed) after a successful `insert` or
`cancel` and expose the updated session state. The grid removes that session,
clears its retained input and closes only its editor. Without source notifications,
direct commands do not guarantee a synchronized grid. The grid's own methods update
their collection/view even if the optional event is absent. Source sessions created
elsewhere are not automatically adopted by this grid.

### Completing several rows

Snapshot iteration is safe while commands remove sessions:

```ts
async function save() {
    if (!await grid.endEdit() || grid.hasValidationErrors) return;
    for (const session of grid.newRowSessions) {
        if (!await grid.insertNewRow(session)) return;
    }
    await dataset.saveChanges(); // Still a separate persistence operation.
}

async function discardNewRows() {
    for (const session of grid.newRowSessions) {
        if (!await grid.cancelNewRow(session)) return;
    }
}
```

[`endEdit`](?!=/api-reference/DataGrid#endEdit) and `cancelEdit()` still operate on
only the active cell; `cancelEdit()` also clears its retained invalid input/error
and never cancels a whole row. Escape adds the pending-row cancellation priority
described above. `hasPendingNewRow` reports whether any
pending rows remain. Query/source/column changes require all sessions to be
inserted or cancelled first. Disposal cancels all owned pending sessions after
in-flight operations finish. Inserting into a DataTable is a
local change; saving the DataSet remains a separate application command.

```ts
await grid.beginEdit(0, "quantity");
if (await grid.endEdit() && !grid.hasValidationErrors && !grid.hasPendingNewRow) {
    // endEdit() reports that editing finished, not that every input was accepted.
    await dataset.saveChanges();
}
// Alternatively, discard the current draft (false while a source update is running):
grid.cancelEdit();
```

See [`beginEdit`](?!=/api-reference/DataGrid#beginEdit),
[`endEdit`](?!=/api-reference/DataGrid#endEdit),
[`cancelEdit`](?!=/api-reference/DataGrid#cancelEdit) and
[`editing`](?!=/api-reference/DataGrid#editing).

Successful edits and source notifications automatically preserve expanded groups
when the row view is rebuilt. If an edit moves a row to a new group, that group
is not opened implicitly. See [saving and restoring expansion](?!=/components/datagrid/grouping/expansion#saving-and-restoring-expansion)
for `getExpansionState()` and `setExpansionState()`.

Finish or cancel editing before changing data, query or column options. `setOptions`
rejects those changes while a cell edit is active instead of silently losing its
draft. Source `changed` notifications are deferred until the edit ends. Scrolling
an edited row out of the rendered viewport attempts confirmation; rejected input
is retained without forcing the cell back into view. Disposing the grid releases its editor
and subscriptions but cannot cancel a source update already in flight.
