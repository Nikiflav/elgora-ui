export default {
  "name": "DataTableOptions",
  "kind": "interface",
  "type": "DataTableOptions",
  "description": "Configures identity lookup and initial values for new rows.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataTableOptions",
  "source": "src/data/dataset/DataTable.ts",
  "members": [
    {
      "name": "idField",
      "type": "string | undefined",
      "description": "Identity field. Default: id. String and numeric keys are both supported.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "defaults",
      "type": "Record<string, unknown> | ((table: DataTable) => Record<string, unknown> | Promise<Record<string, unknown>>) | undefined",
      "description": "Initial field values for each new row; object-valued fields retain their references.\nA factory runs for every session and may be asynchronous. createRowId supplies the identity.",
      "tags": [
        {
          "name": "example",
          "text": "defaults: () => ({ quantity: 0, createdAt: new Date(), ownerId: currentUser.id })"
        }
      ],
      "topics": [],
      "optional": true,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "equals",
      "type": "((field: string, a: unknown, b: unknown) => boolean) | undefined",
      "description": "Synchronous, side-effect-free comparison used for edits and accepted-value differences.\nDefaults to Object.is. Equal values retain the current reference and emit no business events.\nMust be reflexive, symmetric and transitive. A thrown exception aborts an edit.\nIn-place object changes cannot be detected because field values are not cloned.",
      "tags": [
        {
          "name": "example",
          "text": "equals: (field, a, b) => field === \"code\"\n    ? String(a).toLowerCase() === String(b).toLowerCase()\n    : Object.is(a, b)"
        }
      ],
      "topics": [],
      "optional": true,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    },
    {
      "name": "createRowId",
      "type": "NewRowIdFactory | undefined",
      "description": "Generates new-row identities for this table, overriding the dataset generator.\nReceives this table and may return a Promise. Example: createRowId: () => crypto.randomUUID().",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/dataset/DataTable.ts",
      "kind": "property"
    }
  ]
};
