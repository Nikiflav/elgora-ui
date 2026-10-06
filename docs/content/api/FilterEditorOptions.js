export default {
  "name": "FilterEditorOptions",
  "kind": "interface",
  "type": "FilterEditorOptions<TRow>",
  "description": "",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/FilterEditorOptions",
  "source": "src/components/datagrid/FilterEditor.ts",
  "members": [
    {
      "name": "columns",
      "type": "FilterEditorColumn<TRow>[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    },
    {
      "name": "filter",
      "type": "DataFilter | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    },
    {
      "name": "onApply",
      "type": "((filter: DataFilter | undefined, editor: FilterEditor<TRow>) => void) | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    },
    {
      "name": "onCancel",
      "type": "((editor: FilterEditor<TRow>) => void) | undefined",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    }
  ]
};
