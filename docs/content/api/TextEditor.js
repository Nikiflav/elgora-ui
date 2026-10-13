export default {
  "name": "TextEditor",
  "kind": "class",
  "type": "TextEditor<T>",
  "description": "Text input with a separately retained draft string, including invalid input.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/TextEditor",
  "source": "src/components/editors/ValueEditor.ts",
  "members": [
    {
      "name": "text",
      "type": "string",
      "description": "Current raw input, which may not yet be a valid typed value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "modified",
      "type": "boolean",
      "description": "Includes differences in unparsed text as well as typed values.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "resolveText",
      "type": "(text: string) => T | Promise<T>",
      "description": "Resolves text using resolveText, then parse, or unchanged text for string editors.\nUses the same conversion for interactive confirmation and external paste.",
      "tags": [
        {
          "name": "example",
          "text": "await numberEditor.resolveText(\"12,5\"); // 12.5"
        }
      ],
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
        "type": "T | Promise<T>",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => T | Promise<T>"
    },
    {
      "name": "selectAll",
      "type": "() => void",
      "description": "Selects all text, for example when beginning a grid-cell edit with F2.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/ValueEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
