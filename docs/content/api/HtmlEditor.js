export default {
  "name": "HtmlEditor",
  "kind": "class",
  "type": "HtmlEditor",
  "description": "Orchestrates one editing surface and optional tools; owns the sole commit/cancel lifecycle.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditor",
  "source": "src/components/editors/htmleditor/HtmlEditor.ts",
  "members": [
    {
      "name": "surface",
      "type": "HtmlEditorSurface",
      "description": "Sole owner of the editable model, DOM mapping, text selection and history.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "content",
      "type": "HTMLDivElement",
      "description": "Native editing area, retained for compatibility with the compact editor API.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "selectionChanged",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").ObservableEvent<HtmlEditorSelectionRange | undefined>",
      "description": "Same event as surface.selectionChanged; no second selection state is maintained.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "toolbar",
      "type": "HtmlEditorToolbar | undefined",
      "description": "Owned toolbar, present only when enabled at construction.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "inspector",
      "type": "HtmlEditorInspector | undefined",
      "description": "Owned inspector scaffold, present only when enabled at construction.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "commandRegistry",
      "type": "HtmlEditorCommandRegistry",
      "description": "Shared command source consumed by all optional editor tools.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "document",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").HtmlEditorDocument",
      "description": "Detached model snapshot; use commands rather than mutating it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "selection",
      "type": "HtmlEditorSelectionRange | undefined",
      "description": "Remembered text selection, retained while surrounding controls have focus.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "nativeSelection",
      "type": "Selection | null",
      "description": "Live selection only when both endpoints belong to the surface.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "restoreSelection",
      "type": "(state?: HtmlEditorSelectionRange | undefined) => boolean",
      "description": "Restores a valid runtime text bookmark and focuses the surface.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [
        {
          "name": "state",
          "type": "HtmlEditorSelectionRange | undefined",
          "optional": true,
          "defaultValue": "this.selection",
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(state?: HtmlEditorSelectionRange | undefined) => boolean"
    },
    {
      "name": "html",
      "type": "string",
      "description": "Current serialized HTML, excluding surrounding editor UI.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "getHtml",
      "type": "() => string",
      "description": "Returns the current serialized draft.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "() => string"
    },
    {
      "name": "setHtml",
      "type": "(html: string) => void",
      "description": "Replaces content and establishes a new accepted baseline.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [
        {
          "name": "html",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(html: string) => void"
    },
    {
      "name": "resolveText",
      "type": "(text: string) => string | Promise<string>",
      "description": "Resolves external text without editing or saving.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string | Promise<string>",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => string | Promise<string>"
    },
    {
      "name": "execute",
      "type": "(command: HtmlEditorCommand, selection?: HtmlEditorSelectionRange | undefined) => boolean",
      "description": "Applies a command to the surface's single model/history.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [
        {
          "name": "command",
          "type": "HtmlEditorCommand",
          "optional": false,
          "description": ""
        },
        {
          "name": "selection",
          "type": "HtmlEditorSelectionRange | undefined",
          "optional": true,
          "defaultValue": "this.selection",
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(command: HtmlEditorCommand, selection?: HtmlEditorSelectionRange | undefined) => boolean"
    },
    {
      "name": "canUndo",
      "type": "boolean",
      "description": "Whether an operation can be undone in this document scope.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "canRedo",
      "type": "boolean",
      "description": "Whether an undone operation can be reapplied.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "commit",
      "type": "() => Promise<boolean>",
      "description": "Waits for composition/native reconciliation to settle before external acceptance.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "cancel",
      "type": "() => boolean",
      "description": "Restores the accepted value unless native composition is still active.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    }
  ]
};
