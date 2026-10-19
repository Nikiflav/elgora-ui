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
  "definition": "{\n    groupField: string;\n    /**\n     * Group value, without dataType-based conversion. null/undefined share null;\n     * empty text (\"\") is a separate group and must not be merged with null.\n     * other values retain their type. Sources supply one consistent value type per\n     * grouped field. Intervals return bucket values (e.g. month -> 2), not the\n     * original date. Remote sources return null for missing values and calculate\n     * counts/summaries per distinct group before paging.\n     */\n    groupValue: any;\n    count: number;\n    /** Aggregated values, keyed by field name, per QueryArgs.groupSummary. */\n    summaryValues?: Record<string, any>;\n}"
};
