export default {
  "name": "DataViewField",
  "kind": "interface",
  "type": "DataViewField<TRow>",
  "description": "Presentation of a data field in a form, card, list or grid.\nExtends data-access metadata with labels, formatting, editors and lookup options.\nGrid layout and rendering belong to DataGridColumn.",
  "tags": [
    {
      "name": "example",
      "text": "const product: DataViewField<Order> = {\n    name: \"product\", dataType: \"string\", caption: \"Product\", required: true\n};"
    }
  ],
  "topics": [],
  "group": "types",
  "namespace": "Data",
  "path": "/api-reference/DataViewField",
  "source": "src/data/DataViewField.ts",
  "members": [
    {
      "name": "caption",
      "type": "string | undefined",
      "description": "Display label; falls back to `name` when unset.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "description",
      "type": "string | undefined",
      "description": "Field description, available to consumers as a tooltip or help text.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "userState",
      "type": "any",
      "description": "Opaque, caller-defined presentation metadata (not used internally).",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "editorType",
      "type": "EditorType | undefined",
      "description": "UI editor type used when the value is edited.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "readonly",
      "type": "boolean | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "required",
      "type": "boolean | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "hideLabel",
      "type": "boolean | undefined",
      "description": "Whether a card/form consumer should omit the field label.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "kind": "property"
    },
    {
      "name": "showInRow",
      "type": "((row: TRow) => boolean) | undefined",
      "description": "Whether a card/form consumer should display this field for the row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => boolean) | undefined"
    },
    {
      "name": "getText",
      "type": "((row: TRow) => Promise<string>) | undefined",
      "description": "Reads this column's display text for a row; defaults to stringifying getValue().",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<string>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow) => Promise<string>) | undefined"
    },
    {
      "name": "setValue",
      "type": "((row: TRow, value: any) => Promise<any>) | undefined",
      "description": "Writes this column's raw value onto a row; defaults to setting `row[name]`.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
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
        "type": "Promise<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow, value: any) => Promise<any>) | undefined"
    },
    {
      "name": "setText",
      "type": "((row: TRow, text: string) => Promise<any>) | undefined",
      "description": "Parses and writes a display-text edit onto a row.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "text",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<any>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row: TRow, text: string) => Promise<any>) | undefined"
    },
    {
      "name": "getAllowedValues",
      "type": "((row?: TRow, search?: string, top?: number, skip?: number) => Promise<DisplayValue[]>) | undefined",
      "description": "Fetches the allowed-value list for dropdown-style editing/filtering.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "search",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "top",
          "type": "number | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "skip",
          "type": "number | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<DisplayValue[]>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row?: TRow, search?: string, top?: number, skip?: number) => Promise<DisplayValue[]>) | undefined"
    },
    {
      "name": "getAllowedValueText",
      "type": "((row?: TRow) => Promise<string | undefined>) | undefined",
      "description": "Resolves display text for a given value, without loading the full allowed-value list.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/data/DataViewField.ts",
      "parameters": [
        {
          "name": "row",
          "type": "TRow | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<string | undefined>",
        "description": ""
      },
      "kind": "method",
      "signature": "((row?: TRow) => Promise<string | undefined>) | undefined"
    }
  ]
};
