export default {
  "name": "HtmlEditorSurfaceOptions",
  "kind": "interface",
  "type": "HtmlEditorSurfaceOptions",
  "description": "Options for the standalone model-backed editing surface, without saving or surrounding tools.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorSurfaceOptions",
  "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
  "members": [
    {
      "name": "html",
      "type": "string",
      "description": "Initial HTML, parsed through the supported-content policy.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "label",
      "type": "string | undefined",
      "description": "Accessible name of the editing area.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "placeholder",
      "type": "string | undefined",
      "description": "Hint shown for empty content.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "minHeight",
      "type": "string | number | undefined",
      "description": "Minimum editing-area height, in pixels or a CSS length.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "readOnly",
      "type": "boolean | undefined",
      "description": "Prevents edits while allowing selection and copying.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    },
    {
      "name": "disabled",
      "type": "boolean | undefined",
      "description": "Prevents user edits while the host is disabled or busy.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorSurface.ts",
      "kind": "property"
    }
  ]
};
