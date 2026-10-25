export default {
  "name": "getHtmlEditorStyle",
  "kind": "function",
  "type": "(styles: readonly HtmlEditorStyle[], name: string) => HtmlEditorStyle | undefined",
  "description": "Looks up an explicitly authored property, respecting priority. Does not resolve shorthands or computed CSS.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/getHtmlEditorStyle",
  "source": "src/components/editors/htmleditor/HtmlEditorStyles.ts",
  "parameters": [
    {
      "name": "styles",
      "type": "readonly HtmlEditorStyle[]",
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
    "type": "HtmlEditorStyle | undefined",
    "description": ""
  }
};
