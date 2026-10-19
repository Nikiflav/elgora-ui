export default {
  "name": "DataTable",
  "kind": "class",
  "type": "DataTable",
  "description": "Stores rows indexed by identity and exposes them through the DataSource contract.\nupdate() and delete() change local data; getChanges() returns the batch for persistence.\nNew-row sessions remain outside queries until insert() and can be discarded with cancel().",
  "tags": [
    {
      "name": "example",
      "text": "const table = dataset.createTable(\"orders\", [], { createRowId: () => crypto.randomUUID() });\nconst newRowSession = await table.createNewRow();\nawait newRowSession.row.setValue(\"quantity\", 2);\nawait newRowSession.insert();\n// dataset.saveChanges(...) persists the inserted row."
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/DataTable",
  "source": "src/data/dataset/DataTable.ts",
  "members": [
    {
      "name": "revision",
      "type": "number",
      "description": "Query-data version; invalidated immediately when confirmed working data changes, even inside a transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "invalidateCache",
      "type": "() => void",
      "description": "Invalidates local query/group results and emits kind \"reset\" while the dataset is idle.\nUse after in-place object changes or changes to external query dependencies.\nThis does not track an edit, record undo, or make an in-place change persistable.\nOrdinary table edits, import, rollback and history replay invalidate automatically.",
      "tags": [
        {
          "name": "example",
          "text": "externalRates.usd = 1.1;\ntable.invalidateCache();"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "idField",
      "type": "string",
      "description": "Field containing each row's unique identity; defaults to id.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "changed",
      "type": "ObservableEvent<DataSourceChanged<DataRow>>",
      "description": "Reports local row changes, including edits in pending sessions.\nSubscribe to repaint consumers; dispose the returned subscription when no longer needed.",
      "tags": [
        {
          "name": "example",
          "text": "const subscription = table.changed.subscribe(event => console.log(event.kind, event.row?.key));"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "rowChanging",
      "type": "AsyncObservableEvent<DataRowChangeEvent>",
      "description": "Before update, insertion, deletion or cancellation, inside the current transaction.\nreject() aborts the complete edit and stops dispatch. Async handlers are awaited in subscription order.\nCreation reports rowChanged after defaults and identity have been initialized.",
      "tags": [
        {
          "name": "example",
          "text": "table.rowChanging.subscribe(e => {\n    if (e.kind === \"update\" && Number(e.values.quantity) < 0)\n        e.reject(\"Quantity must be nonnegative\", { quantity: \"Must be nonnegative\" });\n});"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "rowChanged",
      "type": "AsyncObservableEvent<DataRowChangeEvent>",
      "description": "After a mutation, inside the transaction; also reports creation and pending-row edits.\nDerived edits join the same undo operation. Never emitted during replay, import or acceptance.\nAsync handlers are awaited in subscription order. Await or return derived edits before the next rule.\nPending-row rules can initialize that row, but cannot modify other rows until insertion.",
      "tags": [
        {
          "name": "example",
          "text": "table.rowChanged.subscribe(async e => {\n    if (e.fields.includes(\"quantity\"))\n        await e.context.setValue(e.row, \"total\", Number(e.row.getValue(\"quantity\")) * 10);\n});"
        },
        {
          "name": "example",
          "text": "table.rowChanged.subscribe(async e => {\n    if (e.fields.includes(\"code\")) {\n        const price = await lookupPrice(e.row.getValue(\"code\"));\n        await e.context.setValue(e.row, \"price\", price);\n    }\n});"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "undoCoordinator",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").UndoCoordinator",
      "description": "Shared dataset coordinator; undo/redo must be executed through it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "rows",
      "type": "readonly DataRow[]",
      "description": "Confirmed rows, including deleted entries awaiting acceptance; returns a copied list.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "getRow",
      "type": "(key: RowIdentity) => DataRow | undefined",
      "description": "Finds a confirmed row by current ID. Pending rows are owned by their session handles.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "key",
          "type": "RowIdentity",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataRow | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(key: RowIdentity) => DataRow | undefined"
    },
    {
      "name": "getRowId",
      "type": "(row: DataRow) => RowIdentity",
      "description": "Stable/current row ID for the DataSource contract. Mapping preserves the row reference.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "RowIdentity",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow) => RowIdentity"
    },
    {
      "name": "importRows",
      "type": "(values: readonly Record<string, unknown>[], preserveChanges?: boolean) => DataRow[]",
      "description": "Imports refreshed values by ID, preserving row references and, by default, local edits.\nExample: table.importRows(serverPage). Pending IDs cannot be overwritten by imports.\nIdentity validation completes for the entire batch before any existing row changes.\nA nonempty import clears the dataset's complete history scope to prevent stale replay.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "values",
          "type": "readonly Record<string, unknown>[]",
          "optional": false,
          "description": ""
        },
        {
          "name": "preserveChanges",
          "type": "boolean",
          "optional": true,
          "defaultValue": "true",
          "description": ""
        }
      ],
      "returns": {
        "type": "DataRow[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(values: readonly Record<string, unknown>[], preserveChanges?: boolean) => DataRow[]"
    },
    {
      "name": "createNewRow",
      "type": "(transaction?: DataTransaction, context?: DataEditContext) => Promise<NewRowSession<DataRow>>",
      "description": "Creates a pending added row using table.createRowId or the dataset's default generator.\nThe generator receives this table. Its result must be unique among stored and pending rows.\ninsert() includes the row in queries and persistence changes; cancel() discards it.\nKeep the returned session handle until it is inserted or cancelled.\nAwait this call before saving or accepting/rejecting changes; an unfinished identity\nrequest blocks those operations, as does a session whose state is still pending.",
      "tags": [
        {
          "name": "example",
          "text": "const newRowSession = await table.createNewRow();\nawait table.update(newRowSession.row, { quantity: 3 });\nawait newRowSession.insert();"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "transaction",
          "type": "DataTransaction | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "context",
          "type": "DataEditContext | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<NewRowSession<DataRow>>",
        "description": ""
      },
      "kind": "method",
      "signature": "(transaction?: DataTransaction, context?: DataEditContext) => Promise<NewRowSession<DataRow>>"
    },
    {
      "name": "_insertNewRow",
      "type": "(row: DataRow, transaction?: DataTransaction, context?: DataEditContext) => Promise<MutationResult>",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Inserts the table-owned session using an explicit or automatic transaction."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "transaction",
          "type": "DataTransaction | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "context",
          "type": "DataEditContext | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, transaction?: DataTransaction, context?: DataEditContext) => Promise<MutationResult>"
    },
    {
      "name": "_cancelNewRow",
      "type": "(row: DataRow, transaction?: DataTransaction, context?: DataEditContext) => Promise<void>",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Cancels the table-owned session using an explicit or automatic transaction."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "transaction",
          "type": "DataTransaction | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "context",
          "type": "DataEditContext | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, transaction?: DataTransaction, context?: DataEditContext) => Promise<void>"
    },
    {
      "name": "update",
      "type": "(row: DataRow, values: Record<string, unknown>, transaction?: DataTransaction, context?: DataEditContext) => Promise<MutationResult>",
      "description": "Updates field values without cloning them, in an automatic transaction; use tx.update() to join a larger edit.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "values",
          "type": "Record<string, unknown>",
          "optional": false,
          "description": ""
        },
        {
          "name": "transaction",
          "type": "DataTransaction | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "context",
          "type": "DataEditContext | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, values: Record<string, unknown>, transaction?: DataTransaction, context?: DataEditContext) => Promise<MutationResult>"
    },
    {
      "name": "delete",
      "type": "(row: DataRow, transaction?: DataTransaction, context?: DataEditContext) => Promise<MutationResult>",
      "description": "Marks an existing row deleted; removes an unsaved added row without a delete entry.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "transaction",
          "type": "DataTransaction | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "context",
          "type": "DataEditContext | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, transaction?: DataTransaction, context?: DataEditContext) => Promise<MutationResult>"
    },
    {
      "name": "loadData",
      "type": "(args: QueryArgs) => Promise<DataResult<DataRow>>",
      "description": "Loads confirmed, non-deleted rows. Pending rows never participate in pages, counts or summaries.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "args",
          "type": "QueryArgs",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<DataResult<DataRow>>",
        "description": ""
      },
      "kind": "method",
      "signature": "(args: QueryArgs) => Promise<DataResult<DataRow>>"
    },
    {
      "name": "getChanges",
      "type": "() => ChangeSet",
      "description": "Returns confirmed insert/update/remove changes. Pending sessions are excluded.\nInsert entries contain all field values; update entries contain only modified fields.",
      "tags": [
        {
          "name": "example",
          "text": "table.getChanges(); // [{ type: \"update\", key: 1, data: { quantity: 3 } }]"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [],
      "returns": {
        "type": "ChangeSet",
        "description": ""
      },
      "kind": "method",
      "signature": "() => ChangeSet"
    },
    {
      "name": "acceptChanges",
      "type": "() => void",
      "description": "Accepts externally persisted values as the new baseline; does not save them.\nExplicitly insert or cancel this table's pending sessions and await new-row creation first.\nThrows without accepting changes if any session or identity request is still pending.\nClears the complete dataset history scope, including operations involving other tables.",
      "tags": [
        {
          "name": "example",
          "text": "await persist(table.getChanges());\ntable.acceptChanges();"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "rejectChanges",
      "type": "() => void",
      "description": "Restores accepted values, removes unsaved added rows and restores deleted rows.\nExplicitly cancel pending sessions first; throws without changing rows if any remain\nor a createNewRow() request has not completed.\nClears the complete dataset history scope, including operations involving other tables.",
      "tags": [
        {
          "name": "example",
          "text": "if (newRowSession.state === \"pending\") await newRowSession.cancel();\ntable.rejectChanges();"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "ensureNoPending",
      "type": "(operation: string) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Rejects an operation while a new-row session or identity request is pending.\nCallers must await row creation and explicitly insert or cancel the returned handles.\nDoes not change session state or row values."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "operation",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(operation: string) => void"
    },
    {
      "name": "_acceptChanges",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Accepts after successful dataset save while the save lock is still held."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_validateKeyMappings",
      "type": "(mappings: readonly KeyMapping[]) => Map<DataRow, RowIdentity>",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Validates the entire mapping without changing rows or indexes, including key swaps."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "mappings",
          "type": "readonly KeyMapping[]",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Map<DataRow, RowIdentity>",
        "description": ""
      },
      "kind": "method",
      "signature": "(mappings: readonly KeyMapping[]) => Map<DataRow, RowIdentity>"
    },
    {
      "name": "_applyKeyMappings",
      "type": "(mappings: Map<DataRow, RowIdentity>) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Applies a prevalidated mapping and rebuilds the index, preserving all row objects."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "mappings",
          "type": "Map<DataRow, RowIdentity>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(mappings: Map<DataRow, RowIdentity>) => void"
    },
    {
      "name": "_equals",
      "type": "(field: string, a: unknown, b: unknown) => boolean",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Uses the table's configured equality consistently for edits and persistence differences."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "field",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "a",
          "type": "unknown",
          "optional": false,
          "description": ""
        },
        {
          "name": "b",
          "type": "unknown",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: string, a: unknown, b: unknown) => boolean"
    },
    {
      "name": "_isPending",
      "type": "(row: DataRow) => boolean",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Identifies sessions still outside confirmed queries."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow) => boolean"
    },
    {
      "name": "_isCreating",
      "type": "() => boolean",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Blocks replay while asynchronous identity/default generation is still running."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTable.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    }
  ]
};
