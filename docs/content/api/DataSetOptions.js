export default {
  "name": "DataSetOptions",
  "kind": "interface",
  "type": "DataSetOptions",
  "description": "Configuration shared by the dataset's tables.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataSetOptions",
  "source": "src/data/dataset/DataSet.ts",
  "members": [
    {
      "name": "undoCoordinator",
      "type": "UndoCoordinator | undefined",
      "description": "Shared application coordinator. If omitted, this dataset creates its own coordinator.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/dataset/DataSet.ts",
      "kind": "property"
    },
    {
      "name": "createRowId",
      "type": "NewRowIdFactory | undefined",
      "description": "Used by tables without their own createRowId. Receives the requesting DataTable.",
      "tags": [
        {
          "name": "example",
          "text": "createRowId: table => table.name + \"-\" + crypto.randomUUID()"
        }
      ],
      "topics": [],
      "optional": true,
      "source": "src/data/dataset/DataSet.ts",
      "kind": "property"
    }
  ]
};
