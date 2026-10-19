import type { MenuItem } from "../popup/PopupMenu";
import type { DataGridColumn } from "./DataGridColumn";
import type { SelectionRange } from "./SelectionManager";
import type { GridRow } from "./GridRow";

/** The grid surface that received a context-menu request. */
export type GridContextMenuTarget =
    | "cell"
    | "row"
    | "rowHeader"
    | "columnHeader";

/** Identifiers for the grid's built-in context-menu actions. */
export type GridStandardContextMenuItem =
    | "copy"
    | "copyWithHeaders"
    | "selectRow"
    | "clearSelection"
    | "sortAscending"
    | "sortDescending"
    | "clearSort"
    | "pinColumn"
    | "autosizeColumn"
    | "autosizeAllColumns"
    | "groupColumn"
    /** Opens this grouping level and all its parent levels. Only available on grouped headers/chips. */
    | "expandGroupsToLevel"
    /** Closes this grouping level while retaining parent and descendant expansion states. */
    | "collapseGroupsAtLevel";

/** Context passed to grid, row, and column context-menu customization points. */
export interface DataGridContextMenuContext<TRow> {
    target: GridContextMenuTarget;
    row?: GridRow;
    rowData?: TRow;
    column?: DataGridColumn<TRow>;
    rowIndex?: number;
    colIndex?: number;
    selectedRanges: SelectionRange[];
    event: MouseEvent;
}

/** Produces context-menu items for a particular grid surface. */
export type GridContextMenuItems<TRow> = (
    context: DataGridContextMenuContext<TRow>
) => MenuItem[] | Promise<MenuItem[]>;
