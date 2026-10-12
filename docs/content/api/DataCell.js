export default {
  "name": "DataCell",
  "kind": "type",
  "type": "any",
  "description": "A single resolved (value, text) pair for one column on one row.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataCell",
  "source": "src/components/datagrid/DataColumn.ts",
  "definition": "{\n    /** Column definition for this cell. */\n    column: DataColumn<TRow>;\n    /** Original row data. */\n    rowData: TRow;\n    /** Resolved raw cell value. */\n    value: any;\n    /** Resolved display text. */\n    text: string;\n}"
};
