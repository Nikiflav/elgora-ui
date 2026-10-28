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
      "name": "stateVersion",
      "type": "number",
      "description": "Monotonic version for consumers that render snapshot-based field states.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspector.ts",
      "kind": "property"
    },
    {
      "name": "getCommandPreviewTargets",
      "type": "(commandId: string) => HtmlEditorUiCommandTargets | undefined",
      "description": "Resolves the same command-specific targets used by the inspector field.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspector.ts",
      "parameters": [
        {
          "name": "commandId",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "HtmlEditorUiCommandTargets | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(commandId: string) => HtmlEditorUiCommandTargets | undefined"
    },
    {
      "name": "refreshDocument",
      "type": "() => void",
      "description": "Rebuilds the node index after the shared command-surface coordinator observes a model change.",
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
      "name": "refreshSelection",
      "type": "() => void",
      "description": "Resolves the current remembered selection into inspector targets.",
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
      "name": "refreshSelectedNodes",
      "type": "(ids: readonly string[]) => void",
      "description": "Applies an explicit structural selection from the shared surface coordinator.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspector.ts",
      "parameters": [
        {
          "name": "ids",
          "type": "readonly string[]",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(ids: readonly string[]) => void"
    },
    {
      "name": "refreshLocalization",
      "type": "() => void",
      "description": "Rebuilds localized command fields while preserving disclosure state.",
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
