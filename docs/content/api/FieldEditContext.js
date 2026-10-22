export default {
  "name": "FieldEditContext",
  "kind": "interface",
  "type": "FieldEditContext<TRow>",
  "description": "Original source row and field supplied to value conversion and validation.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/FieldEditContext",
  "source": "src/data/DataViewField.ts",
  "members": [
    {
      "name": "row",
      "type": "TRow",
      "description": "Original domain row supplied by the hosting component.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "field",
      "type": "DataViewField<TRow>",
      "description": "Field whose value is being converted, displayed or validated.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "value",
      "type": "any",
      "description": "Current field value at the time the context was created.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "locale",
      "type": "string | undefined",
      "description": "Resolved locale supplied by the host; conversion callbacks may use it explicitly.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "localization",
      "type": "Localization | undefined",
      "description": "Host message context, forwarded to built-in/custom editors. Omission uses Localization.default.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    }
  ]
};
