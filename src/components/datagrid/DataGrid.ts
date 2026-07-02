import { Component } from "../../core/Component";
import { setElementProps, e, assignElementProps, span, tr, VNode, v, VNodeChild, ElementProps } from "../../core/e";
import { Utils } from "../../core/Utils";
import { DataFilter } from "../../data/filter";
import { ScrollEngine } from "../scrollbar/scroll-engine";
import { Scrollbar } from "../scrollbar/scrollbar";
import { VariableSizeManager } from "../virtual-list/SizeManager";
import { VirtualList, VirtualDataSource, RenderRowArgs } from "../virtual-list/VirtualList";
import { DataCell, DataColumn, DataColumnOption, DataColumnUtils, OrderByToken, orderByTokenToString, SummaryType } from "./DataColumn";
import { ArrayDataSource, DataSource, LocalGroupingDataSource } from "./DataSource";
import { DataGridState, DefaultGridRowsProvider } from "./DefaultGridRowsProvider";
import { GridRow, GridRowsProvider } from "./GridRow";
import { VirtualGridRows } from "./VirtualGridRows";
import { DataGridTexts, DEFAULT_GRID_TEXTS } from "./DataGridTexts";

import "./DataGrid.css"
import { c, cli } from "../../core/c";
import { trackGesture } from "../../core/interact/DragGesture";
import { DragDropController, DragPayload, DropTarget } from "../../core/interact/DragDropController";
import { createListDropZone } from "../../core/interact/ListDropZone";


/** Accepted row data inputs: a full DataSource, or a plain array wrapped in an ArrayDataSource. */
export type GridDataSource<TRow> = DataSource<TRow> | TRow[];

/** Persisted view state (e.g. for save/restore of a user's layout customizations). */
export interface DataGridLayoutInfo {
    showFilterRow?: boolean;
    visibleColumns?: (string | DataColumnOption)[],
    orderBy?: OrderByToken[],
    groupBy?: string[]
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
    /** Row page size used when querying the DataSource. */
    pageSize?: number,
    /** Names of columns to show as data columns; defaults to all `columns`. */
    visibleColumns?: string[],
    /** Ordered column names to group by (outermost first). */
    groupColumns?: string[],
    /** Overrides for user-facing strings; unset ones fall back to DEFAULT_GRID_TEXTS. */
    texts?: Partial<DataGridTexts>,
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
}

/*
-------------------------------------------------------
*/
export class DataGrid<TRow> extends Component {

    // Options.
    private _dataSource: LocalGroupingDataSource<TRow>;
    private _pageSize = 50;
    private _columns: Map<string, DataColumn<TRow>> = new Map();
    private _fixedLeftColumns: number = 0;
    private _fixedRightColumns: number = 0;
    private _texts: DataGridTexts = DEFAULT_GRID_TEXTS;


    // Data shaping.
    private _filter?: DataFilter;
    private _orderBy?: OrderByToken[];
    private _groupColumns: string[] = [];
    private _visibleColumnNames: string[] = [];
    private _gridColumns: GridColumn<TRow>[] = [];

    // Internal state.
    private _gridRows: VirtualGridRows<TRow>;
    private _defaultColumnWidth = 150;
    private _contentTable: HTMLTableElement;
    private _headerPanel: HTMLDivElement;
    private _tableContainer: HTMLDivElement;
    private _scrollEngine: ScrollEngine;
    private _sizeManager = new VariableSizeManager(30)
    private _defaultRowSize = 0
    // Array of columns that need auto width measurement.
    private _autoWidthColumns?: GridColumn<TRow>[]
    private _rowsPool: HTMLTableRowElement[] = []


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

    private _dragDrop: DragDropController;
    private static readonly HEADER_OFFSET = 1; // _gridColumns[0] is always the row-header column

    private readonly _MAX_ROWS = 100

