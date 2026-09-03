import type { VNode } from "../../core/e";
import type { DataCell, DataCellStyle, DataColumn } from "./DataColumn";
import type { GridRow } from "./GridRow";

/** Cell context supplied to DataGrid presentation callbacks. */
export type GridCell<TRow> = Omit<DataCell<TRow>, "column" | "rowData"> & {
    /** Column definition currently rendered by DataGrid. */
    column: DataGridColumn<TRow>;
    /** Business row data. Undefined for group rows, which have no single business row. */
    rowData?: TRow;
    /** Render-ready row context, including grouping and tree state. */
    gridRow: GridRow;
};

/** DataColumn extended with DataGrid-specific cell presentation callbacks. */
export type DataGridColumn<TRow> = DataColumn<TRow> & {
    /** Provides custom style for the outer grid cell. */
    customCellStyle?(cell: GridCell<TRow>): DataCellStyle | undefined | null;
    /** Returns a VNode that replaces the default value/text display inside the grid cell wrapper. */
    renderCell?(cell: GridCell<TRow>): VNode<any>;
};
