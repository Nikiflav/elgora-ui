export default {
  "name": "HtmlEditorInspector",
  "kind": "class",
  "type": "HtmlEditorInspector",
  "description": "Inspector scaffold owned by HtmlEditor. Targets are previews, not structural editor selections.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspector",
  "source": "src/components/editors/htmleditor/HtmlEditorInspector.ts",
  "members": [
    {
      "name": "inspectedElements",
      "type": "readonly string[]",
      "description": "Current property targets, derived from the remembered editor selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspector.ts",
      "kind": "property"
    },
    {
      "name": "update",
      "type": "() => void",
      "description": "Updates labels/availability without cloning the document or moving DOM focus.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspector.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "openElements",
      "type": "() => Promise<void>",
      "description": "Opens a lazy model tree. Choosing a node previews it without changing caret, HTML or history.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspector.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<void>"
    }
  ]
};
