export default {
  "name": "CellSelectionState",
  "kind": "interface",
  "type": "CellSelectionState",
  "description": "Render state for a cell participating in one or more selection ranges.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/CellSelectionState",
  "source": "src/components/datagrid/SelectionManager.ts",
  "members": [
    {
      "name": "selected",
      "type": "boolean",
      "description": "Whether the cell falls inside any active selection range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "edges",
      "type": "SelectionEdge[]",
      "description": "The selection-box sides the cell sits on; empty array for interior cells.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    }
  ]
};
