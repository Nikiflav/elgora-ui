export default {
  "name": "SelectionRange",
  "kind": "interface",
  "type": "SelectionRange",
  "description": "Rectangular range between an anchor cell and a focus cell.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/SelectionRange",
  "source": "src/components/datagrid/SelectionManager.ts",
  "members": [
    {
      "name": "anchor",
      "type": "SelectionCell",
      "description": "The origin cell where interaction (mouse down / click) started for this box",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    },
    {
      "name": "focus",
      "type": "SelectionCell",
      "description": "The outer edge cell extended by mouse drag or Shift+Click/Arrows",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "kind": "property"
    }
  ]
};
