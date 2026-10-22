export default {
  "name": "TimePicker",
  "kind": "class",
  "type": "TimePicker",
  "description": "Compact button-based time picker for mouse and touch input.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.Time Picker",
  "path": "/api-reference/TimePicker",
  "source": "src/components/time-picker/TimePicker.ts",
  "members": [
    {
      "name": "locale",
      "type": "string",
      "description": "Inherited regional context. Slot values/labels remain explicitly configured HH:mm[:ss] strings.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "string | null",
      "description": "Current selected canonical time, or null when unselected.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "setValue",
      "type": "(value: string | null) => void",
      "description": "Validates and updates selection without invoking onSelect.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/time-picker/TimePicker.ts",
      "parameters": [
        {
          "name": "value",
          "type": "string | null",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: string | null) => void"
    },
    {
      "name": "focus",
      "type": "() => void",
      "description": "Focuses the selected/default time slot, falling back to the first slot when no exact match exists.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/time-picker/TimePicker.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
