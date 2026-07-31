import { DataFilter } from "../../data/filter";
import { DataColumn, DataColumnUtils, OrderByToken } from "./DataColumn";
import { DataSource } from "./DataSource";

/** Discriminates how a GridRow should be rendered. */
export type RowType = 'data' | 'group' | 'node' | 'summary' | 'loading' | 'error' | 'empty' | 'header' | 'filter' | 'footer' | 'detail';

/** A single flattened, render-ready row produced by a GridRowsProvider. */
export interface GridRow {
    /** Deterministic, unique string key (e.g., "group:USA|city:New York") */
    key?: string;
    /** Discriminates how this row should be rendered. */
    type: RowType;
    /** Absolute, monotonic row index within the flattened result set. */
    visibleIndex: number;
    /** The visible index of the parent row in the flattened result set, if this row is a child of a group or tree node. */
    parentRowIndex?: number;
    /** The raw business data or group metadata. */
    data?: any;
    /** Indentation depth for tree UI positioning. */
    level: number;
    /** Display label, primarily used for group rows. */
    text?: string;
    /** True if this row can be expanded/collapsed (e.g. a group row). */
    expandable?: boolean;
    /** Current expand/collapse state, meaningful only when expandable. */
    expanded?: boolean;
    /** Pre-resolved cell values keyed by column name. */
    cells?: Record<string, any>
}

/** A page of rows returned by a GridRowsProvider for a requested viewport. */
export interface GridResult {
    /** Combined count of all currently visible items (headers + visible children) */
    totalCount: number;
    /** Slice of data fitting the viewport */
    rows: GridRow[];
}

/**
 * What the Grid UI Viewport requests from the GridRowsProvider
 */
export interface GridViewportArgs {
    /** Global scroll index start */
    skip: number;
    /** Viewport item count limit */
    top: number;
    /** Allows an in-flight load to be cancelled. */
    signal?: AbortSignal;
}

/** Supplies flattened rows for a viewport and manages per-row expand/collapse state (e.g. groups). */
export interface GridRowsProvider<TRow> {
    load: (args: GridViewportArgs) => Promise<GridResult>;
    setExpanded: (row: GridRow, expanded: boolean) => Promise<void>;
}
