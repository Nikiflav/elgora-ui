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
  "definition": "{\n    /** Column definition for this cell. */\r\n    column: DataColumn<TRow>;\r\n    /** Original row data. */\r\n    rowData: TRow;\r\n    /** Resolved raw cell value. */\r\n    value: any;\r\n    /** Resolved display text. */\r\n    text: string;\r\n}"
};
