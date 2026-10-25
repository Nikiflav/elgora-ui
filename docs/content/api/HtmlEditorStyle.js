export default {
  "name": "HtmlEditorStyle",
  "kind": "interface",
  "type": "HtmlEditorStyle",
  "description": "One inline CSS declaration. Array order, duplicates and !important are significant.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorStyle",
  "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
  "members": [
    {
      "name": "name",
      "type": "string",
      "description": "CSS property name, e.g. background-color. Custom-property names retain their case.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "string",
      "description": "CSS value without the trailing !important priority.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    },
    {
      "name": "important",
      "type": "true | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorModel.ts",
      "kind": "property"
    }
  ]
};
