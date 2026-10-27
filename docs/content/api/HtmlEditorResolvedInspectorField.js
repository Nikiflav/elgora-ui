export default {
  "name": "HtmlEditorResolvedInspectorField",
  "kind": "interface",
  "type": "HtmlEditorResolvedInspectorField",
  "description": "One resolved field, identified by command.id. Reuse this binding during a field\nedit; refreshing the form creates new bindings only after that edit has settled.\nThe declaration's group/order are presentation metadata, never HTML properties.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorResolvedInspectorField",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "members": [
    {
      "name": "command",
      "type": "HtmlEditorUiCommand",
      "description": "Registered command; also the canonical identity of this inspector field.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "definition",
      "type": "HtmlEditorInspectorField",
      "description": "UI declaration that supplied the field and its target resolver.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "context",
      "type": "HtmlEditorInspectorCommandContext",
      "description": "Captured, command-specific target scope.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "HtmlEditorInspectorValueState | undefined",
      "description": "Aggregate value for data fields; absent for action fields.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    },
    {
      "name": "enabled",
      "type": "boolean",
      "description": "Availability at resolution time. Execution rechecks permissions before applying a change.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
      "kind": "property"
    }
  ]
};
