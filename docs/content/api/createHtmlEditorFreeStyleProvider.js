export default {
  "name": "createHtmlEditorFreeStyleProvider",
  "kind": "function",
  "type": "(id: string, text: string, property: string, control: Extract<HtmlEditorPropertyControl, { type: \"color\" | \"length\" | \"text\"; }>) => HtmlEditorPropertyProvider",
  "description": "A free-form inline value, validated against the editor's CSS policy and browser CSS support.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/createHtmlEditorFreeStyleProvider",
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
      "name": "control",
      "type": "{ type: \"color\"; } | { type: \"length\"; units: readonly string[]; min?: number; max?: number; } | { type: \"text\"; }",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "HtmlEditorPropertyProvider",
    "description": ""
  }
};
