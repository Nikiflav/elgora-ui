export default {
  "name": "NewRowIdFactory",
  "kind": "type",
  "type": "any",
  "description": "Generates a unique identity for a new row. Receives the table requesting the identity.\nReturn a string or finite number, directly or asynchronously.",
  "tags": [
    {
      "name": "example",
      "text": "const createRowId: NewRowIdFactory = table => table.name + \"-\" + crypto.randomUUID();"
    }
  ],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/NewRowIdFactory",
  "source": "src/data/dataset/DataSet.ts",
  "definition": "(table: DataTable) => RowIdentity | Promise<RowIdentity>"
};
