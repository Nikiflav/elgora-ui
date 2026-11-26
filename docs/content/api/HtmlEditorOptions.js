export default {
  "name": "HtmlEditorOptions",
  "kind": "interface",
  "type": "HtmlEditorOptions",
  "description": "Configuration for the HTML value editor and its optional surrounding tools.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorOptions",
  "source": "src/components/editors/htmleditor/HtmlEditor.ts",
  "members": [
    {
      "name": "placeholder",
      "type": "string | undefined",
      "description": "Empty document hint.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "minHeight",
      "type": "string | number | undefined",
      "description": "Minimum editing-area height in pixels or a CSS length.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "toolbar",
      "type": "boolean | undefined",
      "description": "Creates the built-in command toolbar. Defaults to false.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "inspector",
      "type": "boolean | undefined",
      "description": "Creates the right-side inspector scaffold. Defaults to false.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "commands",
      "type": "HtmlEditorUiCommand[] | undefined",
      "description": "Additional commands exposed by the toolbar, context menu and inspector actions.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "classOptions",
      "type": "readonly { name: string; text: string; }[] | undefined",
      "description": "Suggested CSS classes for the Advanced inspector.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "allowCustomClasses",
      "type": "boolean | undefined",
      "description": "Allows entering classes outside classOptions. Defaults to true.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    },
    {
      "name": "properties",
      "type": "readonly HtmlEditorPropertyDefinition[] | undefined",
      "description": "Optional providers for semantic properties such as text.color and text.size.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditor.ts",
      "kind": "property"
    }
  ]
};
