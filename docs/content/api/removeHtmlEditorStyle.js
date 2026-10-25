export default {
  "name": "removeHtmlEditorStyle",
  "kind": "function",
  "type": "(styles: HtmlEditorStyle[], name: string) => HtmlEditorStyle[]",
  "description": "Removes only declarations with this exact name, returning the original array when unchanged.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/removeHtmlEditorStyle",
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
    }
  ],
  "returns": {
    "type": "HtmlEditorStyle[]",
    "description": ""
  }
};
