---
id: datagrid-keyboard-navigation
title: Keyboard navigation
group: components
parent: datagrid
path: /components/datagrid/keyboard-navigation
order: 59
description: Navigate selections, edit cells, operate pickers and customize keyboard destinations.
toc: true
api:
  - DataGrid
  - DataGridCellNavigatingEvent
keywords:
  - keyboard
  - Enter
  - Tab
  - cellNavigating
---

# Keyboard navigation

The active cell identifies the current row and column. Selection ranges describe
the highlighted cells; a selected block can remain highlighted while its active
cell moves. Click a data cell to focus the grid before using its keyboard commands.
See [Selection](?!=/components/datagrid/selection) for pointer and selection modes,
and [Cell editing](?!=/components/datagrid/editing) for editable-source examples.

## Read-only navigation

With `allowEdit: false` (the default), navigation never creates a value editor.

| Key | Behavior |
| --- | --- |
| Arrow keys | Move to the adjacent cell and replace the current cell selection. |
| Shift + arrow | Extend the selection from its anchor in multiple-cell mode. |
| Tab / Shift+Tab | Move right / left, continuing on the next / previous row. |
| Enter / Shift+Enter | Move down / up in the current column. |
| Ctrl+C / Command+C | Copy the selected data cells. |

For a selected multi-cell rectangle, Tab traverses its cells row by row and Enter
column by column. Traversal wraps inside that rectangle and preserves it; Shift
reverses direction. With multiple separate ranges, traversal uses the last range.
With a single selected cell, traversal continues across the grid instead, stopping
at the available boundary. Normal arrows collapse a block; Shift+arrows extend it.

In `single-row` mode, selection remains a single whole row, while the active column
can still move horizontally. In `multiple-rows` mode, Shift+Up/Down extends the
whole-row selection. Shift+Left/Right does not extend a row range. Enter and Tab
use across-grid navigation in both row modes rather than rectangular traversal.
Rows excluded by the grid's selection rules are skipped during vertical movement.

## Entering edit mode

Editing requires [`allowEdit`](?!=/api-reference/DataGridOptions#allowEdit), a
writable field and a source implementing [`update`](?!=/api-reference/DataSource#update).

| Start action | Initial text | Arrow behavior |
| --- | --- | --- |
| Enter or F2 | Existing editable text, selected for replacement | Controlled by the editor. |
| Double-click | Existing editable text, selected for replacement | Controlled by the editor. |
| Printable character | That character replaces the existing text | Confirm and move to the adjacent cell. |

Typing while the editor's initial row is loading is retained. Clicking inside an
editor that was started by typing switches it to normal caret/value navigation.
For example, text arrows move the caret; the number editor can use Up/Down to step
the value. An open picker always owns its navigation keys, regardless of how the
cell edit started. Ctrl/Command/Alt-modified arrows are not used to confirm a typed
replacement entry.

[`beginEdit`](?!=/api-reference/DataGrid#beginEdit) without initial text uses normal
editor navigation; supplying text uses replacement-entry navigation:

```ts
await grid.beginEdit(0, "quantity");      // Existing text; editor owns arrows.
await grid.endEdit();
await grid.beginEdit(0, "quantity", "7"); // Replacement text; arrows confirm and move.
```

## Confirming and cancelling

Enter confirms the active edit and moves down. Tab confirms and moves across;
Shift reverses direction. Navigation within a selected block follows the same
traversal as read-only mode. The destination cell is not opened for editing.
Press Enter again to edit it. Outside editing, Shift+Enter navigates upwards;
unmodified Enter starts editing when editing is enabled.

Escape discards the unaccepted cell draft without moving the selection. With an
open picker, the first Escape closes/cancels the picker and the next Escape
cancels the cell edit. Selecting a picker item or changing a checkbox confirms
that value without requesting a move to another cell. Button-based editors retain
their native Enter activation.

Parsing, validation and source updates may be asynchronous. Movement occurs only
after successful confirmation. A failed confirmation retains the editor, error,
active cell and selection. The editor is unavailable while saving; a request
already in flight cannot be cancelled with Escape. Losing focus attempts to
confirm the edit but does not request keyboard navigation.

## Customizing navigation

When the source supports new rows, the final `*` row is an input placeholder.
Selecting it creates nothing; starting an edit initializes a source session before
the editor opens. Tab traverses its cells. Moving away attempts insertion, as do
Enter at its bottom boundary and Tab at its last column. A failed insertion keeps
the pending row for correction. Escape outside cell editing discards the whole
pending row; inside editing it first discards only that cell draft. See
[Adding rows](?!=/components/datagrid/editing#adding-rows) for the lifecycle and
explicit insert/cancel methods.

Subscribe to [`cellNavigating`](?!=/api-reference/DataGrid#cellNavigating) to inspect
the calculated destination before the grid applies it. The synchronous
[`DataGridCellNavigatingEvent`](?!=/api-reference/DataGridCellNavigatingEvent) contains
`key`, `shiftKey`, `currentCell`, mutable `targetCell`, and `cancel`.
Coordinates are zero-based visible row and data-column indices, excluding the row
header. No row data needs to be loaded by a handler merely to inspect coordinates.

Prevent Enter from moving after a successful edit:

```ts
const subscription = grid.cellNavigating.subscribe(event => {
    if (event.key === "Enter") event.cancel = true;
});

// When the owning view no longer needs this behavior:
subscription.dispose();
```

Cancellation preserves both the active cell and the selection. It does not undo
the confirmed value: saving has already succeeded and the editor has closed.
The grid still handles the key, so cancelling Tab does not transfer browser focus.

Redirect Tab from a particular column to another column in the same row:

```ts
grid.cellNavigating.subscribe(event => {
    if (event.key === "Tab" && !event.shiftKey && event.currentCell.colIndex === 1) {
        event.targetCell = {
            rowIndex: event.currentCell.rowIndex,
            colIndex: 3
        };
    }
});
```

Choose indices that exist in your visible columns. An invalid, out-of-bounds or
non-selectable destination cancels movement. Redirecting inside an existing
selected range retains it; redirecting outside it selects the destination according
to `selectionMode`.

The event applies to grid-handled arrows, Enter and Tab, including moves after
successful edits. It does not fire for Enter that starts editing, editor-owned
keys, pointer/programmatic selection, picker acceptance, Escape, or failed edits.
It can fire at a boundary even when the proposed cell equals the current cell.
Handlers must update the event synchronously; asynchronous subscriptions are not
awaited. Prefer changing `targetCell` over directly changing selection in a handler.
Subscriptions are also released when the grid is disposed.
