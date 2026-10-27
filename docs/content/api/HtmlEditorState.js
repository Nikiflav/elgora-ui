export default {
  "name": "HtmlEditorState",
  "kind": "interface",
  "type": "HtmlEditorState",
  "description": "A document and directed selection are committed/restored as one history entry.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorState",
  "source": "src/components/editors/htmleditor/HtmlEditorCommands.ts",
  "members": [
    {
      "name": "document",
      "type": "HtmlEditorDocument",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorCommands.ts",
      "kind": "property"
    },
    {
      "name": "selection",
      "type": "HtmlEditorSelectionState | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommands.ts",
      "kind": "property"
    },
    {
      "name": "marks",
      "type": "{ bold?: boolean; italic?: boolean; styles?: Partial<Record<\"color\" | \"background-color\" | \"font-size\", string>>; } | undefined",
      "description": "Explicit typing-format overrides at a collapsed caret.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommands.ts",
      "kind": "property"
    }
  ]
};
