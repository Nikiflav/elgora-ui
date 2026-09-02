export default {
  "name": "GroupIntervalDefinition",
  "kind": "type",
  "type": "any",
  "description": "A custom grouping interval with a serializable name and local fallback evaluator.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/GroupIntervalDefinition",
  "source": "src/components/datagrid/DataColumn.ts",
  "definition": "{\r\n    name: string;\r\n    text: string;\r\n    getGroupValue: (row: TRow, value: any) => any;\r\n}"
};
