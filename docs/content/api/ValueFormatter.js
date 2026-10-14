export default {
  "name": "ValueFormatter",
  "kind": "interface",
  "type": "ValueFormatter<T>",
  "description": "Converts values to display text and parses text independently of UI or saving.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Types",
  "path": "/api-reference/ValueFormatter",
  "source": "src/formatting/ValueFormatter.ts",
  "members": [
    {
      "name": "format",
      "type": "(value: T) => string",
      "description": "Formats a value without modifying it. Display formats may lose precision.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/ValueFormatter.ts",
      "parameters": [
        {
          "name": "value",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: T) => string"
    },
    {
      "name": "parse",
      "type": "(text: string) => T",
      "description": "Parses text or throws an explanatory error. No validation callbacks or saving occur.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/ValueFormatter.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "T",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => T"
    }
  ]
};
