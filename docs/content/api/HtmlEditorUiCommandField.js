export default {
  "name": "HtmlEditorUiCommandField",
  "kind": "type",
  "type": "any",
  "description": "A value field or action field contributed by a UI command.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandField",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "definition": "HtmlEditorUiCommandFieldBase & (\n    | {\n        readonly type: \"data\";\n        getValue(context: HtmlEditorUiCommandExecutionContext): HtmlEditorUiCommandValueState;\n    }\n    | {\n        readonly type: \"buttons\";\n    }\n)"
};
