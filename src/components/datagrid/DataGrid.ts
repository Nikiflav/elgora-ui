import { Component } from "../../core/Component";
import { setElementProps, e, assignElementProps, span, tr, VNode, v, VNodeChild, ElementProps } from "../../core/e";
import { Utils } from "../../core/Utils";
import { DataFilter } from "../../data/filter";
import { ScrollEngine } from "../scrollbar/scroll-engine";
import { Scrollbar } from "../scrollbar/scrollbar";
import { VariableSizeManager } from "../virtual-list/SizeManager";
import { VirtualList, VirtualDataSource, RenderRowArgs } from "../virtual-list/VirtualList";
import { DataCell, DataCellRendererResult, DataColumn, DataColumnLayoutInfo, DataColumnUtils, GroupInterval, GroupIntervalDefinition, OrderByToken, orderByTokenToString, SummaryDefinition, SummaryType } from "./DataColumn";
import { ArrayDataSource, DataSource, LocalGroupingDataSource, RowIdentity } from "./DataSource";
import type { FilterFunctionRegistry } from "../../data/filter";
import { DataGridState, DefaultGridRowsProvider } from "./DefaultGridRowsProvider";
import { GridRow, GridRowsProvider } from "./GridRow";
import { VirtualGridRows } from "./VirtualGridRows";
import { DataGridTexts, DEFAULT_GRID_TEXTS } from "./DataGridTexts";

import "./DataGrid.css"
import { c, cli } from "../../core/c";
import { trackGesture } from "../../core/interact/DragGesture";
import { DragDropController, DragPayload, DropTarget } from "../../core/interact/DragDropController";
import { createListDropZone } from "../../core/interact/ListDropZone";
import { SelectionManager, GridContext } from "./SelectionManager";
import type { DataGridContextMenuContext, GridContextMenuItems, GridStandardContextMenuItem } from "./DataGridContextMenu";
import { PopupMenu, type MenuItem } from "../popup/PopupMenu";


/** Accepted row data inputs: a full DataSource, or a plain array wrapped in an ArrayDataSource. */
export type GridDataSource<TRow> = DataSource<TRow> | TRow[];

/** Persisted view state (e.g. for save/restore of a user's layout customizations). */
export interface DataGridLayoutInfo {
    showFilterRow?: boolean;
    showColumnHeaders?: boolean;
    showColumnFooters?: boolean;
    visibleColumns?: (string | DataColumnLayoutInfo)[],
    orderBy?: OrderByToken[],
    groupColumns?: string[]
}

type SelectionCell = { rowIndex: number, colIndex: number, wholeRow?: true };

/* GridRow and QueryEngine */


//=================


/** Construction-time configuration for a DataGrid instance. */
export type DataGridOptions<TRow> = {
    /** Row data; defaults to an empty array if omitted. */
    data?: GridDataSource<TRow>,
    columns: DataColumn<TRow>[],
    /** Number of leading columns kept sticky, in addition to the row-header column. */
    fixedLeftColumns?: number,
    /** Number of trailing columns kept sticky. */
    fixedRightColumns?: number,
    /** Row page size used when querying the DataSource. Defaults to 100. */
    pageSize?: number,
    /** Names of columns to show as data columns; defaults to all `columns`. */
    visibleColumns?: string[],
    /** The sort order for the data rows. */
    orderBy?: OrderByToken[],
    /** Sort a data column when its header is clicked. Defaults to true. */
    sortOnHeaderClick?: boolean,
    /** Filter applied to the data rows. */
    filter?: DataFilter,
    /** Ordered column names to group by (outermost first). Ignored when the data source is hierarchical. */
    groupColumns?: string[],
    /** The aggregation summary for group rows. */
    groupSummary?: { field: string, summaryType: SummaryType }[],
    /** Custom group intervals available in the Group by context-menu submenu. */
    groupIntervals?: GroupIntervalDefinition<TRow>[],
    /** Custom summary accumulators available for locally grouped data. */
    customSummaries?: SummaryDefinition<TRow, any, any>[],
    /** Whether group rows participate in cell/row selection (treated as data cells). Defaults to true. */
    selectableGroupRows?: boolean,
    /** Whether hierarchical tree node rows participate in cell/row selection (treated as data cells). Defaults to false. */
    selectableHierarchyNodes?: boolean,
    /** Value passed as parentId for the root-level query, when the data source is hierarchical. Defaults to null. */
    hierarchyRootId?: any,
    /** Pins active group/tree ancestors below the static table header. Defaults to false. */
    stickyGroupRows?: boolean,
    /** Caps how many ancestor levels are pinned at once, keeping the innermost (closest) ones. Defaults to unlimited. */
    stickyGroupRowsMaxLevels?: number,
    /** Overrides for user-facing strings; unset ones fall back to DEFAULT_GRID_TEXTS. */
    texts?: Partial<DataGridTexts>,

    /** Enables the grid context menu. Defaults to true. */
    contextMenu?: boolean,
    /** Built-in context-menu items; null means all standard items, [] means none. */
    standardContextMenuItems?: GridStandardContextMenuItem[] | null,

    /** Produces context-menu items for data, group, and hierarchy rows. */
    rowContextMenuItems?: GridContextMenuItems<TRow>,
    /** Produces context-menu items for row headers. */
    rowHeaderContextMenuItems?: GridContextMenuItems<TRow>,

    /** When column widths sum to less than the viewport, proportionally grow data columns (never the row header) to fill it. Defaults to true. */
    autoFillViewportWidth?: boolean,
    /** Whether to show the row header column. Defaults to true. */
    showRowHeader?: boolean,
    /** Whether to show the column header row. Defaults to true. */
    showColumnHeaders?: boolean,
    /** Whether to show the filter row below the column headers. Defaults to false. */
    showFilterRow?: boolean,
    /** Whether to show the column footer row. Defaults to true. */
    showColumnFooters?: boolean,
    /** The default options for each column. Can be specified to provide default column behavior. */
    defaultColumnOptions?: Partial<DataColumn<TRow>>
}

type GridViewRow = {
    index: number,
    gridRow: GridRow,
    tr?: HTMLTableRowElement
}

type GridView = {
    rows: GridViewRow[]
    totalRows: number
    totalHeight: number
    start: number
    startOffset: number
    firstVisibleIndex: number
}

type CellView<TRow> = {
    col: GridColumn<TRow>
    props: any
    customContent?: DataCellRendererResult
}

type GridColumn<T> = {

    type: "data" | "rowheader";
    width: number;
    dataColumn?: DataColumn<T>;
    visibleIndex: number;
    groupIndex: number;
    textAlign: "left" | "center" | "right";
    fixedPosition: "none" | "left" | "right";
    /** True for columns with no configured width; participates in redistributeColumnWidths() until manually resized. */
    isAutoWidth: boolean;
    /**
     * Un-stretched baseline for an auto column - col.width = col.naturalWidth * scale;
     */
    naturalWidth: number;
    /** True once the one-time content-measurement pass has resolved this auto column's naturalWidth. */
    widthMeasured: boolean;
}

/*
-------------------------------------------------------
*/
/** Virtualized, selectable, and optionally grouped data grid component. */
export class DataGrid<TRow> extends Component {

    // Options.
    private _gridOptions: DataGridOptions<TRow> = { columns: [] };
    private _columnsIndex: Map<string, DataColumn<TRow>> = new Map();
    private _dataSource!: DataSource<TRow>;
    private _isHierarchicalData: boolean = false;
    private _gridColumns: GridColumn<TRow>[] = [];
    /** False until setOptions() has completed its first (constructor-time) call. Used only to
     *  decide whether there's anything mounted yet to refresh - all option handling itself always
     *  goes through setOptions(). */
    private _initialized = false;

    // Internal state.
    private _gridRows!: VirtualGridRows<TRow>;
    private _defaultColumnWidth = 150;
    private _contentTable: HTMLTableElement;
    private _headerPanel: HTMLDivElement;
    private _tableContainer: HTMLDivElement;
    private _scrollEngine: ScrollEngine;
    private _sizeManager = new VariableSizeManager(30)
    private _defaultRowSize = 0
    private _rowsPool: HTMLTableRowElement[] = []
    private _tHeadRowsPool: HTMLTableRowElement[] = []
    private _renderedStickyGroupRows: GridRow[] = []
    private _stickyGroupRowsDirty = true
    // Current computed view.
    private _view?: GridView;


    private _scrollTop = 0
    private _scrollLeft = 0
    private _viewportHeight = 0
    private _viewportWidth = 0
    private _totalBodyHeight = 0
    private _totalWidth = 0
    private _headerHeight = 0
    private _footerHeight = 0
    private _groupPadding = 10
    private _activeColIndex = -1
    private _activeGroupColumn?: string
    private _selection = new SelectionManager();
    private _selectionMouseDown = false;
    private _selectionWholeRowDrag = false;
    private _contextMenu: PopupMenu;

    private _dragDrop: DragDropController;
    private _cancelActiveResize?: () => void;
    private _customCellContent = new WeakMap<HTMLTableCellElement, Component | Node>();

    private readonly _MAX_ROWS = 100

    constructor(options: DataGridOptions<TRow>) {
        super({ ui: "h-100" })

        // DOM
        this.dom.classList.add("elg-grid");
        this.dom.style.position = "relative";
        this.dom.style.boxSizing = "border-box";


        this._headerPanel = e("div", {
            class: "elg-grid-header"
        });

        this._tableContainer = e("div",
            {
                class: "elg-grid-viewport",
                style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box"
                }
            });

        this.listen(this._tableContainer, "keydown", event => this.handleSelectionKeyDown(event as KeyboardEvent), true);
        this.listen(this._tableContainer, "mouseup", () => this.endSelectionDrag());
        this.listen(this._tableContainer, "mouseleave", () => this.endSelectionDrag());

        this._contextMenu = new PopupMenu();
        this.append(this._contextMenu);

        this._contentTable = e("table",
            {
                style: {
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "separate",
                    borderSpacing: "0",
                    boxSizing: "border-box",
                    position: "absolute",
                    left: "0px"
                }
            },
            e("colgroup"),
            e("thead",
                {
                    style: {
                        position: "sticky",
                        top: 0,
                        left: 0,
                        zIndex: 5,
                        boxSizing: "border-box"
                    }
                }),
            e("tbody"),
            e("tfoot",
                {
                    style: {
                        position: "sticky",
                        bottom: 0,
                        left: 0,
                        zIndex: 5,
                        boxSizing: "border-box"
                    }
                }),)

        this._scrollEngine = new ScrollEngine(this._tableContainer);
        this.addCleanup(() => this._scrollEngine.dispose());
        this._scrollEngine.onScroll(this.updateLayout);
        this._scrollEngine.onResize(() => {
            this.updateLayout();
            this.redistributeColumnWidths();
            this.render(this.renderColGroup);
        })

        this._dragDrop = new DragDropController({ onDrop: this.handleColumnDrop });
        this.addCleanup(() => this._dragDrop.dispose());

