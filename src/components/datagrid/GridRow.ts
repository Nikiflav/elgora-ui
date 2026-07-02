import { DataFilter } from "../../data/filter";
import { DataColumn, DataColumnUtils, OrderByToken } from "./DataColumn";
import { DataSource } from "./DataSource";

export type RowType = 'data' | 'group' | 'node' | 'summary' | 'loading' | 'error' | 'empty' | 'header' | 'footer' | 'detail';

export interface GridRow {
    key?: string;         // Deterministic, unique string key (e.g., "group:USA|city:New York")
    type: RowType;
    visibleIndex: number;
    data?: any;          // The raw business data or group metadata
    level: number;       // Indentation depth for tree UI positioning
    text?: string;
    expandable?: boolean;
    expanded?: boolean;
    cells?: Record<string, any>
}

export interface GridResult {
    totalCount: number;  // Combined count of all currently visible items (headers + visible children)
    rows: GridRow[];     // Slice of data fitting the viewport
}

/**
 * What the Grid UI Viewport requests from the GridRowsProvider
 */
export interface GridViewportArgs {
    skip: number;        // Global scroll index start
    top: number;         // Viewport item count limit
    signal?: AbortSignal;
}

export interface GridRowsProvider<TRow> {
    load: (args: GridViewportArgs) => Promise<GridResult>;
    setExpanded: (row: GridRow, expanded: boolean) => Promise<void>;
}
