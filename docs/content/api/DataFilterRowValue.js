export default {
  "name": "DataFilterRowValue",
  "kind": "interface",
  "type": "DataFilterRowValue",
  "description": "One text expression displayed by a filter-row column.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataFilterRowValue",
  "source": "src/components/datagrid/DataFilterRow.ts",
  "members": [
    {
      "name": "field",
      "type": "string",
      "description": "Column name identifying the field to filter.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataFilterRow.ts",
      "kind": "property"
    },
    {
      "name": "text",
      "type": "string",
      "description": "Editable compact expression, optionally prefixed by an operator; empty text clears the field filter.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataFilterRow.ts",
      "kind": "property"
    }
  ]
};
