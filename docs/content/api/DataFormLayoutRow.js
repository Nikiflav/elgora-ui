export default {
  "name": "DataFormLayoutRow",
  "kind": "interface",
  "type": "DataFormLayoutRow",
  "description": "A row of fields. Flex supports arbitrary item counts; grid distributes twelve columns.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Dataform",
  "path": "/api-reference/DataFormLayoutRow",
  "source": "src/components/dataform/DataForm.ts",
  "members": [
    {
      "name": "ui",
      "type": "UiStyle | UiStyle[] | undefined",
      "description": "Typed utility styles applied to the row container.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "display",
      "type": "\"grid\" | \"flex\" | undefined",
      "description": "Defaults to flex.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "wrap",
      "type": "boolean | undefined",
      "description": "Flex wrapping defaults to true. False keeps one horizontally scrollable row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "labelPosition",
      "type": "DataFormLabelPosition | undefined",
      "description": "Row-specific label placement.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "fields",
      "type": "readonly DataFormLayoutItem[]",
      "description": "Ordered field placements. Unlisted fields are omitted from the layout.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    }
  ]
};
