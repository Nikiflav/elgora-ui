export default {
  "name": "GroupByField",
  "kind": "interface",
  "type": "GroupByField",
  "description": "One grouping level in a loadData query, from outermost to innermost.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/GroupByField",
  "source": "src/data/DataSource.ts",
  "members": [
    {
      "name": "field",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "interval",
      "type": "GroupInterval | undefined",
      "description": "Named grouping interval; omit to group raw values.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    }
  ]
};
