export default {
  "name": "SummaryRequest",
  "kind": "type",
  "type": "any",
  "description": "A summary request for one field. Multiple summaries may target the same field.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/SummaryRequest",
  "source": "src/data/summary.ts",
  "definition": "{\n    /** Field whose values are aggregated. */\n    field: string;\n    /** Built-in aggregation or registered custom summary name. */\n    summaryType: SummaryType;\n}"
};
