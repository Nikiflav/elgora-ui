export default {
  "name": "HtmlEditorUiCommandTargetContext",
  "kind": "interface",
  "type": "HtmlEditorUiCommandTargetContext",
  "description": "Captured user intent: selected nodes and remembered text range coexist.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandTargetContext",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "members": [
    {
      "name": "modelVersion",
      "type": "number",
      "description": "Surface model generation at capture time; later generations invalidate this context.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "nodeInfos",
      "type": "readonly HtmlEditorUiCommandNodeInfo[]",
      "description": "Read-only node metadata captured in document order.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    }
  ]
};
