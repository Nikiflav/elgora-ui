export default {
  "name": "TimePickerOptions",
  "kind": "interface",
  "type": "TimePickerOptions",
  "description": "Time-slot list configuration using strict 24-hour strings without timezone conversion.",
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
      "description": "Initially selected time matching timeFormat; null or omission means no selection.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "timeFormat",
      "type": "\"HH:mm\" | \"HH:mm:ss\" | undefined",
      "description": "Slot label and value format. Defaults to HH:mm; second-bearing slots use :00 seconds.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    },
    {
      "name": "minuteStep",
      "type": "number | undefined",
      "description": "Minutes between slots; an integer divisor of 60 from 1 to 60. Defaults to 15.",
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
      "description": "Receives explicit user selections; programmatic setValue does not invoke it.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/time-picker/TimePicker.ts",
      "kind": "property"
    }
  ]
};
