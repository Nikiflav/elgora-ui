export default {
  "name": "getHtmlEditorElementBehavior",
  "kind": "function",
  "type": "(node: Pick<HtmlEditorElement, \"tag\">) => Readonly<HtmlEditorElementBehavior>",
  "description": "Central built-in behavior registry. Unknown block elements retain their container boundary.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Editors",
  "path": "/api-reference/getHtmlEditorElementBehavior",
  "source": "src/components/editors/htmleditor/HtmlEditorStructure.ts",
  "parameters": [
    {
      "name": "node",
      "type": "Pick<HtmlEditorElement, \"tag\">",
      "optional": false,
      "description": ""
    }
  ],
  "returns": {
    "type": "Readonly<HtmlEditorElementBehavior>",
    "description": ""
  }
};
