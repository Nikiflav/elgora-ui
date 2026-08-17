import { Component } from "../../core/Component";
import { setElementProps, e, assignElementProps, span, tr, VNode, v, VNodeChild, ElementProps } from "../../core/e";
import { Utils } from "../../core/Utils";
import { DataFilter } from "../../data/filter";
import { ScrollEngine } from "../scrollbar/scroll-engine";
import { Scrollbar } from "../scrollbar/scrollbar";
import { VariableSizeManager } from "../virtual-list/SizeManager";
import { VirtualList, VirtualDataSource, RenderRowArgs } from "../virtual-list/VirtualList";
import { DataCell, DataColumn, DataColumnLayoutInfo, DataColumnUtils, OrderByToken, orderByTokenToString, SummaryType } from "./DataColumn";
import { ArrayDataSource, DataSource, LocalGroupingDataSource, RowIdentity } from "./DataSource";
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
    /** Filter applied to the data rows. */
    filter?: DataFilter,
    /** Ordered column names to group by (outermost first). Ignored when the data source is hierarchical. */
    groupColumns?: string[],
    /** The aggregation summary for group rows. */
    groupSummary?: { field: string, summaryType: SummaryType }[],
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

    private _dragDrop: DragDropController;

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

        this._tableContainer.addEventListener("keydown", this.handleSelectionKeyDown, true);
        this._tableContainer.addEventListener("mouseup", this.endSelectionDrag);
        this._tableContainer.addEventListener("mouseleave", this.endSelectionDrag);

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
        this._scrollEngine.onScroll(this.updateLayout);
        this._scrollEngine.onResize(() => {
            this.updateLayout();
            this.redistributeColumnWidths();
            this.render(this.renderColGroup);
        })

        this._dragDrop = new DragDropController({ onDrop: this.handleColumnDrop });

        this._dragDrop.registerZone(createListDropZone({
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
        }));

        this._dragDrop.registerZone(createListDropZone({
            id: "group-panel",
            kind: "column",
            element: this._headerPanel,
            axis: "x",
            itemSelector: ".elg-gridcell",
            scrollBy: delta => this._headerPanel.scrollLeft += delta
        }));

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

    private handleSelectionKeyDown = (event: KeyboardEvent) => {
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
        else this._selection.handleCellMouseEnter(row.visibleIndex, colIndex - this.rowHeaderOffset, true);
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
            ds = new ArrayDataSource<TRow>(data || []);
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
            });
        }
    }

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
            || "pageSize" in options || "filter" in options || "orderBy" in options || "groupSummary" in options)) {
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

        this.dom.dispatchEvent(new CustomEvent("optionChanged", { detail: options }));

        const firstCall = !this._initialized;

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
            || "pageSize" in options || "filter" in options || "orderBy" in options || "groupSummary" in options;
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
            props.style.borderRightWidth = "2px";
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
            props.style.borderLeft = "2px solid var(--elg-border-color)";
        }
    }

    private getCellText = (gridRow: GridRow,
        col: GridColumn<TRow>): string => {
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
                    }
                    break;
                }
                if (!col.dataColumn) break;

                let cellText = this.getCellText(gridRow, col);

                props.onmousedown = (e: MouseEvent) => this.beginCellSelection(e, gridRow, col.visibleIndex);
                props.onmouseenter = () => this.enterSelection(gridRow, col.visibleIndex);

                if (col.visibleIndex == 1) {

                    if (gridRow.expandable) {
                        if (gridRow.type == "group")
                            cellText = gridRow.text ?? "";

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

                } else {
                    props.textContent = cellText;
                }
            } break;

            case "header":
                if (col.type == "data" && col.dataColumn) {
                    props.vnodes = [
                        v("span", String(col.dataColumn.caption ?? col.dataColumn.name)),
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
            props.className += " elg-active-col";
        }

        const selectionColIndex = col.type === "data"
            ? col.visibleIndex - this.rowHeaderOffset
            : 0;
        if (this.isSelectableGridRow(gridRow)
            && col.type === "data"
            && this._selection.isSelected(gridRow.visibleIndex, selectionColIndex)) {
            props.className += " elg-selected-cell";
        }
        if (this._selection.isWholeRowSelected(gridRow.visibleIndex) && col.type === "rowheader") {
            props.className += " elg-selected-row-header";
        }
        if (this.isSelectableGridRow(gridRow)
            && col.type === "data"
            && this._selection.isActive(gridRow.visibleIndex, selectionColIndex)) {
            props.className += " elg-active-cell";
        }

        return { col, props };
    }

    private resizeColumn = (e: MouseEvent | TouchEvent, col: GridColumn<TRow>) => {

        e.preventDefault();
        e.stopPropagation();

        const startWidth = col.width;
        const startIsAutoWidth = col.isAutoWidth;

        // Manually resizing a column takes it out of the auto-fill pool permanently.
        col.isAutoWidth = false;

        trackGesture(e, {
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
            },
            onCancel: () => {
                col.width = startWidth;
                col.isAutoWidth = startIsAutoWidth;
                this.redistributeColumnWidths();
                this.render(this.renderColGroup);
            }
        });
    }

    private startColumnDrag = (e: MouseEvent | TouchEvent, headerTd: HTMLTableCellElement, col: GridColumn<TRow>) => {

        if (e instanceof MouseEvent && e.button !== 0) return;
        if (!col.dataColumn) return;

        e.preventDefault();

        const sourceIndex = this._gridColumns.filter(c => c.type == "data").indexOf(col);

        this._activeColIndex = col.visibleIndex;
        this.refresh();

        this._dragDrop.beginDrag(
            {
                kind: "column",
                id: col.dataColumn.name,
                label: col.dataColumn.caption ?? col.dataColumn.name,
                ghostClassName: "elg-box elg-gridcell",
                sourceZoneId: "grid-header",
                sourceIndex
            },
            e,
            headerTd.getBoundingClientRect(),
            "x",
            () => {
                this._activeColIndex = -1;
                this.refresh();
            }
        );
    }

    private startGroupChipDrag = (e: MouseEvent | TouchEvent, chipEl: HTMLElement, columnName: string, sourceIndex: number) => {

        if (e instanceof MouseEvent && e.button !== 0) return;

        e.preventDefault();

        const col = this._columnsIndex.get(columnName);
        if (!col) return;

        this._activeGroupColumn = columnName;
        this.refresh();

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
                ghostClassName: "elg-box elg-gridcell",
                sourceZoneId: "group-panel",
                sourceIndex
            },
            e,
            anchorRect,
            "x",
            () => {
                this._activeGroupColumn = undefined;
                this.refresh();
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
            this.reloadRows();
        } else {
            this.refresh();
        }
    }

    private renderGridRow = (row: GridViewRow) => {

        if (!row.tr)
            return;

        const cells = this._gridColumns.map(col => this.getCellView(row.gridRow, col));
        const cellElements: HTMLElement[] = [];
        let ix = 0;
        let offsetLeft = 0;


        for (let cell of cells) {
            let cellElement = row.tr.cells[ix];
            if (!cellElement) {
                cellElement = document.createElement("td");
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
            setElementProps(cellElements[i], cells[i].props);
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

                if (props.vnodes!.length)
                    props.vnodes?.push(v("i", {
                        class: "ri-arrow-right-s-line"
                    }));

                props.vnodes!.push(v("div",
                    {
                        class: "elg-gridcell" + (this._activeGroupColumn === cn ? " elg-active-col" : ""),
                        onmousedown: (e, el) => this.startGroupChipDrag(e, el, cn, sourceIndex),
                        ontouchstart: (e, el) => this.startGroupChipDrag(e, el, cn, sourceIndex),
                    },
                    v("span", col.caption ?? col.name),
                    v("i", {
                        style: { float: "right", marginRight: "0" },
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











