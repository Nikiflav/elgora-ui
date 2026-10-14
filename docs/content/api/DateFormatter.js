export default {
  "name": "DateFormatter",
  "kind": "class",
  "type": "DateFormatter",
  "description": "Date-only formatting/parsing for ISO YYYY-MM-DD values, without timezone conversion.\nSupports d, dd, M, MM, yyyy and non-alphanumeric separators. Standard format \"d\"\nuses the locale's Gregorian short-date order and separators with Latin digits.\nThis is a documented subset, not full .NET format compatibility.",
  "tags": [
    {
      "name": "example",
      "text": "new DateFormatter(\"dd.MM.yyyy\").parse(\"14.10.2026\"); // \"2026-10-14\""
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Types",
  "path": "/api-reference/DateFormatter",
  "source": "src/formatting/DateFormatter.ts",
  "members": [
    {
      "name": "pattern",
      "type": "string",
      "description": "Requested format; defaults to yyyy-MM-dd.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/DateFormatter.ts",
      "kind": "property"
    },
    {
      "name": "format",
      "type": "(value: string) => string",
      "description": "Formats a valid ISO date. Invalid dates are rejected rather than normalized.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/DateFormatter.ts",
      "parameters": [
        {
          "name": "value",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: string) => string"
    },
    {
      "name": "parse",
      "type": "(text: string) => string",
      "description": "Parses the configured layout into ISO; trims surrounding whitespace but requires exact separators.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/DateFormatter.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => string"
    }
  ]
};
