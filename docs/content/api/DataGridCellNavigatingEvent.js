export default {
  "name": "DataGridCellNavigatingEvent",
  "kind": "interface",
  "type": "DataGridCellNavigatingEvent",
  "description": "Synchronous callback for keyboard navigation. Coordinates refer to visible data columns, excluding row headers.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataGridCellNavigatingEvent",
  "source": "src/components/datagrid/DataGrid.ts",
  "members": [
    {
      "name": "key",
      "type": "CellEditNavigationKey | \"PageUp\" | \"PageDown\" | \"Home\" | \"End\"",
      "description": "Grid navigation key; Enter that starts editing does not raise this event.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "shiftKey",
      "type": "boolean",
      "description": "True for reverse traversal or extended selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "ctrlKey",
      "type": "boolean",
      "description": "Modifier state, used to distinguish grid-wide Home/End from row-local Home/End.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "metaKey",
      "type": "boolean",
      "description": "Command modifier state on platforms that use Meta instead of Control.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "currentCell",
      "type": "{ readonly rowIndex: number; readonly colIndex: number; }",
      "description": "Active cell before navigation; changing this snapshot has no effect.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "targetCell",
      "type": "{ rowIndex: number; colIndex: number; }",
      "description": "Proposed destination. Change its coordinates to redirect navigation. Invalid destinations cancel the move.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "cancel",
      "type": "boolean",
      "description": "Set true to retain the active cell and selection. A completed edit is not rolled back.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    }
  ]
};
