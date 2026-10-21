export default {
  "name": "LookupEditor",
  "kind": "class",
  "type": "LookupEditor<TValue, TItem>",
  "description": "Text-search value picker with a resizable, virtualized multi-column popup.\nSearching does not change value; choosing a row explicitly confirms an item.\nEscape restores the last accepted value; closing results retains the current draft.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/LookupEditor",
  "source": "src/components/editors/LookupEditor.ts",
  "members": [
    {
      "name": "text",
      "type": "string",
      "description": "Raw search/display text; typing does not change the typed value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "restoreDraft",
      "type": "(text: string, error?: string) => void",
      "description": "Restores rejected search text without allowing a delayed value label to overwrite it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "error",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string, error?: string) => void"
    },
    {
      "name": "modified",
      "type": "boolean",
      "description": "Includes unconfirmed search text as well as an explicit candidate value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "kind": "property"
    },
    {
      "name": "resolveText",
      "type": "(text: string) => Promise<TValue>",
      "description": "Resolves external text only when the complete result contains one match.\nDoes not open the popup, change state, emit events, validate or save.",
      "tags": [
        {
          "name": "example",
          "text": "const id = await editor.resolveText(\"Northwind\");"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<TValue>",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => Promise<TValue>"
    },
    {
      "name": "commit",
      "type": "() => Promise<boolean>",
      "description": "Hides results immediately; asynchronous acceptance reports errors on the editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    }
  ]
};
