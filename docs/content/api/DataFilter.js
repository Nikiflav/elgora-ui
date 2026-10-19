export default {
  "name": "DataFilter",
  "kind": "type",
  "type": "any",
  "description": "A serializable filter condition, negation or group. Nested arrays combine conditions with AND.\nEquality with null matches null or missing (undefined) values, never empty text.\nInequality with null is the inverse. Other equality comparisons are type-strict.\nSQL adapters should translate = null / <> null to IS NULL / IS NOT NULL.",
  "tags": [
    {
      "name": "example",
      "text": "const filter: DataFilter = [\"and\", [\"quantity\", \">=\", 1], [\"quantity\", \"<=\", 100]];"
    }
  ],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataFilter",
  "source": "src/data/filter.ts",
  "definition": "BinaryFilter | UnaryFilter | GroupFilter"
};
