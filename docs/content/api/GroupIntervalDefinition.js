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
  "definition": "{\n    name: string;\n    text: string;\n    getGroupValue: (row: TRow, value: any) => any;\n}"
};
