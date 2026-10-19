export default {
  "name": "LocalGroupingDataSource",
  "kind": "class",
  "type": "LocalGroupingDataSource<TRow>",
  "description": "Delegates supported queries to its source and supplies local grouping/summary fallback.\nComplete local group/summary results are cached for ArrayDataSource and DataTable,\nfollowing its revision. Each adapter retains up to eight query results; field\nmetadata and callback identities participate in the keys. Changes to captured\nexternal data require source.invalidateCache(). Remote results are not cached.",
  "tags": [],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/LocalGroupingDataSource",
  "source": "src/data/LocalGroupingDataSource.ts",
  "members": [
    {
      "name": "createNewRow",
      "type": "(() => Promise<import(\"D:/Dev/github/elgora-ui/src/index\").NewRowSession<TRow>>) | undefined",
      "description": "Exposed only when the wrapped source supports new-row sessions.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/LocalGroupingDataSource.ts",
      "kind": "property"
    },
    {
      "name": "update",
      "type": "((row: TRow, values: Record<string, unknown>) => Promise<import(\"D:/Dev/github/elgora-ui/src/index\").MutationResult>) | undefined",
      "description": "Exposed only when the wrapped source supports updates.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/LocalGroupingDataSource.ts",
      "kind": "property"
    },
    {
      "name": "delete",
      "type": "((row: TRow) => Promise<import(\"D:/Dev/github/elgora-ui/src/index\").MutationResult>) | undefined",
      "description": "Exposed only when the wrapped source supports deletion.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/LocalGroupingDataSource.ts",
      "kind": "property"
    },
    {
      "name": "getRowId",
      "type": "((row: TRow) => import(\"D:/Dev/github/elgora-ui/src/index\").RowIdentity) | undefined",
      "description": "Delegated row identity and hierarchy capabilities, without inventing unsupported ones.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/LocalGroupingDataSource.ts",
      "kind": "property"
    },
    {
      "name": "hasChildren",
      "type": "((row: TRow) => Promise<boolean>) | undefined",
      "description": "Presence marks this source as hierarchical (parent/child) and disables groupColumns; answers per-row expandability.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/LocalGroupingDataSource.ts",
      "kind": "property"
    },
    {
      "name": "changed",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").Observable<import(\"D:/Dev/github/elgora-ui/src/index\").DataSourceChanged<TRow>> | undefined",
      "description": "The original event, including pending-row notifications; no second event or subscription.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/LocalGroupingDataSource.ts",
      "kind": "property"
    },
    {
      "name": "undoCoordinator",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").UndoCoordinator | undefined",
      "description": "The source's shared coordinator; the grouping adapter owns no separate history.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/LocalGroupingDataSource.ts",
      "kind": "property"
    },
    {
      "name": "loadData",
      "type": "(args: QueryArgs) => Promise<DataResult<TRow>>",
      "description": "Loads a page of rows or grouped records.\n\nWhen `args.groupColumn` is not provided, the datasource should return\n`dataItems` containing the requested page of rows. When grouping is\nrequested and the datasource supports it, it should return `groups`,\nwhere each group contains its key, row count, and any requested\n`groupSummary` values. A supported grouped query may legitimately\nreturn `groups: []` when no rows match the query; callers must not\ninterpret that as a request to perform grouping locally.\n\nFor a grouped request that the datasource does not handle, it should\nreturn a result with both `dataItems` and `groups` undefined.\n`LocalGroupingDataSource` uses that response as the signal to issue a\nsecond flat request, then performs grouping and supported summaries\nlocally. The server should not return a partial flat page for the\ngrouped request because the local datasource will make that flat\nrequest itself.\n\n`skip` and `top` apply to the returned rows or groups. `totalCount`,\nwhen requested, must describe the complete result before pagination.\nWhen `args.totalSummary` is present, the datasource must return a\nmatching `totalSummary` for the complete filtered result, before\npagination and grouping. The request is optional so remote sources can\navoid an expensive aggregate query when the grid does not need the\nfooter values; when it is absent, `totalSummary` should be omitted.\nImplementations should preserve `args` in the returned `DataResult` so\nconsumers can associate a response with the query that produced it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/LocalGroupingDataSource.ts",
      "parameters": [
        {
          "name": "args",
          "type": "QueryArgs",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<DataResult<TRow>>",
        "description": ""
      },
      "kind": "method",
      "signature": "(args: QueryArgs) => Promise<DataResult<TRow>>"
    }
  ]
};
