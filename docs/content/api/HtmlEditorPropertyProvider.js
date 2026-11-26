export default {
  "name": "HtmlEditorPropertyProvider",
  "kind": "interface",
  "type": "HtmlEditorPropertyProvider",
  "description": "Operates only on an editable model copy inside an editor transaction.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorPropertyProvider",
  "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
  "members": [
    {
      "name": "id",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
      "kind": "property"
    },
    {
      "name": "text",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
      "kind": "property"
    },
    {
      "name": "control",
      "type": "HtmlEditorPropertyControl",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
      "kind": "property"
    },
    {
      "name": "read",
      "type": "(element: HtmlEditorElement) => string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
      "parameters": [
        {
          "name": "element",
          "type": "HtmlEditorElement",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(element: HtmlEditorElement) => string | undefined"
    },
    {
      "name": "accepts",
      "type": "(value: string) => boolean",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
      "parameters": [
        {
          "name": "value",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: string) => boolean"
    },
    {
      "name": "apply",
      "type": "(element: HtmlEditorElement, value: string) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
      "parameters": [
        {
          "name": "element",
          "type": "HtmlEditorElement",
          "optional": false,
          "description": ""
        },
        {
          "name": "value",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(element: HtmlEditorElement, value: string) => void"
    },
    {
      "name": "clear",
      "type": "(element: HtmlEditorElement) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
      "parameters": [
        {
          "name": "element",
          "type": "HtmlEditorElement",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(element: HtmlEditorElement) => void"
    }
  ]
};
