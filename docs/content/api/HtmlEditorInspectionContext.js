export default {
  "name": "HtmlEditorInspectionContext",
  "kind": "interface",
  "type": "HtmlEditorInspectionContext",
  "description": "Captured inspected elements and remembered text range, independent of DOM focus.\nBoth scopes coexist. Tree navigation changes the elements without widening the\ntext range. A gesture in the surface updates both from its model selection.\nCapture once when a field starts editing and retain it until commit/cancel.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspectionContext",
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
      "name": "nodeIds",
      "type": "readonly string[]",
      "description": "Inspected element IDs in document order; text selection is independently available.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    }
  ]
};
