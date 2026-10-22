---
id: datagrid-clipboard
title: Copy and paste
group: datagrid
path: /components/datagrid/clipboard
order: 70
description: Copy read-only selections and paste tabular text, retaining cell errors and pending rows.
api:
  - DataGrid
  - ValueEditor
keywords:
  - clipboard
  - copy
  - paste
  - import
  - TSV
---

# Copy and paste

Copy works without enabling editing. Select a range and use Ctrl+C / Command+C or the context-menu Copy command. Copy with headers adds column captions. Clipboard text follows the field display text; a display format is not necessarily lossless.

Paste requires an editable grid and an updating source. Try it in the [array and lookup demo](?!=/components/datagrid/editing#array-and-lookup).

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
