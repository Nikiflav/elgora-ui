export default {
  "name": "createHtmlEditorClassProvider",
  "kind": "function",
  "type": "(id: string, text: string, options: readonly HtmlEditorPropertyOption[], classes: Readonly<Record<string, string>>) => HtmlEditorPropertyProvider",
  "description": "A provider owns only its configured classes; unrelated classes are preserved.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/createHtmlEditorClassProvider",
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
      "name": "options",
      "type": "readonly HtmlEditorPropertyOption[]",
      "optional": false,
      "description": ""
    },
    {
      "name": "classes",
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
