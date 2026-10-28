export default {
  "name": "HtmlEditorCommand",
  "kind": "type",
  "type": "any",
  "description": "Operations currently supported by the rich-text command layer.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorCommand",
  "source": "src/components/editors/htmleditor/HtmlEditorCommands.ts",
  "definition": "| { type: \"textStyle\"; property: \"color\" | \"background-color\" | \"font-size\"; value: string; nodeIds?: readonly string[] }\n    | { type: \"insertText\"; text: string }\n    | { type: \"insertHtml\"; html: string }\n    | { type: \"link\"; property: \"href\" | \"target\" | \"title\" | \"remove\"; value?: string }\n    | { type: \"link\"; property: \"update\"; href: string; target: string; title: string }\n    | { type: \"deleteBackward\" | \"deleteForward\" | \"insertParagraph\" | \"insertLineBreak\" | \"indent\" | \"outdent\" | \"bold\" | \"italic\" | \"underline\" | \"strikethrough\" | \"clearFormatting\" | \"undo\" | \"redo\" }"
};
