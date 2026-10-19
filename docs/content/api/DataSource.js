export default {
  "name": "DataSource",
  "kind": "interface",
  "type": "DataSource<TRow>",
  "description": "Query and optional row-edit access, independent of DataTable or a remote implementation.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataSource",
  "source": "src/data/DataSource.ts",
  "members": [
    {
      "name": "loadData",
      "type": "(args: QueryArgs) => Promise<DataResult<TRow>>",
      "description": "Loads a page of rows or grouped records.\n\nWhen `args.groupBy` is omitted or empty, the datasource should return\n`dataItems` containing the requested page of rows. When grouping is\nrequested and the datasource supports it, it should return `groups`,\nwhere each group contains its key, row count, and any requested\n`groupSummary` values. A supported grouped query may legitimately\nreturn `groups: []` when no rows match the query; callers must not\ninterpret that as a request to perform grouping locally.\nMore than one groupBy descriptor requests a nested tree. Every non-leaf\ngroup must include its complete groups array for the next descriptor;\ncount remains the number of data rows in that bucket. No leaf data rows\nare returned. skip/top affect only the outer group array, and totalCount\ncounts outer groups. With no top, all outer groups must be returned.\n\nFor a grouped request that the datasource does not handle, it should\nreturn a result with both `dataItems` and `groups` undefined.\n`LocalGroupingDataSource` uses that response as the signal to issue a\nsecond flat request, then performs grouping and supported summaries\nlocally. The server should not return a partial flat page for the\ngrouped request because the local datasource will make that flat\nrequest itself.\n\n`skip` and `top` apply to the returned rows or groups. `totalCount`,\nwhen requested, must describe the complete result before pagination.\nWhen `args.totalSummary` is present, the datasource must return a\nmatching `totalSummary` for the complete filtered result, before\npagination and grouping. The request is optional so remote sources can\navoid an expensive aggregate query when the grid does not need the\nfooter values; when it is absent, `totalSummary` should be omitted.\nImplementations should preserve `args` in the returned `DataResult` so\nconsumers can associate a response with the query that produced it.",
      "tags": [
        {
          "name": "param",
          "text": "args Query, filtering, grouping, pagination, and summary options."
        },
        {
          "name": "returns",
          "text": "The loaded rows or groups, optional total count, and any\nrequested total summaries."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
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
        "description": "The loaded rows or groups, optional total count, and any\nrequested total summaries."
      },
      "kind": "method",
      "signature": "(args: QueryArgs) => Promise<DataResult<TRow>>"
    },
    {
      "name": "changed",
      "type": "Observable<DataSourceChanged<TRow>> | undefined",
      "description": "Optional notifications; consumers dispose their subscription, never the source's event.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "undoCoordinator",
      "type": "UndoCoordinator | undefined",
      "description": "Optional shared history. Execute undo/redo only through this coordinator.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "createNewRow",
      "type": "(() => Promise<NewRowSession<TRow>>) | undefined",
      "description": "Creates an independently owned new-row session; multiple sessions may coexist.\nThe row has a stable temporary identity and is excluded from normal queries\nuntil insert. Pending edits may read other rows but must not mutate them.\nExample: const newRowSession = await source.createNewRow?.();",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<NewRowSession<TRow>>",
        "description": ""
      },
      "kind": "method",
      "signature": "(() => Promise<NewRowSession<TRow>>) | undefined"
    },
    {
      "name": "update",
      "type": "((row: TRow, values: Record<string, unknown>) => Promise<MutationResult>) | undefined",
      "description": "Applies values to the actual source row, including a pending session row.\nEach successful command and its business effects form one transaction if\nthe source supports history. Example: await source.update?.(row, { price: 20 }).",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
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
      "signature": "((row: TRow, values: Record<string, unknown>) => Promise<MutationResult>) | undefined"
    },
    {
      "name": "delete",
      "type": "((row: TRow) => Promise<MutationResult>) | undefined",
      "description": "Deletes a confirmed row. Use the pending session's cancel() for an unconfirmed row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => Promise<MutationResult>) | undefined"
    },
    {
      "name": "getRowId",
      "type": "((row: TRow) => RowIdentity) | undefined",
      "description": "Returns a stable identity for a row, used as its render key and, in hierarchical mode, as the parentId for its children.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
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
      "source": "src/data/DataSource.ts",
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
