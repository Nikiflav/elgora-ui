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

Editing a cell inside an existing selected block preserves the block. After a
successful edit, Tab traverses it row by row and Enter column by column, wrapping
at its edges; Shift reverses the direction. With a single selected cell, navigation
continues across the grid instead. Grid arrow keys collapse the selection (Shift
extends it). Shift+Enter outside editing moves upwards. A
validation failure or cancellation does not change the selected block.

## Array and lookup

Try text, positive numeric values, a multi-column product lookup, a date and a
checkbox. A successful change updates the array and re-queries the grid, including
its summaries. Selecting a picker value or toggling a checkbox confirms that cell.

<live-demo id="datagrid-editing-array" height="460px"></live-demo>

The field's `dataType` selects a standard editor. [`lookup`](?!=/api-reference/DataViewField#lookup)
takes precedence; [`createEditor`](?!=/api-reference/DataViewField#createEditor)
can override either choice. The reusable [`createFieldEditor`](?!=/api-reference/createFieldEditor)
adapter can also be used by a form or card view. The host owns each editor and
disposes it after success or cancellation; shared lookup providers outlive the UI.

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
Correct the draft or press Escape. A failed request never navigates away.

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
precedence over a general mutation error; both remain visible in the editor.

## DataTable and business rules

The grid uses exactly the same update command with [DataTable](?!=/api-reference/DataTable).
These are local, undoable changes; persistence remains the application's job.
The example's total is calculated by a business rule in the same transaction.
Undo and redo are external buttons, not a second grid-owned history.

<live-demo id="datagrid-editing-dataset" height="380px" demo="dataset"></live-demo>

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
Moving to another row attempts `session.insert()`. Enter at the bottom boundary
also inserts; Tab does so at the last column. Successful insertion refreshes the
query and presents a fresh placeholder. `cellNavigating.cancel` prevents both the
move and automatic insertion.

A failed insert retains the session and values. Its error is exposed through
[`newRowError`](?!=/api-reference/DataGrid#newRowError) and the input cells' tooltip.
Correct the row and retry. Escape first cancels the current cell draft; Escape
outside cell editing cancels the entire pending row. No new session is created
for each subsequent cell. Initialization or insertion in progress blocks another
edit; insertion requests are coalesced.

External commands should explicitly complete or discard the row:

```ts
if (await grid.endRowEdit()) {
    // Both the cell and pending row have been accepted into the source.
    await dataset.saveChanges();
}

await grid.cancelNewRow(); // Discard the whole source session instead.
```

[`endEdit`](?!=/api-reference/DataGrid#endEdit) and `cancelEdit()` still operate on
only the active cell. [`endRowEdit`](?!=/api-reference/DataGrid#endRowEdit) and
[`cancelNewRow`](?!=/api-reference/DataGrid#cancelNewRow) operate on the pending
row; `hasPendingNewRow` reports its presence. Query/source/column changes require
that session to be inserted or cancelled first. Disposal cancels the owned pending
session after any in-flight operation finishes. Inserting into a DataTable is a
local change; saving the DataSet remains a separate application command.

```ts
await grid.beginEdit(0, "quantity");
if (await grid.endEdit()) {
    // No invalid or pending cell edit remains. Safe to save or change the query.
    await dataset.saveChanges();
}
// Alternatively, discard the current draft (false while a source update is running):
grid.cancelEdit();
```

See [`beginEdit`](?!=/api-reference/DataGrid#beginEdit),
[`endEdit`](?!=/api-reference/DataGrid#endEdit),
[`cancelEdit`](?!=/api-reference/DataGrid#cancelEdit) and
[`editing`](?!=/api-reference/DataGrid#editing).

Finish or cancel editing before changing data, query or column options. `setOptions`
rejects those changes while a cell edit is active instead of silently losing its
draft. Source `changed` notifications are deferred until the edit ends. Scrolling
an edited row out of the rendered viewport attempts confirmation; a validation
failure brings that cell back into view. Disposing the grid releases its editor
and subscriptions but cannot cancel a source update already in flight.

Tabular paste and grid-level undo/redo shortcuts are separate features; they are
not enabled by `allowEdit`.
