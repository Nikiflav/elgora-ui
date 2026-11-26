export default {
  "name": "createHtmlEditorInlineStyleProvider",
  "kind": "function",
  "type": "(id: string, text: string, property: string, options: readonly HtmlEditorPropertyOption[], values: Readonly<Record<string, string>>) => HtmlEditorPropertyProvider",
  "description": "Maps stable option IDs to inline CSS values without touching unrelated declarations.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/createHtmlEditorInlineStyleProvider",
  "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
  "parameters": [
    {
      "name": "id",
      "type": "string",
      "optional": false,
      "description": ""
    },
    {
      "name": "text",
      "type": "string",
      "optional": false,
      "description": ""
    },
    {
      "name": "property",
      "type": "string",
      "optional": false,
      "description": ""
    },
    {
      "name": "options",
      "type": "readonly HtmlEditorPropertyOption[]",
      "optional": false,
      "description": ""
    },
    {
      "name": "values",
      "type": "Readonly<Record<string, string>>",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "HtmlEditorPropertyProvider",
    "description": ""
  }
};
