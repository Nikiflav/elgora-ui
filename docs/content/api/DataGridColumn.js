export default {
  "name": "DataGridColumn",
  "kind": "type",
  "type": "any",
  "description": "DataColumn extended with DataGrid-specific cell presentation callbacks.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataGridColumn",
  "source": "src/components/datagrid/DataGridColumn.ts",
  "definition": "DataColumn<TRow> & {\n    /** Provides custom style for the outer grid cell. */\n    customCellStyle?(cell: GridCell<TRow>): DataCellStyle | undefined | null;\n    /** Returns a VNode that replaces the default value/text display inside the grid cell wrapper. */\n    renderCell?(cell: GridCell<TRow>): VNode<any>;\n}"
};
