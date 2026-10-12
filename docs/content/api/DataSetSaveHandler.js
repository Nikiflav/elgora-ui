export default {
  "name": "DataSetSaveHandler",
  "kind": "type",
  "type": "any",
  "description": "Persists one batch for all changed tables; resolve success only after the complete batch is saved.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataSetSaveHandler",
  "source": "src/data/dataset/DataSet.ts",
  "definition": "(changes: DataSetChanges) => Promise<DataSetSaveChangesResult>"
};
