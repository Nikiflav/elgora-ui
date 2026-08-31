export default {
  "name": "DataSource",
  "kind": "interface",
  "type": "DataSource<TRow>",
  "description": "Query-level access to row data, with optional native grouping support.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataSource",
  "source": "src/components/datagrid/DataSource.ts",
  "members": [
    {
      "name": "loadData",
      "type": "(args: QueryArgs) => Promise<DataResult<TRow>>",
      "description": "Loads a page of rows or grouped records.\n\nWhen `args.groupColumn` is not provided, the datasource should return\n`dataItems` containing the requested page of rows. When grouping is\nrequested and the datasource supports it, it should return `groups`,\nwhere each group contains its key, row count, and any requested\n`groupSummary` values. A supported grouped query may legitimately\nreturn `groups: []` when no rows match the query; callers must not\ninterpret that as a request to perform grouping locally.\n\nFor a grouped request that the datasource does not handle, it should\nreturn a result with both `dataItems` and `groups` undefined.\n`LocalGroupingDataSource` uses that response as the signal to issue a\nsecond flat request, then performs grouping and supported summaries\nlocally. The server should not return a partial flat page for the\ngrouped request because the local datasource will make that flat\nrequest itself.\n\n`skip` and `top` apply to the returned rows or groups. `totalCount`,\nwhen requested, must describe the complete result before pagination.\nImplementations should preserve `args` in the returned `DataResult` so\nconsumers can associate a response with the query that produced it.",
      "tags": [
        {
          "name": "param",
          "text": "args Query, filtering, grouping, pagination, and summary options."
        },
        {
          "name": "returns",
          "text": "The loaded rows or groups and optional total count."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataSource.ts",
      "parameters": [
        {
          "name": "args",
          "type": "QueryArgs",
          "optional": false,
          "description": "Query, filtering, grouping, pagination, and summary options."
        }
      ],
      "returns": {
        "type": "Promise<DataResult<TRow>>",
        "description": "The loaded rows or groups and optional total count."
      },
      "kind": "method",
      "signature": "(args: QueryArgs) => Promise<DataResult<TRow>>"
    },
    {
      "name": "getRowId",
      "type": "((row: TRow) => RowIdentity) | undefined",
      "description": "Returns a stable identity for a row, used as its render key and, in hierarchical mode, as the parentId for its children.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataSource.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "RowIdentity",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => RowIdentity) | undefined"
    },
    {
      "name": "hasChildren",
      "type": "((row: TRow) => Promise<boolean>) | undefined",
      "description": "Presence marks this source as hierarchical (parent/child) and disables groupColumns; answers per-row expandability.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataSource.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => Promise<boolean>) | undefined"
    }
  ]
};
