export default {
  "name": "HtmlEditorPropertyControl",
  "kind": "type",
  "type": "any",
  "description": "The host presents the control; providers never own a popup or editor selection.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorPropertyControl",
  "source": "src/components/editors/htmleditor/HtmlEditorPropertyProvider.ts",
  "definition": "| { type: \"choices\"; options: readonly HtmlEditorPropertyOption[] }\n    | { type: \"palette\"; options: readonly HtmlEditorPropertyOption[] }\n    | { type: \"color\" }\n    | { type: \"length\"; units: readonly string[]; min?: number; max?: number }\n    | { type: \"text\" }"
};
