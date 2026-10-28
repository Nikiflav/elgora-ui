export default {
  "name": "HtmlEditorUiCommandContext",
  "kind": "interface",
  "type": "HtmlEditorUiCommandContext",
  "description": "Context supplied to every HTML editor command surface.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandContext",
  "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
  "members": [
    {
      "name": "surface",
      "type": "HtmlEditorSurface",
      "description": "The authoritative model-backed editing surface.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "targetId",
      "type": "string | undefined",
      "description": "The node currently under the command surface, when applicable.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "selection",
      "type": "HtmlEditorSelectionRange | undefined",
      "description": "The remembered text selection at the time the command was requested.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "resolution",
      "type": "HtmlEditorUiCommandResolution | undefined",
      "description": "Resolved property scope, when invoked through a command field surface.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    }
  ]
};
