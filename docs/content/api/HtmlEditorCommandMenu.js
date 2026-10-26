export default {
  "name": "HtmlEditorCommandMenu",
  "kind": "class",
  "type": "HtmlEditorCommandMenu",
  "description": "Shared command-menu renderer used for the editor context menu and future menu surfaces.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorCommandMenu",
  "source": "src/components/editors/htmleditor/HtmlEditorCommandMenu.ts",
  "members": [
    {
      "name": "showAt",
      "type": "(x: number, y: number, context?: HtmlEditorCommandContext) => void",
      "description": "Shows the same filtered registry commands at a viewport point.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandMenu.ts",
      "parameters": [
        {
          "name": "x",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "y",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "HtmlEditorCommandContext",
          "optional": true,
          "defaultValue": "this.registry.context()",
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(x: number, y: number, context?: HtmlEditorCommandContext) => void"
    },
    {
      "name": "hide",
      "type": "() => void",
      "description": "Closes the menu without changing the editor selection or document.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandMenu.ts",
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
      "description": "Whether the menu is currently visible.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandMenu.ts",
      "kind": "property"
    }
  ]
};
