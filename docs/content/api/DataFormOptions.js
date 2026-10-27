export default {
  "name": "DataFormOptions",
  "kind": "interface",
  "type": "DataFormOptions<TRow>",
  "description": "Data-bound form options. A form edits one object, not a query of rows.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Dataform",
  "path": "/api-reference/DataFormOptions",
  "source": "src/components/dataform/DataForm.ts",
  "members": [
    {
      "name": "data",
      "type": "TRow",
      "description": "Object or DataRow displayed and edited by the form.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "fields",
      "type": "readonly DataViewField<TRow>[]",
      "description": "Field metadata shared with DataGrid.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "labelPosition",
      "type": "DataFormLabelPosition | undefined",
      "description": "Positions labels above controls or beside them. Defaults to top.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "layout",
      "type": "DataFormLayout | undefined",
      "description": "Optional visual rows. Omission renders all fields vertically; keyboard traversal follows layout order.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "groupState",
      "type": "ReadonlyMap<string, boolean> | undefined",
      "description": "Restored collapsed states by group ID. Read once on construction; obtain updates with getGroupState().",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "surface",
      "type": "\"none\" | \"default\" | undefined",
      "description": "Controls the form container chrome. `none` removes its frame, background and padding for embedded forms.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "allowEdit",
      "type": "boolean | undefined",
      "description": "Prevents entering field editors. Defaults to true.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "onCommit",
      "type": "((row: TRow, field: DataViewField<TRow>, value: any) => void | Promise<void>) | undefined",
      "description": "Optional notification after a field has been accepted.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "adapter",
      "type": "DataFormAdapter<TRow> | undefined",
      "description": "Explicit adapter for proxy/domain objects.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    }
  ]
};
