export default {
  "name": "SummaryDefinition",
  "kind": "interface",
  "type": "SummaryDefinition<TRow, TState, TResult>",
  "description": "Defines a locally calculated summary identified by its serializable name.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/SummaryDefinition",
  "source": "src/components/datagrid/DataColumn.ts",
  "members": [
    {
      "name": "name",
      "type": "string",
      "description": "Name used in `SummaryType` requests.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataColumn.ts",
      "kind": "property"
    },
    {
      "name": "text",
      "type": "string",
      "description": "Display text for summary selectors and documentation.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataColumn.ts",
      "kind": "property"
    },
    {
      "name": "start",
      "type": "(context: SummaryContext<TRow>) => TState | Promise<TState>",
      "description": "Creates the accumulator state for one group and field.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataColumn.ts",
      "parameters": [
        {
          "name": "context",
          "type": "SummaryContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "TState | Promise<TState>",
        "description": ""
      },
      "kind": "method",
      "signature": "(context: SummaryContext<TRow>) => TState | Promise<TState>"
    },
    {
      "name": "accumulate",
      "type": "(state: TState, value: any, row: TRow, context: SummaryContext<TRow>) => void | TState | Promise<void | TState>",
      "description": "Adds one row value to the accumulator. Returning a value replaces the state.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataColumn.ts",
      "parameters": [
        {
          "name": "state",
          "type": "TState",
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
          "name": "row",
          "type": "TRow",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "SummaryContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void | TState | Promise<void | TState>",
        "description": ""
      },
      "kind": "method",
      "signature": "(state: TState, value: any, row: TRow, context: SummaryContext<TRow>) => void | TState | Promise<void | TState>"
    },
    {
      "name": "finalize",
      "type": "(state: TState, context: SummaryContext<TRow>) => TResult | Promise<TResult>",
      "description": "Converts the final accumulator state into the value displayed by the group row.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataColumn.ts",
      "parameters": [
        {
          "name": "state",
          "type": "TState",
          "optional": false,
          "description": ""
        },
        {
          "name": "context",
          "type": "SummaryContext<TRow>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "TResult | Promise<TResult>",
        "description": ""
      },
      "kind": "method",
      "signature": "(state: TState, context: SummaryContext<TRow>) => TResult | Promise<TResult>"
    }
  ]
};
