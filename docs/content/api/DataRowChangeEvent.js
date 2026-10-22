export default {
  "name": "DataRowChangeEvent",
  "kind": "interface",
  "type": "DataRowChangeEvent",
  "description": "Business-rule notification delivered inside the current transaction, never during undo/redo.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataRowChangeEvent",
  "source": "src/data/dataset/DataEditContext.ts",
  "members": [
    {
      "name": "kind",
      "type": "\"cancel\" | \"create\" | \"update\" | \"insert\" | \"delete\"",
      "description": "The local operation being validated or processed by a business rule.\n\n- create: createNewRow() initialized a pending row. It is not in table.rows or query/save\n  results yet. Only rowChanged emits this kind, after identity and defaults are available.\n- update: one or more field values change, on either a confirmed or pending row.\n  rowChanging sees proposed values; rowChanged sees applied values.\n- insert: NewRowSession.insert() includes the pending row in its table.\n  rowChanging sees isPending === true; rowChanged sees isPending === false.\n  This is local insertion, not a server save; the row remains in added state.\n- delete: table.delete() marks a confirmed row deleted, or removes an unsaved added row.\n  Pending rows must be cancelled instead of deleted.\n- cancel: NewRowSession.cancel() discards a pending row without inserting it.\n  rowChanging sees the pending session; rowChanged sees the cancelled session.\n\ncreate and insert are separate steps: a user can fill in a created draft, then insert\nit or cancel it. Lifecycle kinds have empty fields; only update identifies changed fields.\nBusiness events do not emit reset and are not invoked during undo/redo or import.",
      "tags": [
        {
          "name": "example",
          "text": "table.rowChanged.subscribe(async e => {\n    if (e.kind === \"create\") {\n        await e.context.setValue(e.row, \"quantity\", 1); // initialize the draft\n    } else if (e.kind === \"insert\") {\n        await updateRelatedTotals(e.context); // the row now participates in table queries\n    }\n});"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "kind": "property"
    },
    {
      "name": "row",
      "type": "DataRow",
      "description": "Actual affected row; use context for edits that must join this transaction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "kind": "property"
    },
    {
      "name": "fields",
      "type": "readonly string[]",
      "description": "Names of fields that actually change for update; empty for create, insert, delete and cancel.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "kind": "property"
    },
    {
      "name": "oldValues",
      "type": "Readonly<Record<string, unknown>>",
      "description": "Previous values of changed fields for updates; the row's values for lifecycle operations.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "kind": "property"
    },
    {
      "name": "values",
      "type": "Readonly<Record<string, unknown>>",
      "description": "Proposed values before an update, applied values after it; field values are not cloned.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "kind": "property"
    },
    {
      "name": "context",
      "type": "DataEditContext",
      "description": "Transaction-bound editing API for applying derived changes, including edits to related rows.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "kind": "property"
    },
    {
      "name": "reject",
      "type": "(error: string, fieldErrors?: Record<string, string>) => void",
      "description": "Rejects the complete transaction. Example: e.reject(\"Quantity must be positive\").",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataEditContext.ts",
      "parameters": [
        {
          "name": "error",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "fieldErrors",
          "type": "Record<string, string> | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(error: string, fieldErrors?: Record<string, string>) => void"
    }
  ]
};
