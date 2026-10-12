export default {
  "name": "DataChange",
  "kind": "interface",
  "type": "DataChange",
  "description": "A transport change containing field values, never a domain row object.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataChange",
  "source": "src/data/ChangeSet.ts",
  "members": [
    {
      "name": "type",
      "type": "\"update\" | \"insert\" | \"remove\"",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/ChangeSet.ts",
      "kind": "property"
    },
    {
      "name": "key",
      "type": "RowIdentity | undefined",
      "description": "Insert may omit this when its data already contains the identity field.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ChangeSet.ts",
      "kind": "property"
    },
    {
      "name": "data",
      "type": "Record<string, unknown> | undefined",
      "description": "All insert values, or changed update fields; absent for removal.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ChangeSet.ts",
      "kind": "property"
    }
  ]
};
