export default {
  "name": "FilterEditorOptions",
  "kind": "interface",
  "type": "FilterEditorOptions<TRow>",
  "description": "Filter-builder fields, initial expression and explicit apply/cancel callbacks.",
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
      "description": "Fields users can choose when creating conditions.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    },
    {
      "name": "filter",
      "type": "DataFilter | undefined",
      "description": "Initial expression. Omit to start without a filter.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    },
    {
      "name": "onApply",
      "type": "((filter: DataFilter | undefined, editor: FilterEditor<TRow>) => void) | undefined",
      "description": "Receives the expression when Apply is invoked; the host decides how to apply it to data.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    },
    {
      "name": "onCancel",
      "type": "((editor: FilterEditor<TRow>) => void) | undefined",
      "description": "Receives an explicit cancellation request; the host decides whether to close the editor.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/datagrid/FilterEditor.ts",
      "kind": "property"
    }
  ]
};
