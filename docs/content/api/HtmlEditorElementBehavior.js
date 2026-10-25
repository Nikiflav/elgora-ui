export default {
  "name": "HtmlEditorElementBehavior",
  "kind": "interface",
  "type": "HtmlEditorElementBehavior",
  "description": "Rules shared by keyboard commands, range replacement and structural navigation.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/HtmlEditorElementBehavior",
  "source": "src/components/editors/htmleditor/HtmlEditorStructure.ts",
  "members": [
    {
      "name": "kind",
      "type": "HtmlEditorElementKind",
      "description": "Determines legal child boundaries and whether text can be edited directly.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/htmleditor/HtmlEditorStructure.ts",
      "kind": "property"
    },
    {
      "name": "splitTag",
      "type": "string | undefined",
      "description": "Tag produced by splitting a text block. Omit to retain the original tag.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorStructure.ts",
      "kind": "property"
    },
    {
      "name": "boundary",
      "type": "true | undefined",
      "description": "Collapsed Backspace/Delete cannot merge this area's outer edge with a sibling.\nExplicit range deletion still follows coverage and may remove the whole element.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/htmleditor/HtmlEditorStructure.ts",
      "kind": "property"
    }
  ]
};
