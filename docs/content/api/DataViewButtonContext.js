export default {
  "name": "DataViewButtonContext",
  "kind": "interface",
  "type": "DataViewButtonContext<TRow>",
  "description": "Context supplied to a field action callback or custom button renderer.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataViewButtonContext",
  "source": "src/data/DataViewField.ts",
  "members": [
    {
      "name": "row",
      "type": "TRow | undefined",
      "description": "Business row represented by the action; absent for synthetic/group rows.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "field",
      "type": "DataViewField<TRow>",
      "description": "Field that owns the action buttons.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "button",
      "type": "DataViewButton<TRow>",
      "description": "Button definition currently being resolved or invoked.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "any",
      "description": "Current raw field value when the host can resolve one.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "owner",
      "type": "unknown",
      "description": "DataForm or DataGrid instance that owns the rendered button.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    }
  ]
};
