export default {
  "name": "HtmlEditorElement",
  "kind": "interface",
  "type": "HtmlEditorElement",
  "description": "HTML element content, with a single canonical location for each authored property.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorElement",
  "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
  "members": [
    {
      "name": "id",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "type",
      "type": "\"element\"",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "tag",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "classes",
      "type": "string[]",
      "description": "Unique class tokens in authored order.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "styles",
      "type": "HtmlEditorStyle[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "attributes",
      "type": "Record<string, string>",
      "description": "Other HTML attributes as strings. class/style are excluded; boolean presence uses an empty string.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "children",
      "type": "HtmlEditorNode[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    }
  ]
};
