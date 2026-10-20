export default {
  "name": "DataGridColumnLayoutInfo",
  "kind": "type",
  "type": "any",
  "description": "Lightweight per-column override, e.g. for persisted layout/visible-column state.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataGridColumnLayoutInfo",
  "source": "src/components/datagrid/DataGridColumn.ts",
  "definition": "{\n    /** Column name identifying the definition to override. */\n    name: string,\n    /** Persisted or caller-provided width in CSS pixels. */\n    width?: number;\n    /** Optional aggregation associated with this column's layout entry. */\n    summaryType?: SummaryType;\n    /** Opaque application state retained alongside the layout entry. */\n    userState?: any;\n}"
};
