export default {
  "name": "DataFormLayoutItem",
  "kind": "interface",
  "type": "DataFormLayoutItem",
  "description": "Placement of an existing field; field metadata and validation remain shared with DataGrid.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Dataform",
  "path": "/api-reference/DataFormLayoutItem",
  "source": "src/components/dataform/DataForm.ts",
  "members": [
    {
      "name": "field",
      "type": "string",
      "description": "Name of a field in the form. Each field may appear at most once.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "ui",
      "type": "UiStyle | UiStyle[] | undefined",
      "description": "Typed utility styles applied to the field wrapper, including its label and value.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "span",
      "type": "number | undefined",
      "description": "Number of columns in a grid row (1–12). Defaults to 12.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "width",
      "type": "string | number | undefined",
      "description": "Flex item width, in pixels or a CSS length. Defaults to auto.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    },
    {
      "name": "labelPosition",
      "type": "DataFormLabelPosition | undefined",
      "description": "Overrides the row/form label placement.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/dataform/DataForm.ts",
      "kind": "property"
    }
  ]
};
