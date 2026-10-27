export default {
  "name": "HtmlEditorInspectorFieldPresentation",
  "kind": "type",
  "type": "any",
  "description": "Existing DataViewField presentation reused by the inspector. The command ID\nsupplies name; the adapter owns reads and Mixed labels. Lookup uses the shared\nfield.lookup contract, so no second editor-type or allowed-values system exists.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspectorFieldPresentation",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "definition": "Omit<DataViewField<HtmlEditorInspectionRow>,\n    \"name\" | \"type\" | \"buttons\" | \"getValue\" | \"getText\" | \"showInRow\">"
};
