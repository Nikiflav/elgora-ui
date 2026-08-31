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
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "columns",
      "type": "string[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "isRowSelectable",
      "type": "((rowIndex: number) => boolean) | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "findNextSelectableRow",
      "type": "((rowIndex: number, direction: 1 | -1) => number) | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    }
  ]
};
