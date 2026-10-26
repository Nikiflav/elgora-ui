export default {
  "name": "HtmlEditorSurface",
  "kind": "class",
  "type": "HtmlEditorSurface",
  "description": "Owns contenteditable, model, selection, input handling and history; never commits or cancels values.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorSurface",
  "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
  "members": [
    {
      "name": "content",
      "type": "HTMLDivElement",
      "description": "Native editing area; identical to this component's dom.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "input",
      "type": "ObservableEvent<void>",
      "description": "User document changes only; selection and baseline replacement do not emit input.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "documentChanged",
      "type": "ObservableEvent<void>",
      "description": "Document/history replacement or editing; lets views refresh without treating replacement as user input.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "interactionChanged",
      "type": "ObservableEvent<void>",
      "description": "Interaction/composition availability changed, without a document edit.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "selectionChanged",
      "type": "ObservableEvent<HtmlEditorSelectionState | undefined>",
      "description": "Detached remembered text selection, retained while surrounding controls have focus.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "document",
      "type": "HtmlEditorDocument",
      "description": "Detached snapshot; mutating it does not modify the editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "getSelectionCoverage",
      "type": "(selection?: HtmlEditorSelectionState | undefined) => ReadonlyMap<string, HtmlEditorNodeCoverage>",
      "description": "Detached node coverage for a range, sharing Copy/Delete rules without cloning the document.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "parameters": [
        {
          "name": "selection",
          "type": "HtmlEditorSelectionState | undefined",
          "optional": true,
          "defaultValue": "this.selection",
          "description": ""
        }
      ],
      "returns": {
        "type": "ReadonlyMap<string, HtmlEditorNodeCoverage>",
        "description": ""
      },
      "kind": "method",
      "signature": "(selection?: HtmlEditorSelectionState | undefined) => ReadonlyMap<string, HtmlEditorNodeCoverage>"
    },
    {
      "name": "getMarkState",
      "type": "(mark: \"bold\" | \"italic\", selection?: HtmlEditorSelectionState | undefined) => HtmlEditorMarkState",
      "description": "Returns the aggregate Bold/Italic state for the current selected fragments.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "parameters": [
        {
          "name": "mark",
          "type": "\"bold\" | \"italic\"",
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
        "type": "HtmlEditorMarkState",
        "description": ""
      },
      "kind": "method",
      "signature": "(mark: \"bold\" | \"italic\", selection?: HtmlEditorSelectionState | undefined) => HtmlEditorMarkState"
    },
    {
      "name": "selectNode",
      "type": "(nodeId: string | undefined) => boolean",
      "description": "Selects a complete model node while retaining the same model/history contract as text selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "parameters": [
        {
          "name": "nodeId",
          "type": "string | undefined",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(nodeId: string | undefined) => boolean"
    },
    {
      "name": "selection",
      "type": "HtmlEditorSelectionState | undefined",
      "description": "Last selection inside this editor, retained while focus moves to a toolbar or inspector.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "nativeSelection",
      "type": "Selection | null",
      "description": "Live browser selection, only when both endpoints belong to this editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "restoreSelection",
      "type": "(state?: HtmlEditorSelectionState | undefined) => boolean",
      "description": "Restores a saved selection. Returns false for removed nodes or a replaced document.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
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
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "settled",
      "type": "boolean",
      "description": "True when native composition/reconciliation has finished and a host may accept or replace content.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "editable",
      "type": "boolean",
      "description": "Whether commands may edit the document now, including composition and host interaction state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "getHtml",
      "type": "() => string",
      "description": "Returns serialized draft HTML.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "parameters": [],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "() => string"
    },
    {
      "name": "execute",
      "type": "(command: HtmlEditorCommand, selection?: HtmlEditorSelectionState | undefined) => boolean",
      "description": "Applies a supported operation to the model and selection in one undoable transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
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
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "canRedo",
      "type": "boolean",
      "description": "Whether the last undone operation can be reapplied.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "setHtml",
      "type": "(html: string) => void",
      "description": "Replaces content and resets history/runtime bookmarks without emitting user input.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
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
      "name": "setInteractionState",
      "type": "(readOnly: boolean, disabled: boolean) => void",
      "description": "Updates host permissions without replacing content, selection or history.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "parameters": [
        {
          "name": "readOnly",
          "type": "boolean",
          "optional": false,
          "description": ""
        },
        {
          "name": "disabled",
          "type": "boolean",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(readOnly: boolean, disabled: boolean) => void"
    }
  ]
};
