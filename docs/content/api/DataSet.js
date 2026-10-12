export default {
  "name": "DataSet",
  "kind": "class",
  "type": "DataSet",
  "description": "Manages named tables and saves their pending changes as one application-defined batch.\nEdit rows through their tables, then call saveChanges() to persist and accept the batch.\nUse rejectChanges() to restore accepted values without sending a request.\nBefore saving, finish active field edits and explicitly insert each new-row session\nthat should be included. To discard edits, cancel pending sessions before rejecting.\nsaveChanges(), acceptChanges() and rejectChanges() throw if any table has a pending\nsession or an unfinished createNewRow() request. They never insert or cancel it automatically.\nEach successful edit and its business effects form one undo operation; failed edits add none.\nUndo/redo restores recorded versions without rerunning business rules.\nSaving, accepting, rejecting or importing refreshed rows clears this dataset's history only.",
  "tags": [
    {
      "name": "example",
      "text": "const dataset = new DataSet({ createRowId: () => crypto.randomUUID() });\nconst orders = dataset.createTable(\"orders\", [{ id: 1, quantity: 2 }]);\nawait orders.rows[0].setValue(\"quantity\", 3);\nawait dataset.undoCoordinator.undo();\nawait dataset.undoCoordinator.redo();"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/DataSet",
  "source": "src/data/dataset/DataSet.ts",
  "members": [
    {
      "name": "undoCoordinator",
      "type": "UndoCoordinator",
      "description": "Coordinator shared with tables; call undo()/redo() here, never on individual history scopes.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "kind": "property"
    },
    {
      "name": "undoHistory",
      "type": "UndoHistory",
      "description": "This dataset's history scope; save/discard clears only this scope.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "kind": "property"
    },
    {
      "name": "createRowId",
      "type": "NewRowIdFactory | undefined",
      "description": "Default identity generator passed the requesting table; table-level generators take priority.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/dataset/DataSet.ts",
      "kind": "property"
    },
    {
      "name": "tables",
      "type": "readonly DataTable[]",
      "description": "Registered tables in creation order; modifying this list cannot change the dataset.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "kind": "property"
    },
    {
      "name": "isSaving",
      "type": "boolean",
      "description": "True while persistence and acceptance are running; editing is blocked during that time.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "kind": "property"
    },
    {
      "name": "createTable",
      "type": "(name: string, values?: readonly Record<string, unknown>[], options?: DataTableOptions) => DataTable",
      "description": "Creates a named table. Example: createTable(\"orders\", [], { idField: \"orderId\" }).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "values",
          "type": "readonly Record<string, unknown>[]",
          "optional": true,
          "defaultValue": "[]",
          "description": ""
        },
        {
          "name": "options",
          "type": "DataTableOptions | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataTable",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string, values?: readonly Record<string, unknown>[], options?: DataTableOptions) => DataTable"
    },
    {
      "name": "getTable",
      "type": "(name: string) => DataTable | undefined",
      "description": "Looks up an existing table; missing names return undefined.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
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
      "name": "getChanges",
      "type": "() => DataSetChanges",
      "description": "Returns copied change containers without cloning field values, excluding pending sessions.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [],
      "returns": {
        "type": "DataSetChanges",
        "description": ""
      },
      "kind": "method",
      "signature": "() => DataSetChanges"
    },
    {
      "name": "acceptChanges",
      "type": "() => void",
      "description": "Accepts values that have already been persisted externally; does not send a request.\nAll new-row sessions must first be inserted or cancelled, and createNewRow() calls awaited.\nThrows before changing any table if a session or identity request is still pending.\nDo not accept a newly inserted row unless it was included in the successful external save.\nsaveChanges() performs acceptance automatically after a successful save.",
      "tags": [
        {
          "name": "example",
          "text": "await persist(dataset.getChanges());\ndataset.acceptChanges();"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
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
      "description": "Restores accepted values and removes confirmed, unsaved insertions without a server request.\nExplicitly cancel pending new-row sessions first; this method does not cancel them.\nThrows before changing any table if any new-row session or identity request is pending.",
      "tags": [
        {
          "name": "example",
          "text": "for (const newRowSession of newRowSessions) {\n    if (newRowSession.state === \"pending\") await newRowSession.cancel();\n}\ndataset.rejectChanges();"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "saveChanges",
      "type": "(save: DataSetSaveHandler) => Promise<DataSetSaveChangesResult>",
      "description": "Sends one dataset-wide batch; failures retain edits, success accepts the new baseline.\nNo changes means no request. Editing is blocked while awaiting the application callback.\nAll ID mappings are validated before applying any; row object references are preserved.\nKey mappings update row identities only. Related field values must be updated by the application.\n\nA Save action should finish active field edits, await outstanding createNewRow() calls,\nthen explicitly insert the sessions to include. Check each insert result before saving.\nA failed insert must stop the Save action so the user can correct or cancel that row.\nThis method throws before calling save if any table still has a pending session or\nidentity request, even when getChanges() is empty. No sessions are inserted automatically.\nIf several views share the dataset, coordinate their pending sessions before saving.",
      "tags": [
        {
          "name": "example",
          "text": "await dataset.saveChanges(async changes => api.save(changes));\n// Success may return { success: true, keyMappings: { orders: [\n//     { temporaryKey: \"client-id\", key: 123 }\n// ] } }."
        },
        {
          "name": "example",
          "text": "// Application-provided UI and persistence callbacks:\nasync function onSaveClick() {\n    try {\n        if (!await finishActiveCellEdit()) return;\n        // newRowSessions contains session handles from completed createNewRow() calls.\n        for (const newRowSession of newRowSessions) {\n            if (newRowSession.state !== \"pending\") continue;\n            const result = await newRowSession.insert();\n            if (!result.success) {\n                showError(result.error);\n                return;\n            }\n        }\n        const result = await dataset.saveChanges(changes => api.save(changes));\n        if (!result.success) showError(result.error);\n    } catch (error) {\n        showError(error instanceof Error ? error.message : String(error));\n    }\n}\nsaveButton.addEventListener(\"click\", onSaveClick);\n\n// A successful local insert remains in getChanges() if the later save fails.\n// Correct the data and retry Save, or explicitly reject the confirmed changes."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [
        {
          "name": "save",
          "type": "DataSetSaveHandler",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<DataSetSaveChangesResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(save: DataSetSaveHandler) => Promise<DataSetSaveChangesResult>"
    },
    {
      "name": "transaction",
      "type": "(label: string, operation: (tx: DataTransaction) => void | MutationResult | Promise<void | MutationResult>) => Promise<MutationResult>",
      "description": "Applies a named edit across tables that succeeds or is rolled back as a whole.\nUse only the supplied tx for mutations.\nValidation failure returns success:false; exceptions reject. Both restore all affected rows.\nUI notifications run only after success. Observer errors do not roll back committed edits.\nAwait context operations. Save, import, acceptance and unrelated edits are blocked while active.\ntx.context provides dataset access with edits bound to this transaction.\nAll direct and business-rule edits are recorded as one operation on success.",
      "tags": [
        {
          "name": "example",
          "text": "await dataset.transaction(\"Change quantities\", async tx => {\n    await tx.update(orders, firstRow, { quantity: 5 });\n    await tx.update(orders, secondRow, { quantity: 10 });\n});"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [
        {
          "name": "label",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "operation",
          "type": "(tx: DataTransaction) => void | MutationResult | Promise<void | MutationResult>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<MutationResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(label: string, operation: (tx: DataTransaction) => void | MutationResult | Promise<void | MutationResult>) => Promise<MutationResult>"
    },
    {
      "name": "_mutate",
      "type": "<T>(operation: string, transaction: DataTransaction | undefined, mutation: (tx: DataTransaction) => T | Promise<T>, rejected?: (result: Extract<MutationResult, { success: false; }>) => T) => Promise<T>",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Executes a mutation in its supplied context, or creates an independent transaction."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [
        {
          "name": "operation",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "transaction",
          "type": "DataTransaction | undefined",
          "optional": false,
          "description": ""
        },
        {
          "name": "mutation",
          "type": "(tx: DataTransaction) => T | Promise<T>",
          "optional": false,
          "description": ""
        },
        {
          "name": "rejected",
          "type": "((result: Extract<MutationResult, { success: false; }>) => T) | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<T>",
        "description": ""
      },
      "kind": "method",
      "signature": "<T>(operation: string, transaction: DataTransaction | undefined, mutation: (tx: DataTransaction) => T | Promise<T>, rejected?: (result: Extract<MutationResult, { success: false; }>) => T) => Promise<T>"
    },
    {
      "name": "_clearHistory",
      "type": "() => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Establishes a new dataset history baseline without clearing other application scopes."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "_restoreHistory",
      "type": "(restorations: readonly (() => void)[]) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Restores recorded versions without business events or additional history entries."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [
        {
          "name": "restorations",
          "type": "readonly (() => void)[]",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(restorations: readonly (() => void)[]) => void"
    },
    {
      "name": "_ensureTransaction",
      "type": "(transaction: DataTransaction) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Rejects foreign or completed transaction contexts."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [
        {
          "name": "transaction",
          "type": "DataTransaction",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(transaction: DataTransaction) => void"
    },
    {
      "name": "ensureEditable",
      "type": "(operation: string, transaction?: DataTransaction) => void",
      "description": "",
      "tags": [
        {
          "name": "internal",
          "text": "Checks save, transaction ownership and notification reentrancy before mutations."
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/data/dataset/DataSet.ts",
      "parameters": [
        {
          "name": "operation",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "transaction",
          "type": "DataTransaction | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(operation: string, transaction?: DataTransaction) => void"
    }
  ]
};
