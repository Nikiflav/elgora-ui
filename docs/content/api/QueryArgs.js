export default {
  "name": "QueryArgs",
  "kind": "interface",
  "type": "QueryArgs",
  "description": "A single page/query request made against a DataSource.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/QueryArgs",
  "source": "src/data/DataSource.ts",
  "members": [
    {
      "name": "filter",
      "type": "DataFilter | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "orderby",
      "type": "OrderByToken[] | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "select",
      "type": "string[] | undefined",
      "description": "Field names to include; omit to fetch all fields.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "skip",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "top",
      "type": "number | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "groupColumn",
      "type": "string | undefined",
      "description": "Column to bucket rows by; when set, the result carries `groups` instead of `dataItems`.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "groupInterval",
      "type": "GroupInterval | undefined",
      "description": "Interval requested for groupColumn; arbitrary strings may be server-defined.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "groupSummary",
      "type": "{ field: string; summaryType: SummaryType; }[] | undefined",
      "description": "Aggregations to compute per group, per field.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "totalSummary",
      "type": "SummaryRequest[] | undefined",
      "description": "Optional, demand-driven aggregations for the complete filtered result,\nindependently of paging and grouping. When omitted, the datasource\nshould not calculate or return total summaries.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "parentId",
      "type": "any",
      "description": "Value to match against the data source's parent-reference field; present only in hierarchical (parent/child) mode.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "requireTotalCount",
      "type": "boolean | undefined",
      "description": "Whether the caller needs an accurate total row/group count back.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "abortSignal",
      "type": "AbortSignal | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    }
  ]
};
