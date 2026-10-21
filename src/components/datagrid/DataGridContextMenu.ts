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
    /** Cancels the specific pending session under the pointer. */
    | "cancelNewRow"
    | "copy"
    | "copyWithHeaders"
    /** Reads clipboard text and pastes it at the active cell in an editable grid. */
    | "paste"
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
    /** Grid surface on which the context menu was requested. */
    target: GridContextMenuTarget;
    /** Flattened row under the pointer; absent for column headers and group chips. */
    row?: GridRow;
    /** Business row for data cells/rows; absent for group metadata and headers. */
    rowData?: TRow;
    /** Data-column definition when the target identifies a column. */
    column?: DataGridColumn<TRow>;
    /** Zero-based visible row index, when a row is targeted. */
    rowIndex?: number;
    /** Zero-based data-column index when supplied by the target; excludes the row header. */
    colIndex?: number;
    /** Snapshot of the selection ranges when the menu was requested. */
    selectedRanges: SelectionRange[];
    /** Original browser context-menu event, including pointer coordinates and modifiers. */
    event: MouseEvent;
}

/** Produces context-menu items for a particular grid surface. */
export type GridContextMenuItems<TRow> = (
    context: DataGridContextMenuContext<TRow>
) => MenuItem[] | Promise<MenuItem[]>;
