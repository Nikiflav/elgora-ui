export default {
  "name": "GridStandardContextMenuItem",
  "kind": "type",
  "type": "any",
  "description": "Identifiers for the grid's built-in context-menu actions.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/GridStandardContextMenuItem",
  "source": "src/components/datagrid/DataGridContextMenu.ts",
  "definition": "| \"copy\"\n    | \"copyWithHeaders\"\n    | \"selectRow\"\n    | \"clearSelection\"\n    | \"sortAscending\"\n    | \"sortDescending\"\n    | \"clearSort\"\n    | \"pinColumn\"\n    | \"autosizeColumn\"\n    | \"autosizeAllColumns\"\n    | \"groupColumn\"\n    /** Opens this grouping level and all its parent levels. Only available on grouped headers/chips. */\n    | \"expandGroupsToLevel\"\n    /** Closes this grouping level while retaining parent and descendant expansion states. */\n    | \"collapseGroupsAtLevel\""
};
