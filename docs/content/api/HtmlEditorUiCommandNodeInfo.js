export default {
  "name": "HtmlEditorUiCommandNodeInfo",
  "kind": "interface",
  "type": "HtmlEditorUiCommandNodeInfo",
  "description": "Read-only metadata for an inspected model node. The model remains the source of truth.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandNodeInfo",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "members": [
    {
      "name": "id",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "parentId",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "pathIds",
      "type": "readonly string[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "nodeType",
      "type": "\"text\" | \"element\"",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "role",
      "type": "\"container\" | \"grid\" | \"table\" | \"text\" | \"block\" | \"inline\" | \"inlineBlock\" | \"atomic\" | \"tableRow\" | \"tableCell\" | \"gridItem\" | \"list\" | \"listItem\"",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "tag",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    }
  ]
};
