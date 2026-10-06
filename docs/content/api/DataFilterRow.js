export default {
  "name": "DataFilterRow",
  "kind": "class",
  "type": "DataFilterRow<TRow>",
  "description": "Converts a DataFilter to the compact, per-column expressions used by a filter row.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataFilterRow",
  "source": "src/components/datagrid/DataFilterRow.ts",
  "members": [
    {
      "name": "columns",
      "type": "DataFilterRowColumn<TRow>[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataFilterRow.ts",
      "kind": "property"
    },
    {
      "name": "parse",
      "type": "(field: string, text: string) => DataFilter | undefined",
      "description": "Parses one column expression into a DataFilter.",
      "tags": [
        {
          "name": "example",
          "text": "```ts\nrow.parse(\"price\", \"1..100\");\n// [\"and\", [\"price\", \">=\", 1], [\"price\", \"<=\", 100]]\n\nrow.parse(\"price\", \"500..\");\n// [\"price\", \">=\", 500]\n\nrow.parse(\"created\", \"..10.12.26\");\n// [\"created\", \"<=\", new Date(2026, 11, 10)]\n\nrow.parse(\"name\", \"\\\\=abc\");\n// [\"name\", \"contains\", \"=abc\"]\n```"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataFilterRow.ts",
      "parameters": [
        {
          "name": "field",
          "type": "string",
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
        "type": "DataFilter | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(field: string, text: string) => DataFilter | undefined"
    },
    {
      "name": "toFilter",
      "type": "(values: readonly DataFilterRowValue[]) => DataFilter | undefined",
      "description": "Combines the current filter-row values into an implicit AND filter.",
      "tags": [
        {
          "name": "example",
          "text": "```ts\nrow.toFilter([\n  { field: \"name\", text: \"phone\" },\n  { field: \"price\", text: \">=100\" }\n]);\n// [\"and\", [\"name\", \"contains\", \"phone\"], [\"price\", \">=\", 100]]\n```"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataFilterRow.ts",
      "parameters": [
        {
          "name": "values",
          "type": "readonly DataFilterRowValue[]",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataFilter | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(values: readonly DataFilterRowValue[]) => DataFilter | undefined"
    },
    {
      "name": "fromFilter",
      "type": "(filter?: DataFilter) => DataFilterRowValue[] | false",
      "description": "Formats a simple filter as one expression per column.\nReturns `false` when OR, negation, selectors, or ambiguous conditions are present.",
      "tags": [
        {
          "name": "example",
          "text": "```ts\nrow.fromFilter([\"and\", [\"name\", \"contains\", \"phone\"], [\"price\", \">=\", 100]]);\n// [{ field: \"name\", text: \"phone\" }, { field: \"price\", text: \"100..\" }]\n\nrow.fromFilter([\"or\", [\"name\", \"=\", \"phone\"], [\"name\", \"=\", \"tablet\"]]);\n// false"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataFilterRow.ts",
      "parameters": [
        {
          "name": "filter",
          "type": "DataFilter | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataFilterRowValue[] | false",
        "description": ""
      },
      "kind": "method",
      "signature": "(filter?: DataFilter) => DataFilterRowValue[] | false"
    },
    {
      "name": "toText",
      "type": "(filter?: DataFilter) => string",
      "description": "Formats any supported filter, including OR and nested groups, as readable text.",
      "tags": [
        {
          "name": "example",
          "text": "```ts\nrow.toText([\"or\", [\"region\", \"contains\", \"123\"], [\"product\", \"=\", \"567\"]]);\n// \"Region contains '123' or Product = '567'\"\n```"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataFilterRow.ts",
      "parameters": [
        {
          "name": "filter",
          "type": "DataFilter | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "string",
        "description": ""
      },
      "kind": "method",
      "signature": "(filter?: DataFilter) => string"
    }
  ]
};
