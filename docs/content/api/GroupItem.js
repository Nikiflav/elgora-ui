export default {
  "name": "GroupItem",
  "kind": "type",
  "type": "any",
  "description": "A single group bucket produced when a QueryArgs.groupColumn is set.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/GroupItem",
  "source": "src/data/DataSource.ts",
  "definition": "{\n    groupField: string;\n    groupValue: any;\n    count: number;\n    /** Aggregated values, keyed by field name, per QueryArgs.groupSummary. */\n    summaryValues?: Record<string, any>;\n}"
};
