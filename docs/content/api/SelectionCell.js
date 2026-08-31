export default {
  "name": "SelectionCell",
  "kind": "interface",
  "type": "SelectionCell",
  "description": "Coordinates and selection metadata for a visible grid cell.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/SelectionCell",
  "source": "src/components/datagrid/SelectionManager.ts",
  "members": [
    {
      "name": "rowIndex",
      "type": "number",
      "description": "The actual visual row index on screen at the moment of selection",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "colIndex",
      "type": "number",
      "description": "Visual column index on screen at the moment of selection",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "wholeRow",
      "type": "boolean | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    }
  ]
};
