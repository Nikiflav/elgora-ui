export default {
  "name": "ArrayDataSource",
  "kind": "class",
  "type": "ArrayDataSource<T>",
  "description": "DataSource implementation backed by an in-memory array.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/ArrayDataSource",
  "source": "src/data/ArrayDataSource.ts",
  "members": [
    {
      "name": "array",
      "type": "T[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    },
    {
      "name": "getRowId",
      "type": "((row: T) => any) | undefined",
      "description": "Only assigned when `options.parentField` is given, so plain flat arrays don't get flagged as hierarchical.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    },
    {
      "name": "hasChildren",
      "type": "((row: T) => Promise<boolean>) | undefined",
      "description": "Presence marks this source as hierarchical (parent/child) and disables groupColumns; answers per-row expandability.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/ArrayDataSource.ts",
      "kind": "property"
    },
    {
      "name": "loadData",
      "type": "(args: QueryArgs) => Promise<DataResult<T>>",
      "description": "Loads a page of rows or grouped records.\n\nWhen `args.groupColumn` is not provided, the datasource should return\n`dataItems` containing the requested page of rows. When grouping is\nrequested and the datasource supports it, it should return `groups`,\nwhere each group contains its key, row count, and any requested\n`groupSummary` values. A supported grouped query may legitimately\nreturn `groups: []` when no rows match the query; callers must not\ninterpret that as a request to perform grouping locally.\n\nFor a grouped request that the datasource does not handle, it should\nreturn a result with both `dataItems` and `groups` undefined.\n`LocalGroupingDataSource` uses that response as the signal to issue a\nsecond flat request, then performs grouping and supported summaries\nlocally. The server should not return a partial flat page for the\ngrouped request because the local datasource will make that flat\nrequest itself.\n\n`skip` and `top` apply to the returned rows or groups. `totalCount`,\nwhen requested, must describe the complete result before pagination.\nWhen `args.totalSummary` is present, the datasource must return a\nmatching `totalSummary` for the complete filtered result, before\npagination and grouping. The request is optional so remote sources can\navoid an expensive aggregate query when the grid does not need the\nfooter values; when it is absent, `totalSummary` should be omitted.\nImplementations should preserve `args` in the returned `DataResult` so\nconsumers can associate a response with the query that produced it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/ArrayDataSource.ts",
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
      "source": "src/data/ArrayDataSource.ts",
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
    },
    {
      "name": "saveChanges",
      "type": "(changes: ChangeSet) => Promise<SaveChangesResult>",
      "description": "Applies a ChangeSet directly to the backing array.\n\nArrayDataSource uses the change key to find existing rows. Inserted rows\nkeep the supplied key because there is no server that can assign a new\nidentity; therefore the successful result never needs keyMappings.\n\nThe complete batch is validated before the array is changed, so a bad\nkey does not leave a partially applied in-memory update.",
      "tags": [
        {
          "name": "example",
          "text": "await source.saveChanges?.([\n    { type: \"update\", key: 1, data: { amount: 25 } },\n    { type: \"remove\", key: 2 }\n]);"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/ArrayDataSource.ts",
      "parameters": [
        {
          "name": "changes",
          "type": "ChangeSet",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<SaveChangesResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(changes: ChangeSet) => Promise<SaveChangesResult>"
    }
  ]
};
