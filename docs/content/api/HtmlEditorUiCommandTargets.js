export default {
  "name": "HtmlEditorUiCommandTargets",
  "kind": "type",
  "type": "any",
  "description": "Command-specific application units resolved from the captured intent.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandTargets",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "definition": "| { readonly kind: \"nodes\"; readonly nodeInfos: readonly HtmlEditorUiCommandNodeInfo[]; readonly complete?: boolean }\n    | { readonly kind: \"text\"; readonly ranges: readonly HtmlEditorSelectionRange[]; readonly complete?: boolean }"
};
