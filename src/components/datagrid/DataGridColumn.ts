import type { VNode } from "../../core/e";
import type { DataCell, DataViewField } from "../../data/DataViewField";
import type { StyleObject } from "../../core/e";
import type { SummaryType } from "../../data/summary";
import type { GridContextMenuItems } from "./DataGridContextMenu";
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

/** Presentation and interaction of a field as a column in DataGrid. */
export interface DataGridColumn<TRow> extends DataViewField<TRow> {
    /** Column width in pixels. Omit to let the grid measure it. */
    width?: number;
    /** Alignment of the grid cell content. */
    textAlign?: "start" | "center" | "end";
    /** Whether the user can resize this column. */
    resizable?: boolean;
    /** Whether the user can reorder this column. */
    reorderable?: boolean;
    /** Relative ordering hint among grid columns. */
    logicalOrder?: number;
    /** Context-menu items for cells in this column. */
    contextMenuItems?: GridContextMenuItems<TRow>;
    /** Context-menu items for this column's header. */
    headerContextMenuItems?: GridContextMenuItems<TRow>;
    /** Provides custom style for the outer grid cell. */
    customCellStyle?(cell: GridCell<TRow>): DataCellStyle | undefined | null;
    /** Returns a VNode that replaces the default value/text display inside the grid cell wrapper. */
    renderCell?(cell: GridCell<TRow>): VNode<any>;
};

/** Per-cell visual overrides applied to the outer grid cell. */
export type DataCellStyle = {
    /** Additional classes for the outer grid cell. */
    className?: string;
    /** Inline styles, including CSS custom properties such as --elg-grid-cell-bg. */
    style?: StyleObject;
};

/** Lightweight per-column override, e.g. for persisted layout/visible-column state. */
export type DataGridColumnLayoutInfo = {
    name: string,
    width?: number;
    summaryType?: SummaryType;
    userState?: any;
}
