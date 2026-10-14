export default {
  "name": "CalendarOptions",
  "kind": "interface",
  "type": "CalendarOptions",
  "description": "Standalone date-only calendar options. Dates use strict YYYY-MM-DD strings.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Calendar",
  "path": "/api-reference/CalendarOptions",
  "source": "src/components/calendar/Calendar.ts",
  "members": [
    {
      "name": "value",
      "type": "string | null | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/calendar/Calendar.ts",
      "kind": "property"
    },
    {
      "name": "min",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/calendar/Calendar.ts",
      "kind": "property"
    },
    {
      "name": "max",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/calendar/Calendar.ts",
      "kind": "property"
    },
    {
      "name": "locale",
      "type": "string | undefined",
      "description": "Formatting locale; defaults to the browser language.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/calendar/Calendar.ts",
      "kind": "property"
    },
    {
      "name": "firstDayOfWeek",
      "type": "number | undefined",
      "description": "0 = Sunday, 1 = Monday, ... 6 = Saturday. Defaults to Monday.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/calendar/Calendar.ts",
      "kind": "property"
    },
    {
      "name": "today",
      "type": "string | undefined",
      "description": "Overrides the local current date, for reproducible demos or an application clock.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/calendar/Calendar.ts",
      "kind": "property"
    },
    {
      "name": "onSelect",
      "type": "((date: string, calendar: Calendar) => void) | undefined",
      "description": "Receives an explicit user selection, including choosing the already selected date.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/calendar/Calendar.ts",
      "kind": "property"
    }
  ]
};
