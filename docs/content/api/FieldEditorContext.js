export default {
  "name": "FieldEditorContext",
  "kind": "interface",
  "type": "FieldEditorContext<TRow>",
  "description": "Context for custom editor creation. Pass onCommit to the editor to retain source-controlled saving.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/FieldEditorContext",
  "source": "src/data/DataViewField.ts",
  "members": [
    {
      "name": "text",
      "type": "string | undefined",
      "description": "Preloaded cell label, avoiding a second lookup request at the start of editing.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "onCommit",
      "type": "(value: any) => Promise<void>",
      "description": "Asynchronously submits a candidate value through the host's validation and saving pipeline.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "value",
          "type": "any",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: any) => Promise<void>"
    }
  ]
};
