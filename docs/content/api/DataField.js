export default {
  "name": "DataField",
  "kind": "interface",
  "type": "DataField<TRow>",
  "description": "Describes how to read and process a field from any row type.\nIndependent of UI presentation and of DataSet/DataTable membership.\nDataViewField adds presentation; DataGridColumn adds grid-specific behavior.",
  "tags": [
    {
      "name": "example",
      "text": "const amount: DataField<Order> = {\n    name: \"amount\", dataType: \"number\", getValue: row => row.amount\n};"
    }
  ],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataField",
  "source": "src/data/DataField.ts",
  "members": [
    {
      "name": "name",
      "type": "string",
      "description": "Data member name; local operations also use it as the field identifier.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataField.ts",
      "kind": "property"
    },
    {
      "name": "dataType",
      "type": "DataType | undefined",
      "description": "Semantic value type. Independent of the editor used to display or edit the field.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataField.ts",
      "kind": "property"
    },
    {
      "name": "getValue",
      "type": "((row: TRow) => any | Promise<any>) | undefined",
      "description": "Reads a value synchronously or asynchronously. Omit to read the row member.\nAccessors must not mutate data: local queries may reuse a field value for\nseveral summaries while processing the same row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "any | Promise<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => any | Promise<any>) | undefined"
    },
    {
      "name": "groupInterval",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").GroupInterval | undefined",
      "description": "Built-in or source-defined grouping interval.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataField.ts",
      "kind": "property"
    }
  ]
};
