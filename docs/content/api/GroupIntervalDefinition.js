export default {
  "name": "GroupIntervalDefinition",
  "kind": "type",
  "type": "any",
  "description": "A custom grouping interval with a serializable name and local fallback evaluator.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/GroupIntervalDefinition",
  "source": "src/data/grouping.ts",
  "definition": "{\n    /** Serializable identifier used by groupInterval, groupBy and structured child filters. */\n    name: string;\n    /** Human-readable label shown in interval selection menus. */\n    text: string;\n    /** Maps a row's resolved field value to a stable bucket value. May return a promise; must not mutate rows. */\n    getGroupValue: (row: TRow, value: any) => any;\n}"
};
