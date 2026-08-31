export default {
  "name": "ArrayDataSource",
  "kind": "class",
  "type": "ArrayDataSource<T>",
  "description": "DataSource implementation backed by an in-memory array.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Data",
  "path": "/api-reference/ArrayDataSource",
  "source": "src/components/datagrid/DataSource.ts",
  "members": [
    {
      "name": "array",
      "type": "T[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "getRowId",
      "type": "((row: T) => any) | undefined",
      "description": "Only assigned when `options.parentField` is given, so plain flat arrays don't get flagged as hierarchical.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "hasChildren",
      "type": "((row: T) => Promise<boolean>) | undefined",
      "description": "Presence marks this source as hierarchical (parent/child) and disables groupColumns; answers per-row expandability.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "loadData",
      "type": "(args: QueryArgs) => Promise<DataResult<T>>",
      "description": "Loads a page of rows or grouped records.\n\nWhen `args.groupColumn` is not provided, the datasource should return\n`dataItems` containing the requested page of rows. When grouping is\nrequested and the datasource supports it, it should return `groups`,\nwhere each group contains its key, row count, and any requested\n`groupSummary` values. A supported grouped query may legitimately\nreturn `groups: []` when no rows match the query; callers must not\ninterpret that as a request to perform grouping locally.\n\nFor a grouped request that the datasource does not handle, it should\nreturn a result with both `dataItems` and `groups` undefined.\n`LocalGroupingDataSource` uses that response as the signal to issue a\nsecond flat request, then performs grouping and supported summaries\nlocally. The server should not return a partial flat page for the\ngrouped request because the local datasource will make that flat\nrequest itself.\n\n`skip` and `top` apply to the returned rows or groups. `totalCount`,\nwhen requested, must describe the complete result before pagination.\nImplementations should preserve `args` in the returned `DataResult` so\nconsumers can associate a response with the query that produced it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataSource.ts",
      "parameters": [
        {
          "name": "args",
          "type": "QueryArgs",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<DataResult<T>>",
        "description": ""
      },
      "kind": "method",
      "signature": "(args: QueryArgs) => Promise<DataResult<T>>"
    },
    {
      "name": "indexOfRow",
      "type": "(row: T) => Promise<number>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataSource.ts",
      "parameters": [
        {
          "name": "row",
          "type": "T",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<number>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: T) => Promise<number>"
    }
  ]
};
