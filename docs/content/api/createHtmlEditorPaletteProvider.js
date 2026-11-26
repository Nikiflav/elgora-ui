export default {
  "name": "createHtmlEditorPaletteProvider",
  "kind": "function",
  "type": "(id: string, text: string, property: string, options: readonly HtmlEditorPropertyOption[], values: Readonly<Record<string, string>>) => HtmlEditorPropertyProvider",
  "description": "Choice provider with swatches; storage remains the same as the inline choice provider.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/createHtmlEditorPaletteProvider",
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
