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
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "row",
      "type": "GridRow | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "rowData",
      "type": "TRow | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "column",
      "type": "DataColumn<TRow> | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "rowIndex",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "colIndex",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "selectedRanges",
      "type": "SelectionRange[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    },
    {
      "name": "event",
      "type": "MouseEvent",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGridContextMenu.ts",
      "kind": "property"
    }
  ]
};