    constructor(options: DataGridOptions<TRow>) {
        super({ ui: "h-100" })

        // Options.
        this._pageSize = options.pageSize ?? 50;
        // Show row header.
        this._fixedLeftColumns = 1 + (options.fixedLeftColumns || 0);
        this._fixedRightColumns = options.fixedRightColumns || 0;

        // Initialize columns map
        for (const col of options.columns) {
            this._columns.set(col.name, col);
        }

        this._visibleColumnNames = options.visibleColumns || options.columns.map(col => col.name);
        this._groupColumns = options.groupColumns || [];
        this._texts = { ...DEFAULT_GRID_TEXTS, ...options.texts };

        // Initialize columns
        this._gridColumns = this.getGridColumns();
        this._autoWidthColumns = this._gridColumns.filter(c => c.dataColumn && !c.dataColumn.width);

        // Data source.        
        let ds: DataSource<TRow>;
        if (options.data == undefined || options.data instanceof Array) {
            const array = options.data || [];
            ds = new ArrayDataSource<TRow>(array);

        } else {
            ds = options.data;
        }
        this._dataSource = new LocalGroupingDataSource(ds, (row, column) => {
            const col = this._columns.get(column);
            if (!col)
                return Promise.resolve((row as any)[column]);
            return DataColumnUtils.getValue(col, row);
        });

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


        this._gridRows = this.createGridRows();




        this._scrollEngine = new ScrollEngine(this._tableContainer);
        this._scrollEngine.onScroll(this.updateLayout);
        this._scrollEngine.onResize(this.updateLayout)

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
            itemSelector: "td.elg-gridcell-data",
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

    }


    private getState(): DataGridState<TRow> {
        return {
            dataSource: this._dataSource,
            columns: this._columns,
            visibleColumns: this.getVisibleColumns().map(c => c.name),
            baseFilter: this._filter,
            groupColumns: this._groupColumns,
            groupSummary: this.getVisibleColumns().filter(c => c.summaryType).map(c => ({ field: c.name, summaryType: c.summaryType })),
            orderBy: this._orderBy
        } as DataGridState<TRow>;
    }

