export default {
  "name": "FieldLookup",
  "kind": "interface",
  "type": "FieldLookup<TRow, TItem>",
  "description": "Shared lookup data and presentation. Items need not have a prescribed shape.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/FieldLookup",
  "source": "src/data/DataViewField.ts",
  "members": [
    {
      "name": "columns",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").DataGridColumn<TItem>[] | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "loadItems",
      "type": "(query: LookupQuery, context: FieldEditContext<TRow>) => Promise<LookupResult<TItem>>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "query",
          "type": "LookupQuery",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "FieldEditContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<LookupResult<TItem>>",
        "description": ""
      },
      "kind": "method",
      "signature": "(query: LookupQuery, context: FieldEditContext<TRow>) => Promise<LookupResult<TItem>>"
    },
    {
      "name": "getValueText",
      "type": "(value: any, context: FieldEditContext<TRow>) => string | Promise<string>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "value",
          "type": "any",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "FieldEditContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "string | Promise<string>",
        "description": ""
      },
      "kind": "method",
      "signature": "(value: any, context: FieldEditContext<TRow>) => string | Promise<string>"
    }
  ]
};
