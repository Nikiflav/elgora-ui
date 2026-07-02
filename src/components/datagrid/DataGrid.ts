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

import "./DataGrid.css"
import { c, cli } from "../../core/c";


export type GridDataSource<TRow> = DataSource<TRow> | TRow[];

export interface DataGridLayoutInfo {
    showFilterRow?: boolean;
    visibleColumns?: (string | DataColumnOption)[],
    orderBy?: OrderByToken[],
    groupBy?: string[]
}

type SelectionCell = { rowIndex: number, colIndex: number, wholeRow?: true };

/* GridRow and QueryEngine */


//=================


export type DataGridOptions<TRow> = {
    data?: GridDataSource<TRow>,
    columns: DataColumn<TRow>[],
    fixedLeftColumns?: number,
    fixedRightColumns?: number,
    pageSize?: number,
    visibleColumns?: string[],
    groupColumns?: string[],
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
                            onpointerdown: (e, el) => {
                                this.resizeColumn(e, col);
                            }
                        }),
                    ]
                    props.onpointerdown = (e: PointerEvent, td: HTMLTableCellElement) => {
                        this.reorderColumn(e, td, col);
                    }
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

    private resizeColumn = (e: PointerEvent, col: GridColumn<TRow>) => {

        e.preventDefault();
        e.stopPropagation();

        const resizer = e.currentTarget as HTMLElement;
        resizer.setPointerCapture(e.pointerId);

        const startX = e.clientX;
        const startWidth = col.width;
        const onmove = (e: PointerEvent) => {
            const newWidth = startWidth + (e.clientX - startX);
            col.width = Math.floor(Math.max(40, Math.min(800, newWidth)));
            this.render(this.renderColGroup);
        };
        const onup = (e: PointerEvent) => {
            resizer.releasePointerCapture(e.pointerId);
            window.removeEventListener("pointerup", onup);
            window.removeEventListener("pointermove", onmove);
        }

        window.addEventListener("pointerup", onup);
        window.addEventListener("pointermove", onmove);

    }

    
    private reorderColumn = (pe: PointerEvent, headerTd: HTMLTableCellElement, col: GridColumn<TRow>) => {

        // Ensure we only trigger on primary click
        if (pe.button !== 0) return;

        pe.preventDefault();

        headerTd.setPointerCapture(pe.pointerId);
        const headerRect = headerTd.getBoundingClientRect();

        // Record initial mouse positions
        const startX = pe.clientX;
        const startY = pe.clientY;
        let lastX = startX;
        let lastY = startY;

        const containerRect = this.dom.getBoundingClientRect();
        let offset = 0;
        let scrollLoop = 0;
        const cells = this._gridColumns.map((col, ix) => {
            const cell = {
                col: col,
                left: offset,
                right: offset + col.width,
                mid: offset + col.width / 2
            }
            offset += col.width;
            return cell;
        })
        let lastCell = cells.find(c => c.col == col);

        this._activeColIndex = col.visibleIndex;

        const line = e("div", {
            style: {
                position: "absolute",
                top: "0",
                bottom: "0",
                width: "2px",
                backgroundColor: "orangered",
                left: (headerRect.left - containerRect.left) + "px",
                zIndex: "998",
                opacity: "0"
            }
        })

        const overlay = e("div", {
            class: "elg-box elg-gridcell",
            style: {
                position: "absolute",
                overflow: "hidden",
                top: (headerRect.top - containerRect.top) + "px",
                left: (headerRect.left - containerRect.left) + "px",
                width: headerRect.width + "px",
                height: headerRect.height + "px",
                zIndex: 999,
                pointerEvents: "none"
            }
        }, e("span", (col.dataColumn?.caption ?? col.dataColumn?.name ?? "")))

        this.dom.append(line, overlay);

        const update = () => {
            let dx = lastX - startX;
            let dy = lastY - startY;

            assignElementProps(overlay, {
                style: {
                    transform: `translate(${dx}px, ${dy}px)`
                }
            })

            let x = lastX - containerRect.left + this._scrollEngine.scrollLeft;
            let cellIndex = -1;
            for (let ix = 0; ix < cells.length; ix++) {
                if (cells[ix].left < x && x <= cells[ix].mid) {
                    cellIndex = ix;
                    break;
                }
                if (cells[ix].mid < x && x <= cells[ix].right) {
                    cellIndex = ix + 1;
                    break;
                }
            }
            if (cellIndex >= cells.length)
                cellIndex--;

            if (cellIndex >= 0) {
                const cell = cells[cellIndex];
                if (cell.col.type == "data") {
                    lastCell = cell
                    assignElementProps(line, {
                        style: {
                            left: (cell.left - this._scrollEngine.scrollLeft) + "px",
                            opacity: cell.col.visibleIndex == col.visibleIndex || cell.col.visibleIndex == col.visibleIndex + 1 ? "0" : "1",
                        }
                    });
                }
            }

            x = lastX - containerRect.left;
            if (x < 40 || containerRect.width - x < 40) {
                // Start scroll right.
                let SCROLL_STEP = x < 40 ? -1 : 1;
                if (this._scrollEngine.maxScrollLeft >= this._scrollEngine.scrollLeft + SCROLL_STEP)
                    scrollLoop = setTimeout(() => {
                        if (!scrollLoop)
                            return;
                        let old = this._scrollEngine.scrollLeft;
                        this._scrollEngine.scrollLeft += SCROLL_STEP;
                        if (this._scrollEngine.scrollLeft == old)
                            return;
                        //lastX = SCROLL_STEP;
                        update()
                    }, 200);
            }

            this.refresh();

        }

        const onmove = (pe: PointerEvent) => {

            lastX = pe.pageX;
            lastY = pe.pageY;
            update();
        };
        const onup = (e: PointerEvent) => {
            headerTd.releasePointerCapture(e.pointerId);

            overlay.remove();
            line.remove();
            if (scrollLoop)
                clearTimeout(scrollLoop)
            scrollLoop = 0;
            window.removeEventListener("pointerup", onup);
            window.removeEventListener("pointermove", onmove);

            // Move column.
            if (lastCell) {
                if (lastCell.col !== col) {
                    let ix = this._gridColumns.indexOf(col);
                    //if (ix < lastCell.col.visibleIndex)
                    //    lastCell.col.visibleIndex--;
                    this._gridColumns.splice(ix, 1)
                    ix = this._gridColumns.indexOf(lastCell.col);
                    this._gridColumns.splice(ix, 0, col)
                    this._gridColumns.forEach((c, ix) => {
                        c.visibleIndex = ix
                    })
                    this.refresh();
                }
            }
            this._activeColIndex = -1;
            this.refresh();

        }

        window.addEventListener("pointerup", onup);
        window.addEventListener("pointermove", onmove);

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
        for (let cn of this._groupColumns) {
            let col = this._columns.get(cn);
            if (col) {

                if (props.vnodes!.length)
                    props.vnodes?.push(v("i", {
                        class: "ri-arrow-right-s-line"
                    }));

                props.vnodes!.push(v("div",
                    {
                        class: "elg-gridcell"
                    },
                    v("span", col.caption ?? col.name),
                    v("i", {
                        style: { float: "right", marginRight: "0" },
                        class: "elg-icon ri-close-line"
                    })
                ))
            }
        }

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


