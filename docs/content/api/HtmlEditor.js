export default {
  "name": "HtmlEditor",
  "kind": "class",
  "type": "HtmlEditor",
  "description": "Rich-text editing through model commands, with scoped reconciliation for IME and noncancelable input.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditor",
  "source": "src/components/editors/htmleditor/HtmlEditor.ts",
  "members": [
    {
      "name": "content",
      "type": "HTMLDivElement",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "selectionChanged",
      "type": "ObservableEvent<HtmlEditorSelectionState | undefined>",
      "description": "A detached snapshot is emitted when the editor's remembered selection changes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "document",
      "type": "HtmlEditorDocument",
      "description": "Detached snapshot; mutating it does not modify the editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "selection",
      "type": "HtmlEditorSelectionState | undefined",
      "description": "Last selection inside this editor, retained while focus moves to a toolbar or inspector.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "nativeSelection",
      "type": "Selection | null",
      "description": "Live browser selection, only when both endpoints belong to this editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "restoreSelection",
      "type": "(state?: HtmlEditorSelectionState | undefined) => boolean",
      "description": "Restores a saved selection. Returns false for removed nodes or a replaced document.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "parameters": [
        {
          "name": "state",
          "type": "HtmlEditorSelectionState | undefined",
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
      "signature": "(state?: HtmlEditorSelectionState | undefined) => boolean"
    },
    {
      "name": "html",
      "type": "string",
      "description": "HTML suitable for persistence under the parser's supported-content policy.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "resolveText",
      "type": "(text: string) => string | Promise<string>",
      "description": "Converts text into a typed value, or throws/rejects when it cannot be resolved.\nDoes not modify draft, error, busy or confirmation state, invoke validation,\nemit events or save. Hosts can use this independently for clipboard paste.",
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
      "name": "setHtml",
      "type": "(html: string) => void",
      "description": "Replaces the document and its accepted baseline.",
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
      "name": "getHtml",
      "type": "() => string",
      "description": "",
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
      "name": "commit",
      "type": "() => Promise<boolean>",
      "description": "Confirmation waits for the host to retry after native composition has finished.",
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
      "description": "Restores the last accepted value. Returns false while confirmation is running.",
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
    },
    {
      "name": "execute",
      "type": "(command: HtmlEditorCommand, selection?: HtmlEditorSelectionState | undefined) => boolean",
      "description": "Applies a supported operation to the model and selection in one undoable transaction.",
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
          "type": "HtmlEditorSelectionState | undefined",
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
      "signature": "(command: HtmlEditorCommand, selection?: HtmlEditorSelectionState | undefined) => boolean"
    },
    {
      "name": "canUndo",
      "type": "boolean",
      "description": "Whether the current document scope has an operation to undo.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "canRedo",
      "type": "boolean",
      "description": "Whether the last undone operation can be reapplied.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    }
  ]
};
