export default {
  "name": "DatePickerOptions",
  "kind": "interface",
  "type": "DatePickerOptions",
  "description": "Standalone date-picker options. Dates use strict YYYY-MM-DD strings.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Date Picker",
  "path": "/api-reference/DatePickerOptions",
  "source": "src/components/date-picker/DatePicker.ts",
  "members": [
    {
      "name": "value",
      "type": "string | null | undefined",
      "description": "Initially selected date, or null for no selection. Does not emit onSelect during construction.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "min",
      "type": "string | undefined",
      "description": "Inclusive earliest selectable date in YYYY-MM-DD form.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "max",
      "type": "string | undefined",
      "description": "Inclusive latest selectable date in YYYY-MM-DD form.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "firstDayOfWeek",
      "type": "number | undefined",
      "description": "0 = Sunday, 1 = Monday, ... 6 = Saturday. Defaults to Monday.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "today",
      "type": "string | undefined",
      "description": "Overrides the local current date, for reproducible demos or an application clock.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "onSelect",
      "type": "((date: string, datePicker: DatePicker) => void) | undefined",
      "description": "Receives an explicit user selection, including choosing the already selected date.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    }
  ]
};
