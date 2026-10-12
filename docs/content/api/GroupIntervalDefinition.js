export default {
  "name": "GroupIntervalDefinition",
  "kind": "type",
  "type": "any",
  "description": "A custom grouping interval with a serializable name and local fallback evaluator.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/GroupIntervalDefinition",
  "source": "src/data/grouping.ts",
  "definition": "{\n    name: string;\n    text: string;\n    getGroupValue: (row: TRow, value: any) => any;\n}"
};
