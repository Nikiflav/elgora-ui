export default {
  "name": "HtmlEditorCommandContext",
  "kind": "interface",
  "type": "HtmlEditorCommandContext",
  "description": "Context supplied to every HTML editor command surface.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorCommandContext",
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
      "description": "The inspector node currently under the command surface, when applicable.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "selection",
      "type": "HtmlEditorSelectionState | undefined",
      "description": "The remembered text selection at the time the command was requested.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    }
  ]
};
