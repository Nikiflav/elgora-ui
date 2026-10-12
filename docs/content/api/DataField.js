export default {
  "name": "DataField",
  "kind": "interface",
  "type": "DataField<TRow>",
  "description": "Minimal field metadata required for local data operations.\nUI column definitions can implement this structurally without coupling data engines to a grid.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataField",
  "source": "src/data/DataField.ts",
  "members": [
    {
      "name": "name",
      "type": "string",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/data/DataField.ts",
      "kind": "property"
    },
    {
      "name": "dataType",
      "type": "DataType | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataField.ts",
      "kind": "property"
    },
    {
      "name": "editorType",
      "type": "string | undefined",
      "description": "Legacy editor hint used only when no semantic dataType was provided.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataField.ts",
      "kind": "property"
    },
    {
      "name": "getValue",
      "type": "((row: TRow) => Promise<any>) | undefined",
      "description": "",
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
        "type": "Promise<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => Promise<any>) | undefined"
    },
    {
      "name": "groupInterval",
      "type": "import(\"D:/Dev/github/elgora-ui/src/index\").GroupInterval | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataField.ts",
      "kind": "property"
    },
    {
      "name": "getGroupValue",
      "type": "((row: TRow, value: any) => any | Promise<any>) | undefined",
      "description": "",
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
        },
        {
          "name": "value",
          "type": "any",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "any | Promise<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow, value: any) => any | Promise<any>) | undefined"
    }
  ]
};
