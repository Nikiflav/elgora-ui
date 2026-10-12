export default {
  "name": "DataTransaction",
  "kind": "class",
  "type": "DataTransaction",
  "description": "Explicit ownership context for a dataset edit that succeeds or is rolled back as a whole.\nUse its methods inside dataset.transaction(); ordinary table edits cannot join implicitly.\nField values are not cloned. Rollback restores previous references, not changes inside objects.",
  "tags": [
    {
      "name": "example",
      "text": "await dataset.transaction(\"Change quantities\", async tx => {\n    await tx.update(orders, firstRow, { quantity: 5 });\n    await tx.update(orders, secondRow, { quantity: 10 });\n});"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/DataTransaction",
  "source": "src/data/dataset/DataTransaction.ts",
  "members": [
    {
      "name": "context",
      "type": "DataEditContext",
      "description": "Dataset access bound to this transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "kind": "property"
    },
    {
      "name": "update",
      "type": "(table: DataTable, row: DataRow, values: Record<string, unknown>) => Promise<MutationResult>",
      "description": "Updates a row in this transaction; an unsuccessful result aborts the complete transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "table",
          "type": "DataTable",
          "optional": false,
          "description": ""
        },
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
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(table: DataTable, row: DataRow, values: Record<string, unknown>) => Promise<MutationResult>"
    },
    {
      "name": "delete",
      "type": "(table: DataTable, row: DataRow) => Promise<MutationResult>",
      "description": "Deletes a confirmed row as part of this transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "table",
          "type": "DataTable",
          "optional": false,
          "description": ""
        },
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(table: DataTable, row: DataRow) => Promise<MutationResult>"
    },
    {
      "name": "createNewRow",
      "type": "(table: DataTable) => Promise<NewRowSession<DataRow>>",
      "description": "Creates a pending session in this transaction; rollback cancels the created session.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "table",
          "type": "DataTable",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<NewRowSession<DataRow>>",
        "description": ""
      },
      "kind": "method",
      "signature": "(table: DataTable) => Promise<NewRowSession<DataRow>>"
    },
    {
      "name": "insert",
      "type": "(newRowSession: NewRowSession<DataRow>) => Promise<MutationResult>",
      "description": "Confirms a session locally; rollback restores its previous state and membership.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "newRowSession",
          "type": "NewRowSession<DataRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(newRowSession: NewRowSession<DataRow>) => Promise<MutationResult>"
    },
    {
      "name": "cancel",
      "type": "(newRowSession: NewRowSession<DataRow>) => Promise<void>",
      "description": "Cancels a session; rollback restores the same pending row and session objects.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "newRowSession",
          "type": "NewRowSession<DataRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(newRowSession: NewRowSession<DataRow>) => Promise<void>"
    },
    {
      "name": "_ensureActive",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Checks ownership and lifetime, including after an asynchronous continuation."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_hasCaptured",
      "type": "(row: DataRow) => boolean",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Avoids repeated snapshots when a row is edited several times."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
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
      "name": "_capture",
      "type": "(row: DataRow, restore: () => void, captureAfter: () => () => void) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Captures each affected row once, before its first mutation."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "restore",
          "type": "() => void",
          "optional": false,
          "description": ""
        },
        {
          "name": "captureAfter",
          "type": "() => () => void",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, restore: () => void, captureAfter: () => () => void) => void"
    },
    {
      "name": "_notify",
      "type": "(table: DataTable, event: DataSourceChanged<DataRow>) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Defers UI observation until the complete transaction has succeeded."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "table",
          "type": "DataTable",
          "optional": false,
          "description": ""
        },
        {
          "name": "event",
          "type": "DataSourceChanged<DataRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(table: DataTable, event: DataSourceChanged<DataRow>) => void"
    },
    {
      "name": "_fail",
      "type": "(result: Extract<MutationResult, { success: false; }>) => MutationResult",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Remembers validation rejection even when the caller ignores its result."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "result",
          "type": "{ success: false; error: string; fieldErrors?: Record<string, string>; }",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "MutationResult",
        "description": ""
      },
      "kind": "method",
      "signature": "(result: Extract<MutationResult, { success: false; }>) => MutationResult"
    },
    {
      "name": "_throwIfFailed",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Stops processing after a business rule rejects the edit."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_isValidationFailure",
      "type": "(error: unknown) => boolean",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Distinguishes expected business rejection from an exception."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "error",
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
      "signature": "(error: unknown) => boolean"
    },
    {
      "name": "_result",
      "type": "() => MutationResult",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Returns the first validation rejection or success."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "MutationResult",
        "description": ""
      },
      "kind": "method",
      "signature": "() => MutationResult"
    },
    {
      "name": "_finish",
      "type": "() => Promise<MutationResult>",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Waits for started context operations so an unawaited operation cannot escape rollback."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<MutationResult>"
    },
    {
      "name": "_settle",
      "type": "() => Promise<void>",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Waits for all started operations before restoring a failed transaction."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<void>"
    },
    {
      "name": "_rollback",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Restores captured row state and membership in reverse mutation order."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_operation",
      "type": "() => UndoOperation | undefined",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Captures the completed edit for replay without rerunning business rules."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "UndoOperation | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "() => UndoOperation | undefined"
    },
    {
      "name": "_publish",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Delivers committed notifications; observer errors do not reverse the transaction."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_track",
      "type": "<T>(operation: Promise<T>) => Promise<T>",
      "description": "Tracks context operations, recording asynchronous failures for transaction completion.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataTransaction.ts",
      "parameters": [
        {
          "name": "operation",
          "type": "Promise<T>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<T>",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(operation: Promise<T>) => Promise<T>"
    }
  ]
};
