export default {
  "name": "HtmlEditorInspectorTargets",
  "kind": "type",
  "type": "any",
  "description": "Command-specific application units. A resolver maps a selection to eligible\ntext fragments or element owners (e.g. paragraphs for alignment), deduplicates\nthem, and excludes structural shells that the command cannot safely change.\nAn empty list makes the field inapplicable. Resolve once and use the same units\nfor state, permissions and execution; never widen a range inside a UI adapter.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspectorTargets",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "definition": "| { readonly kind: \"elements\"; readonly nodeIds: readonly HtmlEditorNodeId[] }\n    | { readonly kind: \"text\"; readonly ranges: readonly HtmlEditorSelectionState[] }"
};
