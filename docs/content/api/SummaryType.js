export default {
  "name": "SummaryType",
  "kind": "type",
  "type": "any",
  "description": "Aggregation kind applied to a group column's summary value.\r\n`count` and `distinct` support all value types; `sum`, `avg`, `min`, and `max`\nrequire a numeric column.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/SummaryType",
  "source": "src/components/datagrid/DataColumn.ts",
  "definition": "\"count\" | \"sum\" | \"avg\" | \"min\" | \"max\" | \"distinct\" | string"
};
