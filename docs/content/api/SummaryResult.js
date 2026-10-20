export default {
  "name": "SummaryResult",
  "kind": "type",
  "type": "any",
  "description": "A resolved summary value returned alongside the requested data.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/SummaryResult",
  "source": "src/data/summary.ts",
  "definition": "{\n    /** Field from the corresponding summary request. */\n    field: string;\n    /** Aggregation from the corresponding summary request. */\n    summaryType: SummaryType;\n    /** Computed aggregate; may be undefined when the aggregation has no eligible values. */\n    value: any;\n}"
};
