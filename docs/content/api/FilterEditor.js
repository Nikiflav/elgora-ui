export default {
  "name": "FilterEditor",
  "kind": "class",
  "type": "FilterEditor<TRow>",
  "description": "A reusable builder for structured DataFilter expressions.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/FilterEditor",
  "source": "src/components/datagrid/FilterEditor.ts",
  "members": [
    {
      "name": "getFilter",
      "type": "() => DataFilter | undefined",
      "description": "Returns the currently edited filter, or undefined when no condition exists.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/FilterEditor.ts",
      "parameters": [],
      "returns": {
        "type": "DataFilter | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "() => DataFilter | undefined"
    },
    {
      "name": "setFilter",
      "type": "(filter?: DataFilter) => void",
      "description": "Replaces the editor state without invoking the apply callback.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/FilterEditor.ts",
      "parameters": [
        {
          "name": "filter",
          "type": "DataFilter | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(filter?: DataFilter) => void"
    },
    {
      "name": "apply",
      "type": "() => void",
      "description": "Applies the current draft filter.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/FilterEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "cancel",
      "type": "() => void",
      "description": "Discards the current draft and notifies the cancel callback.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/FilterEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "clear",
      "type": "() => void",
      "description": "Clears the draft and applies an empty filter.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/FilterEditor.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
