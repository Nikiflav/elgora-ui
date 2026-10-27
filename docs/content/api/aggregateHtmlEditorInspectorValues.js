export default {
  "name": "aggregateHtmlEditorInspectorValues",
  "kind": "function",
  "type": "(values: readonly (HtmlEditorInspectorValue | undefined)[]) => HtmlEditorInspectorValueState | undefined",
  "description": "Aggregates per-target authored values with Object.is. Undefined means unset;\nempty text, zero, false and null remain real values. Empty input has no applicable\ntargets and returns undefined, so the caller can omit that field entirely.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/aggregateHtmlEditorInspectorValues",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "parameters": [
    {
      "name": "values",
      "type": "readonly (HtmlEditorInspectorValue | undefined)[]",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "HtmlEditorInspectorValueState | undefined",
    "description": ""
  }
};
