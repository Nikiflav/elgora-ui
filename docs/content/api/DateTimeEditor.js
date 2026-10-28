export default {
  "name": "DateTimeEditor",
  "kind": "class",
  "type": "DateTimeEditor",
  "description": "Local date-time editor combining DatePicker and TimePicker in one popover.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/DateTimeEditor",
  "source": "src/components/editors/DateTimeEditor.ts",
  "members": [
    {
      "name": "openOnInputClick",
      "type": "boolean",
      "description": "A click on the active date-time input opens the picker; focus alone does not.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/DateTimeEditor.ts",
      "kind": "property"
    },
    {
      "name": "resolveText",
      "type": "(text: string) => Promise<string | null>",
      "description": "Resolves and validates a local canonical date-time.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/DateTimeEditor.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<string | null>",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => Promise<string | null>"
    }
  ]
};
