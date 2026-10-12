export default {
  "name": "SummaryType",
  "kind": "type",
  "type": "any",
  "description": "Aggregation kind applied to a group column's summary value.\n`count` and `distinct` support all value types; `sum`, `avg`, `min`, and `max`\nrequire a numeric column.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/SummaryType",
  "source": "src/data/summary.ts",
  "definition": "\"count\" | \"sum\" | \"avg\" | \"min\" | \"max\" | \"distinct\" | string"
};
