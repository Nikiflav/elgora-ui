---
id: datagrid-context-menus
title: Context menus
group: components
parent: datagrid
path: /components/datagrid/context-menus
order: 61
description: Configure column, row, row-header, and cell context-menu actions.
toc: true
api:
  - DataGrid
  - DataGridContextMenuContext
  - GridContextMenuItems
  - GridStandardContextMenuItem
keywords:
  - context menu
  - row actions
  - column actions
  - custom actions
---

# Context menus

DataGrid exposes separate customization points for cells, rows, row headers,
and column headers. Keep standard actions and add application-specific actions
where they are relevant.

<live-demo id="datagrid-context-menus" height="360px"></live-demo>

The demo adds a custom row action while retaining the built-in column menu.
Context callbacks receive the row, column, selected ranges, and originating
mouse event.

## API reference

See [`DataGridContextMenuContext`](?!=/api-reference/DataGridContextMenuContext),
[`GridContextMenuItems`](?!=/api-reference/GridContextMenuItems), and
[`GridStandardContextMenuItem`](?!=/api-reference/GridStandardContextMenuItem).
