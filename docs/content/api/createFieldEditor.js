export default {
  "name": "createFieldEditor",
  "kind": "function",
  "type": "<TRow>(context: FieldEditorContext<TRow>) => ValueEditor<any>",
  "description": "Creates a value-only editor for a field; shared by grids, forms and cards.\nThe caller owns its lifetime and supplies the asynchronous persistence callback.",
  "tags": [
    {
      "name": "example",
      "text": "const editor = createFieldEditor({ row, field, value, onCommit: saveValue });"
    }
  ],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/createFieldEditor",
  "source": "src/components/editors/createFieldEditor.ts",
  "parameters": [
    {
      "name": "context",
      "type": "FieldEditorContext<TRow>",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "ValueEditor<any>",
    "description": ""
  }
};
