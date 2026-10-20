export default {
  "name": "TimeEditorOptions",
  "kind": "interface",
  "type": "TimeEditorOptions",
  "description": "Time text editing and optional slot-picker configuration; values use HH:mm or HH:mm:ss.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/TimeEditorOptions",
  "source": "src/components/editors/TimeEditor.ts",
  "members": [
    {
      "name": "timeFormat",
      "type": "\"HH:mm\" | \"HH:mm:ss\" | undefined",
      "description": "Strict 24-hour input and picker format. Defaults to HH:mm.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/TimeEditor.ts",
      "kind": "property"
    },
    {
      "name": "minuteStep",
      "type": "number | undefined",
      "description": "Picker slot interval in minutes; must divide 60 evenly. Defaults to 15. Does not restrict typed minutes.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/TimeEditor.ts",
      "kind": "property"
    },
    {
      "name": "defaultTime",
      "type": "string | undefined",
      "description": "Picker's initial focus time when the value is empty. Defaults to 10:00; does not prefill the editor.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/TimeEditor.ts",
      "kind": "property"
    }
  ]
};
