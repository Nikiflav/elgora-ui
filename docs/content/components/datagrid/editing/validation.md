---
id: datagrid-edit-validation
title: Validation and rejected input
group: datagrid
parent: datagrid-editing
path: /components/datagrid/editing/validation
order: 61
description: Keep rejected cell text visible without trapping focus, and retry asynchronous validation.
api:
  - DataGrid
  - DataViewField
---

# Validation and rejected input

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

<live-demo id="datagrid-editing-remote" height="360px" src="../editing.md.remote.ts"></live-demo>

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
