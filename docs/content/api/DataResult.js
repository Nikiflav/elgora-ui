export default {
  "name": "DataResult",
  "kind": "interface",
  "type": "DataResult<TRow>",
  "description": "The response to a QueryArgs request: either flat data rows or, when grouping, group buckets.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataResult",
  "source": "src/data/DataSource.ts",
  "members": [
    {
      "name": "totalCount",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "args",
      "type": "QueryArgs",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "dataItems",
      "type": "TRow[] | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "groups",
      "type": "GroupItem[] | undefined",
      "description": "Used exclusively when args.groupColumn is set.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "totalSummary",
      "type": "SummaryResult[] | undefined",
      "description": "Aggregations for the complete filtered result, before paging and\ngrouping. Returned only when `args.totalSummary` was requested; values\nmust not be calculated from the returned page alone.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    }
  ]
};
