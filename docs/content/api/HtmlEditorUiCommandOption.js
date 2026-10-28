export default {
  "name": "HtmlEditorUiCommandOption",
  "kind": "interface",
  "type": "HtmlEditorUiCommandOption",
  "description": "One compact lookup choice exposed by a UI command.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandOption",
  "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
  "members": [
    {
      "name": "id",
      "type": "string",
      "description": "Stable value used by the command; also suitable for persistence.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "text",
      "type": "string",
      "description": "Localized text shown in the lookup editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "icon",
      "type": "RemixIcon | undefined",
      "description": "Optional icon for menus and segmented choice buttons.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "color",
      "type": "string | undefined",
      "description": "Optional CSS color preview; empty string represents the default/inherited color.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "disabled",
      "type": "boolean | undefined",
      "description": "Retains the choice in the list while preventing it from being applied.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    }
  ]
};
