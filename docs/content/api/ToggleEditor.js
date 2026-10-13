export default {
  "name": "ToggleEditor",
  "kind": "class",
  "type": "ToggleEditor",
  "description": "Boolean switch using the shared asynchronous confirmation lifecycle.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/ToggleEditor",
  "source": "src/components/editors/ValueEditor.ts",
  "members": [
    {
      "name": "resolveText",
      "type": "(text: string) => boolean | Promise<boolean>",
      "description": "Resolves the same boolean text forms as CheckboxEditor, without toggling it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean | Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => boolean | Promise<boolean>"
    }
  ]
};