    private createGridRows() {

        var provider = new DefaultGridRowsProvider<TRow>(this.getState());
        return new VirtualGridRows(provider, (args, result) => {
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


    private getGridColumns(): GridColumn<TRow>[] {

        const gridColumns: GridColumn<TRow>[] = [
            {
                type: "rowheader",
                visibleIndex: 0,
                groupIndex: -1,
                textAlign: "right",
                width: 80,
                fixedPosition: "left"
            }
        ];

        //let sampleRows: GridRow[] | undefined;
        //let canvasContext: CanvasRenderingContext2D | undefined;

        const totalColumns = gridColumns.length + this._visibleColumnNames.length;

        for (let name of this._visibleColumnNames) {
            const dataCol = this._columns.get(name);

            const groupIndex = dataCol ? this._groupColumns.indexOf(dataCol.name) : -1;

            let fixedPosition: "none" | "left" | "right" = "none";
            if (this._fixedLeftColumns > gridColumns.length)
                fixedPosition = "left";
            else if (totalColumns - this._fixedRightColumns > gridColumns.length)
                fixedPosition = "right"

            const col: GridColumn<TRow> = {
                type: "data",
                dataColumn: dataCol,
                visibleIndex: gridColumns.length,
                groupIndex,
                textAlign: "left",
                width: this._defaultColumnWidth,
                fixedPosition
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

            }
        }

        return gridColumns;
    }

    /**
     * Tells the grid to update internal cache and redraw
     */
    layoutChanged = async () => {
        this._gridColumns = await this.getGridColumns();

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


        // Phase 3: WRITE (mutate DOM, no reads!)
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

            if (this._autoWidthColumns?.length) {
                if (!columnWidths) {
                    columnWidths = new Map();
                }
                // Measure column widths
                for (let col of this._autoWidthColumns) {
                    let txt = this.getCellText(row.gridRow, col);
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
                col.width = width
            }
            this._autoWidthColumns = undefined;
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

        if (visibleIndex == this._fixedLeftColumns - 1) {
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

        if (visibleIndex == this._visibleColumnNames.length - this._fixedRightColumns) {
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


        if (col.type == "rowheader" && gridRow.type != "footer" && gridRow.type != "header") {
            props.textContent = this.getCellText(gridRow, col);
        }

        if (col.type == "data" && col.dataColumn) {

            switch (gridRow.type) {
                case "group":
                case "data":
                case "summary": {
                    let cellText = this.getCellText(gridRow, col);

                    if (col.visibleIndex == 1) {

                        if (gridRow.expandable) {
                            if (gridRow.type == "group")
                                cellText = gridRow.text ?? "";

                            props.vnodes = [
                                v("i", {
                                    class: "elg-icon " + (gridRow.expanded ? "ri-arrow-down-s-line" : "ri-arrow-right-s-line"),
                                    ui: ["elg", "hover", "me-2"],
                                    style: {
                                        marginLeft: (this._groupPadding * gridRow.level) + "px",
                                    },
                                    onclick: async (e, el) => {

                                        assignElementProps(el, {
                                            class: "elg-spinner-ring",
                                            ui: ["elg", "me-2", "text-primary"]
                                        })

                                        await this._gridRows.setExpanded(gridRow, !gridRow.expanded);
                                        this.render(this.renderBody);
                                    }
                                }),
                                v("span", cellText)
                            ]
                        } else {
                            props.vnodes = [
                                v("span", {
                                    style: {
                                        marginLeft: (this._groupPadding * gridRow.level) + "px",
                                    },

                                }, cellText)
                            ]
                        }

                    }
                    else {
                        props.textContent = cellText;
                    }
                } break;
                case "header":
                    props.vnodes = [
                        v("span", String(col.dataColumn.caption ?? col.dataColumn.name)),
                        v("em", {
                            class: "elg-grid-header-resizer",
                            onmousedown: (e, el) => this.resizeColumn(e, col),
                            ontouchstart: (e, el) => this.resizeColumn(e, col),
                        }),
                    ]
                    props.onmousedown = (e: MouseEvent, td: HTMLTableCellElement) => this.startColumnDrag(e, td, col);
                    props.ontouchstart = (e: TouchEvent, td: HTMLTableCellElement) => this.startColumnDrag(e, td, col);
                    break;
                case "footer":
                    //props.textContent = col.caption ?? col.name;
                    props.innerHTML = "&#8203;";
                    break;

                default:
                    props.innerHTML = "&#8203;";
                    break;
            }
        }



        if (this._activeColIndex === col.visibleIndex) {
            props.className += " elg-active-col";
        }

        return { col, props };
    }

    private resizeColumn = (e: MouseEvent | TouchEvent, col: GridColumn<TRow>) => {

        e.preventDefault();
        e.stopPropagation();

        const startWidth = col.width;

        trackGesture(e, {
            axis: "x",
            onMove: (dx) => {
                col.width = Math.floor(Math.max(40, Math.min(800, startWidth + dx)));
                this.render(this.renderColGroup);
            },
            onEnd: () => { },
            onCancel: () => {
                col.width = startWidth;
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

        const col = this._columns.get(columnName);
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
        const ix = this._groupColumns.indexOf(name);
        if (ix < 0) return;
        this._groupColumns.splice(ix, 1);
        this.recomputeGroupIndexes();
        this.reloadRows();
    }

    private recomputeGroupIndexes() {
        for (const col of this._gridColumns) {
            if (col.dataColumn)
                col.groupIndex = this._groupColumns.indexOf(col.dataColumn.name);
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
        const groupColumnsBefore = this._groupColumns.slice();

        if (payload.sourceZoneId == "group-panel" && target.zoneId != "group-panel") {
            const gi = this._groupColumns.indexOf(columnName);
            if (gi > -1) this._groupColumns.splice(gi, 1);
        }

        if (target.zoneId == "grid-header") {
            const gridCol = this._gridColumns.find(c => c.dataColumn?.name == columnName);
            if (gridCol) {
                const fromIx = this._gridColumns.indexOf(gridCol);
                this._gridColumns.splice(fromIx, 1);
                let toIx = target.index + DataGrid.HEADER_OFFSET;
                if (fromIx < toIx) toIx--;
                this._gridColumns.splice(Math.max(DataGrid.HEADER_OFFSET, toIx), 0, gridCol);
                this._gridColumns.forEach((c, ix) => c.visibleIndex = ix);
            }
        }
        else if (target.zoneId == "group-panel") {
            if (payload.sourceZoneId == "group-panel") {
                const fromIx = this._groupColumns.indexOf(columnName);
                if (fromIx > -1) {
                    this._groupColumns.splice(fromIx, 1);
                    let toIx = target.index;
                    if (fromIx < toIx) toIx--;
                    this._groupColumns.splice(toIx, 0, columnName);
                }
            } else if (!this._groupColumns.includes(columnName)) {
                this._groupColumns.splice(target.index, 0, columnName);
            }
        }

        this.recomputeGroupIndexes();

        const groupColumnsChanged = groupColumnsBefore.length !== this._groupColumns.length
            || groupColumnsBefore.some((name, ix) => name !== this._groupColumns[ix]);

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


            if (ix < this._fixedLeftColumns) {
                this.applyLeftStickyStyles(ix, cell.props, offsetLeft, cell.col.width);
            }
            offsetLeft += cell.col.width;
            ix++;
        }

        // Apply right sticky styles
        if (this._fixedRightColumns > 0) {
            let offsetRight = 0;
            for (let k = cells.length - 1; k >= cells.length - this._fixedRightColumns; k--) {
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

    private renderHeaderAndFooter() {

        if (!this._contentTable.tHead)
            return;

        let hr = this._contentTable.tHead.rows.length > 0 ?
            this._contentTable.tHead.rows[0] :
            null;
        if (!hr) {
            hr = document.createElement("tr")
            this._contentTable.tHead.appendChild(hr)
        }

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



        if (!this._contentTable.tFoot)
            return;

        let fr = this._contentTable.tFoot.rows.length > 0 ?
            this._contentTable.tFoot.rows[0] :
            null;
        if (!fr) {
            fr = document.createElement("tr")
            this._contentTable.tFoot.appendChild(fr)
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

        // Measure header and footer.
        const headerHeight = this._contentTable.tHead?.offsetHeight || 0;
        const footerHeight = this._contentTable.tFoot?.offsetHeight || 0;
        if (headerHeight != this._headerHeight || footerHeight != this._footerHeight) {

            this._headerHeight = headerHeight;
            this._footerHeight = footerHeight;

            this._scrollEngine.updateDimensions(
                this._scrollEngine.scrollWidth,
                this._totalBodyHeight + this._headerHeight + this._footerHeight)
        }
    }



    private renderHeaderPanel = () => {

        const props: ElementProps<HTMLElement> = {
            class: "elg-grid-header",
            vnodes: []
        };

        if (this._groupColumns.length === 0) {
            props.vnodes!.push(v("span", {
                class: "elg-grid-header-empty"
            }, this._texts.groupPanelEmptyText));
        }

        this._groupColumns.forEach((cn, sourceIndex) => {
            let col = this._columns.get(cn);
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

    private renderColGroup = () => {

        const colGroup = this._contentTable.querySelector("colgroup")!;
        if (!colGroup) {
            return;
        }

        let ix = 0;

        for (let col of this._gridColumns) {
            let colElement = colGroup.children[ix] as HTMLElement;
            if (!colElement) {
                colElement = document.createElement("col");
                colGroup.appendChild(colElement);
            }

            const width = typeof col.width == "number"
                ? col.width + "px"
                : col.width ?? "";

            setElementProps(colElement, {
                style: {
                    width: width
                }
            });

            ix++;
        }

        for (let j = ix; j < colGroup.children.length; j++) {
            colGroup.removeChild(colGroup.children[j]);
        }

        const totalWidth = this._contentTable.offsetWidth;
        if (this._totalWidth != totalWidth) {
            this._totalWidth = totalWidth
            this._scrollEngine.updateDimensions(
                this._totalWidth,
                this._scrollEngine.scrollHeight)
        }
    }
}


