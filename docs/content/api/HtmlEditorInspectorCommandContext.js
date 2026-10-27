export default {
  "name": "HtmlEditorInspectorCommandContext",
  "kind": "interface",
  "type": "HtmlEditorInspectorCommandContext",
  "description": "Command context after target resolution; shared by all entry points into an inspector command.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspectorCommandContext",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "members": [
    {
      "name": "inspection",
      "type": "HtmlEditorResolvedInspection",
      "description": "Captured targets; command handlers must use these rather than the current browser selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    }
  ]
};
