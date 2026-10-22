export default {
  "name": "NumberFormatter",
  "kind": "class",
  "type": "NumberFormatter",
  "description": "Locale-aware, .NET-inspired numeric formats: G, N/F/P[0–20], C[0–20]suffix.\nN groups digits, F omits grouping, P displays a fraction as a percentage.\nC requires a literal currency symbol/code, placed after the number with a nonbreaking space.\nThis is a subset with a currency extension, not full .NET compatibility.",
  "tags": [
    {
      "name": "example",
      "text": "new NumberFormatter(\"C2€\", \"en-US\").format(1234.5); // \"1,234.50 €\""
    },
    {
      "name": "example",
      "text": "new NumberFormatter(\"P1\", \"en-US\").parse(\"12.5%\"); // 0.125"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Types",
  "path": "/api-reference/NumberFormatter",
  "source": "src/formatting/NumberFormatter.ts",
  "members": [
    {
      "name": "pattern",
      "type": "string",
      "description": "Original, case-sensitive pattern. N, F, P and C default to two fraction digits; G is general.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/NumberFormatter.ts",
      "kind": "property"
    },
    {
      "name": "format",
      "type": "(value: number) => string",
      "description": "Formats finite numbers only. Rounding is presentation-only; no currency conversion is performed.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/NumberFormatter.ts",
      "parameters": [
        {
          "name": "value",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: number) => string"
    },
    {
      "name": "parse",
      "type": "(text: string) => number",
      "description": "Parses this locale's numeric text, accepting grouped or ungrouped digits and optional surrounding whitespace.\nCurrency/percent suffixes are required when configured. Incorrect grouping and trailing text throw.\nParsing a rounded label recovers only the displayed precision; empty/null handling belongs to the editor.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/formatting/NumberFormatter.ts",
      "parameters": [
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "number",
        "description": ""
      },
      "kind": "method",
      "signature": "(text: string) => number"
    }
  ]
};
