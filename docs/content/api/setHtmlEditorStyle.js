export default {
  "name": "setHtmlEditorStyle",
  "kind": "function",
  "type": "(styles: HtmlEditorStyle[], name: string, value: string, important?: boolean) => HtmlEditorStyle[]",
  "description": "Replaces declarations of one property and appends the new declaration. Other shorthand/longhand declarations retain their order.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/setHtmlEditorStyle",
  "source": "src/components/editors/htmleditor/HtmlEditorStyles.ts",
  "parameters": [
    {
      "name": "styles",
      "type": "HtmlEditorStyle[]",
      "optional": false,
      "description": ""
    },
    {
      "name": "name",
      "type": "string",
      "optional": false,
      "description": ""
    },
    {
      "name": "value",
      "type": "string",
      "optional": false,
      "description": ""
    },
    {
      "name": "important",
      "type": "boolean",
      "optional": true,
      "defaultValue": "false",
      "description": ""
    }
  ],
  "returns": {
    "type": "HtmlEditorStyle[]",
    "description": ""
  }
};
