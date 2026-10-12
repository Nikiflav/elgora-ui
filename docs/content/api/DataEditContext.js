export default {
  "name": "DataEditContext",
  "kind": "class",
  "type": "DataEditContext",
  "description": "Transaction-bound access to the same dataset, tables and rows, without copying them.\nUse event.context for derived edits; ordinary row.setValue() cannot join an active transaction.\nThe context expires when its transaction completes.\nRe-entering a changed field in the same causal chain rejects the edit as a cycle.\nEqual values do not re-enter the chain. Independent sequential edits remain allowed.\nAsync subscribers are awaited sequentially. Await derived edits before reading their results.\nChains longer than 100 steps are rejected as a safety limit.",
  "tags": [
    {
      "name": "example",
      "text": "orders.rowChanged.subscribe(async e => {\n    if (e.fields.includes(\"quantity\"))\n        await e.context.setValue(e.row, \"total\", Number(e.row.getValue(\"quantity\")) * 10);\n});"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/DataEditContext",
  "source": "src/data/dataset/DataEditContext.ts",
  "members": [
    {
      "name": "getTable",
      "type": "(name: string) => DataTable | undefined",
      "description": "Looks up an existing table. Example: context.getTable(\"orders\").",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataTable | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string) => DataTable | undefined"
    },
    {
      "name": "setValue",
      "type": "(row: DataRow, field: string, value: unknown) => Promise<MutationResult>",
      "description": "Changes a field and tracks the operation even when the event handler does not await it.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "field",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "value",
          "type": "unknown",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, field: string, value: unknown) => Promise<MutationResult>"
    },
    {
      "name": "update",
      "type": "(row: DataRow, values: Record<string, unknown>) => Promise<MutationResult>",
      "description": "Applies several fields in this transaction. Example: context.update(row, { price: 5 }).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
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
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, values: Record<string, unknown>) => Promise<MutationResult>"
    },
    {
      "name": "delete",
      "type": "(row: DataRow) => Promise<MutationResult>",
      "description": "Deletes a confirmed row in this transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
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
      "signature": "(row: DataRow) => Promise<MutationResult>"
    },
    {
      "name": "createNewRow",
      "type": "(table: DataTable) => Promise<NewRowSession<DataRow>>",
      "description": "Creates a pending row in the specified table. Example: context.createNewRow(items).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
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
      "type": "(session: NewRowSession<DataRow>) => Promise<MutationResult>",
      "description": "Includes a pending session in the table, without persisting it to a server.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
        {
          "name": "session",
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
      "signature": "(session: NewRowSession<DataRow>) => Promise<MutationResult>"
    },
    {
      "name": "cancel",
      "type": "(session: NewRowSession<DataRow>) => Promise<void>",
      "description": "Discards a pending session in the same transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
        {
          "name": "session",
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
      "signature": "(session: NewRowSession<DataRow>) => Promise<void>"
    },
    {
      "name": "_checkTarget",
      "type": "(row?: DataRow) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Prevents pending-row rules from modifying other rows before insertion."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(row?: DataRow) => void"
    },
    {
      "name": "_enter",
      "type": "(row: DataRow, fields: readonly string[], kind?: string) => DataEditContext",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Extends this immutable causal chain; checks only fields that actually change."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
        {
          "name": "row",
          "type": "DataRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "fields",
          "type": "readonly string[]",
          "optional": false,
          "description": ""
        },
        {
          "name": "kind",
          "type": "string",
          "optional": true,
          "defaultValue": "\"update\"",
          "description": ""
        }
      ],
      "returns": {
        "type": "DataEditContext",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: DataRow, fields: readonly string[], kind?: string) => DataEditContext"
    }
  ]
};
