export default {
  "name": "DatePicker",
  "kind": "class",
  "type": "DatePicker",
  "description": "Compact date picker with day, month and year views, using standard UI utilities.\nSelection is independent of keyboard focus. No data source or save operation is involved.",
  "tags": [
    {
      "name": "example",
      "text": "new DatePicker({ value: \"2026-10-13\", onSelect: date => console.log(date) });"
    }
  ],
  "topics": [],
  "group": "components",
  "namespace": "Components.Date Picker",
  "path": "/api-reference/DatePicker",
  "source": "src/components/date-picker/DatePicker.ts",
  "members": [
    {
      "name": "selected",
      "type": "ObservableEvent<string>",
      "description": "User-selection notification; external setValue() never emits this event.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "locale",
      "type": "string",
      "description": "Resolved regional locale; explicit overrides are not affected by context changes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "string | null",
      "description": "Selected date or null. Keyboard browsing does not change this value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "month",
      "type": "string",
      "description": "Currently displayed month as YYYY-MM, even in month/year selection views.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/date-picker/DatePicker.ts",
      "kind": "property"
    },
    {
      "name": "setValue",
      "type": "(value: string | null) => void",
      "description": "Loads a date silently and shows its month; null clears selection and shows today.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/date-picker/DatePicker.ts",
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
      "name": "showMonth",
      "type": "(date: string) => void",
      "description": "Shows the month containing a valid date without selecting it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/date-picker/DatePicker.ts",
      "parameters": [
        {
          "name": "date",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(date: string) => void"
    },
    {
      "name": "focus",
      "type": "() => void",
      "description": "Moves native focus to the browsed day in the calendar.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/date-picker/DatePicker.ts",
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
