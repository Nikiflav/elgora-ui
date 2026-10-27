export default {
  "name": "HtmlEditorInspectionRow",
  "kind": "interface",
  "type": "HtmlEditorInspectionRow",
  "description": "Virtual DataForm row. Its fields describe editor operations rather than node\nmembers. A future DataFormAdapter reads each binding's state and submits through\nexecuteInspectorField; mutating this row must never mutate the HTML model.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspectionRow",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "members": [
    {
      "name": "context",
      "type": "HtmlEditorInspectionContext",
      "description": "Context pinned for the currently displayed form.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "fields",
      "type": "ReadonlyMap<string, HtmlEditorResolvedInspectorField>",
      "description": "Fields keyed by command ID; Mixed/Unset metadata stays outside editor values.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    }
  ]
};
