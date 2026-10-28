export default {
  "name": "aggregateHtmlEditorUiCommandValues",
  "kind": "function",
  "type": "(values: readonly (HtmlEditorUiCommandValue | undefined)[]) => HtmlEditorUiCommandValueState | undefined",
  "description": "Aggregates authored values while preserving empty strings, zero and false.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/aggregateHtmlEditorUiCommandValues",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "parameters": [
    {
      "name": "values",
      "type": "readonly (HtmlEditorUiCommandValue | undefined)[]",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "HtmlEditorUiCommandValueState | undefined",
    "description": ""
  }
};
