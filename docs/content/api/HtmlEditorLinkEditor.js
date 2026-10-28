export default {
  "name": "HtmlEditorLinkEditor",
  "kind": "class",
  "type": "HtmlEditorLinkEditor",
  "description": "Compact link editor popover used when the toolbar has no inspector to reveal.\r\nIt reuses the same registry commands as the inspector so URL policy, target\r\noptions, aggregate values and editing behavior never diverge between views.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorLinkEditor",
  "source": "src/components/editors/htmleditor/HtmlEditorLinkEditor.ts",
  "members": [
    {
      "name": "show",
      "type": "(anchor: HTMLElement, context: HtmlEditorCommandContext) => void",
      "description": "Opens the editor anchored at a toolbar button for the given command context.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorLinkEditor.ts",
      "parameters": [
        {
          "name": "anchor",
          "type": "HTMLElement",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "HtmlEditorCommandContext",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(anchor: HTMLElement, context: HtmlEditorCommandContext) => void"
    },
    {
      "name": "hide",
      "type": "() => void",
      "description": "Closes the editor without committing or changing the selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorLinkEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "isOpen",
      "type": "boolean",
      "description": "Whether the editor popover is currently visible.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorLinkEditor.ts",
      "kind": "property"
    }
  ]
};
