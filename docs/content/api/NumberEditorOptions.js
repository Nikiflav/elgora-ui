export default {
  "name": "NumberEditorOptions",
  "kind": "interface",
  "type": "NumberEditorOptions",
  "description": "Configuration for the numeric editor's keyboard stepping behavior.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/NumberEditorOptions",
  "source": "src/components/editors/ValueEditor.ts",
  "members": [
    {
      "name": "step",
      "type": "number | undefined",
      "description": "Amount added or subtracted by ArrowUp/ArrowDown. Defaults to 1.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "min",
      "type": "number | undefined",
      "description": "Lower bound used by keyboard stepping.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    },
    {
      "name": "max",
      "type": "number | undefined",
      "description": "Upper bound used by keyboard stepping.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/ValueEditor.ts",
      "kind": "property"
    }
  ]
};
