export default {
  "name": "DataGridContextMenuContext",
  "kind": "interface",
  "type": "DataGridContextMenuContext<TRow>",
  "description": "Context passed to grid, row, and column context-menu customization points.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataGridContextMenuContext",
  "source": "src/components/datagrid/DataGridContextMenu.ts",
  "members": [
    {
      "name": "target",
      "type": "GridContextMenuTarget",
      "description": "Grid surface on which the context menu was requested.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "row",
      "type": "GridRow | undefined",
      "description": "Flattened row under the pointer; absent for column headers and group chips.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "rowData",
      "type": "TRow | undefined",
      "description": "Business row for data cells/rows; absent for group metadata and headers.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "column",
      "type": "DataGridColumn<TRow> | undefined",
      "description": "Data-column definition when the target identifies a column.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "rowIndex",
      "type": "number | undefined",
      "description": "Zero-based visible row index, when a row is targeted.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "colIndex",
      "type": "number | undefined",
      "description": "Zero-based data-column index when supplied by the target; excludes the row header.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "selectedRanges",
      "type": "SelectionRange[]",
      "description": "Snapshot of the selection ranges when the menu was requested.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "event",
      "type": "MouseEvent",
      "description": "Original browser context-menu event, including pointer coordinates and modifiers.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    }
  ]
};
