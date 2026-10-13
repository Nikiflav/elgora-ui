export default {
  "name": "evalFilter",
  "kind": "function",
  "type": "(item: Record<string, any>, filter: DataFilter, functions?: FilterFunctionRegistry) => boolean",
  "description": "Evaluates a filter against one row. Empty filters match every row.\nSupply custom functions to resolve selectors such as { function: \"category\", field: \"code\" }.",
  "tags": [
    {
      "name": "example",
      "text": "rows.filter(row => evalFilter(row, [\"quantity\", \">=\", 10]));"
    }
  ],
  "topics": [],
  "group": "core",
  "namespace": "Data",
  "path": "/api-reference/evalFilter",
  "source": "src/data/filter.ts",
  "parameters": [
    {
      "name": "item",
      "type": "Record<string, any>",
      "optional": false,
      "description": ""
    },
    {
      "name": "filter",
      "type": "DataFilter",
      "optional": false,
      "description": ""
    },
    {
      "name": "functions",
      "type": "FilterFunctionRegistry | undefined",
      "optional": true,
      "description": ""
    }
  ],
  "returns": {
    "type": "boolean",
    "description": ""
  }
};
