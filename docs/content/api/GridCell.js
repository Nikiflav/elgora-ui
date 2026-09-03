export default {
  "name": "GridCell",
  "kind": "type",
  "type": "any",
  "description": "Cell context supplied to DataGrid presentation callbacks.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/GridCell",
  "source": "src/components/datagrid/DataGridColumn.ts",
  "definition": "Omit<DataCell<TRow>, \"column\" | \"rowData\"> & {\n    /** Column definition currently rendered by DataGrid. */\n    column: DataGridColumn<TRow>;\n    /** Business row data. Undefined for group rows, which have no single business row. */\n    rowData?: TRow;\n    /** Render-ready row context, including grouping and tree state. */\n    gridRow: GridRow;\n}"
};
