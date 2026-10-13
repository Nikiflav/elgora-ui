export default {
  "name": "LookupEditor",
  "kind": "class",
  "type": "LookupEditor<TValue, TItem>",
  "description": "Text-search value picker with a resizable, virtualized multi-column popup.\nSearching does not change value; choosing a row explicitly confirms an item.\nEscape or outside dismissal restores the last accepted value and its text.",
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
      "name": "open",
      "type": "() => void",
      "description": "Opens results lazily, retaining focus in the search input.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "close",
      "type": "() => void",
      "description": "Hides results; cancel() also restores the last accepted value and text.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "cancel",
      "type": "() => boolean",
      "description": "Restores the accepted value, cancels pending searches and closes results.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/LookupEditor.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    },
    {
      "name": "commit",
      "type": "() => Promise<boolean>",
      "description": "Closes only after successful acceptance; failures remain available for correction.",
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
