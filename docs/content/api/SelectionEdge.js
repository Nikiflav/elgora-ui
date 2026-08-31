export default {
  "name": "SelectionEdge",
  "kind": "type",
  "type": "any",
  "description": "The cardinal sides of a selection box a selected cell can sit on.\r\nA cell is marked with every side it touches (e.g. a lone cell is on all four,\r\na single-row selection marks its cells as both top and bottom), so the renderer\r\ncan paint a complete border around any selection shape.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/SelectionEdge",
  "source": "src/components/datagrid/SelectionManager.ts",
  "definition": "\"t\" | \"r\" | \"b\" | \"l\""
};
