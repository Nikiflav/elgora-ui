---
id: datagrid-editing
title: Cell editing and editors
navTitle: Editing
group: datagrid
path: /components/datagrid/editing
order: 60
description: Configure field editors and begin, confirm or cancel cell editing.
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
sectionRedirects:
  - asynchronous-source-and-validation|/components/datagrid/editing/validation#asynchronous-source-and-validation
  - rejected-input|/components/datagrid/editing/validation#rejected-input
  - datatable-and-business-rules|/components/datagrid/editing/change-tracking#datatable-and-business-rules
  - modified-cells|/components/datagrid/editing/change-tracking#modified-cells
  - adding-rows|/components/datagrid/editing/new-rows#adding-rows
  - managing-new-row-sessions|/components/datagrid/editing/new-rows#managing-new-row-sessions
  - direct-source-commands|/components/datagrid/editing/new-rows#direct-source-commands
  - completing-several-rows|/components/datagrid/editing/new-rows#completing-several-rows
  - pasting-cells|/components/datagrid/clipboard#pasting-cells
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

<live-demo id="datagrid-editing-array" height="560px" src="editing.md.ts"></live-demo>

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

## Controlling the edit

See [Keyboard navigation](?!=/components/datagrid/keyboard-navigation) for complete
read-only and editing behavior, including cancellation and redirection through
[`cellNavigating`](?!=/api-reference/DataGrid#cellNavigating).

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

## Related topics

- [Validation and rejected input](?!=/components/datagrid/editing/validation)
- [New rows and pending sessions](?!=/components/datagrid/editing/new-rows)
- [Change tracking and saving](?!=/components/datagrid/editing/change-tracking)
- [Copy and paste](?!=/components/datagrid/clipboard)
