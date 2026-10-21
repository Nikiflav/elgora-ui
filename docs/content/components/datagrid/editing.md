---
id: datagrid-editing
title: Cell editing
group: components
parent: datagrid
path: /components/datagrid/editing
order: 58
description: Edit existing cells with value editors, asynchronous sources and DataTable transactions.
toc: true
api:
  - DataGrid
  - DataViewField
  - FieldLookup
  - FieldEditorContext
  - createFieldEditor
keywords:
  - edit
  - validation
  - lookup
---

# Cell editing

Set [`allowEdit`](?!=/api-reference/DataGridOptions#allowEdit) to `true` and supply a
source with [`update`](?!=/api-reference/DataSource#update). Plain arrays are wrapped
in an editable [ArrayDataSource](?!=/api-reference/ArrayDataSource). A field marked
`readonly` and synthetic rows such as group headers cannot be edited. Real tree
rows can be edited when their source supports updates.

Double-click or select a cell and press Enter or F2 to edit its existing value;
arrows then retain their normal caret/value behavior. Typing a printable character
instead begins replacement entry, passing that character as the initial text.
In replacement entry, arrows confirm and move to the adjacent cell. Clicking
inside the editor switches to caret/value navigation. An open picker always owns
its arrow keys. Enter confirms and moves down; Tab confirms and moves across,
without opening an editor in the destination cell. Shift reverses
the direction. Escape discards the unaccepted draft. A picker owns its navigation
keys while open, and its Escape closes the picker first.

Editing a cell inside an existing selected block preserves the block. After an
edit, Tab traverses it row by row and Enter column by column, wrapping
at its edges; Shift reverses the direction. With a single selected cell, navigation
continues across the grid instead. Grid arrow keys collapse the selection (Shift
extends it). Shift+Enter outside editing moves upwards. A
validation failure or cancellation does not change the selected block.

## Array and lookup

Try text, positive numeric values, a multi-column product lookup, a date and a
checkbox. A successful change updates the array and re-queries the grid, including
its summaries. Selecting a picker value or toggling a checkbox confirms that cell.

The Add row button creates a source session through the grid. The list below the
table shows each pending session's ID and offers Insert/Cancel for that specific
session, including rows which are not last. Try pasting invalid quantities into
several new rows: Insert keeps an invalid row pending; Cancel removes only its
session. The row header's context menu also offers Cancel new row.

<live-demo id="datagrid-editing-array" height="560px"></live-demo>

The field's `dataType` selects a standard editor. [`lookup`](?!=/api-reference/DataViewField#lookup)
takes precedence; [`createEditor`](?!=/api-reference/DataViewField#createEditor)
can override either choice. The reusable [`createFieldEditor`](?!=/api-reference/createFieldEditor)
adapter can also be used by a form or card view. The host owns each editor and
disposes it when editing ends, including when rejected input is retained in the
cell; shared lookup providers outlive the UI.

For example, use a switch instead of the standard checkbox, or a time editor for
a canonical time string:

```ts
{ name: "approved", dataType: "boolean",
  createEditor: context => new ToggleEditor({
    value: context.value, onCommit: context.onCommit
  }) }

{ name: "startTime", dataType: "string",
  createEditor: context => new TimeEditor({
    value: context.value, label: "Start time", onCommit: context.onCommit
  }) }
```

See [ToggleEditor](?!=/api-reference/ToggleEditor),
[TimeEditor](?!=/api-reference/TimeEditor), and
[FieldEditorContext](?!=/api-reference/FieldEditorContext). Custom factories must
pass the supplied `onCommit`; it includes field validation and source-controlled
acceptance.

[`getText`](?!=/api-reference/DataViewField#getText) overrides the cell label;
otherwise lookup fields use `lookup.getValueText`, and other fields use
`formatValue` or standard string conversion. `formatValue` also supplies text for
editing; it can differ from a decorated cell label such as a currency amount.
If the editable format differs from the editor's standard input syntax, provide
a matching `resolveText` so formatted values can be parsed back without loss.

Lookup items are arbitrary objects. `getItemValue` chooses the stored value,
`getItemText` chooses its label, and optional `columns` describe multiple popup
columns. Without columns, a single label column is supplied automatically.
`loadItems(query, context)` receives search, paging and cancellation options along
with the original row. Cache data in the shared provider, not the editor instance.

## Asynchronous source and validation

This example simulates a remote source. Change the quantity and confirm; the editor
is unavailable during the request. Quantities above 100 are rejected by the source.
The editor closes after the request finishes, and rejected input remains marked
in its cell for correction.

The source implements filtering, sorting, paging, grouping, group/total summaries,
field projection and cancellation checks. It also provides identity, change
notifications, updates, new-row sessions and deletion. `ArrayDataSource` and
`LocalGroupingDataSource` simulate server-side processing; a real implementation
sends these requests to its backend. Total summaries cover the complete filtered
result before paging, and are returned only when requested. The footer below
starts with a quantity sum of 7 and refreshes after accepted mutations.
Hierarchy and undo history are optional capabilities and are not advertised by
this flat, immediately saved source.

<live-demo id="datagrid-editing-remote" height="360px" demo="remote"></live-demo>

[`resolveText`](?!=/api-reference/DataViewField#resolveText) replaces the standard
text resolver, without mutating the row. A custom lookup resolver may accept free
text instead of requiring one match. [`validate`](?!=/api-reference/DataViewField#validate)
checks both typed and selected values and may be asynchronous. `required` rejects
null, undefined and empty strings. Source `fieldErrors` for the edited field take
precedence over a general mutation error. Rejected input and its message remain
visible in the cell after editing ends.

## Rejected input

Parsing, validation and source failures do not trap focus in an editor. Enter,
Tab, pointer navigation and blur finish editing after any pending request settles.
The cell displays the rejected input with an error icon and red frame; its tooltip
contains the error message. Reopening the cell restores that input and error.
Escape discards the active cell's rejected input and error, closes its editor if
open, and displays the source value. This priority also applies with no editor
open, and to pending rows: the first Escape restores the cell, not the whole row.
If the active cell has no rejected input/error and belongs to a pending session,
Escape cancels that entire session, even when another cell in the row has an error.
A second Escape after restoring an invalid pending cell therefore cancels its row.
In an existing row, Escape without an error only discards any current cell edit.
An open picker still handles Escape first; in-flight saves cannot be interrupted.
A successful retry clears the draft, including restoring the source's current value.

Drafts retain only text and an error, never a second typed row value. Text editors
restore that raw text in their input. Checkbox and switch editors instead show
the source's accepted boolean value; their error tooltip includes the rejected
text (for example, `Input: "something"`). Merely focusing or leaving such a control
does not clear the draft. Explicitly changing it submits a new boolean value.
Custom non-text editors use the field's `formatValue`, or string conversion, to
describe rejected actions; provide a matching `resolveText` for clipboard input.

Drafts belong to the grid, keyed by source row identity and field. Supply stable
[`getRowId`](?!=/api-reference/DataSource#getRowId) values when queries return new
row objects. Without it, row object identity is used. Drafts are not sent to the
source: filtering, sorting, grouping and summaries use only accepted values.
[`hasValidationErrors`](?!=/api-reference/DataGrid#hasValidationErrors) reports
outstanding cell or pending-row errors. It is separate from `editing`.

## DataTable and business rules

The grid uses exactly the same update command with [DataTable](?!=/api-reference/DataTable).
These are local, undoable changes; persistence remains the application's job.
The example's total is calculated by a business rule in the same transaction.
Undo and redo are external buttons, not a second grid-owned history.

<live-demo id="datagrid-editing-dataset" height="430px" demo="dataset"></live-demo>

### Modified cells

Sources may implement [`isCellModified(row, fieldName)`](?!=/api-reference/DataSource#isCellModified)
to expose differences from their accepted/persisted baseline. The grid reads this
synchronous capability when rendering; it owns no second change buffer. Sources
without it, including `ArrayDataSource`, do not display modification marks.
[`DataTable.isCellModified`](?!=/api-reference/DataTable#isCellModified) delegates
to [`DataRow.isModified`](?!=/api-reference/DataRow#isModified), including custom
equality, business-rule changes, and undo/redo. Source `changed` notifications
refresh the cells. A failed save retains the marks; a successful
[`saveChanges`](?!=/api-reference/DataSet#saveChanges) accepts the baseline and
clears them. The demo's **Save (simulated)** makes no network request.

Pending sessions retain only their `*` and green bottom edge. After insertion,
unsaved added rows mark every present field, including default values. The empty
placeholder, row headers, group rows and summaries have no modified-cell tint.

The background order is custom base, then a 10% success tint, then selection.
Error outlines remain independent. Override `--elg-data-grid-modified-cell-bg`
to replace the modified background. Use the base token for custom colors that
should participate in normal tinting:

```ts
customCellStyle: () => ({
    style: { "--elg-data-grid-cell-bg": "#fff4d6" }
})
```

Direct `background` or `backgroundColor` styles explicitly override the computed
background, including its modification and selection tints. A custom source
should emit `changed` after changing modification state or accepting a save;
the grid does not infer persistence from an `update` event.

## Controlling the edit

See [Keyboard navigation](?!=/components/datagrid/keyboard-navigation) for complete
read-only and editing behavior, including cancellation and redirection through
[`cellNavigating`](?!=/api-reference/DataGrid#cellNavigating).

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
is not opened implicitly. See [saving and restoring expansion](?!=/components/datagrid/grouping#saving-and-restoring-expansion)
for `getExpansionState()` and `setExpansionState()`.

Finish or cancel editing before changing data, query or column options. `setOptions`
rejects those changes while a cell edit is active instead of silently losing its
draft. Source `changed` notifications are deferred until the edit ends. Scrolling
an edited row out of the rendered viewport attempts confirmation; rejected input
is retained without forcing the cell back into view. Disposing the grid releases its editor
and subscriptions but cannot cancel a source update already in flight.

## Cell picker buttons

Lookup, date and date-time columns show a cell-owned picker button on mouse hover.
Clicking it starts editing and opens the picker in one action, including in the
new-row placeholder. A plain cell click still selects; double-click still edits.
Buttons do not create editors until activated and do not shift the cell text.

Set [`editorButtonVisibility`](?!=/api-reference/DataGridColumn#editorButtonVisibility)
on a column, or through `defaultColumnOptions` for the grid:

```ts
grid.setOptions({ defaultColumnOptions: { editorButtonVisibility: "always" } });
// "always": visible with mouse or touch.
// "hover": visible only when hovering with a hover-capable pointer (default).
// "never": no button outside editing; editor buttons and Alt+Down still work.
```

Column settings override the default. Read-only cells and group/summary rows have
no picker button. Alt+ArrowDown opens the active cell's picker without requiring
hover. Use the **Editor button visibility** selector in the first demo to compare.
For a custom `createEditor` returning a `PopoverEditor`, supply field metadata
such as `editorButton: { icon: "ri-time-line", label: "Open time picker" }`.

## Pasting cells

With `allowEdit: true`, Ctrl+V / Command+V pastes tab-separated text at the active
cell. Inside an editor, paste remains the editor's native text operation. The
block is not repeated to fill a larger selection. Read-only fields are skipped
without shifting columns; fields beyond the last visible column are ignored.
Group and summary rows cannot be paste destinations.

Select the starting cell with a single click, then use Ctrl+V / Command+V or
right-click and choose **Paste**. The context-menu command reads text from the
system clipboard and uses the same pipeline as keyboard paste. Browser permission
may be required; if reading is unavailable or denied, the menu offers a return to
the grid with an instruction to use keyboard paste. Copy and Copy with headers
are also available in the context menu. Include `"paste"` in
`standardContextMenuItems` when supplying an explicit list of built-in commands.

Each cell uses its editor's [`resolveText`](?!=/api-reference/ValueEditor#resolveText)
and validation. Lookup text must resolve unambiguously unless a custom resolver
accepts free text. Successfully resolved fields are sent in one `update` per row;
failed cells retain their text and error, and the next input row is processed.
There is no whole-paste rollback for a general remote source.

Input extending past the result creates independent
[`NewRowSession`](?!=/api-reference/NewRowSession) instances. Failure to create a
new row stops the remaining paste, retaining earlier results. A cell failure keeps
its row pending without calling `insert()`, and processing continues. An insert
failure also retains the session and its error and continues to the next row.
Correct pending rows in place, then leave them to retry insertion, or use
[`insertNewRow(session)`](?!=/api-reference/DataGrid#insertNewRow) explicitly.

The same operation is available programmatically. In the array example, select
the Description column first so the following three values align with
Description, Product and Quantity:

```ts
try {
    grid.getSelectionManager().selectSingleCell(0, 1);
    await grid.pasteText("Office\tKeyboard\t2\nWorkshop\tMouse\tinvalid");
    // Check grid.hasValidationErrors and grid.hasPendingNewRow for corrections.
} catch (error) {
    // A creation/query failure stopped the operation; earlier accepted rows remain.
}
```

[`pasteText`](?!=/api-reference/DataGrid#pasteText) waits for processing to finish;
cell and insert errors are retained rather than rejecting its promise. Creation,
query and malformed clipboard errors reject. Paste is serialized and grid editing
is unavailable until it settles. Grid-level undo/redo shortcuts remain separate;
source-owned history decides which mutations can be undone.
