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

<live-demo id="datagrid-selection" height="425px"></live-demo>

## Selection modes

Set `selectionMode` to `single-row`, `multiple-rows` or `multiple-cells` (the default).
The same restrictions apply to pointer gestures, keyboard navigation and all
programmatic range operations on the grid's SelectionManager.

```ts
grid.setOptions({ selectionMode: "single-row" });
grid.getSelectionManager().selectSingleCell(3, 2);
grid.refresh(); // Selects the whole row; active coordinates remain row 3, column 2.
```

In `single-row`, clicking, dragging, adding or extending a range replaces selection
with one whole row, including with Ctrl/Cmd or Shift. In `multiple-rows`, Ctrl/Cmd
adds disjoint whole-row ranges and Shift or dragging extends the latest range.
Normal arrow navigation replaces selection; Shift+Up/Down extends or shrinks a
row range. Left/Right keep active column navigation but never create partial-row
selection. Tab moves between columns and wraps to the next row; Enter moves
vertically. Tab/Enter replace row-mode selection with the destination row.

Changing modes normalizes existing ranges. `multiple-rows` expands cell rectangles
to whole-row ranges; `single-row` keeps only the active row. Returning to cell mode
retains whole-row ranges until a new selection gesture. The active cell remains
independent of the ranges: `setActiveCell()` alone changes focus coordinates without
selecting a row. Direct manager mutations require `grid.refresh()` to update visuals.

Selection state is rendered by the grid cell, so custom renderers do not need
to know how selection colors or edge borders work. Applications can inspect or
clear the current state with `getSelectedRanges()`, `getActiveSelectionCell()`,
and `clearSelection()`.

## API reference

See [`SelectionManager`](?!=/api-reference/SelectionManager),
[`CellSelectionState`](?!=/api-reference/CellSelectionState), and
[`DataGrid`](?!=/api-reference/DataGrid).
