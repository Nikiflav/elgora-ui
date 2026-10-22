---
id: datagrid-change-tracking
title: Change tracking and saving
group: datagrid
parent: datagrid-editing
path: /components/datagrid/editing/change-tracking
order: 63
description: Source-owned modification marks, DataTable business rules and explicit persistence.
api:
  - DataGrid
  - DataTable
  - DataSet
---

# Change tracking and saving

## DataTable and business rules

The grid uses exactly the same update command with [DataTable](?!=/api-reference/DataTable).
These are local, undoable changes; persistence remains the application's job.
The example's total is calculated by a business rule in the same transaction.
Undo and redo are external buttons, not a second grid-owned history.

<live-demo id="datagrid-editing-dataset" height="430px" src="../editing.md.dataset.ts"></live-demo>

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
