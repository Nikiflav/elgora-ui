export default {
  "name": "HtmlEditorInspectorValueState",
  "kind": "type",
  "type": "any",
  "description": "Aggregated authored value of a property. Unset means every target uses its default;\nMixed means targets disagree. Neither state is a value to persist into HTML.\nA concrete value outside a lookup's options remains a value, not Unset.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspectorValueState",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "definition": "| { readonly kind: \"value\"; readonly value: HtmlEditorInspectorValue }\n    | { readonly kind: \"unset\" }\n    | { readonly kind: \"mixed\" }"
};
