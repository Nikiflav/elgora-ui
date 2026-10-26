export default {
  "name": "HtmlEditorUiCommand",
  "kind": "interface",
  "type": "HtmlEditorUiCommand",
  "description": "A command exposed by a toolbar, context menu, or node action overlay.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommand",
  "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
  "members": [
    {
      "name": "id",
      "type": "string",
      "description": "Stable application-facing command identifier.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "label",
      "type": "string",
      "description": "Localization key or literal label resolved by the registry.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "icon",
      "type": "string | undefined",
      "description": "Optional Remix Icon class.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "isVisible",
      "type": "((context: HtmlEditorCommandContext) => boolean) | undefined",
      "description": "Whether the command belongs in the current surface.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "isEnabled",
      "type": "((context: HtmlEditorCommandContext) => boolean) | undefined",
      "description": "Whether the command can currently be executed.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "getState",
      "type": "((context: HtmlEditorCommandContext) => HtmlEditorMarkState) | undefined",
      "description": "Aggregate visual state, independent from whether the command is executable.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "execute",
      "type": "(context: HtmlEditorCommandContext) => boolean | void",
      "description": "Executes the command against the shared editor context.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    }
  ]
};
