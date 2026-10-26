export default {
  "name": "DataFormAdapter",
  "kind": "interface",
  "type": "DataFormAdapter<TRow>",
  "description": "Reads and accepts one form row. DataForm supplies a default adapter for plain objects and DataRow.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Dataform",
  "path": "/api-reference/DataFormAdapter",
  "source": "src/components/dataform/DataForm.ts",
  "members": [
    {
      "name": "getValue",
      "type": "(row: TRow, field: DataViewField<TRow>) => any | Promise<any>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "field",
          "type": "DataViewField<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "any | Promise<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: TRow, field: DataViewField<TRow>) => any | Promise<any>"
    },
    {
      "name": "getText",
      "type": "(row: TRow, field: DataViewField<TRow>, value: any, locale?: string) => string | Promise<string>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "field",
          "type": "DataViewField<TRow>",
          "optional": false,
          "description": ""
        },
        {
          "name": "value",
          "type": "any",
          "optional": false,
          "description": ""
        },
        {
          "name": "locale",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "string | Promise<string>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: TRow, field: DataViewField<TRow>, value: any, locale?: string) => string | Promise<string>"
    },
    {
      "name": "setValue",
      "type": "(row: TRow, field: DataViewField<TRow>, value: any) => Promise<void>",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/dataform/DataForm.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "field",
          "type": "DataViewField<TRow>",
          "optional": false,
          "description": ""
        },
        {
          "name": "value",
          "type": "any",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(row: TRow, field: DataViewField<TRow>, value: any) => Promise<void>"
    }
  ]
};
