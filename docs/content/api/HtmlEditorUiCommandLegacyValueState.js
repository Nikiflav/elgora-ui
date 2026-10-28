export default {
  "name": "HtmlEditorUiCommandLegacyValueState",
  "kind": "interface",
  "type": "HtmlEditorUiCommandLegacyValueState",
  "description": "Legacy string lookup state retained by the command-level convenience API.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorUiCommandLegacyValueState",
  "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
  "members": [
    {
      "name": "value",
      "type": "string | undefined",
      "description": "Current option ID, or undefined when the current value has no matching option.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    },
    {
      "name": "mixed",
      "type": "boolean | undefined",
      "description": "Whether compatible targets disagree; never persist this marker as an HTML value.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorCommandRegistry.ts",
      "kind": "property"
    }
  ]
};
