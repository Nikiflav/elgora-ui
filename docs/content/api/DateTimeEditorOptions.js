export default {
  "name": "DateTimeEditorOptions",
  "kind": "interface",
  "type": "DateTimeEditorOptions",
  "description": "Local date-time input and combined calendar/time picker configuration; values have no timezone suffix.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/DateTimeEditorOptions",
  "source": "src/components/editors/DateTimeEditor.ts",
  "members": [
    {
      "name": "dateFormat",
      "type": "string | undefined",
      "description": "DateFormatter pattern for the input's date portion. Defaults to yyyy-MM-dd.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateTimeEditor.ts",
      "kind": "property"
    },
    {
      "name": "timeFormat",
      "type": "\"HH:mm\" | \"HH:mm:ss\" | undefined",
      "description": "Strict 24-hour format for the time portion. Defaults to HH:mm.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateTimeEditor.ts",
      "kind": "property"
    },
    {
      "name": "firstDayOfWeek",
      "type": "number | undefined",
      "description": "First calendar weekday: 0 = Sunday through 6 = Saturday. Defaults to 1 (Monday).",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateTimeEditor.ts",
      "kind": "property"
    },
    {
      "name": "minuteStep",
      "type": "number | undefined",
      "description": "Time-picker slot interval in minutes, an integer divisor of 60. Defaults to 15.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateTimeEditor.ts",
      "kind": "property"
    },
    {
      "name": "defaultTime",
      "type": "string | undefined",
      "description": "Time used when selecting a date without an existing time. Defaults to 10:00.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateTimeEditor.ts",
      "kind": "property"
    }
  ]
};
