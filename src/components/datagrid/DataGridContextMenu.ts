import type { MenuItem } from "../popup/PopupMenu";
import type { DataColumn } from "./DataColumn";
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
    | "groupColumn";

/** Context passed to grid, row, and column context-menu customization points. */
export interface DataGridContextMenuContext<TRow> {
    target: GridContextMenuTarget;
    row?: GridRow;
    rowData?: TRow;
    column?: DataColumn<TRow>;
    rowIndex?: number;
    colIndex?: number;
    selectedRanges: SelectionRange[];
    event: MouseEvent;
}

/** Produces context-menu items for a particular grid surface. */
export type GridContextMenuItems<TRow> = (
    context: DataGridContextMenuContext<TRow>
) => MenuItem[] | Promise<MenuItem[]>;
