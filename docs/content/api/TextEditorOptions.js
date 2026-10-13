export default {
  "name": "TextEditorOptions",
  "kind": "interface",
  "type": "TextEditorOptions<T>",
  "description": "Text-specific parsing and formatting, in addition to the shared value lifecycle.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/TextEditorOptions",
  "source": "src/components/editors/ValueEditor.ts",
  "members": [
    {
      "name": "parse",
      "type": "((text: string) => T | Promise<T>) | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "format",
      "type": "((value: T) => string) | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "commitOnBlur",
      "type": "boolean | undefined",
      "description": "Defaults to true. Enter always confirms; Escape always cancels.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    }
  ]
};
