export default {
  "name": "TimeFormatter",
  "kind": "class",
  "type": "TimeFormatter",
  "description": "Formats and parses strict 24-hour time values without timezone conversion.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Types",
  "path": "/api-reference/TimeFormatter",
  "source": "src/formatting/TimeFormatter.ts",
  "members": [
    {
      "name": "pattern",
      "type": "\"HH:mm\" | \"HH:mm:ss\"",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/TimeFormatter.ts",
      "kind": "property"
    },
    {
      "name": "format",
      "type": "(value: string) => string",
      "description": "Formats a canonical time value.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/TimeFormatter.ts",
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
      "description": "Parses a strict 24-hour time and rejects invalid clock values.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/TimeFormatter.ts",
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
