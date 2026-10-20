export default {
  "name": "GridContext",
  "kind": "interface",
  "type": "GridContext",
  "description": "Grid callbacks and dimensions used by selection navigation.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/GridContext",
  "source": "src/components/datagrid/SelectionManager.ts",
  "members": [
    {
      "name": "totalRows",
      "type": "number",
      "description": "Number of rows in the current flattened view, including structural rows.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "columns",
      "type": "string[]",
      "description": "Ordered names of the selectable data columns.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "isRowSelectable",
      "type": "((rowIndex: number) => boolean) | undefined",
      "description": "Returns whether navigation may select a particular visible row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "findNextSelectableRow",
      "type": "((rowIndex: number, direction: 1 | -1) => number) | undefined",
      "description": "Finds a selectable row in the given direction; return -1 when no candidate exists.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    }
  ]
};
