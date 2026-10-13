export default {
  "name": "ArrayDataSource",
  "kind": "class",
  "type": "ArrayDataSource<T>",
  "description": "Reads and edits the supplied array directly, preserving existing row references.\nNew rows are plain objects and remain outside the array until their session is inserted.\nEach command emits changed after success. No undo history or server persistence is provided.",
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
      "name": "changed",
      "type": "ObservableEvent<DataSourceChanged<T>>",
      "description": "Notifications for successful edits, including pending-row edits.",
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
      "name": "update",
      "type": "(row: T, values: Record<string, unknown>) => Promise<MutationResult>",
      "description": "Applies fields to the actual confirmed or pending row.\nAn equal-value patch emits no notification. The identity cannot be changed.",
      "tags": [
        {
          "name": "example",
          "text": "await source.update(row, { quantity: 3, price: 20 });"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/ArrayDataSource.ts",
      "parameters": [
        {
          "name": "row",
          "type": "T",
          "optional": false,
          "description": ""
        },
        {
          "name": "values",
          "type": "Record<string, unknown>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: T, values: Record<string, unknown>) => Promise<MutationResult>"
    },
    {
      "name": "delete",
      "type": "(row: T) => Promise<MutationResult>",
      "description": "Removes a confirmed row from the supplied array. Pending rows must be cancelled instead.",
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
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: T) => Promise<MutationResult>"
    },
    {
      "name": "createNewRow",
      "type": "() => Promise<NewRowSession<T>>",
      "description": "Initializes an independent draft, with defaults and a stable identity.\nDrafts are excluded from queries, summaries and hierarchy until insert().\ninsert/cancel are individually idempotent; the opposite terminal transition rejects.",
      "tags": [
        {
          "name": "example",
          "text": "const session = await source.createNewRow();\nawait source.update(session.row, { product: \"Keyboard\", quantity: 1 });\nconst result = await session.insert();\nif (!result.success) console.error(result.error);"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/ArrayDataSource.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<NewRowSession<T>>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<NewRowSession<T>>"
    }
  ]
};
