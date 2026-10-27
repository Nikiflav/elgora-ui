export default {
  "name": "HtmlEditorInspectorField",
  "kind": "type",
  "type": "any",
  "description": "Optional Basic-tab declaration on a shared command. Register role-based commands\nsuch as text.color or block.align; keep these declarations out of node instances.\nA data contribution becomes a DataForm value field; a buttons contribution becomes\nan action using the command's label/icon/state. Execution always stays in the registry.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorInspectorField",
  "source": "src/components/editors/htmleditor/HtmlEditorInspection.ts",
  "definition": "HtmlEditorInspectorFieldBase & (\n    | {\n        /** Value control; values are read from all resolved targets. */\n        readonly type: \"data\";\n        /** Pure aggregate read, using the same target scope that execute receives. */\n        getValue(context: HtmlEditorInspectorCommandContext): HtmlEditorInspectorValueState;\n    }\n    | {\n        /** Action control, e.g. Bold/Italic; active/mixed state uses command.getState. */\n        readonly type: \"buttons\";\n    }\n)"
};
