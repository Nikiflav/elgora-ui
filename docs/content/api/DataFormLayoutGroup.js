export default {
  "name": "DataFormLayoutGroup",
  "kind": "interface",
  "type": "DataFormLayoutGroup",
  "description": "Named section containing ordinary layout rows. IDs preserve disclosure state across form recreation.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Dataform",
  "path": "/api-reference/DataFormLayoutGroup",
  "source": "src/components/dataform/DataForm.ts",
  "members": [
    {
      "name": "id",
      "type": "string",
      "description": "Unique group identity, independent from its translated title.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "title",
      "type": "string",
      "description": "Visible and accessible section heading.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "collapsible",
      "type": "boolean | undefined",
      "description": "Allows keyboard and pointer disclosure through a native details/summary control.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "collapsed",
      "type": "boolean | undefined",
      "description": "Initial state when groupState does not contain this ID. Defaults to false.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "ui",
      "type": "UiStyle | UiStyle[] | undefined",
      "description": "Utility styles on the section container.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "rows",
      "type": "readonly DataFormLayoutRow[]",
      "description": "Ordered rows within the group.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    }
  ]
};
