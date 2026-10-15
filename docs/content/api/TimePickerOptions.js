export default {
  "name": "TimePickerOptions",
  "kind": "interface",
  "type": "TimePickerOptions",
  "description": "",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Time Picker",
  "path": "/api-reference/TimePickerOptions",
  "source": "src/components/time-picker/TimePicker.ts",
  "members": [
    {
      "name": "value",
      "type": "string | null | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "timeFormat",
      "type": "\"HH:mm\" | \"HH:mm:ss\" | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "minuteStep",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "defaultTime",
      "type": "string | undefined",
      "description": "Time used for initial focus when no value has been selected. Defaults to 10:00.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "maxHeight",
      "type": "string | undefined",
      "description": "Maximum height of the scrollable slot list. Defaults to 240px.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "onSelect",
      "type": "((value: string, picker: TimePicker) => void) | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    }
  ]
};
