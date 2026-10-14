export default {
  "name": "DateEditorOptions",
  "kind": "interface",
  "type": "DateEditorOptions",
  "description": "Date-only text editing with an optional calendar popup. Values are YYYY-MM-DD or null.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/DateEditorOptions",
  "source": "src/components/editors/DateEditor.ts",
  "members": [
    {
      "name": "min",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateEditor.ts",
      "kind": "property"
    },
    {
      "name": "max",
      "type": "string | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateEditor.ts",
      "kind": "property"
    },
    {
      "name": "locale",
      "type": "string | undefined",
      "description": "Controls calendar labels and the locale-dependent standard dateFormat \"d\".",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateEditor.ts",
      "kind": "property"
    },
    {
      "name": "dateFormat",
      "type": "string | undefined",
      "description": "Display and input pattern; defaults to yyyy-MM-dd. Custom converters override their respective direction.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateEditor.ts",
      "kind": "property"
    },
    {
      "name": "firstDayOfWeek",
      "type": "number | undefined",
      "description": "Calendar first weekday, 0 = Sunday through 6 = Saturday; defaults to Monday.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateEditor.ts",
      "kind": "property"
    },
    {
      "name": "today",
      "type": "string | undefined",
      "description": "Optional application-local current date, forwarded to Calendar.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/DateEditor.ts",
      "kind": "property"
    }
  ]
};
