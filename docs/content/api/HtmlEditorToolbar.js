export default {
  "name": "HtmlEditorToolbar",
  "kind": "class",
  "type": "HtmlEditorToolbar",
  "description": "Compact command toolbar backed by the inspector's shared DataForm field renderer.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorToolbar",
  "source": "src/components/editors/htmleditor/HtmlEditorToolbar.ts",
  "members": [
    {
      "name": "setInspector",
      "type": "(inspector: HtmlEditorInspector) => void",
      "description": "Installs the shared inspector field form once the editor has created it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorToolbar.ts",
      "parameters": [
        {
          "name": "inspector",
          "type": "HtmlEditorInspector",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(inspector: HtmlEditorInspector) => void"
    },
    {
      "name": "update",
      "type": "() => void",
      "description": "Refreshes the shared field form and fallback commands without changing document focus.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorToolbar.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
