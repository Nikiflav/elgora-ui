---
id: data-form
title: DataForm
group: components
parent: editors
path: /components/data-form
order: 22
description: Edit one plain object or DataRow with the same field and editor contract as DataGrid.
api:
  - DataForm
  - DataFormOptions
  - DataFormAdapter
keywords:
  - form
  - fields
  - DataRow
  - editing
---

# DataForm

`DataForm` edits one object at a time. It reuses `DataViewField` metadata and
the same field-editor factory as `DataGrid`, so display formatting, validation,
lookups, dates and numeric editors behave consistently in both components.

## Plain objects and DataRow

Pass a plain object to get an isolated draft. The original object is unchanged
until the host accepts the form's `value`. When the value is a `DataRow`, the
form detects its row contract and writes accepted values through `row.setValue`,
so the table receives normal change notifications and tracking.

Click a value, press **Enter** or **F2**, edit it and confirm with **Enter**.
**Escape** restores the accepted value. Leaving the editor commits it after
asynchronous validation; a rejected value keeps its editor and error visible.
While editing, **Enter** and **Tab** commit and move to the next editable field;
**Shift+Tab** moves to the previous field. **Escape** cancels the field and
returns focus to its cell. An open lookup or date popup keeps ownership of its
own keyboard commands until it closes.

<live-demo id="data-form-basic" height="620px" src="data-form.md.ts"></live-demo>

## Labels and adapters

Use `labelPosition: "top"` (the default) or `"start"` for compact horizontal
forms. Both forms accept the same `DataViewField` definitions. Supply `adapter`
when a domain object does not expose field values directly; the adapter only
needs `getValue`, `getText`, and `setValue`.

For plain objects, the built-in adapter edits a shallow draft. For `DataRow`,
the built-in adapter preserves the table's mutation pipeline. Use `onCommit` for
side effects or remote persistence after a field has been accepted.

## API reference

See [`DataForm`](?!=/api-reference/DataForm),
[`DataFormOptions`](?!=/api-reference/DataFormOptions),
[`DataFormAdapter`](?!=/api-reference/DataFormAdapter), and
[`DataViewField`](?!=/api-reference/DataViewField).
