export default {
  "name": "CheckboxEditor",
  "kind": "class",
  "type": "CheckboxEditor",
  "description": "Checkbox editing a boolean value, confirming immediately after user changes.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/CheckboxEditor",
  "source": "src/components/editors/ValueEditor.ts",
  "members": [
    {
      "name": "resolveText",
      "type": "(text: string) => boolean | Promise<boolean>",
      "description": "Resolves true/false, yes/no and 1/0, ignoring case and surrounding whitespace.",
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
