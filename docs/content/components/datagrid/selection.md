---
id: datagrid-selection
title: Selection
group: components
parent: datagrid
path: /components/datagrid/selection
order: 57
description: Select cells, ranges, and rows with mouse and keyboard interaction.
toc: true
api:
  - DataGrid
  - SelectionManager
  - CellSelectionState
keywords:
  - selection
  - cell selection
  - range selection
  - copy
---

# Selection

DataGrid supports cell and range selection. Drag across cells to select a
rectangle, use the row header for whole-row selection, and use the context menu
to copy the result.

<live-demo id="datagrid-selection" height="360px"></live-demo>

Selection state is rendered by the grid cell, so custom renderers do not need
to know how selection colors or edge borders work. Applications can inspect or
clear the current state with `getSelectedRanges()`, `getActiveSelectionCell()`,
and `clearSelection()`.

## API reference

See [`SelectionManager`](?!=/api-reference/SelectionManager),
[`CellSelectionState`](?!=/api-reference/CellSelectionState), and
[`DataGrid`](?!=/api-reference/DataGrid).
