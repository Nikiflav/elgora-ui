export default {
  "name": "DateEditor",
  "kind": "class",
  "type": "DateEditor",
  "description": "Date-only editor with a keyed DatePicker picker. Text and selected calendar days\nuse the shared asynchronous validation/commit lifecycle; the host performs saving.",
  "tags": [
    {
      "name": "example",
      "text": "new DateEditor({ value: \"2026-10-14\", onCommit: date => updateDeliveryDate(date) });"
    }
  ],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/DateEditor",
  "source": "src/components/editors/DateEditor.ts",
  "members": [
    {
      "name": "resolveText",
      "type": "(text: string) => Promise<string | null>",
      "description": "Resolves dateFormat input (empty means null), or uses a custom converter.\nThe result must remain a valid canonical date inside min/max. No saving occurs.",
      "tags": [
        {
          "name": "example",
          "text": "await editor.resolveText(\"2026-02-29\"); // Rejects an invalid date."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/DateEditor.ts",
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
    },
    {
      "name": "setValue",
      "type": "(value: string | null) => void",
      "description": "Loads a canonical date silently and updates an already created calendar.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/DateEditor.ts",
      "parameters": [
        {
          "name": "value",
          "type": "string | null",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: string | null) => void"
    }
  ]
};
