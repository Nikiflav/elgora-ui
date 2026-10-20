export default {
  "name": "GridExpansionState",
  "kind": "interface",
  "type": "GridExpansionState",
  "description": "Independent snapshot of group expansion for one source and grouping definition.\nContains no rows or cached query results. Treat keys as opaque identifiers; reuse\nonly with the same source and ordered grouping fields/intervals. Tree mode is not included.",
  "tags": [
    {
      "name": "example",
      "text": "const state = grid.getExpansionState();\nawait grid.setExpansionState(state);"
    }
  ],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/GridExpansionState",
  "source": "src/components/datagrid/GridExpansionState.ts",
  "members": [
    {
      "name": "expandedGroupKeys",
      "type": "readonly string[]",
      "description": "Expanded group keys, including descendants retained beneath collapsed parents.\nAn empty list means all groups are collapsed; missing groups are ignored on restore.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/GridExpansionState.ts",
      "kind": "property"
    }
  ]
};
