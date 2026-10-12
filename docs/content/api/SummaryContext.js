export default {
  "name": "SummaryContext",
  "kind": "interface",
  "type": "SummaryContext<TRow>",
  "description": "Context supplied to a custom summary lifecycle method.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/SummaryContext",
  "source": "src/data/summary.ts",
  "members": [
    {
      "name": "field",
      "type": "string",
      "description": "Field being summarized.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/summary.ts",
      "kind": "property"
    },
    {
      "name": "groupValue",
      "type": "any",
      "description": "Value of the group currently being accumulated.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/summary.ts",
      "kind": "property"
    },
    {
      "name": "row",
      "type": "TRow | undefined",
      "description": "Current source row, when the lifecycle method is processing a row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/summary.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "any",
      "description": "Current field value, when the lifecycle method is processing a row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/summary.ts",
      "kind": "property"
    }
  ]
};