        this.addCleanup(this._dragDrop.registerZone(createListDropZone({
            id: "grid-header",
            kind: "column",
            // Hit-test/indicator against the whole scrollable table (header+body+footer), matching
            // the old reorder behavior where dragging anywhere over the grid - not just the thin
            // header strip - still tracked the drop column. Slots still come from the header row only.
            element: this._tableContainer,
            itemsElement: this._contentTable.tHead!,
            axis: "x",
            itemSelector: "tr.elg-gridrow-header td.elg-gridcell-data",
            scrollBy: delta => this._scrollEngine.scrollLeft += delta
        })));

        this.addCleanup(this._dragDrop.registerZone(createListDropZone({
            id: "group-panel",
            kind: "column",
            element: this._headerPanel,
            axis: "x",
            itemSelector: ".elg-gridcell",
            scrollBy: delta => this._headerPanel.scrollLeft += delta
        })));

        this._tableContainer.append(this._contentTable);

        this.append(this._headerPanel);
        this.append(e("div",
            {
                style: {

                    position: "relative",
                    flex: 1
                }
            },
            this._tableContainer
        ));


        this.renderTasks.push(() => this.renderHeaderPanel())
        this.renderTasks.push(() => this.renderColGroup())
        this.renderTasks.push(() => this.renderHeaderAndFooter())
        this.renderTasks.push(() => this.renderBody())

