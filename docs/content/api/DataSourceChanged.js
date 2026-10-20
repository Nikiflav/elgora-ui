export default {
  "name": "DataSourceChanged",
  "kind": "interface",
  "type": "DataSourceChanged<TRow>",
  "description": "Working data changed, not necessarily persisted data. Pending rows notify too.\n`row` is the actual source object; absent row means a broader invalidation.\nSources supporting this event must notify for successful mutations and replay.\nComponents may repaint pending values without reloading/reordering the dataset.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataSourceChanged",
  "source": "src/data/DataSource.ts",
  "members": [
    {
      "name": "kind",
      "type": "\"create\" | \"update\" | \"insert\" | \"delete\" | \"cancel\" | \"reset\"",
      "description": "The completed working-data operation. For DataTable, emitted only after transaction success.\ncreate initializes a pending draft outside table queries; insert includes that draft locally\ninto the table (not to a server). update changes field values, including pending values.\ndelete removes/marks a confirmed row; cancel discards a pending draft.\nreset requests a broader repaint after undo/redo, import, acceptance or rejection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "row",
      "type": "TRow | undefined",
      "description": "Actual affected row, including pending drafts. Omitted for source-wide invalidation.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    },
    {
      "name": "fields",
      "type": "readonly string[] | undefined",
      "description": "Changed field names when known; omission means consumers must not assume a field-level change.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataSource.ts",
      "kind": "property"
    }
  ]
};
