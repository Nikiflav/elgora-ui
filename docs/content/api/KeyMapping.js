export default {
  "name": "KeyMapping",
  "kind": "interface",
  "type": "KeyMapping",
  "description": "Maps a client-side temporary key to the key assigned by the server.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/KeyMapping",
  "source": "src/data/ChangeSet.ts",
  "members": [
    {
      "name": "temporaryKey",
      "type": "RowIdentity",
      "description": "Identity used by the client before persistence.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/ChangeSet.ts",
      "kind": "property"
    },
    {
      "name": "key",
      "type": "RowIdentity",
      "description": "Persisted identity assigned to the same row by the server.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/ChangeSet.ts",
      "kind": "property"
    }
  ]
};
