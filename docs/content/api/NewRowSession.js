export default {
  "name": "NewRowSession",
  "kind": "interface",
  "type": "NewRowSession<TRow>",
  "description": "A new-row editing session owned by its source.\nThe application retains this handle and explicitly chooses insert() or cancel().\nFor DataTable, pending sessions block saveChanges(), acceptChanges() and rejectChanges().",
  "tags": [
    {
      "name": "example",
      "text": "const newRowSession = await source.createNewRow!();\nawait source.update!(newRowSession.row, { quantity: 3 });\nconst result = await newRowSession.insert();\nif (!result.success) showError(result.error);"
    }
  ],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/NewRowSession",
  "source": "src/data/DataSource.ts",
  "members": [
    {
      "name": "row",
      "type": "TRow",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "state",
      "type": "\"pending\" | \"inserted\" | \"cancelled\"",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "insert",
      "type": "() => Promise<MutationResult>",
      "description": "Confirms insertion. A rejected result leaves the session pending for correction.\nFor DataTable this is local; remote sources may persist here. Repeated insert\nafter success is harmless. Insert after cancellation must reject.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<MutationResult>"
    },
    {
      "name": "cancel",
      "type": "() => Promise<void>",
      "description": "Discards this pending session. Repeated cancel is harmless; cancel after insert rejects.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<void>"
    }
  ]
};
