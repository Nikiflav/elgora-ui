export default {
  "name": "DataRow",
  "kind": "class",
  "type": "DataRow",
  "description": "Represents one table row with current values, accepted values and persistence state.\nRead values with getValue() and change them with setValue() or table.update().\nObjects, arrays and dates are stored and returned by reference; field values are not cloned.\nReplace a field value to track an edit. In-place changes are not tracked or rolled back.",
  "tags": [
    {
      "name": "example",
      "text": "const row = table.getRow(1)!;\nawait row.setValue(\"quantity\", 3);\nconsole.log(row.getOriginal(\"quantity\"), row.getValue(\"quantity\"));"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/DataRow",
  "source": "src/data/dataset/DataRow.ts",
  "members": [
    {
      "name": "table",
      "type": "DataTable",
      "description": "Owning table, including while the row is pending, cancelled or removed. Use isPending to check session membership.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "kind": "property"
    },
    {
      "name": "key",
      "type": "RowIdentity",
      "description": "Current identity; server mapping updates the key without replacing this row.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "kind": "property"
    },
    {
      "name": "state",
      "type": "DataRowState",
      "description": "Current persistence state, e.g. an added row remains added after local insert.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "kind": "property"
    },
    {
      "name": "isPending",
      "type": "boolean",
      "description": "True while this row belongs to a pending new-row session and is excluded from table queries.\nInsert or cancel makes it false; undo/redo and rollback restore it with the session state.\nFalse does not guarantee table membership: a cancelled or removed row is not pending either.",
      "tags": [
        {
          "name": "example",
          "text": "if (!event.row.isPending) {\n    await event.context.setValue(relatedRow, \"amount\", total);\n}"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "kind": "property"
    },
    {
      "name": "getValue",
      "type": "(field: string) => unknown",
      "description": "Reads the current field value without copying it. Example: row.getValue(\"quantity\").",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
        {
          "name": "field",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "unknown",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: string) => unknown"
    },
    {
      "name": "getOriginal",
      "type": "(field: string) => unknown",
      "description": "Reads the accepted value. An added row has no accepted original version.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
        {
          "name": "field",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "unknown",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: string) => unknown"
    },
    {
      "name": "isModified",
      "type": "(field: string) => boolean",
      "description": "Checks a field against its original snapshot; all present fields of an added row are new.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
        {
          "name": "field",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: string) => boolean"
    },
    {
      "name": "toObject",
      "type": "() => Record<string, unknown>",
      "description": "Returns a new field container without cloning its values; object-valued fields retain their references.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [],
      "returns": {
        "type": "Record<string, unknown>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Record<string, unknown>"
    },
    {
      "name": "changes",
      "type": "() => Record<string, unknown>",
      "description": "Returns modified field values when an original snapshot exists; otherwise returns all values.\nUse table.getChanges() to obtain persistence entries for changed rows only.",
      "tags": [
        {
          "name": "example",
          "text": "await row.setValue(\"quantity\", 3);\nrow.changes(); // { quantity: 3 }"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [],
      "returns": {
        "type": "Record<string, unknown>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Record<string, unknown>"
    },
    {
      "name": "setValue",
      "type": "(field: string, value: unknown) => Promise<MutationResult>",
      "description": "Edits through the owning table. Example: await row.setValue(\"quantity\", 3).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
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
      "signature": "(field: string, value: unknown) => Promise<MutationResult>"
    },
    {
      "name": "_applyValues",
      "type": "(values: Record<string, unknown>) => string[]",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Applies an owned patch after source validation; captures original values on first edit."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
        {
          "name": "values",
          "type": "Record<string, unknown>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string[]",
        "description": ""
      },
      "kind": "method",
      "signature": "(values: Record<string, unknown>) => string[]"
    },
    {
      "name": "_replaceValues",
      "type": "(values: Record<string, unknown>) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Replaces accepted values when importing refreshed data; row identity stays unchanged."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
        {
          "name": "values",
          "type": "Record<string, unknown>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(values: Record<string, unknown>) => void"
    },
    {
      "name": "_markDeleted",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Marks deletion; values remain available for rejectChanges()."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_acceptChanges",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Accepts the current version and releases the lazy original snapshot."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_rejectChanges",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Restores accepted values. The table separately removes unsaved added rows."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_snapshot",
      "type": "() => DataRowSnapshot",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Copies row containers and state without cloning field values."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [],
      "returns": {
        "type": "DataRowSnapshot",
        "description": ""
      },
      "kind": "method",
      "signature": "() => DataRowSnapshot"
    },
    {
      "name": "_restore",
      "type": "(snapshot: DataRowSnapshot) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Restores a captured version without invoking edits or business rules."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
        {
          "name": "snapshot",
          "type": "DataRowSnapshot",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(snapshot: DataRowSnapshot) => void"
    },
    {
      "name": "_changeId",
      "type": "(key: RowIdentity) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Applies a prevalidated server mapping without generating a user edit."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataRow.ts",
      "parameters": [
        {
          "name": "key",
          "type": "RowIdentity",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(key: RowIdentity) => void"
    }
  ]
};
