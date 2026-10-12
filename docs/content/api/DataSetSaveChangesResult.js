export default {
  "name": "DataSetSaveChangesResult",
  "kind": "type",
  "type": "any",
  "description": "Result of saving the complete batch. Mappings apply to successfully inserted rows, grouped by table.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataSetSaveChangesResult",
  "source": "src/data/dataset/DataSet.ts",
  "definition": "| { success: true; keyMappings?: Record<string, KeyMapping[]> }\n    | { success: false; error: string; fieldErrors?: Record<string, string> }"
};