        // Every option - at construction time and for every later change - goes through the same
        // setOptions() path. On this first call there's nothing mounted yet to render (see _initialized).
        this.setOptions(options);
    }

    private isSelectableGridRow(row: GridRow | undefined): boolean {
        if (!row) return false;
        if (row.type === "data") return true;
        if (row.type === "group") return this._gridOptions.selectableGroupRows !== false;
        if (row.type === "node") return this._gridOptions.selectableHierarchyNodes === true;
        return false;
    }

    private getSelectionContext = (): GridContext => ({
        totalRows: this._gridRows?.count() ?? 0,
        columns: this._gridColumns.filter(c => c.type === "data").map(c => c.dataColumn!.name),
        isRowSelectable: index => this.isSelectableGridRow(this._gridRows?.getAt(index)),
        findNextSelectableRow: (index, direction) => {
            let next = index + direction;
            const total = this._gridRows?.count() ?? 0;
            let checked = 0;
            while (next >= 0 && next < total && checked < 20) {
                if (this.isSelectableGridRow(this._gridRows.getAt(next))) return next;
                next += direction;
                checked++;
            }
            return index;
        }
    });

    private handleSelectionKeyDown = async (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
            if (this._selection.getRanges().length === 0) return;

            event.preventDefault();
            event.stopPropagation();
            await this.copySelection();
            return;
        }

        const previous = this._selection.getActiveCell();
        if (this._selection.handleKeyDown(event, this.getSelectionContext())) {
            event.preventDefault();
            event.stopPropagation();
            this.refresh();

            const active = this._selection.getActiveCell();
            if (active && (!previous || previous.rowIndex !== active.rowIndex || previous.colIndex !== active.colIndex)) {
                this.ensureKeyboardCellVisible(active.rowIndex, active.colIndex);
            }
        }
    };

    /** Copies the currently selected data cells to the system clipboard. */
    public async copySelection(addHeaders = false): Promise<boolean> {
        const ranges = this._selection.getRanges();
        const gridColumns = this._gridColumns.filter(column => column.type === "data");
        const columns = gridColumns.map(column => column.dataColumn!);
        if (ranges.length === 0 || gridColumns.length === 0) return false;

        const selectedRows = new Map<number, Set<number>>();
        for (const range of ranges) {
            const minRow = Math.min(range.anchor.rowIndex, range.focus.rowIndex);
            const maxRow = Math.max(range.anchor.rowIndex, range.focus.rowIndex);
            const minCol = range.anchor.wholeRow || range.focus.wholeRow
                ? 0
                : Math.min(range.anchor.colIndex, range.focus.colIndex);
            const maxCol = range.anchor.wholeRow || range.focus.wholeRow
                ? columns.length - 1
                : Math.max(range.anchor.colIndex, range.focus.colIndex);

            for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
                let selectedColumns = selectedRows.get(rowIndex);
                if (!selectedColumns) {
                    selectedColumns = new Set<number>();
                    selectedRows.set(rowIndex, selectedColumns);
                }
                for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
                    if (colIndex >= 0 && colIndex < columns.length) selectedColumns.add(colIndex);
                }
            }
        }

        const textLines: string[][] = [];
        for (const rowIndex of Array.from(selectedRows.keys()).sort((a, b) => a - b)) {
            const selectedColumns = selectedRows.get(rowIndex)!;
            let row = this._gridRows.getAt(rowIndex);
            if (row.type === "loading") {
                await this._gridRows.load(rowIndex, 1);
                row = this._gridRows.getAt(rowIndex);
            }
            if (!this.isSelectableGridRow(row) || row.type === "loading") continue;

            const line: string[] = [];
            for (const colIndex of Array.from(selectedColumns).sort((a, b) => a - b)) {
                let cellText = this.getCellText(row, gridColumns[colIndex]);
                if (/[\t\r\n"]/.test(cellText)) cellText = `"${cellText.replace(/"/g, '""')}"`;
                line.push(cellText);
            }
            textLines.push(line);
        }

        if (textLines.length === 0) return false;

        if (addHeaders) {
            const headerColumns = Array.from(new Set(
                Array.from(selectedRows.values()).flatMap(selectedColumns => Array.from(selectedColumns))
            )).sort((a, b) => a - b);
            textLines.unshift(headerColumns.map(colIndex => columns[colIndex].caption ?? columns[colIndex].name ?? ""));
        }

        const text = textLines.map(line => line.join("\t")).join("\r\n");
        const escapeHtml = (value: string) => value.replace(/[&<>"']/g, symbol => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[symbol]!));
        const html = `<table>${textLines.map(line =>
            `<tr>${line.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
        ).join("\r\n")}</table>`;

        try {
            if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        "text/plain": new Blob([text], { type: "text/plain" }),
                        "text/html": new Blob([html], { type: "text/html" })
                    })
                ]);
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                return false;
            }
        } catch {
            if (!navigator.clipboard?.writeText) return false;
            await navigator.clipboard.writeText(text);
        }

        return true;
    }

    private getContextMenuRowData = (row?: GridRow): TRow | undefined => {
        if (!row || (row.type !== "data" && row.type !== "node")) return undefined;
        return row.data?.data as TRow | undefined;
    };

    private getColumnPinPosition = (columnName: string): "left" | "right" | "none" => {
        const columns = this._gridOptions.visibleColumns ?? [];
        const index = columns.indexOf(columnName);
        if (index < 0) return "none";
        if (index < (this._gridOptions.fixedLeftColumns ?? 0)) return "left";
        if (index >= columns.length - (this._gridOptions.fixedRightColumns ?? 0)) return "right";
        return "none";
    };

    private setColumnPinPosition = (columnName: string, position: "left" | "right" | "none") => {
        const columns = [...(this._gridOptions.visibleColumns ?? [])];
        const currentIndex = columns.indexOf(columnName);
        if (currentIndex < 0) return;

        let leftCount = this._gridOptions.fixedLeftColumns ?? 0;
        let rightCount = this._gridOptions.fixedRightColumns ?? 0;
        const currentPosition = this.getColumnPinPosition(columnName);

        columns.splice(currentIndex, 1);
        if (currentPosition === "left") leftCount--;
        if (currentPosition === "right") rightCount--;

        if (position === "left") {
            columns.splice(leftCount, 0, columnName);
            leftCount++;
        } else if (position === "right") {
            columns.splice(columns.length - rightCount, 0, columnName);
            rightCount++;
        } else {
            const unpinnedIndex = Math.min(leftCount, columns.length - rightCount);
            columns.splice(unpinnedIndex, 0, columnName);
        }

        this.setOptions({
            visibleColumns: columns,
            fixedLeftColumns: leftCount,
            fixedRightColumns: rightCount
        });
    };

    private autoSizeAllColumns = () => {
        for (const column of this.getVisibleColumns()) column.width = undefined;
        void this.layoutChanged();
    };

    private setColumnSort = (columnName: string, direction: "asc" | "desc", preserveExisting = false) => {
        if (!preserveExisting) {
            this.setOptions({ orderBy: [[columnName, direction]] });
            return;
        }

        const orderBy = [...(this._gridOptions.orderBy ?? [])];
        const index = orderBy.findIndex(item =>
            typeof item === "string" ? item === columnName : item[0] === columnName
        );
        const token: OrderByToken = [columnName, direction];
        if (index >= 0) orderBy[index] = token;
        else orderBy.push(token);
        this.setOptions({ orderBy });
    };

    private toggleColumnSort = (columnName: string, preserveExisting = false) => {
        const direction = this.getColumnSortDirection(columnName);
        if (direction === undefined)
            this.setColumnSort(columnName, "asc", preserveExisting);
        else if (direction === "asc")
            this.setColumnSort(columnName, "desc", preserveExisting);
        else
            this.clearColumnSort(columnName);
    };

    private clearColumnSort = (columnName: string) => {
        if (this._gridOptions.groupColumns?.includes(columnName)) {
            // A grouped column must remain sorted so that flat rows can be grouped into
            // contiguous ranges. Clearing it resets the implicit grouping sort instead.
            this.setColumnSort(columnName, "asc", true);
            return;
        }

        const orderBy = (this._gridOptions.orderBy ?? []).filter(item =>
            typeof item === "string" ? item !== columnName : item[0] !== columnName
        );
        this.setOptions({ orderBy });
    };

    /** Adds a column to grouping and makes it the primary sort criterion. */
    public groupBy = (columnName: string, direction: "asc" | "desc" = "asc") => {
        if (this._isHierarchicalData) return;

        const groupColumns = [...(this._gridOptions.groupColumns ?? [])];
        if (!groupColumns.includes(columnName)) groupColumns.push(columnName);

        const orderBy = (this._gridOptions.orderBy ?? []).filter(item =>
            typeof item === "string" ? item !== columnName : item[0] !== columnName
        );
        orderBy.unshift([columnName, direction]);

        this.setOptions({ groupColumns, orderBy });
    };

    /** Keeps grouping and sorting synchronized, adding implicit ascending group sorts when needed. */
    private normalizeGroupingSort = () => {
        const groupColumns = this._gridOptions.groupColumns ?? [];
        if (!groupColumns.length) return;

        const orderBy = this._gridOptions.orderBy ?? [];
        const grouped = new Set(groupColumns);
        const groupedOrder = groupColumns.map(columnName => {
            const token = orderBy.find(item =>
                typeof item === "string" ? item === columnName : item[0] === columnName
            );
            return token ?? [columnName, "asc"] as OrderByToken;
        });
        const remaining = orderBy.filter(item => {
            const columnName = typeof item === "string" ? item : item[0];
            return !grouped.has(columnName);
        });
        this._gridOptions.orderBy = [...groupedOrder, ...remaining];
    };

    private toggleColumnGrouping = (columnName: string) => {
        if (this._isHierarchicalData) return;
        const groupColumns = [...(this._gridOptions.groupColumns ?? [])];
        const index = groupColumns.indexOf(columnName);
        if (index >= 0) groupColumns.splice(index, 1);
        else {
            this.groupBy(columnName);
            return;
        }
        this.setOptions({ groupColumns });
    };

    private setColumnSummary = (columnName: string, summaryType?: SummaryType) => {
        const summaries = (this._gridOptions.groupSummary ?? []).filter(s => s.field !== columnName);
        if (summaryType) summaries.push({ field: columnName, summaryType });
        this.setOptions({ groupSummary: summaries });
    };

    private setColumnGroupInterval = (columnName: string, groupInterval?: GroupInterval) => {
        this.setColumnOptions(columnName, { groupInterval });
        if (!this._gridOptions.groupColumns?.includes(columnName)) {
            this.groupBy(columnName, this.getColumnSortDirection(columnName) ?? "asc");
        } else {
            this.reloadRows();
        }
    };

    private getColumnSortDirection = (columnName: string): "asc" | "desc" | undefined => {
        const token = this._gridOptions.orderBy?.find(item =>
            typeof item === "string" ? item === columnName : item[0] === columnName
        );
        if (!token) return undefined;
        return typeof token === "string" ? "asc" : token[1];
    };

    private getColumnSortOrder = (columnName: string): number | undefined => {
        const index = this._gridOptions.orderBy?.findIndex(item =>
            typeof item === "string" ? item === columnName : item[0] === columnName
        ) ?? -1;
        return index >= 0 ? index + 1 : undefined;
    };

    private getContextMenuItems = async (context: DataGridContextMenuContext<TRow>): Promise<MenuItem[]> => {
        const items: MenuItem[] = [];
        const standard = this._gridOptions.standardContextMenuItems;
        const hasStandard = (item: GridStandardContextMenuItem) =>
            standard === null || standard?.includes(item) === true;
        const addDivider = () => {
            if (items.length && items[items.length - 1].isDivider !== true) items.push({ isDivider: true });
        };

        if (context.target === "columnHeader" && context.column) {
            const columnName = context.column.name;
            const pinPosition = this.getColumnPinPosition(columnName);
            const isGrouped = this._gridOptions.groupColumns?.includes(columnName) === true;
            const sortDirection = this.getColumnSortDirection(columnName);
            const preserveExistingSort = (event?: Event) => event instanceof MouseEvent && event.shiftKey;

            if ((!sortDirection || sortDirection === "desc") && hasStandard("sortAscending" as GridStandardContextMenuItem)) {
                items.push({
                    icon: "ri-arrow-up-line",
                    text: "Sort Ascending",
                    action: event => this.setColumnSort(columnName, "asc", preserveExistingSort(event))
                });
            }
            if ((!sortDirection || sortDirection === "asc") && hasStandard("sortDescending" as GridStandardContextMenuItem)) {
                items.push({
                    icon: "ri-arrow-down-line",
                    text: "Sort Descending",
                    action: event => this.setColumnSort(columnName, "desc", preserveExistingSort(event))
                });
            }
            if (sortDirection && !isGrouped && hasStandard("clearSort" as GridStandardContextMenuItem)) {
                items.push({
                    icon: "ri-close-line",
                    text: "Clear sorting",
                    action: () => this.clearColumnSort(columnName)
                });
            }
            if (hasStandard("pinColumn" as GridStandardContextMenuItem)) {
                addDivider();
                items.push({
                    icon: "ri-pushpin-line",
                    text: "Pin Column",
                    subItems: async () => [
                        {
                            icon: "ri-close-line",
                            text: "No Pin",
                            checked: () => pinPosition === "none",
                            action: () => this.setColumnPinPosition(columnName, "none")
                        },
                        {
                            text: "Pin Left",
                            checked: () => pinPosition === "left",
                            action: () => this.setColumnPinPosition(columnName, "left")
                        },
                        {
                            text: "Pin Right",
                            checked: () => pinPosition === "right",
                            action: () => this.setColumnPinPosition(columnName, "right")
                        }
                    ]
                });
            }
            if (hasStandard("autosizeColumn" as GridStandardContextMenuItem)) {
                addDivider();
                items.push({
                    icon: "ri-expand-up-down-line",
                    text: "Autosize This Column",
                    action: () => this.autoSizeColumn(columnName)
                });
            }
            if (hasStandard("autosizeAllColumns" as GridStandardContextMenuItem)) {
                items.push({
                    icon: "ri-expand-up-down-line",
                    text: "Autosize All Columns",
                    action: this.autoSizeAllColumns
                });
            }
            if (hasStandard("groupColumn" as GridStandardContextMenuItem)) {
                addDivider();
                const intervalLabels: Record<string, string> = {
                    "year": "Year",
                    "yearQuarter": "Year-quarter",
                    "quarter": "Quarter",
                    "yearMonth": "Year-month",
                    "month": "Month",
                    "week": "ISO week",
                    "day": "Day",
                    "dayOfWeek": "Day of week",
                    "hour": "Hour",
                    "minute": "Minute",
                    "second": "Second",
                    "firstChar": "First character"
                };
                const supportedIntervals = DataColumnUtils.getSupportedGroupIntervals(context.column!);
                const customIntervals = this._gridOptions.groupIntervals ?? [];
                const advancedIntervals = [
                    ...supportedIntervals.map(value => ({ label: intervalLabels[value] ?? String(value), value })),
                    ...customIntervals
                        .filter(interval => !supportedIntervals.includes(interval.name))
                        .map(interval => ({ label: interval.text, value: interval.name as GroupInterval }))
                ];
                items.push({
                    icon: "ri-timeline-view",
                    text: `${isGrouped ? "Ungroup" : "Group by"} ${context.column.caption ?? context.column.name}`,
                    disabled: this._isHierarchicalData,
                    action: () => isGrouped
                        ? this.toggleColumnGrouping(columnName)
                        : this.setColumnGroupInterval(columnName, undefined)
                });
                if (advancedIntervals.length) {
                    items.push({
                        icon: "ri-settings-3-line",
                        text: "Grouping options",
                        disabled: this._isHierarchicalData,
                        subItems: async () => {
                            const currentInterval = context.column!.groupInterval;
                            const intervals: Array<{ label: string, value?: GroupInterval }> = [
                                { label: "Exact value" },
                                ...advancedIntervals
                            ];
                            if (currentInterval && !intervals.some(i => i.value === currentInterval)) {
                                intervals.push({ label: String(currentInterval), value: currentInterval });
                            }
                            return intervals.map(interval => ({
                                text: interval.label,
                                checked: () => isGrouped && currentInterval === interval.value,
                                action: () => this.setColumnGroupInterval(columnName, interval.value)
                            }));
                        }
                    });
                }
            }
            addDivider();
            const currentSummary = this._gridOptions.groupSummary?.find(s => s.field === columnName)?.summaryType;
            items.push({
                icon: "ri-calculator-line",
                text: "Summary",
                disabled: this._isHierarchicalData,
                subItems: async () => {
                    const summaryTypes: Array<{ label: string, value?: SummaryType }> = [
                        { label: "None" },
                        { label: "Count", value: "count" },
                        { label: "Sum", value: "sum" },
                        { label: "Minimum", value: "min" },
                        { label: "Maximum", value: "max" },
                        { label: "Distinct", value: "distinct" },
                        ...(this._gridOptions.customSummaries ?? []).map(summary => ({
                            label: summary.text,
                            value: summary.name as SummaryType
                        }))
                    ];
                    return summaryTypes.map(summary => ({
                        text: summary.label,
                        checked: () => currentSummary === summary.value,
                        action: () => this.setColumnSummary(columnName, summary.value)
                    }));
                }
            });
        }

        if (context.target === "cell" || context.target === "rowHeader" || context.target === "row") {
            if (hasStandard("copy") && this._selection.getRanges().length > 0) {
                items.push({ icon: "ri-file-copy-line", text: "Copy selected cells", action: () => this.copySelection() });
            }
            if (hasStandard("copyWithHeaders") && this._selection.getRanges().length > 0) {
                items.push({ icon: "ri-file-copy-2-line", text: "Copy selected cells with headers", action: () => this.copySelection(true) });
            }
            if (hasStandard("selectRow") && context.row && this.isSelectableGridRow(context.row)) {
                items.push({
                    icon: "ri-checkbox-multiple-line",
                    text: "Select row",
                    action: () => {
                        this._selection.selectSingleRow(context.row!.visibleIndex);
                        this.refresh();
                    }
                });
            }
            if (hasStandard("clearSelection") && this._selection.getRanges().length > 0) {
                items.push({ icon: "ri-close-circle-line", text: "Clear selection", action: () => this.clearSelection() });
            }
        }

        const customItems: MenuItem[] = [];
        if (context.target === "cell" && context.column?.contextMenuItems) {
            customItems.push(...(await context.column.contextMenuItems(context)));
        }
        if (context.target === "columnHeader" && context.column?.headerContextMenuItems) {
            customItems.push(...(await context.column.headerContextMenuItems(context)));
        }
        if ((context.target === "cell" || context.target === "row") && this._gridOptions.rowContextMenuItems) {
            customItems.push(...(await this._gridOptions.rowContextMenuItems(context)));
        }
        if (context.target === "rowHeader" && this._gridOptions.rowHeaderContextMenuItems) {
            customItems.push(...(await this._gridOptions.rowHeaderContextMenuItems(context)));
        }

        if (customItems.length) {
            addDivider();
            items.push(...customItems);
        }

        return items;
    };

    private showContextMenu = async (
        event: MouseEvent,
        target: DataGridContextMenuContext<TRow>["target"],
        row?: GridRow,
        column?: DataColumn<TRow>,
        colIndex?: number
    ) => {
        if (!this._gridOptions.contextMenu) return;

        event.preventDefault();
        event.stopPropagation();

        if (target === "cell" && row && colIndex !== undefined && this.isSelectableGridRow(row)
            && !this._selection.isSelected(row.visibleIndex, colIndex)) {
            this._selection.selectSingleCell(row.visibleIndex, colIndex);
            this.refresh();
        } else if (target === "rowHeader" && row && this.isSelectableGridRow(row)
            && !this._selection.isWholeRowSelected(row.visibleIndex)) {
            this._selection.selectSingleRow(row.visibleIndex);
            this.refresh();
        }

        const context: DataGridContextMenuContext<TRow> = {
            target,
            row,
            rowData: this.getContextMenuRowData(row),
            column,
            rowIndex: row?.visibleIndex,
            colIndex,
            selectedRanges: this._selection.getRanges(),
            event
        };
        const items = await this.getContextMenuItems(context);
        if (items.length) {
            await this._contextMenu.show({
                point: { x: event.clientX, y: event.clientY },
                items
            });
        }
    };

    private ensureKeyboardCellVisible(rowIndex: number, colIndex: number): void {
        const rowTop = this._sizeManager.getOffset(rowIndex);
        const rowBottom = rowTop + this._sizeManager.getSize(rowIndex);
        const viewBottom = this._scrollTop + this._viewportHeight - this._headerHeight - this._footerHeight;
        if (rowTop < this._scrollTop) {
            this._scrollEngine.scrollTop = rowTop;
        } else if (rowBottom > viewBottom) {
            this._scrollEngine.scrollTop = rowBottom - this._viewportHeight + this._headerHeight + this._footerHeight;
        }
        this.scrollToColumn(colIndex);
    }

    private endSelectionDrag = () => {
        this._selectionMouseDown = false;
        this._selectionWholeRowDrag = false;
    };

    private beginCellSelection = (event: MouseEvent, row: GridRow, colIndex: number) => {
        if (event.button !== 0 || !this.isSelectableGridRow(row)) return;
        event.preventDefault();
        this._tableContainer.focus();
        this._selectionMouseDown = true;
        this._selectionWholeRowDrag = false;
        this._selection.handleCellClick(row.visibleIndex, colIndex - this.rowHeaderOffset, event);
        this.refresh();
    };

    private beginRowSelection = (event: MouseEvent, row: GridRow) => {
        if (event.button !== 0 || !this.isSelectableGridRow(row)) return;
        event.preventDefault();
        this._tableContainer.focus();
        this._selectionMouseDown = true;
        this._selectionWholeRowDrag = true;
        this._selection.handleRowHeaderClick(row.visibleIndex, event);
        this.refresh();
    };

    private enterSelection = (row: GridRow, colIndex: number) => {
        if (!this._selectionMouseDown || !this.isSelectableGridRow(row)) return;
        if (this._selectionWholeRowDrag) this._selection.extendRowSelection(row.visibleIndex);
        else {
            // The row-header pseudo-column is not part of the cell-selection coordinate space.
            // Ignore it during a cell drag so right-to-left selection cannot extend to -1.
            if (colIndex < this.rowHeaderOffset) return;
            this._selection.handleCellMouseEnter(row.visibleIndex, colIndex - this.rowHeaderOffset, true);
        }
        this.refresh();
    };

    /** Number of leading sticky columns, including the row-header column when it's shown. */
    private get fixedLeftColumnCount(): number {
        return (this._gridOptions.showRowHeader !== false ? 1 : 0) + (this._gridOptions.fixedLeftColumns || 0);
    }

    /** Number of trailing sticky columns. */
    private get fixedRightColumnCount(): number {
        return this._gridOptions.fixedRightColumns || 0;
    }

    /** 1 if the row-header pseudo-column is shown, else 0 - the index offset of the first data column in _gridColumns. */
    private get rowHeaderOffset(): number {
        return this._gridOptions.showRowHeader !== false ? 1 : 0;
    }

    /** Resolved user-facing texts, merging configured overrides onto DEFAULT_GRID_TEXTS. */
    private get texts(): DataGridTexts {
        return { ...DEFAULT_GRID_TEXTS, ...this._gridOptions.texts };
    }

    /** (Re)builds _dataSource/_isHierarchicalData from _gridOptions.data. */
    private _rebuildDataSource() {

        const data = this._gridOptions.data;
        let ds: DataSource<TRow>;
        if (data == undefined || data instanceof Array) {
            ds = new ArrayDataSource<TRow>(data || [], { filterFunctions: this.getGroupFilterFunctions() });
        } else {
            ds = data;
        }

        this._isHierarchicalData = !!ds.hasChildren;

        if (this._isHierarchicalData) {
            if (this._gridOptions.groupColumns?.length) {
                console.warn("DataGrid: groupColumns is ignored when the data source is hierarchical (defines hasChildren).");
            }
            this._dataSource = ds;
        } else {
            this._dataSource = new LocalGroupingDataSource(ds, (row, column) => {
                const col = this._columnsIndex.get(column);
                if (!col)
                    return Promise.resolve((row as any)[column]);
                return DataColumnUtils.getValue(col, row);
            }, column => this._columnsIndex.get(column), this._gridOptions.groupIntervals, this._gridOptions.customSummaries);
        }
    }

    private getGroupFilterFunctions = (): FilterFunctionRegistry => {
        const functions: FilterFunctionRegistry = {};
        for (const interval of this._gridOptions.groupIntervals ?? []) {
            functions[interval.name] = (value, _args, row) => interval.getGroupValue(row, value);
        }
        return functions;
    };

    /** Merges a column patch onto the existing DataColumn of the same name (preserving its object
     *  identity, since it's shared with _gridOptions.columns and _gridColumns[i].dataColumn), or adds
     *  it as a new column if no such name exists yet. */
    private _mergeColumnPatch(patch: Partial<DataColumn<TRow>> & { name: string }) {
        const existing = this._columnsIndex.get(patch.name);
        if (existing) {
            Object.assign(existing, patch);
        } else {
            const col = patch as DataColumn<TRow>;
            this._columnsIndex.set(col.name, col);
            this._gridOptions.columns.push(col);
        }
    }

    /**
     * Sets (patches) the grid's options. Only the provided keys are changed; everything else is
     * left as-is. This is the single path for both the constructor's initial options and every
     * later change - fires an "optionChanged" DOM event on this.dom with the applied patch as detail.
     */
    public setOptions = (options: Partial<DataGridOptions<TRow>>) => {

        if (this._initialized && ("data" in options || "groupColumns" in options || "hierarchyRootId" in options
            || "pageSize" in options || "filter" in options || "orderBy" in options || "groupSummary" in options
            || "groupIntervals" in options || "customSummaries" in options)) {
            this._selection.clear();
        }

        // Reconcile columns by name instead of replacing the array wholesale, so DataColumn object
        // identity is preserved for objects already referenced by _gridColumns[i].dataColumn.
        if (options.columns) {
            const keepNames = new Set(options.columns.map(c => c.name));
            for (const name of [...this._columnsIndex.keys()]) {
                if (!keepNames.has(name)) {
                    this._columnsIndex.delete(name);
                    const ix = this._gridOptions.columns.findIndex(c => c.name === name);
                    if (ix > -1) this._gridOptions.columns.splice(ix, 1);
                }
            }
            for (const col of options.columns) {
                this._mergeColumnPatch(col);
            }
        }

        const { columns, ...rest } = options;
        Object.assign(this._gridOptions, rest);

        // Resolve every optional field to a concrete default, once, so the rest of the grid (and
        // getOptions()) never has to special-case "unset".
        this._gridOptions.visibleColumns ??= this._gridOptions.columns.map(c => c.name);
        this._gridOptions.groupColumns ??= [];
        this._gridOptions.groupSummary ??= [];
        this._gridOptions.groupIntervals ??= [];
        this._gridOptions.customSummaries ??= [];
        this._gridOptions.pageSize ??= 100;
        this._gridOptions.fixedLeftColumns ??= 0;
        this._gridOptions.fixedRightColumns ??= 0;
        this._gridOptions.autoFillViewportWidth ??= true;
        this._gridOptions.showRowHeader ??= true;
        this._gridOptions.showColumnHeaders ??= true;
        this._gridOptions.showFilterRow ??= false;
        this._gridOptions.showColumnFooters ??= true;
        this._gridOptions.hierarchyRootId ??= null;
        this._gridOptions.stickyGroupRows ??= false;
        this._gridOptions.selectableGroupRows ??= true;
        this._gridOptions.selectableHierarchyNodes ??= false;
        this._gridOptions.texts ??= {};
        this._gridOptions.contextMenu ??= true;
        this._gridOptions.standardContextMenuItems ??= null;
        this._gridOptions.sortOnHeaderClick ??= true;

        const firstCall = !this._initialized;
        this.normalizeGroupingSort();

        this.dom.dispatchEvent(new CustomEvent("optionChanged", { detail: options }));

        if (firstCall || "data" in options) {
            this._rebuildDataSource();
        }

        if (firstCall) {
            // Nothing mounted yet - build the initial layout/rows directly, without the render()
            // that layoutChanged()/reloadRows() would otherwise trigger.
            this._gridColumns = this.rebuildGridColumns();
            this._gridRows = this.createGridRows();
            this._initialized = true;
            return;
        }

        const reloadsRows = "data" in options || "groupColumns" in options || "hierarchyRootId" in options
            || "pageSize" in options || "filter" in options || "orderBy" in options || "groupSummary" in options
            || "groupIntervals" in options || "customSummaries" in options;
        const changesLayout = "columns" in options || "visibleColumns" in options || "fixedLeftColumns" in options
            || "fixedRightColumns" in options || "autoFillViewportWidth" in options || "showRowHeader" in options;
        const changesStaticRows = "showColumnHeaders" in options || "showFilterRow" in options || "showColumnFooters" in options;

        if (changesLayout) this.layoutChanged();
        if (reloadsRows) this.reloadRows();
        if (!changesLayout && !reloadsRows && ("texts" in options || "stickyGroupRows" in options || "selectableGroupRows" in options || "selectableHierarchyNodes" in options || changesStaticRows)) this.refresh();
    }

    /** Returns a shallow copy of the grid's current, fully-resolved options. */
    getOptions(): DataGridOptions<TRow> {
        return { ...this._gridOptions };
    }

    /** Returns the column definition for the given name, or undefined if no such column exists. */
    getColumn(name: string): DataColumn<TRow> | undefined {
        return this._columnsIndex.get(name);
    }

    public getSelectionManager(): SelectionManager { return this._selection; }
    public getSelectedRanges() { return this._selection.getRanges(); }
    public getActiveSelectionCell() { return this._selection.getActiveCell(); }
    public clearSelection() { this._selection.clear(); this.refresh(); }

    /** Patches an existing column's definition in place and updates the grid's layout accordingly. */
    setColumnOptions(name: string, patch: Partial<DataColumn<TRow>>) {
        if (!this._columnsIndex.has(name)) {
            console.warn(`DataGrid.setColumnOptions: no column named "${name}".`);
            return;
        }
        this._mergeColumnPatch({ ...patch, name });
        this.dom.dispatchEvent(new CustomEvent("optionChanged", { detail: { columns: [{ ...patch, name }] } }));
        this.layoutChanged();
    }

    /**
     * Clears a column's configured width and puts it back into the auto-width pool. getGridColumns()
     * already treats any column with no configured width as auto-width and unmeasured, so the next
     * layoutChanged()/render picks it up and re-measures it against the currently visible rows'
     * content (see measureAndAdjustScroll()) - same as a column that was never given a fixed width.
     */
    autoSizeColumn(name: string) {
        this.setColumnOptions(name, { width: undefined });
    }


    /** Tries to find the row index that corresponds to the given key, or -1 if not found.
     * The method traverses the currently loaded visible rows plus a few rows around the viewport.
     */
    public async tryGetRowIndexByKey(key: RowIdentity): Promise<number> {
        const view = this._view;
        const getRowId = this._dataSource?.getRowId;

        if (!view || !getRowId || key == null) {
            return -1;
        }

        // 1. Direct Hit: Search the currently rendered viewport rows first (Fastest)
        for (const row of view.rows) {
            if (row?.gridRow?.data != null && getRowId(row.gridRow.data) === key) {
                return row.index;
            }
        }

        const lookupCount = 500;
        const totalRows = this._gridRows.count(); // Ensure you use your grid rows count getter

        // Resolve bounds around current viewport
        const minBefore = Math.max(0, view.firstVisibleIndex - lookupCount);

        const lastVisibleIndex = view.firstVisibleIndex + view.rows.length - 1;
        const maxAfter = Math.min(totalRows - 1, lastVisibleIndex + lookupCount);

        const maxOffset = Math.max(
            view.firstVisibleIndex - minBefore,
            maxAfter - lastVisibleIndex
        );

        // Helper method to validate a given row index asynchronously
        const checkRowAtIndex = async (idx: number): Promise<boolean> => {
            const row = await this._gridRows.getAt(idx);
            if (row && row.type === "data" && row.data != null) {
                return getRowId(row.data) === key;
            }
            return false;
        };

        // 2. Concentric Ripple Search: Step outward simultaneously before and after the view
        for (let offset = 1; offset <= maxOffset; offset++) {
            const beforeIdx = view.firstVisibleIndex - offset;
            const afterIdx = lastVisibleIndex + offset;

            // Check the row BEFORE current viewport
            if (beforeIdx >= minBefore) {
                if (await checkRowAtIndex(beforeIdx)) {
                    return beforeIdx;
                }
            }

            // Check the row AFTER current viewport
            if (afterIdx <= maxAfter) {
                if (await checkRowAtIndex(afterIdx)) {
                    return afterIdx;
                }
            }
        }

        return -1;
    }


    /** 
    * Scrolls the grid to the row at the given visible index.
    * Resolves after internal layout adjustments (and their rAF frames) have stabilized.
    */
    public async scrollToRow(rowIndex: number): Promise<void> {
        const maxIndex = this._gridRows.count() - 1;
        const targetIndex = Math.max(0, Math.min(rowIndex, maxIndex));

        let attempts = 0;
        const maxAttempts = 5;
        let delta = 0;

        do {
            attempts++;

            // 1. Get current best-guess offset
            const targetOffset = this._sizeManager.getOffset(targetIndex);

            // 2. Set scroll position
            this._scrollEngine.scrollTop = targetOffset;

            // 3. Trigger updateLayout (which queues its own internal rAF)
            this.updateLayout();

            // 4. Wait for the rAF scheduled by updateLayout to execute and settle the DOM/measurements
            await Utils.nextFrame();

            // 5. Check if newly measured rows changed sizeManager's calculated offset
            const correctedOffset = this._sizeManager.getOffset(targetIndex);
            delta = Math.abs(this._scrollEngine.scrollTop - correctedOffset);

        } while (delta > 1 && attempts < maxAttempts);

        // Final precision cleanup frame if a tiny pixel offset remains
        if (delta > 0) {
            this._scrollEngine.scrollTop = this._sizeManager.getOffset(targetIndex);
            this.updateLayout();
            await Utils.nextFrame();
        }
    }

    /**
     * Scrolls horizontally only when a data column is outside the usable viewport.
     * The index is relative to data columns, matching SelectionManager's cell index.
     */
    public scrollToColumn(colIndex: number): void {
        const dataColumns = this._gridColumns.filter(col => col.type === "data");
        const column = dataColumns[colIndex];
        if (!column) return;

        let columnLeft = 0;
        for (const col of this._gridColumns) {
            if (col === column) break;
            columnLeft += col.width;
        }
        const columnRight = columnLeft + column.width;

        const fixedLeftWidth = this._gridColumns
            .slice(0, this.fixedLeftColumnCount)
            .reduce((sum, col) => sum + col.width, 0);
        const fixedRightWidth = this._gridColumns
            .slice(this._gridColumns.length - this.fixedRightColumnCount)
            .reduce((sum, col) => sum + col.width, 0);
        const viewportLeft = this._scrollLeft + fixedLeftWidth;
        const viewportRight = this._scrollLeft + this._viewportWidth - fixedRightWidth;

        if (column.fixedPosition !== "none" || (columnLeft >= viewportLeft && columnRight <= viewportRight)) return;

        const targetLeft = columnLeft < viewportLeft
            ? columnLeft - fixedLeftWidth
            : columnRight - this._viewportWidth + fixedRightWidth;
        this._scrollEngine.scrollLeft = targetLeft;
    }

    private getState(): DataGridState<TRow> {
        return {
            dataSource: this._dataSource,
            pageSize: this._gridOptions.pageSize!,
            columns: this._columnsIndex,
            visibleColumns: this.getVisibleColumns().map(c => c.name),
            baseFilter: this._gridOptions.filter,
            groupColumns: this._gridOptions.groupColumns,
            groupSummary: this._gridOptions.groupSummary,
            orderBy: this._gridOptions.orderBy,
            hierarchyRootId: this._gridOptions.hierarchyRootId,
        };
    }

    private createGridRows() {

        var provider = new DefaultGridRowsProvider<TRow>(this.getState());
        return new VirtualGridRows(provider, this._gridOptions.pageSize!, (args, result) => {
            this.refresh();
        })
    }
    /**
         * Returns the currently visible columns
         * @returns Array of visible columns
         */
    getVisibleColumns(): DataColumn<TRow>[] {

        return this._gridColumns
            .filter(x => x.dataColumn != undefined)
            .map(x => x.dataColumn!);
    }


    private rebuildGridColumns(): GridColumn<TRow>[] {

        // Rebuilding _gridColumns from scratch would otherwise reset every auto-width column back
        // to an unmeasured default, even ones that already had a correctly measured width and
        // didn't actually change - carry those over instead of re-measuring them for no reason.
        const previousByName = new Map(
            this._gridColumns
                .filter(c => c.dataColumn)
                .map(c => [c.dataColumn!.name, c] as const)
        );

        const visibleColumnNames = this._gridOptions.visibleColumns!;
        const groupColumns = this._gridOptions.groupColumns!;


        const gridColumns: GridColumn<TRow>[] = [];
        let totalColumns = visibleColumnNames.length;

        if (this._gridOptions.showRowHeader !== false) {
            totalColumns++;
            gridColumns.push({
                type: "rowheader",
                visibleIndex: 0,
                groupIndex: -1,
                textAlign: "right",
                width: 80,
                fixedPosition: "left",
                isAutoWidth: false,
                naturalWidth: 80,
                widthMeasured: true
            });
        }

        //let sampleRows: GridRow[] | undefined;
        //let canvasContext: CanvasRenderingContext2D | undefined;


        for (let name of visibleColumnNames) {
            const dataCol = this._columnsIndex.get(name);

            const groupIndex = dataCol ? groupColumns.indexOf(dataCol.name) : -1;

            let fixedPosition: "none" | "left" | "right" = "none";
            if (this.fixedLeftColumnCount > gridColumns.length)
                fixedPosition = "left";
            else if (totalColumns - this.fixedRightColumnCount < gridColumns.length)
                fixedPosition = "right"

            const isAutoWidth = !dataCol?.width;

            const col: GridColumn<TRow> = {
                type: "data",
                dataColumn: dataCol,
                visibleIndex: gridColumns.length,
                groupIndex,
                textAlign: "left",
                width: this._defaultColumnWidth,
                fixedPosition,
                isAutoWidth,
                naturalWidth: this._defaultColumnWidth,
                widthMeasured: false
            };
            gridColumns.push(col)

            if (dataCol) {

                let width = this._defaultColumnWidth;
                if (dataCol.width)
                    width = dataCol.width;


                if (groupIndex > -1) {
                    width += (groupIndex + 1) * this._groupPadding;
                    // Make group columns wider by default.
                    if (!dataCol.width)
                        width += 50;
                }

                col.width = width;
                if (isAutoWidth)
                    col.naturalWidth = width;
            }

            const previous = previousByName.get(name);
            if (isAutoWidth && previous?.isAutoWidth && previous.widthMeasured) {
                col.width = previous.width;
                col.naturalWidth = previous.naturalWidth;
                col.widthMeasured = true;
            }
        }

        return gridColumns;
    }

    /**
     * Tells the grid to update internal cache and redraw
     */
    layoutChanged = async () => {
        this._gridColumns = await this.rebuildGridColumns();

        this.refresh();
    }

    private updateLayout = () => {

        // Phase 1: READ all layout properties
        this._scrollTop = this._scrollEngine.scrollTop
        this._scrollLeft = this._scrollEngine.scrollLeft
        this._viewportHeight = this._scrollEngine.clientHeight
        this._viewportWidth = this._scrollEngine.clientWidth


        assignElementProps(this._contentTable, {
            style: {
                left: `-${this._scrollLeft}px`
            }
        })
        this.render(this.renderBody)
    }

    private renderBody = () => {


        // Phase 2: COMPUTE (pure, no DOM access)
        const view = this.computeView()
        this._view = view;
        // Phase 3: WRITE (mutate DOM, no reads!)
        this.renderStickyGroupRows(view)
        this.renderView(view)

        // Phase 4: MEASURE (deferred to next frame to avoid forced reflow)
        requestAnimationFrame(() => this.measureAndAdjustScroll(view))

    }

    /**
     * Computes the view to render based on current scroll position
     */
    private computeView = (): GridView => {

        const totalRows = this._gridRows.count()

        const totalHeight = this._sizeManager.getOffset(totalRows)

        const scrollTop = this._scrollTop;

        const firstVisibleIndex = this._sizeManager.findIndex(scrollTop)

        const start = Math.max(
            0,
            firstVisibleIndex
        )

        const rows: GridViewRow[] = []

        const startOffset = this._sizeManager.getOffset(start)
        let y = startOffset

        for (let i = start; i < totalRows; i++) {

            const height = this._sizeManager.getSize(i)
            const gr = this._gridRows.getAt(i)

            if (!gr)
                continue;


            rows.push({
                index: i,
                gridRow: gr,
            })

            y += height

            if (rows.length >= this._MAX_ROWS)
                break

            if (y > scrollTop + this._viewportHeight)
                break;
        }

        return {
            rows,
            totalRows,
            totalHeight,
            start,
            startOffset,
            firstVisibleIndex,
        }
    }

    // --------------------------------------
    // Actual Render - Update DOM
    // --------------------------------------

    private renderView = (view: GridView): void => {

        let p = 0
        for (const rowInfo of view.rows) {

            if (p >= this._rowsPool.length) {

                const el = tr();
                this._rowsPool.push(el);
                this._contentTable.tBodies[0].appendChild(el);

            }

            rowInfo.tr = this._rowsPool[p]

            this.renderGridRow(rowInfo);
            rowInfo.tr.style.display = ""
            p++
        }

        // hide unused rows
        for (let i = p; i < this._rowsPool.length; i++) {
            this._rowsPool[i].style.display = "none"
        }

        const offset = view.startOffset - this._scrollTop;
        this._contentTable.tBodies[0].style.transform = `translateY(${Math.floor(offset)}px)`
        //this._contentTable.tBodies[0].style.top = `${Math.floor(view.startOffset)}px`
        if (this._totalBodyHeight != view.totalHeight) {

            this._totalBodyHeight = view.totalHeight
            this._scrollEngine.updateDimensions(
                this._scrollEngine.scrollWidth,
                this._totalBodyHeight + this._footerHeight + this._headerHeight)
        }
    }

    // --------------------------------------
    // Measure phase (READ ONLY)
    // --------------------------------------

    private measureAndAdjustScroll = (view: GridView): void => {

        let changed = false
        let scrollDelta = 0;

        if (this._defaultRowSize == 0 && view.rows.length > 0) {

            let sum = 0;
            for (const row of view.rows) {
                const el = row.tr!
                const measured = el.offsetHeight
                sum += measured
            }
            if (sum > 0)
                this._sizeManager.defaultSize = this._defaultRowSize = Math.round(sum / view.rows.length)
            //if (changed) this.refresh();
        }

        let columnWidths: Map<GridColumn<TRow>, number> | undefined;
        let canvasContext: CanvasRenderingContext2D | undefined;

        const pendingWidthColumns = this._gridColumns.filter(c => c.isAutoWidth && !c.widthMeasured);

        for (const row of view.rows) {

            const el = row.tr!
            const measured = el.offsetHeight
            const prev = this._sizeManager.getSize(row.index)

            if (measured > 0 && measured !== prev) {
                this._sizeManager.update(row.index, measured)
                changed = true
                if (row.index < view.firstVisibleIndex) {
                    scrollDelta += measured - prev;
                }
            }

            if (pendingWidthColumns.length) {
                if (!columnWidths) {
                    columnWidths = new Map();
                }
                // Measure column widths
                for (let col of pendingWidthColumns) {
                    let txt = this.getCellText(row.gridRow, col);
                    if (!txt)
                        txt = col.dataColumn?.caption ?? col.dataColumn?.name ?? "";
                    let estimatedWidth = col.width;
                    if (txt) {

                        if (!canvasContext) {
                            const canvas = document.createElement('canvas');
                            canvasContext = canvas.getContext('2d')!;
                            canvasContext.font = "16px Arial"; // Match your grid's font styling
                        }

                        const metrics = canvasContext.measureText(txt);
                        // Add padding (e.g., 24px for cell padding + borders)
                        estimatedWidth = metrics.width + 24;
                        if (col.groupIndex > -1)
                            estimatedWidth += 100;
                    }

                    let width = columnWidths.get(col) ?? 50;
                    if (estimatedWidth > width) {
                        width = estimatedWidth;
                    }
                    columnWidths.set(col, width);
                }
            }
        }

        if (columnWidths) {
            for (let [col, width] of columnWidths) {
                col.width = width;
                col.naturalWidth = width;
                col.widthMeasured = true;
            }
            this.redistributeColumnWidths();
            // Needs refresh
            this.refresh();
        }

        const currentWidth = this._contentTable.offsetWidth;
        if (currentWidth != this._totalWidth) {
            this._totalWidth = currentWidth;
            this._scrollEngine.updateDimensions(
                this._totalWidth,
                this._scrollEngine.scrollHeight);
        }

        if (scrollDelta != 0)
            this._scrollEngine.scrollTop += scrollDelta;

    }



    private applyLeftStickyStyles = (visibleIndex: number, props: any, offsetLeft: number, width: number) => {
        props.style = props.style || {};
        props.style.position = "sticky";
        props.style.zIndex = "2";
        props.style.width = width + "px";
        props.style.minWidth = width + "px";
        props.style.maxWidth = width + "px";
        props.style.left = (offsetLeft) + "px";

        if (visibleIndex == this.fixedLeftColumnCount - 1) {
            props.style.borderRight = "1px solid var(--elg-border-color)";
        }
    }

    private applyRightStickyStyles = (visibleIndex: number, props: any, offsetRight: number, width: number) => {
        props.style = props.style || {};
        props.style.position = "sticky";
        props.style.zIndex = "2";
        props.style.width = width + "px";
        props.style.minWidth = width + "px";
        props.style.maxWidth = width + "px";
        props.style.right = (offsetRight) + "px";

        if (visibleIndex == this._gridColumns.length - 1 - this.fixedRightColumnCount) {
            props.style.borderLeft = "1px solid var(--elg-border-color)";
        }
    }

    private getCellText = (gridRow: GridRow, col: GridColumn<TRow>): string => {

        // First column in a group row displays the group label.
        if (false && col.visibleIndex == 1
            && gridRow.expandable
            && gridRow.type == "group")
            return gridRow.text ?? "";

        if (col.dataColumn) {
            const cell = gridRow.cells?.[col.dataColumn.name];
            return String(cell?.text ?? cell?.value ?? cell ?? "");
        }
        else if (col.type == "rowheader") {
            return String(gridRow.visibleIndex)
        }

        return "";
    }

    private getCellView = (
        gridRow: GridRow,
        col: GridColumn<TRow>): CellView<TRow> => {

        const props: any = {
            className: `elg-gridcell elg-gridcell-${col.type}`,
        };
        let customContent: DataCellRendererResult | undefined;

        switch (gridRow.type) {

            case "group":
            case "data":
            case "node":
            case "summary": {
                if (col.type == "rowheader") {
                    props.textContent = this.getCellText(gridRow, col);
                    if (this.isSelectableGridRow(gridRow)) {
                        props.onmousedown = (e: MouseEvent) => this.beginRowSelection(e, gridRow);
                        props.onmouseenter = () => this.enterSelection(gridRow, col.visibleIndex);
                        props.oncontextmenu = (e: MouseEvent) => this.showContextMenu(e, "rowHeader", gridRow);
                    }
                    break;
                }
                if (!col.dataColumn) break;

                const cellText = this.getCellText(gridRow, col);
                const resolvedCell = gridRow.cells?.[col.dataColumn.name];
                const dataCell: DataCell<TRow> = {
                    column: col.dataColumn,
                    rowData: gridRow.data as TRow,
                    value: resolvedCell?.value ?? resolvedCell,
                    text: cellText
                };
                const customStyle = col.dataColumn.customCellStyle?.(dataCell);
                if (customStyle) {
                    if (customStyle.className)
                        props.className += " " + customStyle.className;
                    if (customStyle.style)
                        props.style = customStyle.style;
                }
                customContent = col.dataColumn.renderCell?.(dataCell);
                if (customContent !== undefined) {
                    if (customContent && typeof customContent === "object" && "tag" in customContent)
                        props.vnodes = [customContent];
                }

                props.onmousedown = (e: MouseEvent) => this.beginCellSelection(e, gridRow, col.visibleIndex);
                props.onmouseenter = () => this.enterSelection(gridRow, col.visibleIndex);
                props.oncontextmenu = (e: MouseEvent) => this.showContextMenu(
                    e,
                    "cell",
                    gridRow,
                    col.dataColumn,
                    col.visibleIndex - this.rowHeaderOffset
                );

                if (customContent === undefined && col.visibleIndex == 1) {

                    if (gridRow.expandable) {

                        props.vnodes = [
                            v("i", {
                                class: "elg-icon " + (gridRow.expanded ? "ri-arrow-down-s-line" : "ri-arrow-right-s-line"),
                                ui: ["elg", "hover", "me-1"],
                                style: {
                                    marginLeft: (this._groupPadding * gridRow.level) + "px",
                                },
                                onclick: async (e, el) => {

                                    assignElementProps(el, {
                                        class: "elg-spinner-ring",
                                        ui: ["elg", "me-1", "text-primary"]
                                    })

                                    const rowIndex = gridRow.visibleIndex;

                                    await this._gridRows.setExpanded(gridRow, !gridRow.expanded);

                                    // If current row is sticky group row - scroll to that row in the grid body.
                                    if (el.closest(".elg-gridrow-sticky")) {
                                        this.scrollToRow(rowIndex);
                                    }
                                    else {
                                        // Refresh grid rows.
                                        this.render(this.renderBody);
                                    }
                                }
                            }),
                            v("span", cellText)
                        ]
                    } else {
                        // Reserve the same width as the expand arrow (hidden, not just omitted) so leaf
                        // rows' text lines up with their expandable siblings' text at the same level.
                        props.vnodes = [
                            v("i", {
                                class: "elg-icon ri-arrow-right-s-line",
                                ui: ["elg", "me-1"],
                                style: {
                                    marginLeft: (this._groupPadding * gridRow.level) + "px",
                                    visibility: "hidden"
                                }
                            }),
                            v("span", cellText)
                        ]
                    }

                } else if (customContent === undefined) {
                    props.textContent = cellText;
                }
            } break;

            case "header":
                if (col.type == "data" && col.dataColumn) {
                    const sortDirection = this.getColumnSortDirection(col.dataColumn.name);
                    const sortOrder = this.getColumnSortOrder(col.dataColumn.name);
                    const showSortOrder = sortOrder !== undefined && (this._gridOptions.orderBy?.length ?? 0) > 1;
                    props.vnodes = [
                        v("span", String(col.dataColumn.caption ?? col.dataColumn.name)),
                        showSortOrder
                            ? v("span", {
                                textContent: String(sortOrder),
                                ui: ["ms-1", "text-muted", "fs-80"],
                                ariaLabel: `Sort priority ${sortOrder}`
                            })
                            : null,
                        sortDirection
                            ? v("i", {
                                class: `${sortDirection === "asc" ? "ri-arrow-up-line" : "ri-arrow-down-line"}`,
                                ui: ["ms-1", "text-muted"],
                                ariaLabel: sortDirection === "asc" ? "Sorted ascending" : "Sorted descending"
                            })
                            : null,
                        v("em", {
                            class: "elg-grid-header-resizer",
                            onmousedown: (e, el) => this.resizeColumn(e, col),
                            ontouchstart: (e, el) => this.resizeColumn(e, col),
                            ondblclick: (e, el) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (col.dataColumn)
                                    this.autoSizeColumn(col.dataColumn.name);
                            },
                        }),
                    ]
                    props.onmousedown = (e: MouseEvent, td: HTMLTableCellElement) => this.startColumnDrag(e, td, col);
                    props.ontouchstart = (e: TouchEvent, td: HTMLTableCellElement) => this.startColumnDrag(e, td, col);
                    props.onclick = (e: MouseEvent) => {
                        if (this._gridOptions.sortOnHeaderClick !== false)
                            this.toggleColumnSort(col.dataColumn!.name, e.shiftKey);
                    };
                    props.oncontextmenu = (e: MouseEvent) => this.showContextMenu(
                        e,
                        "columnHeader",
                        undefined,
                        col.dataColumn
                    );
                }
                break;

            case "footer":
            case "filter":
                // Placeholder cells; footer summaries and per-column filter controls land later.
                if (col.type == "data") props.innerHTML = "&#8203;";
                break;

            default:
                // loading / empty / error / detail rows: still show a row number, placeholder data cell.
                if (col.type == "rowheader") props.textContent = this.getCellText(gridRow, col);
                else if (col.type == "data") props.innerHTML = "&#8203;";
                break;
        }

        if (this._activeColIndex === col.visibleIndex) {
            props.className += " elg-column-dragging";
        }

        const selectionColIndex = col.type === "data"
            ? col.visibleIndex - this.rowHeaderOffset
            : 0;
        if (this.isSelectableGridRow(gridRow) && col.type === "data") {
            const state = this._selection.getSelectionState(
                gridRow.visibleIndex,
                selectionColIndex,
                this.getSelectionContext()
            );
            if (state.selected) {
                props.className += " elg-selected-cell";
                for (const side of state.edges) {
                    props.className += " elg-selected-cell-" + side;
                }
            }
        }
        if (this.isSelectableGridRow(gridRow)
            && this._selection.isWholeRowSelected(gridRow.visibleIndex)
            && col.type === "rowheader") {
            props.className += " elg-selected-row-header";
        }
        if (this.isSelectableGridRow(gridRow)
            && col.type === "data"
            && this._selection.isActive(gridRow.visibleIndex, selectionColIndex)) {
            props.className += " elg-active-cell";
        }

        return { col, props, customContent };
    }

    private resizeColumn = (e: MouseEvent | TouchEvent, col: GridColumn<TRow>) => {

        e.preventDefault();
        e.stopPropagation();

        const startWidth = col.width;
        const startIsAutoWidth = col.isAutoWidth;

        // Manually resizing a column takes it out of the auto-fill pool permanently.
        col.isAutoWidth = false;

        this._cancelActiveResize?.();
        let cancelResize: (() => void) | undefined;
        const clearResize = () => {
            if (this._cancelActiveResize === cancelResize)
                this._cancelActiveResize = undefined;
        };

        cancelResize = trackGesture(e, {
            axis: "x",
            onMove: (dx) => {
                col.width = Math.floor(Math.max(40, Math.min(800, startWidth + dx)));
                this.redistributeColumnWidths();
                this.render(this.renderColGroup);
            },
            onEnd: () => {
                // Sync the resolved width back onto the column definition (same object referenced by
                // _gridOptions.columns) so getColumn()/getOptions() reflect what's on screen.
                if (col.dataColumn)
                    col.dataColumn.width = col.width;
                clearResize();
            },
            onCancel: () => {
                col.width = startWidth;
                col.isAutoWidth = startIsAutoWidth;
                this.redistributeColumnWidths();
                this.render(this.renderColGroup);
                clearResize();
            }
        });
        this._cancelActiveResize = cancelResize;
    }

    /** Releases grid-owned interaction controllers and active gestures. */
    public override dispose(): void {
        this._cancelActiveResize?.();
        this._cancelActiveResize = undefined;
        super.dispose();
    }

    private startColumnDrag = (e: MouseEvent | TouchEvent, headerTd: HTMLTableCellElement, col: GridColumn<TRow>) => {

        if (e instanceof MouseEvent && e.button !== 0) return;
        if (!col.dataColumn) return;

        const sourceIndex = this._gridColumns.filter(c => c.type == "data").indexOf(col);

        this._activeColIndex = col.visibleIndex;
        headerTd.classList.add("elg-column-dragging");

        let dragMoved = false;
        this._dragDrop.beginDrag(
            {
                kind: "column",
                id: col.dataColumn.name,
                label: col.dataColumn.caption ?? col.dataColumn.name,
                ghostClassName: "elg-box elg-grid-drag-ghost",
                ghostSize: "content",
                sourceZoneId: "grid-header",
                sourceIndex
            },
            e,
            headerTd.getBoundingClientRect(),
            "x",
            () => {
                this._activeColIndex = -1;
                headerTd.classList.remove("elg-column-dragging");
                if (dragMoved) this.refresh();
            },
            () => {
                dragMoved = true;
            }
        );
    }

    private startGroupChipDrag = (e: MouseEvent | TouchEvent, chipEl: HTMLElement, columnName: string, sourceIndex: number) => {

        if (e instanceof MouseEvent && e.button !== 0) return;

        const col = this._columnsIndex.get(columnName);
        if (!col) return;

        this._activeGroupColumn = columnName;
        chipEl.classList.add("elg-column-dragging");

        let dragMoved = false;
        // Ghost keeps the chip's own width, but reads as a header cell height-wise. Height comes
        // from the header row itself, not _headerHeight (which is tHead's total height and would
        // include a filter row too, once DataGridLayoutInfo.showFilterRow is implemented).
        const chipRect = chipEl.getBoundingClientRect();
        const headerRowHeight = this._contentTable.tHead?.rows[0]?.offsetHeight;
        const anchorRect = new DOMRect(
            chipRect.left,
            chipRect.top,
            chipRect.width,
            headerRowHeight || chipRect.height
        );

        this._dragDrop.beginDrag(
            {
                kind: "column",
                id: columnName,
                label: col.caption ?? col.name,
                ghostClassName: "elg-box elg-grid-drag-ghost",
                ghostSize: "content",
                sourceZoneId: "group-panel",
                sourceIndex
            },
            e,
            anchorRect,
            "x",
            () => {
                this._activeGroupColumn = undefined;
                chipEl.classList.remove("elg-column-dragging");
                if (dragMoved) this.refresh();
            },
            () => {
                dragMoved = true;
            }
        );
    }

    private removeGroupColumn(name: string) {
        const groupColumns = this._gridOptions.groupColumns!;
        const ix = groupColumns.indexOf(name);
        if (ix < 0) return;
        groupColumns.splice(ix, 1);
        this.recomputeGroupIndexes();
        this.reloadRows();
    }

    private recomputeGroupIndexes() {
        const groupColumns = this._gridOptions.groupColumns!;
        for (const col of this._gridColumns) {
            if (col.dataColumn)
                col.groupIndex = groupColumns.indexOf(col.dataColumn.name);
        }
    }

    /**
     * Rebuilds the rows pipeline from scratch against the current DataGridState (grouping,
     * filter, orderBy, ...). Used any time a data-shaping option changes - the DataSource
     * decides internally how "hard" the reload actually is (e.g. a local array source just
     * re-buckets in memory). Resets expand/collapse state and scroll position, since the
     * previous row tree no longer matches the new shape.
     */
    private reloadRows() {
        this._gridRows = this.createGridRows();
        this.refresh();
    }

    /**
     * Applies a completed column drag: repositions within _gridColumns when dropped on the header,
     * or adds/reorders _groupColumns when dropped on the group panel. Triggers a real row reload
     * when the grouping actually changed.
     */
    private handleColumnDrop = (payload: DragPayload, target: DropTarget) => {

        const columnName = payload.id;
        const groupColumns = this._gridOptions.groupColumns!;
        const groupColumnsBefore = groupColumns.slice();
        const headerOffset = this.rowHeaderOffset;

        if (payload.sourceZoneId == "group-panel" && target.zoneId != "group-panel") {
            const gi = groupColumns.indexOf(columnName);
            if (gi > -1) groupColumns.splice(gi, 1);
        }

        if (target.zoneId == "grid-header") {
            const gridCol = this._gridColumns.find(c => c.dataColumn?.name == columnName);
            if (gridCol) {
                const fromIx = this._gridColumns.indexOf(gridCol);
                this._gridColumns.splice(fromIx, 1);
                let toIx = target.index + headerOffset;
                if (fromIx < toIx) toIx--;
                this._gridColumns.splice(Math.max(headerOffset, toIx), 0, gridCol);
                this._gridColumns.forEach((c, ix) => c.visibleIndex = ix);

                // Keep visibleColumns in sync with the live drag-reordered order, since getOptions()
                // must reflect reality, not just what was last passed to setOptions().
                this._gridOptions.visibleColumns = this._gridColumns
                    .filter(c => c.dataColumn)
                    .map(c => c.dataColumn!.name);
            }
        }
        else if (target.zoneId == "group-panel") {
            if (payload.sourceZoneId == "group-panel") {
                const fromIx = groupColumns.indexOf(columnName);
                if (fromIx > -1) {
                    groupColumns.splice(fromIx, 1);
                    let toIx = target.index;
                    if (fromIx < toIx) toIx--;
                    groupColumns.splice(toIx, 0, columnName);
                }
            } else if (!groupColumns.includes(columnName)) {
                groupColumns.splice(target.index, 0, columnName);
            }
        }

        this.recomputeGroupIndexes();

        const groupColumnsChanged = groupColumnsBefore.length !== groupColumns.length
            || groupColumnsBefore.some((name, ix) => name !== groupColumns[ix]);

        if (groupColumnsChanged) {
            this.normalizeGroupingSort();
            this.reloadRows();
        } else {
            this.refresh();
        }
    }

    private renderGridRow = (row: GridViewRow) => {

        if (!row.tr)
            return;

        const cells = this._gridColumns.map(col => this.getCellView(row.gridRow, col));
        const cellElements: HTMLTableCellElement[] = [];
        let ix = 0;
        let offsetLeft = 0;


        for (let cell of cells) {
            let cellElement = row.tr.cells[ix];
            if (!cellElement) {
                cellElement = document.createElement("td") as HTMLTableCellElement;
                const r = Math.floor(Math.random() * 40) + 5;
                cellElement.style.setProperty('--elg-empty-right', r + 'px');
                row.tr.appendChild(cellElement);
            }

            cellElements.push(cellElement);


            if (ix < this.fixedLeftColumnCount) {
                this.applyLeftStickyStyles(ix, cell.props, offsetLeft, cell.col.width);
            }
            offsetLeft += cell.col.width;
            ix++;
        }

        // Apply right sticky styles
        if (this.fixedRightColumnCount > 0) {
            let offsetRight = 0;
            for (let k = cells.length - 1; k >= cells.length - this.fixedRightColumnCount; k--) {
                const cell = cells[k];
                this.applyRightStickyStyles(k, cell.props, offsetRight, cell.col.width);
                offsetRight += cell.col.width;
            }
        }

        for (let i = 0; i < cellElements.length; i++) {
            const previousContent = this._customCellContent.get(cellElements[i]);
            if (previousContent instanceof Component)
                previousContent.dispose();
            else if (previousContent?.parentNode === cellElements[i])
                cellElements[i].removeChild(previousContent);
            this._customCellContent.delete(cellElements[i]);
            setElementProps(cellElements[i], cells[i].props);
            const content = cells[i].customContent;
            if (content instanceof Component) {
                content.mount(cellElements[i]);
                this._customCellContent.set(cellElements[i], content);
            } else if (content instanceof Node) {
                cellElements[i].appendChild(content);
                this._customCellContent.set(cellElements[i], content);
            } else if (typeof content === "string") {
                cellElements[i].appendChild(document.createTextNode(content));
            }
        }

        // Remove excess cells
        while (ix < row.tr.cells.length)
            row.tr?.removeChild(row.tr.cells[ix]);

        setElementProps(row.tr, {
            class: "elg-gridrow elg-gridrow-" + row.gridRow.type
        });
    }

    /** Number of static (non-sticky) rows currently occupying the front of the <thead> pool. */
    private get staticTHeadRowCount(): number {
        return (this._gridOptions.showColumnHeaders ? 1 : 0)
            + (this._gridOptions.showFilterRow ? 1 : 0);
    }

    /** Resolves the expanded group/node chain above the first visible body row. */
    private getStickyGroupRows(view: GridView): GridRow[] {
        const rows: GridRow[] = [];
        const visited = new Set<number>();
        let row = view.rows[0]?.gridRow;

        while (row?.parentRowIndex !== undefined) {
            const parentRowIndex = row.parentRowIndex;
            if (parentRowIndex < 0 || visited.has(parentRowIndex)) break;
            visited.add(parentRowIndex);

            const parent = this._gridRows.getAt(parentRowIndex);
            if (parent.type !== "group" && parent.type !== "node") break;

            rows.push(parent);
            row = parent;
        }

        rows.reverse();

        const maxLevels = this._gridOptions.stickyGroupRowsMaxLevels;
        if (maxLevels !== undefined && rows.length > maxLevels) {
            // Keep the innermost (closest to the viewport) ancestors - they're the most relevant context.
            return rows.slice(rows.length - maxLevels);
        }

        return rows;
    }

    /** Returns a reusable row slot in the shared pool for all <thead> row types. */
    private getTHeadRow(index: number): HTMLTableRowElement {
        const tHead = this._contentTable.tHead!;
        while (this._tHeadRowsPool.length <= index) {
            const tr = document.createElement("tr");
            this._tHeadRowsPool.push(tr);
            tHead.appendChild(tr);
        }
        const tr = this._tHeadRowsPool[index];
        if (tr.parentElement !== tHead) {
            tHead.appendChild(tr);
        }
        return tr;
    }

    /** Renders the current group/node ancestry after the static table-header rows. */
    private renderStickyGroupRows(view: GridView) {
        const rows = this._gridOptions.stickyGroupRows
            ? this.getStickyGroupRows(view)
            : [];
        const rowsChanged = this._stickyGroupRowsDirty
            || rows.length !== this._renderedStickyGroupRows.length
            || rows.some((row, index) => row !== this._renderedStickyGroupRows[index]);

        if (!rowsChanged) return;

        const staticCount = this.staticTHeadRowCount;

        for (let i = 0; i < rows.length; i++) {
            const tr = this.getTHeadRow(staticCount + i);
            this.renderGridRow({ gridRow: rows[i], tr, index: rows[i].visibleIndex });
            tr.classList.add("elg-gridrow-sticky");
            tr.style.display = "";
        }

        for (let i = staticCount + rows.length; i < this._tHeadRowsPool.length; i++) {
            this._tHeadRowsPool[i].style.display = "none";
        }

        if (rowsChanged) {
            this._renderedStickyGroupRows = rows;
            this._stickyGroupRowsDirty = false;
            this.updateHeaderAndFooterDimensions();
        }
    }

    /** Placeholder for the per-column filter row; real filter controls land later. */
    private renderFilterRow(index: number) {
        if (!this._gridOptions.showFilterRow) {
            if (this._tHeadRowsPool[index]) {
                this._tHeadRowsPool[index].style.display = "none";
            }
            return;
        }

        const tr = this.getTHeadRow(index);
        this.renderGridRow({
            gridRow: {
                type: "filter",
                visibleIndex: 0,
                level: 0,
                cells: {}
            },
            tr,
            index: 0
        });
        tr.style.display = "";
    }

    private renderHeaderAndFooter() {

        let nextIndex = 0;

        if (this._gridOptions.showColumnHeaders) {
            const hr = this.getTHeadRow(nextIndex++);
            this.renderGridRow({
                gridRow: {
                    type: "header",
                    visibleIndex: 0,
                    level: 0,
                    cells: {}
                },
                tr: hr,
                index: 0
            });
            hr.style.display = "";
        } else if (this._tHeadRowsPool[0]) {
            this._tHeadRowsPool[0].style.display = "none";
        }

        this.renderFilterRow(nextIndex);
        if (this._gridOptions.showFilterRow) nextIndex++;

        this._stickyGroupRowsDirty = true;

        const tFoot = this._contentTable.tFoot!;
        let fr = tFoot.rows[0];

        if (this._gridOptions.showColumnFooters) {
            if (!fr) {
                fr = document.createElement("tr")
                tFoot.appendChild(fr)
            }

            this.renderGridRow({
                gridRow: {
                    type: "footer",
                    visibleIndex: 0,
                    level: 0,
                    cells: {}
                },
                tr: fr,
                index: 0
            });
            fr.style.display = "";
        } else if (fr) {
            fr.style.display = "none";
        }

        this.updateHeaderAndFooterDimensions();
    }

    /** Reconciles the virtual scroll range after a static or sticky table section changes height. */
    private updateHeaderAndFooterDimensions() {
        const headerHeight = this._contentTable.tHead?.offsetHeight || 0;
        const footerHeight = this._contentTable.tFoot?.offsetHeight || 0;
        if (headerHeight != this._headerHeight || footerHeight != this._footerHeight) {

            this._headerHeight = headerHeight;
            this._footerHeight = footerHeight;
            // No need to update scroll dimensions. 
            // The scroll engine uses ResizeObserver to update.
            /*
            this._scrollEngine.updateDimensions(
                this._scrollEngine.scrollWidth,
                this._totalBodyHeight + this._headerHeight + this._footerHeight) 
            */
        }
    }



    private renderHeaderPanel = () => {

        if (this._isHierarchicalData) {
            setElementProps(this._headerPanel, { class: "elg-grid-header", style: { display: "none" }, vnodes: [] });
            return;
        }

        const props: ElementProps<HTMLElement> = {
            class: "elg-grid-header",
            vnodes: []
        };

        // Render group chips or empty text if no group columns are defined.

        const groupColumns = this._gridOptions.groupColumns!;

        if (groupColumns.length === 0) {
            props.vnodes!.push(v("span", {
                class: "elg-grid-header-empty"
            }, this.texts.groupPanelEmptyText));
        }

        groupColumns.forEach((cn: string, sourceIndex: number) => {
            let col = this._columnsIndex.get(cn);
            if (col) {
                const sortDirection = this.getColumnSortDirection(cn);
                const sortOrder = this.getColumnSortOrder(cn);
                const showSortOrder = sortOrder !== undefined && (this._gridOptions.orderBy?.length ?? 0) > 1;

                if (props.vnodes!.length)
                    props.vnodes?.push(v("i", {
                        class: "ri-arrow-right-s-line"
                    }));

                props.vnodes!.push(v("div",
                    {
                        class: "elg-gridcell" + (this._activeGroupColumn === cn ? " elg-column-dragging" : ""),
                        onmousedown: (e, el) => this.startGroupChipDrag(e, el, cn, sourceIndex),
                        ontouchstart: (e, el) => this.startGroupChipDrag(e, el, cn, sourceIndex),
                        onclick: (e: MouseEvent) => {
                            if (this._gridOptions.sortOnHeaderClick !== false)
                                this.toggleColumnSort(cn, e.shiftKey);
                        },
                        oncontextmenu: (e: MouseEvent) => this.showContextMenu(
                            e,
                            "columnHeader",
                            undefined,
                            col
                        ),
                    },
                    v("span", col.caption ?? col.name),
                    showSortOrder
                        ? v("span", {
                            textContent: String(sortOrder),
                            ui: ["ms-1", "text-muted", "fs-80"],
                            ariaLabel: `Sort priority ${sortOrder}`
                        })
                        : null,
                    sortDirection
                        ? v("i", {
                            class: sortDirection === "asc" ? "ri-arrow-up-line" : "ri-arrow-down-line",
                            ui: ["ms-1", "text-muted"],
                            ariaLabel: sortDirection === "asc" ? "Sorted ascending" : "Sorted descending"
                        })
                        : null,
                    v("i", {
                        style: { marginRight: "0" },
                        class: "elg-icon ri-close-line",
                        onclick: (e, el) => {
                            e.stopPropagation();
                            this.removeGroupColumn(cn);
                        }
                    })
                ))
            }
        });

        setElementProps(this._headerPanel, props)

    }

    /**
     * Recomputes width for all "auto" columns (no configured width, not yet manually resized) so
     * they fill any leftover viewport space, scaled from each column's naturalWidth baseline - never
     * from the current (possibly already-scaled) width, which would drift on repeated calls. Pure
     * width mutation; callers are responsible for triggering a render afterward.
     */
    private redistributeColumnWidths() {

        const autoColumns = this._gridColumns.filter(c => c.isAutoWidth);
        if (autoColumns.length === 0) return;

        if (!this._gridOptions.autoFillViewportWidth) {
            for (const col of autoColumns) col.width = col.naturalWidth;
            return;
        }

        // Falls back to a direct (one-time) measurement if the ResizeObserver-driven _viewportWidth
        // hasn't reported yet - avoids a first-paint flash of unstretched columns.
        const viewportWidth = this._viewportWidth || this._tableContainer.clientWidth;

        const fixedTotal = this._gridColumns
            .filter(c => !c.isAutoWidth)
            .reduce((sum, c) => sum + c.width, 0);
        const naturalTotal = autoColumns.reduce((sum, c) => sum + c.naturalWidth, 0);
        const available = viewportWidth - fixedTotal;

        const scale = naturalTotal > 0 && available > naturalTotal ? available / naturalTotal : 1;
        for (const col of autoColumns) {
            col.width = col.naturalWidth * scale;
        }
    }

    private renderColGroup = () => {

        const colGroup = this._contentTable.querySelector("colgroup")!;
        if (!colGroup) {
            return;
        }

        let ix = 0;
        let totalWidth = 0;

        for (let col of this._gridColumns) {
            let colElement = colGroup.children[ix] as HTMLElement;
            if (!colElement) {
                colElement = document.createElement("col");
                colGroup.appendChild(colElement);
            }

            setElementProps(colElement, {
                style: {
                    width: col.width + "px"
                }
            });

            totalWidth += col.width;
            ix++;
        }

        for (let j = ix; j < colGroup.children.length; j++) {
            colGroup.removeChild(colGroup.children[j]);
        }

        // Keep the virtual scroll width aligned with the browser's whole-pixel table width.
        // Fractional column sums can otherwise exceed the viewport by a tiny floating-point
        // amount for one frame, briefly showing the horizontal scrollbar.
        const renderedWidth = Math.round(totalWidth);

        if (this._totalWidth != renderedWidth) {
            this._totalWidth = renderedWidth
            assignElementProps(this._contentTable, { style: { width: renderedWidth + "px" } });
            this._scrollEngine.updateDimensions(
                this._totalWidth,
                this._scrollEngine.scrollHeight)
        }
    }
}











