import { Component } from "../../core/Component";
import { ObservableEvent } from "../../core/ElgoraUI";
import { Localization, type LocaleOptions } from "../../localization/Localization";
import type { MessageKey } from "../../localization/Messages";
import { setElementProps, e, assignElementProps, span, tr, VNode, v, VNodeChild, ElementProps } from "../../core/e";
import { Utils } from "../../core/Utils";
import { DataFilter } from "../../data/filter";
import { ScrollEngine, type ScrollbarMode } from "../scrollbar/scroll-engine";
import { VariableSizeManager } from "../virtual-list/SizeManager";
import { VirtualList, VirtualDataSource, RenderRowArgs } from "../virtual-list/VirtualList";
import { DataViewFieldUtils } from "../../data/DataViewField";
import type { DataGridColumnLayoutInfo } from "./DataGridColumn";
import { orderByTokenToString, type GroupInterval, type GroupIntervalDefinition, type OrderByToken } from "../../data/grouping";
import type { SummaryDefinition, SummaryType, SummaryResult } from "../../data/summary";
import { DataGridColumn, GridCell } from "./DataGridColumn";
import { ArrayDataSource } from "../../data/ArrayDataSource";
import { LocalGroupingDataSource } from "../../data/LocalGroupingDataSource";
import type { DataSource, NewRowSession } from "../../data/DataSource";
import type { RowIdentity } from "../../data/RowIdentity";
import type { FilterFunctionRegistry } from "../../data/filter";
import { DataGridState, DefaultGridRowsProvider } from "./DefaultGridRowsProvider";
import { GridRow, GridRowsProvider } from "./GridRow";
import { VirtualGridRows } from "./VirtualGridRows";
import { NewRowGridRowsProvider } from "./NewRowGridRowsProvider";
import { copyExpansionState, type GridExpansionState } from "./GridExpansionState";
import { DataGridTexts, DEFAULT_GRID_TEXTS } from "./DataGridTexts";

import "./DataGrid.css"
import { c, cli } from "../../core/c";
import { trackGesture } from "../../core/interact/DragGesture";
import { DragDropController, DragPayload, DropTarget } from "../../core/interact/DragDropController";
import { createListDropZone } from "../../core/interact/ListDropZone";
import { SelectionManager, GridContext, type SelectionMode } from "./SelectionManager";
import type { DataGridContextMenuContext, GridContextMenuItems, GridStandardContextMenuItem } from "./DataGridContextMenu";
import { PopupMenu, type MenuItem } from "../popup/PopupMenu";
import { Popover } from "../popup/popover";
import { FilterEditor } from "./FilterEditor";
import { DataFilterRow } from "./DataFilterRow";
import { GridCellEditor, type CellEditNavigationKey } from "./GridCellEditor";
import { createFieldEditor, getFieldEditorButton } from "../editors/createFieldEditor";
import { parseClipboardText } from "./ClipboardText";

/** Rejected user text retained until a successful correction or row removal. */
type InvalidCellInput = { text: string; error: string };


/** Accepted row data inputs: a full DataSource, or a plain array wrapped in an ArrayDataSource. */
export type GridDataSource<TRow> = DataSource<TRow> | TRow[];

/** Persisted view state (e.g. for save/restore of a user's layout customizations). */
export interface DataGridLayoutInfo {
    showFilterRow?: boolean;
    showColumnHeaders?: boolean;
    showColumnFooters?: boolean;
    visibleColumns?: (string | DataGridColumnLayoutInfo)[],
    orderBy?: OrderByToken[],
    groupColumns?: string[]
}

type SelectionCell = { rowIndex: number, colIndex: number, wholeRow?: true };

/** Synchronous keyboard-navigation hook. Coordinates refer to visible data columns, excluding row headers. */
export interface DataGridCellNavigatingEvent {
    /** Navigation key; Enter that starts editing does not raise this event. */
    readonly key: CellEditNavigationKey;
    /** True for reverse Tab/Enter traversal or extended arrow selection. */
    readonly shiftKey: boolean;
    /** Active cell before navigation; changing this snapshot has no effect. */
    readonly currentCell: {
        /** Zero-based row in the current flattened view. */
        readonly rowIndex: number;
        /** Zero-based visible data column, excluding row headers. */
        readonly colIndex: number;
    };
    /** Proposed destination. Change its coordinates to redirect navigation. Invalid destinations cancel the move. */
    targetCell: {
        /** Zero-based destination row in the current flattened view. */
        rowIndex: number;
        /** Zero-based destination data column, excluding row headers. */
        colIndex: number;
    };
    /** Set true to retain the active cell and selection. A completed edit is not rolled back. */
    cancel: boolean;
}

/* GridRow and QueryEngine */


//=================


/** How spare viewport width is distributed; columns are never shrunk below their base width. */
export type ColumnWidthMode = "fixed" | "stretch-auto" | "stretch-all";
/** Manual column resizing: change only this column or exchange width with the next visible data column. */
export type ColumnResizeMode = "independent" | "next-column";
/** Mouse cursor used over the data-grid body. */
export type DataGridCursor = "default" | "pointer" | "text";
/** Cell separator style used by a DataGrid. */
export type DataGridCellBorders = "none" | "rows" | "all";

/** Data, column, interaction and presentation options for a DataGrid. */
export type DataGridOptions<TRow> = LocaleOptions & {
    /** Enables existing-cell editing when the source supports update. Defaults to false. */
    allowEdit?: boolean;
    /** Row data; defaults to an empty array if omitted. */
    data?: GridDataSource<TRow>,
    /** Field and presentation definitions, identified by unique column names. */
    columns: DataGridColumn<TRow>[],
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
    groupSummary?: {
        /** Column name whose values are aggregated in each group. */
        field: string;
        /** Built-in or registered custom aggregation. */
        summaryType: SummaryType;
    }[],
    /** Aggregations for the complete filtered result, independently of paging and grouping. */
    totalSummary?: {
        /** Column name whose values are aggregated over the complete filtered result. */
        field: string;
        /** Built-in or registered custom aggregation. */
        summaryType: SummaryType;
    }[],
    /** Custom group intervals available in the Group by context-menu submenu. */
    groupIntervals?: GroupIntervalDefinition<TRow>[],
    /** Custom summary accumulators available for locally grouped data. */
    customSummaries?: SummaryDefinition<TRow, any, any>[],
    /** Whether group rows participate in cell/row selection (treated as data cells). Defaults to true. */
    selectableGroupRows?: boolean,
    /** Whether hierarchical tree node rows participate in cell/row selection (treated as data cells). Defaults to false. */
    selectableHierarchyNodes?: boolean,
    /** Selection behavior for mouse, keyboard and programmatic operations. Defaults to multiple-cells. */
    selectionMode?: SelectionMode,
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

    /** Uses base widths, stretches auto columns, or stretches all data columns proportionally. Defaults to stretch-auto. */
    columnWidthMode?: ColumnWidthMode,
    /** Manual resize behavior. Omit for next-column in stretch modes and independent in fixed mode.
     * The last data column always resizes independently. The outer grid container never changes width. */
    columnResizeMode?: ColumnResizeMode,
    /** Whether to show the row header column. Defaults to true. */
    showRowHeader?: boolean,
    /** Whether to show the column header row. Defaults to true. */
    showColumnHeaders?: boolean,
    /** Whether to show the grouping panel above the table. Defaults to true. */
    showGroupPanel?: boolean,
    /** Whether to show the filter row below the column headers. Defaults to false. */
    showFilterRow?: boolean,
    /** Whether to show the column footer row. Defaults to true. */
    showColumnFooters?: boolean,
    /** Whether data rows receive the grid hover background. Defaults to false. */
    showRowHover?: boolean,
    /** Whether the outer grid border is rendered. Defaults to true. */
    showBorder?: boolean,
    /** Cell separator style: no separators, horizontal row separators, or full cell borders. Defaults to rows. */
    cellBorders?: DataGridCellBorders,
    /** Whether the current selection is visually highlighted. Defaults to true. */
    showSelection?: boolean,
    /** Cursor used over the grid body. Defaults to the browser default cursor. */
    cursor?: DataGridCursor,
    /** Scrollbar presentation: thin at rest, auto-hidden, or always full-width. Defaults to thin. */
    scrollbarMode?: ScrollbarMode,
    /** Mouse proximity in CSS pixels that expands each scrollbar independently. Defaults to 50. */
    scrollbarHoverDistance?: number,
    /** The default options for each column. Can be specified to provide default column behavior. */
    defaultColumnOptions?: Partial<DataGridColumn<TRow>>
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
    dataColumn?: DataGridColumn<T>;
    visibleIndex: number;
    groupIndex: number;
    textAlign: "left" | "center" | "right";
    fixedPosition: "none" | "left" | "right";
    /** True for columns with no configured width; participates in redistributeColumnWidths() until manually resized. */
    isAutoWidth: boolean;
    /**
     * Un-stretched baseline for any column - col.width = col.naturalWidth * scale;
     */
    naturalWidth: number;
    /** True once the one-time content-measurement pass has resolved this auto column's naturalWidth. */
    widthMeasured: boolean;
    /** Last total-summary result included in this auto column's measurement. */
    footerWidthVersion?: number;
}

/*
-------------------------------------------------------
*/
/** Virtualized, selectable, and optionally grouped data grid component. */
export class DataGrid<TRow> extends Component {

    // Options.
    private _gridOptions: DataGridOptions<TRow> = { columns: [] };
    private readonly messages = Localization.resolveMessages(this._gridOptions);
    private _messageSubscriptions: { dispose(): void }[] = [];
    private _localizationChanged?: { dispose(): void };
    private _resolvedLocale?: string;

    /** Resolved grid locale, before a column's own override. No default is copied into options. */
    get locale(): string { return Localization.resolveLocale(this._gridOptions); }
    private _columnsIndex: Map<string, DataGridColumn<TRow>> = new Map();
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
    private readonly _newRowPlaceholder: HTMLDivElement;
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
    /** Stable screen widths during and after manual resizing, until layout/viewport changes. */
    private _columnResizeLayout?: { viewportWidth: number; mode: ColumnWidthMode; widths: Map<string, number> };
    private _totalBodyHeight = 0
    private _totalWidth = 0
    private _headerHeight = 0
    private _footerHeight = 0
    private _totalSummary: SummaryResult[] = []
    private _totalSummaryLoaded = false
    private _totalSummaryWidthVersion = 0;
    private _groupPadding = 10
    private _draggingColIndex = -1
    private _activeGroupColumn?: string
    private _selection = new SelectionManager();
    private _newRowSession?: NewRowSession<TRow>;
    private _newRowSessions: NewRowSession<TRow>[] = [];
    private _creatingNewRow?: Promise<NewRowSession<TRow>>;
    private _newRowCommand?: { session: NewRowSession<TRow>; kind: "insert" | "cancel" };
    // Only rejected UI input is retained here. Accepted values remain source-owned.
    private _invalidCellInputs = new Map<unknown, Map<string, InvalidCellInput>>();
    private _pasteOperation?: Promise<void>;
    private _pendingRowErrors = new Map<NewRowSession<TRow>, string>();

    private getInputRowKey(row: TRow): unknown { return this._dataSource.getRowId?.(row) ?? row; }

    private setInvalidCellInput(row: TRow, field: string, input: InvalidCellInput): void {
        const key = this.getInputRowKey(row);
        let fields = this._invalidCellInputs.get(key);
        if (!fields) this._invalidCellInputs.set(key, fields = new Map());
        fields.set(field, input);
    }

    private clearInvalidCellInput(row: TRow, field: string): void {
        const key = this.getInputRowKey(row), fields = this._invalidCellInputs.get(key);
        fields?.delete(field);
        if (!fields?.size) this._invalidCellInputs.delete(key);
    }

    private getInvalidCellInput(gridRow: GridRow, field: string): InvalidCellInput | undefined {
        if (!["data", "node", "new"].includes(gridRow.type) || !gridRow.data) return undefined;
        const row = gridRow.type === "new" ? gridRow.data : gridRow.data.data ?? gridRow.data;
        return this._invalidCellInputs.get(this.getInputRowKey(row))?.get(field);
    }

    private async retainInsertError(session: NewRowSession<TRow>, error: string,
        fieldErrors?: Record<string, string>, inputs?: Map<string, string>): Promise<void> {
        this._newRowError = error;
        this._pendingRowErrors.set(session, error);
        for (const [name, message] of Object.entries(fieldErrors ?? {})) {
            const field = this._columnsIndex.get(name);
            if (!field) continue; // Unrepresented errors remain available at row level.
            const text = inputs?.get(name) ?? await DataViewFieldUtils.getText(field, session.row);
            this.setInvalidCellInput(session.row, name, { text, error: message });
        }
    }

    /**
     * Pastes TSV at the active cell, without repeating it to fill the selection.
     * Cell failures retain their input and processing continues. New-row creation
     * failures stop the operation; earlier successful mutations are not rolled back.
     */
    public pasteText(text: string): Promise<void> {
        if (this._pasteOperation) return this._pasteOperation;
        if (this.disposed.Value || this._creatingNewRow || !this._gridOptions.allowEdit || !this._dataSource.update || this._openingEdit || this._newRowOperation)
            return Promise.reject(new Error("Failed to paste cells. Grid editing is unavailable or a row command is running."));
        const operation = this.applyClipboardText(text);
        this._pasteOperation = operation.finally(() => {
            this._pasteOperation = undefined;
            this._editNeedsReload = false;
            if (!this.disposed.Value) this.reloadEditedData();
        });
        return this._pasteOperation;
    }

    private async applyClipboardText(text: string): Promise<void> {
        if (!await this.endEdit()) throw new Error("Failed to paste cells. Cell editing is still in progress.");
        const origin = this._selection.getActiveCell();
        if (!origin) return;
        const source = this._dataSource;
        const columns = this._gridColumns.filter(column => column.type === "data").map(column => column.dataColumn!);
        const lines = parseClipboardText(text);
        // A just-reloaded view has no known count yet. Initialize it before
        // deciding which destinations are existing rows versus overflow input.
        await this._gridRows.load(0, 1);
        if (this.disposed.Value) return;
        // Capture domain references before updates can reorder filtered/grouped data.
        const targets: (TRow | undefined)[] = [];
        for (let i = 0; i < lines.length; i++) {
            const index = origin.rowIndex + i;
            if (index >= this._gridRows.count()) { targets.push(undefined); continue; }
            await this._gridRows.load(index, 1);
            const item = this._gridRows.getAt(index);
            if (!["data", "node", "new"].includes(item.type))
                throw new Error("Failed to paste cells. The destination contains a non-editable group or summary row.");
            targets.push(item.type === "new" ? item.data : item.data?.data ?? item.data);
        }
        for (let i = 0; i < lines.length; i++) {
            if (this.disposed.Value) return;
            if (!lines[i].some((_input, j) => columns[origin.colIndex + j] && !columns[origin.colIndex + j].readonly)) continue;
            let row = targets[i];
            let session = this._newRowSessions.find(item => item.row === row);
            if (row === undefined) {
                if (!source.createNewRow) throw new Error("Failed to paste new row. The data source does not support row creation.");
                try { session = await this.createNewRowCore(); }
                catch (error) {
                    this._newRowError = this.messages.text("dataGrid.pasteRowFailed", { row: i + 1, message: this.messages.describe(error) });
                    throw new Error(this._newRowError);
                }
                if (this.disposed.Value) return;
                row = session.row;
            }
            const values: Record<string, unknown> = {};
            const inputs = new Map<string, string>();
            for (let j = 0; j < lines[i].length && origin.colIndex + j < columns.length; j++) {
                const field = columns[origin.colIndex + j];
                if (field.readonly) continue;
                const input = lines[i][j];
                inputs.set(field.name, input);
                let editor: ReturnType<typeof createFieldEditor<TRow>> | undefined;
                try {
                    const value = await DataViewFieldUtils.getValue(field, row);
                    const context = { row, field, value, locale: field.locale ?? this.locale, localization: this._gridOptions.localization, onCommit: async () => {} };
                    editor = createFieldEditor(context);
                    const candidate = await editor.resolveText(input);
                    const error = field.createEditor
                        ? field.required && (candidate == null || candidate === "")
                            ? Localization.resolveMessages(context, context.locale).text("valueEditor.required") : await field.validate?.(candidate, context)
                        : undefined;
                    if (error) throw new Error(error);
                    const editorError = await editor.validateValue(candidate);
                    if (editorError) throw new Error(editorError);
                    values[field.name] = candidate;
                } catch (error) {
                    this.setInvalidCellInput(row, field.name, { text: input, error: Utils.getErrorText(error) });
                } finally { editor?.dispose(); }
            }
            if (this.disposed.Value) return;
            if (Object.keys(values).length) {
                try {
                    const result = await source.update!(row, values);
                    if (!result.success) {
                        for (const field of Object.keys(values))
                            this.setInvalidCellInput(row, field, { text: inputs.get(field)!,
                                error: result.fieldErrors?.[field] ?? result.error });
                    } else for (const field of Object.keys(values)) this.clearInvalidCellInput(row, field);
                } catch (error) {
                    for (const field of Object.keys(values))
                        this.setInvalidCellInput(row, field, { text: inputs.get(field)!, error: Utils.getErrorText(error) });
                }
            }
            if (this.disposed.Value) return;
            if (session) await this.completeNewRow(session, "insert", true, inputs);
        }
    }
    private _newRowOperation?: Promise<boolean>;
    private _newRowError?: string;
    private _cellToReveal?: { rowIndex: number; colIndex: number; rowsVersion: number };
    /**
     * Raised before keyboard navigation changes selection, after cell editing
     * finishes, including when rejected input is retained. Does not fire for
     * pointer/programmatic selection. Handlers run synchronously; cancel prevents movement only.
     * @example grid.cellNavigating.subscribe(event => { if (event.key === "Enter") event.cancel = true; });
     */
    readonly cellNavigating = new ObservableEvent<DataGridCellNavigatingEvent>();
    private _selectionMouseDown = false;
    private _selectionWholeRowDrag = false;
    private _contextMenu: PopupMenu;
    private _filterPopover?: Popover;
    private _filterRow?: DataFilterRow<TRow>;
    private _cellEditor?: GridCellEditor<TRow>;
    private _editingCell?: { rowIndex: number; columnName: string };
    private _editingRow?: TRow;
    private _openingEdit = false;
    private _editVersion = 0;
    private _pendingEditText?: string;
    private _sourceChanged?: { dispose(): void };
    private _editNeedsReload = false;
    private _rowsVersion = 0;

    private _dragDrop: DragDropController;
    private _cancelActiveResize?: () => void;

    private readonly _MAX_ROWS = 100

    /** Creates a grid with a virtualized row view; mount it to display the supplied columns and source. */
    constructor(options: DataGridOptions<TRow>) {
        super({ ui: "h-100" })

        // DOM
        this.dom.classList.add("elg-data-grid");
        this.dom.style.position = "relative";
        this.dom.style.boxSizing = "border-box";
        this._newRowPlaceholder = e("div", { class: "elg-data-grid-new-row-placeholder", hidden: true,
            ariaHidden: "true" });
        this.dom.append(this._newRowPlaceholder);


        this._headerPanel = e("div", {
            class: "elg-data-grid-header"
        });

        this._tableContainer = e("div",
            {
                class: "elg-data-grid-viewport",
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
        this.listen(this._tableContainer, "paste", event => {
            const target = event.target as Element;
            if (target.closest("input, textarea, [contenteditable='true']") || !this._gridOptions.allowEdit) return;
            const text = (event as ClipboardEvent).clipboardData?.getData("text/plain");
            if (text === undefined) return;
            event.preventDefault();
            void this.pasteText(text).catch(error => { this._newRowError = Utils.getErrorText(error); this.refresh(); });
        });
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
            if (this._scrollEngine.clientWidth !== this._viewportWidth) this._cancelActiveResize?.();
            this.updateLayout();
            this.redistributeColumnWidths();
            this.refresh();
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
            itemSelector: "tr.elg-data-grid-row-header td.elg-data-grid-cell-data",
            scrollBy: delta => this._scrollEngine.scrollLeft += delta
        })));

        this.addCleanup(this._dragDrop.registerZone(createListDropZone({
            id: "group-panel",
            kind: "column",
            element: this._headerPanel,
            axis: "x",
            itemSelector: ".elg-data-grid-cell",
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
        if (row.type === "new") return true;
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

    /**
     * Opens the active cell, or an explicit visible row/column. Returns false for
     * read-only fields, synthetic rows and sources without update.
     * Supplying initialText replaces the displayed text and lets arrows confirm
     * and navigate; without it, arrows remain available to the editor.
     * @example await grid.beginEdit(0, "quantity");
     * @example await grid.beginEdit(0, "quantity", "7");
     */
    public async beginEdit(rowIndex?: number, columnName?: string, initialText?: string): Promise<boolean> {
        if (this.disposed.Value || this._creatingNewRow || this._pasteOperation || this._openingEdit || this._newRowOperation || this._cellEditor?.editor.busy || !this._gridOptions.allowEdit || !this._dataSource.update) return false;
        if (this._cellEditor && !await this.endEdit()) return false;
        const active = this._selection.getActiveCell();
        rowIndex ??= active?.rowIndex;
        const columns = this._gridColumns.filter(col => col.type === "data");
        const column = columnName ? columns.find(col => col.dataColumn!.name === columnName) : columns[active?.colIndex ?? 0];
        if (rowIndex === undefined || rowIndex < 0 || !column || column.dataColumn!.readonly) return false;
        if (this._newRowSession && !await this.leaveNewRowFor(rowIndex)) return false;
        if (this._openingEdit) return false;
        const field = column.dataColumn!;
        const version = ++this._editVersion;
        this._openingEdit = true;
        this._pendingEditText = initialText;
        try {
            await this._gridRows.load(rowIndex, 1);
            let gridRow = this._gridRows.getAt(rowIndex);
            if (gridRow.type === "new") {
                this._newRowSession = this._newRowSessions.find(session => session.row === gridRow.data);
                if (!this._newRowSession) {
                    const session = await this.createNewRowCore();
                    if (version !== this._editVersion || this.disposed.Value) {
                        try { if (session.state === "pending") await session.cancel(); }
                        finally { this.releaseNewRow(session); }
                        return false;
                    }
                    this._newRowSession = session;
                    this._editNeedsReload = true;
                }
                const resolved = await this.getNewGridRow(rowIndex, this._newRowSessions.indexOf(this._newRowSession));
                if (version !== this._editVersion || this.disposed.Value) return false;
                // Update the cached input row in place, without re-querying the
                // source. Render its defaults before mounting the first editor.
                Object.assign(gridRow, resolved);
                this.ensureCellVisible(rowIndex, columns.indexOf(column));
                this.refresh();
                await Utils.nextFrame();
                if (version !== this._editVersion || this.disposed.Value) return false;
            }
            if ((gridRow.type !== "data" && gridRow.type !== "node" && gridRow.type !== "new") || !gridRow.data) return false;
            const row = (gridRow.type === "new" ? gridRow.data : gridRow.data.data ?? gridRow.data) as TRow;
            const cached = gridRow.cells?.[field.name];
            const value = cached && typeof cached === "object" && "value" in cached
                ? cached.value : await DataViewFieldUtils.getValue(field, row);
            const text = cached && typeof cached.text === "string"
                ? cached.text : await DataViewFieldUtils.getText(field, row, this.locale);
            if (version !== this._editVersion || this.disposed.Value) return false;
            // Editing changes the active cell, not the block being traversed by
            // Tab/Enter. Only an edit outside the selection starts a new range.
            if (this._selection.isSelected(rowIndex, columns.indexOf(column)))
                this._selection.setActiveCell(rowIndex, columns.indexOf(column));
            else this._selection.selectSingleCell(rowIndex, columns.indexOf(column));
            this.ensureCellVisible(rowIndex, columns.indexOf(column));
            this._editingCell = { rowIndex, columnName: field.name };
            this._editingRow = row;
            const inputRowKey = this.getInputRowKey(row);
            const invalidInput = this._invalidCellInputs.get(inputRowKey)?.get(field.name);
            this._cellEditor = new GridCellEditor(this.dom, { row, field, value, text, locale: field.locale ?? this.locale, localization: this._gridOptions.localization,
                onCommit: async candidate => {
                    const result = await this._dataSource.update!(row, { [field.name]: candidate });
                    if (!result.success) throw new Error(result.fieldErrors?.[field.name] ?? result.error);
                    this._editNeedsReload = true;
                }
            }, (key, backwards, restoreFocus) => this.closeCellEditor(key, backwards, restoreFocus),
            input => this.setInvalidCellInput(row, field.name, input),
            () => this.clearInvalidCellInput(row, field.name),
            () => { void this.cancelActiveCell(); });
            if (invalidInput) this._cellEditor.restoreDraft(invalidInput.text, invalidInput.error);
            this.refresh();
            await Utils.nextFrame();
            if (version !== this._editVersion || !this._cellEditor || this.disposed.Value) return false;
            this.positionCellEditor();
            this._cellEditor.focus(this._pendingEditText);
            return true;
        } catch (error) {
            if (this._gridRows.getAt(rowIndex).type !== "new") throw error;
            this._newRowError = Utils.getErrorText(error);
            this.refresh(); return false;
        } finally {
            if (version === this._editVersion) {
                this._openingEdit = false; this._pendingEditText = undefined;
                if (!this._cellEditor) {
                    this._editingCell = undefined;
                    if (this._editNeedsReload) { this._editNeedsReload = false; this.reloadEditedData(); }
                }
            }
        }
    }

    /** Finishes cell editing. Rejected input remains visible as a cell draft and does not block navigation. */
    public endEdit(): Promise<boolean> {
        return this._cellEditor?.finish() ?? Promise.resolve(!this._openingEdit);
    }

    /**
     * Discards the active cell's editing input and retained error, showing its source value.
     * Never cancels the whole pending row; use cancelNewRow(session) explicitly.
     * A running source update cannot be cancelled.
     */
    public cancelEdit(): boolean {
        if (this._pasteOperation || this._cellEditor?.editor.busy) return false;
        const cell = this.getActiveCellInputContext();
        if (cell) this.clearInvalidCellInput(cell.row, cell.columnName);
        if (this._openingEdit) {
            this._editVersion++; this._openingEdit = false; this._pendingEditText = undefined;
        }
        if (this._cellEditor) { this._cellEditor.editor.cancel(); this.closeCellEditor(); }
        else if (this._editNeedsReload) { this._editNeedsReload = false; this.reloadEditedData(); }
        else this.refresh();
        return true;
    }

    private getActiveCellInputContext(): { row: TRow; columnName: string } | undefined {
        if (this._cellEditor && this._editingCell && this._editingRow !== undefined)
            return { row: this._editingRow, columnName: this._editingCell.columnName };
        const active = this._selection.getActiveCell();
        if (!active) return;
        const gridRow = this._gridRows.getAt(active.rowIndex);
        const field = this._gridColumns.filter(column => column.type === "data")[active.colIndex]?.dataColumn;
        if (!field || !gridRow?.data || !["data", "node", "new"].includes(gridRow.type)) return;
        return { row: gridRow.type === "new" ? gridRow.data : gridRow.data.data ?? gridRow.data, columnName: field.name };
    }

    /** Escape targets the active cell even when its editor has already closed. */
    private async cancelActiveCell(): Promise<boolean> {
        if (this.disposed.Value || this._pasteOperation || this._newRowOperation || this._cellEditor?.editor.busy) return false;
        if (!this._cellEditor) {
            const active = this._selection.getActiveCell();
            const rows = this._gridRows;
            if (active) await rows.load(active.rowIndex, 1);
            const current = this._selection.getActiveCell();
            // Do not apply a delayed Escape to a different selection or a newly opened editor.
            if (rows !== this._gridRows || current?.rowIndex !== active?.rowIndex || current?.colIndex !== active?.colIndex
                || this._cellEditor || this._openingEdit) return false;
            if (this.disposed.Value || this._pasteOperation || this._newRowOperation) return false;
        }
        const cell = this.getActiveCellInputContext();
        const invalid = !!this._cellEditor?.editor.error
            || !!(cell && this._invalidCellInputs.get(this.getInputRowKey(cell.row))?.has(cell.columnName));
        if (invalid) return this.cancelEdit();
        const session = cell && this._newRowSessions.find(item => item.row === cell.row);
        return session ? this.cancelNewRow(session) : this.cancelEdit();
    }

    /** True while a cell editor is being created or is active. */
    public get editing(): boolean { return this._openingEdit || !!this._cellEditor; }

    /** Last new-row creation/insertion/cancellation error; undefined after a successful retry. */
    public get newRowError(): string | undefined { return this._newRowError; }

    /** True after input-row editing has created a source-owned pending session. */
    public get hasPendingNewRow(): boolean { return this._newRowSessions.length > 0; }

    /** True while rejected cell input or a pending-row insertion error still needs correction. */
    public get hasValidationErrors(): boolean { return !!this._cellEditor?.editor.error || this._invalidCellInputs.size > 0 || this._pendingRowErrors.size > 0; }

    /** Snapshot of source-owned pending sessions created through this grid; safe to iterate while completing them. */
    public get newRowSessions(): readonly NewRowSession<TRow>[] { return [...this._newRowSessions]; }

    /**
     * Creates and displays a source-owned pending row, outside sorting, grouping and summaries.
     * Rejects while another row operation/paste is running or editing is unavailable.
     * @example const session = await grid.createNewRow();
     */
    public createNewRow(): Promise<NewRowSession<TRow>> {
        if (this._pasteOperation || this._openingEdit || this._newRowOperation || this._cellEditor?.editor.busy)
            return Promise.reject(new Error("Failed to create new row. Another editing operation is in progress."));
        return this.createNewRowCore();
    }

    private createNewRowCore(): Promise<NewRowSession<TRow>> {
        if (this.disposed.Value || !this._gridOptions.allowEdit || !this._dataSource.update || !this._dataSource.createNewRow)
            return Promise.reject(new Error("Failed to create new row. Grid editing or source row creation is unavailable."));
        if (this._creatingNewRow)
            return Promise.reject(new Error("Failed to create new row. Row creation is already in progress."));
        const source = this._dataSource;
        this._creatingNewRow = Promise.resolve().then(() => {
            if (this.disposed.Value) throw new DOMException("Failed to create new row. The grid was disposed.", "AbortError");
            return source.createNewRow!();
        }).then(async session => {
            if (this.disposed.Value) {
                if (session.state === "pending") await session.cancel();
                throw new DOMException("Failed to create new row. The grid was disposed.", "AbortError");
            }
            this._newRowSessions.push(session);
            this._newRowError = undefined;
            if (this._cellEditor || this._openingEdit || this._pasteOperation) this._editNeedsReload = true;
            else this.reloadEditedData();
            return session;
        }).catch(error => {
            this._newRowError = Utils.getErrorText(error);
            if (!this.disposed.Value) this.refresh();
            throw error;
        }).finally(() => { this._creatingNewRow = undefined; });
        return this._creatingNewRow;
    }

    /**
     * Finishes this session's cell editor, checks its rejected inputs and inserts its domain row.
     * Returns false on validation/source failure or a conflicting operation. A foreign/completed
     * session rejects. Does not finish an editor on another row. Direct session.insert() bypasses UI checks.
     * @example await grid.insertNewRow(session);
     */
    public insertNewRow(session: NewRowSession<TRow>): Promise<boolean> {
        return this.completeNewRow(session, "insert");
    }

    /**
     * Cancels the specified pending session and its own editor, rejected inputs and errors.
     * Other rows' editors are not cancelled. Returns false while a conflicting operation runs
     * or source cancellation fails; a foreign/completed session rejects.
     * @example await grid.cancelNewRow(session);
     */
    public cancelNewRow(session: NewRowSession<TRow>): Promise<boolean> {
        return this.completeNewRow(session, "cancel");
    }

    private completeNewRow(session: NewRowSession<TRow>, kind: "insert" | "cancel", fromPaste = false,
        inputs?: Map<string, string>): Promise<boolean> {
        if (this._newRowOperation && this._newRowCommand?.session === session && this._newRowCommand.kind === kind)
            return this._newRowOperation;
        if (!this._newRowSessions.includes(session) || session.state !== "pending")
            return Promise.reject(new Error(`Failed to ${kind} new row. The session is not pending in this grid.`));
        if (this.disposed.Value || (!fromPaste && this._pasteOperation) || this._openingEdit || this._creatingNewRow
            || this._newRowOperation || this._cellEditor?.editor.busy) return Promise.resolve(false);
        this._newRowCommand = { session, kind };
        return this.runNewRowOperation(async () => {
            if (this._editingRow === session.row) {
                if (kind === "insert") {
                    if (!await this.endEdit()) return false;
                } else if (!this.cancelEdit()) return false;
            }
            if (this.disposed.Value) return false;
            if (kind === "insert") {
                if (this._invalidCellInputs.get(this.getInputRowKey(session.row))?.size) return false;
                const result = await session.insert();
                if (!result.success) {
                    await this.retainInsertError(session, result.error, result.fieldErrors, inputs);
                    return false;
                }
            } else await session.cancel();
            this.releaseNewRow(session);
            return true;
        }, session);
    }

    private releaseNewRow(session: NewRowSession<TRow>): void {
        this._newRowSessions = this._newRowSessions.filter(item => item !== session);
        if (this._newRowSession === session) this._newRowSession = undefined;
        this._invalidCellInputs.delete(this.getInputRowKey(session.row));
        this._pendingRowErrors.delete(session);
    }

    /** Internal keyboard/query action; public row commands always require an explicit session. */
    private async finishActiveRowEdit(): Promise<boolean> {
        if (this._pasteOperation || this._creatingNewRow) return false;
        const session = this._newRowSession ?? this.getSelectedNewRowSession();
        return session ? this.insertNewRow(session) : this.endEdit();
    }

    private getSelectedNewRowSession(): NewRowSession<TRow> | undefined {
        const active = this._selection.getActiveCell();
        const row = active ? this._gridRows.getAt(active.rowIndex) : undefined;
        return row?.type === "new" ? this._newRowSessions.find(item => item.row === row.data) : undefined;
    }

    /** Serializes session completion and exposes errors in the input row without dropping the session. */
    private runNewRowOperation(action: () => Promise<boolean>, session?: NewRowSession<TRow>): Promise<boolean> {
        this._newRowOperation = action().then(success => {
            if (success) this._newRowError = undefined;
            return success;
        }, error => {
            if (session) this._pendingRowErrors.set(session, Utils.getErrorText(error));
            this._newRowError = Utils.getErrorText(error); return false;
        }).finally(() => {
            this._newRowOperation = undefined;
            this._newRowCommand = undefined;
            if (this._cellEditor || this._openingEdit || this._pasteOperation) this._editNeedsReload = true;
            else if (!this.disposed.Value) this.reloadEditedData();
        });
        return this._newRowOperation;
    }

    /** Before a pointer or explicit edit leaves the input row, confirm the source session. */
    private async leaveNewRowFor(rowIndex: number): Promise<boolean> {
        if (this._newRowOperation) return false;
        if (this._newRowSession) await this._gridRows.load(rowIndex, 1);
        if (this._newRowSession && this._gridRows.getAt(rowIndex)?.data !== this._newRowSession.row) {
            await this.finishActiveRowEdit();
            this._newRowSession = undefined;
        }
        return true;
    }

    /** Resolves pending defaults and business-rule values; the untouched placeholder never invokes field callbacks. */
    private async getNewGridRow(index: number, offset = this._newRowSessions.length): Promise<GridRow> {
        const row = this._newRowSessions[offset]?.row;
        return { key: row ? `pending-row-${offset}` : "new-row", type: "new", visibleIndex: index, level: 0, data: row,
            cells: row ? await DataViewFieldUtils.getDataCells(this._gridOptions.columns, row, this.locale) : {} };
    }

    /** Disposes the editor before re-querying; source events never destroy an active draft. */
    private closeCellEditor(key?: CellEditNavigationKey, backwards = false, restoreFocus = true): void {
        this._cellEditor?.dispose(); this._cellEditor = undefined; this._editingCell = undefined; this._editingRow = undefined;
        if (key) {
            this.navigateSelection(new KeyboardEvent("keydown", { key, shiftKey: backwards }));
            const active = this._selection.getActiveCell();
            if (active) this.ensureCellVisible(active.rowIndex, active.colIndex);
        }
        if (this._editNeedsReload) { this._editNeedsReload = false; this.reloadEditedData(); }
        if (restoreFocus) this._tableContainer.focus();
        else if (this._newRowSession && !this._newRowOperation && !this.dom.contains(this.dom.ownerDocument.activeElement)) void this.finishActiveRowEdit();
        this.refresh();
    }

    /** Invalidates rows and complete-result summaries after a confirmed mutation or replay. */
    private reloadEditedData(): void {
        if (this.disposed.Value || !this._initialized) return;
        this._totalSummaryLoaded = false; this._totalSummary = [];
        this.reloadRows(true);
    }

    /** Reanchors after VNode patches; an offscreen edit is confirmed before its row is recycled. */
    private positionCellEditor = (): void => {
        if (!this._cellEditor || !this._editingCell || this.disposed.Value) return;
        const { rowIndex, columnName } = this._editingCell;
        const cell = Array.from(this._contentTable.querySelectorAll<HTMLElement>(`tbody [data-elg-edit-row="${rowIndex}"]`))
            .find(item => item.getAttribute("data-elg-edit-column") === columnName);
        if (cell && cell.closest("tr")?.style.display !== "none") this._cellEditor.position(cell, this.dom);
        else if (!this._openingEdit && !this._cellEditor.editor.busy) {
            void this.endEdit().then(success => {
                if (!success && this._editingCell) this.ensureCellVisible(rowIndex,
                    this._gridColumns.filter(col => col.type === "data").findIndex(col => col.dataColumn!.name === columnName));
            });
        }
    };

    /** Positions a non-interactive label over the input row without merging its selectable cells. */
    private positionNewRowPlaceholder = (): void => {
        if (this.disposed.Value) return;
        const rowIndex = this._gridRows.count() - 1;
        const cell = rowIndex >= 0 && !this._gridRows.getAt(rowIndex)?.data && this._gridRows.getAt(rowIndex)?.type === "new"
            ? this._contentTable.querySelector<HTMLElement>(`tbody [data-elg-edit-row="${rowIndex}"]`) : null;
        if (!cell || cell.closest("tr")?.style.display === "none") {
            setElementProps(this._newRowPlaceholder, { class: "elg-data-grid-new-row-placeholder", ariaHidden: "true", hidden: true, vnodes: [] }); return;
        }
        const bounds = cell.getBoundingClientRect();
        const viewport = this._tableContainer.getBoundingClientRect();
        const host = this.dom.getBoundingClientRect();
        const header = this._contentTable.tHead?.getBoundingClientRect();
        const footer = this._contentTable.tFoot?.getBoundingClientRect();
        const rowHeader = cell.parentElement?.querySelector<HTMLElement>(".elg-data-grid-cell-rowheader")?.getBoundingClientRect();
        const left = Math.max(bounds.left, viewport.left, rowHeader?.right ?? viewport.left);
        const right = viewport.right;
        const top = Math.max(bounds.top, viewport.top, header?.bottom ?? viewport.top);
        const bottom = Math.min(bounds.bottom, viewport.bottom, footer && footer.height > 0 ? footer.top : viewport.bottom);
        setElementProps(this._newRowPlaceholder, {
            class: "elg-data-grid-new-row-placeholder", ariaHidden: "true",
            hidden: right <= left || bottom <= top,
            style: { left: `${left - host.left - this.dom.clientLeft}px`, top: `${top - host.top - this.dom.clientTop}px`,
                width: `${Math.max(0, right - left)}px`, height: `${Math.max(0, bottom - top)}px` },
            vnodes: [v("span", { key: "new-row-label" }, this._newRowError ?? this.texts.newRowText)]
        });
    };

    private handleSelectionKeyDown = async (event: KeyboardEvent) => {
        if (this._newRowOperation || (this._creatingNewRow && !this._openingEdit) || this._pasteOperation) { event.preventDefault(); event.stopPropagation(); return; }
        if (this._cellEditor?.element.contains(event.target as Node)) return;
        if (this._openingEdit && !event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey) {
            if (event.key.length === 1) this._pendingEditText = (this._pendingEditText ?? "") + event.key;
            else if (event.key === "Backspace") this._pendingEditText = (this._pendingEditText ?? "").slice(0, -1);
            else if (event.key === "Escape") {
                this.cancelEdit();
            } else return;
            event.preventDefault(); event.stopPropagation(); return;
        }
        // Form controls own their keyboard navigation. In particular, arrow keys
        // in the filter row must move the caret/value instead of moving the grid
        // selection behind the editor.
        const target = event.target as Element | null;
        if (target instanceof HTMLInputElement
            || target instanceof HTMLTextAreaElement
            || target instanceof HTMLSelectElement
            || target?.closest("[contenteditable='true']")) {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key))
                event.stopPropagation();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
            if (this._selection.getRanges().length === 0) return;

            event.preventDefault();
            event.stopPropagation();
            await this.copySelection();
            return;
        }

        const previous = this._selection.getActiveCell();
        if (!event.isComposing && event.altKey && event.key === "ArrowDown" && previous) {
            const column = this._gridColumns.filter(col => col.type === "data")[previous.colIndex]?.dataColumn;
            if (column && getFieldEditorButton(column) && this._gridOptions.allowEdit && !column.readonly) {
                event.preventDefault(); event.stopPropagation();
                await this.openCellPicker(previous.rowIndex, column.name);
                return;
            }
        }
        if (event.key === "Escape") {
            event.preventDefault(); event.stopPropagation();
            await this.cancelActiveCell(); return;
        }
        if (!event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey
            && (event.key === "F2" || (event.key === "Enter" && !event.shiftKey) || event.key.length === 1) && this._gridOptions.allowEdit) {
            event.preventDefault(); event.stopPropagation();
            await this.beginEdit(undefined, undefined, event.key.length === 1 ? event.key : undefined);
            return;
        }
        if (this.navigateSelection(event)) {
            event.preventDefault();
            event.stopPropagation();
            this.refresh();

            const active = this._selection.getActiveCell();
            if (active && (!previous || previous.rowIndex !== active.rowIndex || previous.colIndex !== active.colIndex)) {
                this.ensureCellVisible(active.rowIndex, active.colIndex);
            }
        }
    };

    /** Offers the computed destination before applying keyboard selection changes. */
    private navigateSelection(event: KeyboardEvent): boolean {
        return this._selection.handleKeyDown(event, this.getSelectionContext(), (currentCell, targetCell) => {
            const args: DataGridCellNavigatingEvent = {
                key: event.key as CellEditNavigationKey, shiftKey: event.shiftKey,
                currentCell, targetCell, cancel: false
            };
            this.cellNavigating.invoke(args);
            if (args.cancel || this.disposed.Value) return null;
            const target = args.targetCell;
            const context = this.getSelectionContext();
            if (!Number.isInteger(target.rowIndex) || !Number.isInteger(target.colIndex)
                || target.rowIndex < 0 || target.rowIndex >= context.totalRows
                || target.colIndex < 0 || target.colIndex >= context.columns.length) return null;
            const newIndex = this._gridRows.count() - 1;
            const exitsAtEnd = currentCell.rowIndex === newIndex && target.rowIndex === newIndex
                && !event.shiftKey && (event.key === "Enter"
                    || (event.key === "Tab" && currentCell.colIndex === context.columns.length - 1));
            const session = this._newRowSession ?? this.getSelectedNewRowSession();
            if (session && (target.rowIndex !== currentCell.rowIndex || exitsAtEnd)) {
                this._newRowSession = session;
                void this.finishActiveRowEdit().then(async () => {
                    if (this.disposed.Value) return;
                    this._newRowSession = undefined;
                    // Even a rejected row may be left; it remains in the pending tail.
                    this.reloadEditedData();
                    await this._gridRows.load(0, 1);
                    if (this.disposed.Value) return;
                    const rowIndex = exitsAtEnd ? this._gridRows.count() - 1 : Math.min(target.rowIndex, this._gridRows.count() - 1);
                    const colIndex = exitsAtEnd && event.key === "Tab" ? 0 : target.colIndex;
                    this._selection.selectSingleCell(rowIndex, colIndex);
                    // The new row count is known, but the scroll engine still
                    // has the old range until rendering and measurement finish.
                    this._cellToReveal = { rowIndex, colIndex, rowsVersion: this._rowsVersion };
                    this.refresh();
                });
                return null;
            }
            return target;
        });
    }

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
        if (row?.type === "new") return row.data as TRow | undefined;
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
        const groupSummaries = (this._gridOptions.groupSummary ?? []).filter(s => s.field !== columnName);
        const totalSummaries = (this._gridOptions.totalSummary ?? []).filter(s => s.field !== columnName);
        if (summaryType) {
            groupSummaries.push({ field: columnName, summaryType });
            totalSummaries.push({ field: columnName, summaryType });
        }
        this.setOptions({ groupSummary: groupSummaries, totalSummary: totalSummaries });
    };

    private setColumnGroupInterval = (columnName: string, groupInterval?: GroupInterval) => {
        this.setColumnOptions(columnName, { groupInterval });
        if (!this._gridOptions.groupColumns?.includes(columnName)) {
            this.groupBy(columnName, this.getColumnSortDirection(columnName) ?? "asc");
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

    /** Returns the compact column label, including its configured summary type when present. */
    private getColumnHeaderText = (column: DataGridColumn<TRow>): string => {
        const label = column.caption ?? column.name;
        const summary = this._gridOptions.groupSummary?.find(item => item.field === column.name);
        return summary ? `${label} (${summary.summaryType})` : label;
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
                    text: this.messages.text("dataGrid.sortAscending"),
                    action: event => this.setColumnSort(columnName, "asc", preserveExistingSort(event))
                });
            }
            if ((!sortDirection || sortDirection === "asc") && hasStandard("sortDescending" as GridStandardContextMenuItem)) {
                items.push({
                    icon: "ri-arrow-down-line",
                    text: this.messages.text("dataGrid.sortDescending"),
                    action: event => this.setColumnSort(columnName, "desc", preserveExistingSort(event))
                });
            }
            if (sortDirection && !isGrouped && hasStandard("clearSort" as GridStandardContextMenuItem)) {
                items.push({
                    icon: "ri-close-line",
                    text: this.messages.text("dataGrid.clearSorting"),
                    action: () => this.clearColumnSort(columnName)
                });
            }
            if (hasStandard("pinColumn" as GridStandardContextMenuItem)) {
                addDivider();
                items.push({
                    icon: "ri-pushpin-line",
                    text: this.messages.text("dataGrid.pinColumn"),
                    subItems: async () => [
                        {
                            icon: "ri-close-line",
                            text: this.messages.text("dataGrid.noPin"),
                            checked: () => pinPosition === "none",
                            action: () => this.setColumnPinPosition(columnName, "none")
                        },
                        {
                            text: this.messages.text("dataGrid.pinLeft"),
                            checked: () => pinPosition === "left",
                            action: () => this.setColumnPinPosition(columnName, "left")
                        },
                        {
                            text: this.messages.text("dataGrid.pinRight"),
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
                    text: this.messages.text("dataGrid.autosizeColumn"),
                    action: () => this.autoSizeColumn(columnName)
                });
            }
            if (hasStandard("autosizeAllColumns" as GridStandardContextMenuItem)) {
                items.push({
                    icon: "ri-expand-up-down-line",
                    text: this.messages.text("dataGrid.autosizeAll"),
                    action: this.autoSizeAllColumns
                });
            }
            const groupingItems: MenuItem[] = [];
            if (hasStandard("groupColumn") && !this._isHierarchicalData) {
                const intervalLabels: Record<string, string> = {
                    "year": this.messages.text("dataGrid.interval.year"),
                    "yearQuarter": this.messages.text("dataGrid.interval.yearQuarter"),
                    "quarter": this.messages.text("dataGrid.interval.quarter"),
                    "yearMonth": this.messages.text("dataGrid.interval.yearMonth"),
                    "month": this.messages.text("dataGrid.interval.month"),
                    "week": this.messages.text("dataGrid.interval.week"),
                    "day": this.messages.text("dataGrid.interval.day"),
                    "dayOfWeek": this.messages.text("dataGrid.interval.dayOfWeek"),
                    "hour": this.messages.text("dataGrid.interval.hour"),
                    "minute": this.messages.text("dataGrid.interval.minute"),
                    "second": this.messages.text("dataGrid.interval.second"),
                    "firstChar": this.messages.text("dataGrid.interval.firstChar")
                };
                const supportedIntervals = DataViewFieldUtils.getSupportedGroupIntervals(context.column!);
                const customIntervals = this._gridOptions.groupIntervals ?? [];
                const advancedIntervals = [
                    ...supportedIntervals.map(value => ({ label: intervalLabels[value] ?? String(value), value })),
                    ...customIntervals
                        .filter(interval => !supportedIntervals.includes(interval.name))
                        .map(interval => ({ label: interval.text, value: interval.name as GroupInterval }))
                ];
                groupingItems.push({
                    icon: "ri-timeline-view",
                    text: this.messages.text(isGrouped ? "dataGrid.ungroup" : "dataGrid.groupBy", { column: context.column.caption ?? context.column.name }),
                    action: () => isGrouped
                        ? this.toggleColumnGrouping(columnName)
                        : this.setColumnGroupInterval(columnName, undefined)
                });
                if (advancedIntervals.length) {
                    groupingItems.push({
                        icon: "ri-settings-3-line",
                        text: this.messages.text("dataGrid.interval"),
                        subItems: async () => {
                            const currentInterval = context.column!.groupInterval;
                            const intervals: Array<{ label: string, value?: GroupInterval }> = [
                                { label: this.messages.text("dataGrid.exactValue") },
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
            if (isGrouped && !this._isHierarchicalData) {
                if (groupingItems.length && (hasStandard("expandGroupsToLevel") || hasStandard("collapseGroupsAtLevel")))
                    groupingItems.push({ isDivider: true });
                if (hasStandard("expandGroupsToLevel")) {
                    groupingItems.push({
                        icon: "ri-arrow-down-s-line",
                        text: this.messages.text("dataGrid.expandToLevel"),
                        action: () => this.changeColumnGroupExpansion(columnName, true)
                    });
                }
                if (hasStandard("collapseGroupsAtLevel")) {
                    groupingItems.push({
                        icon: "ri-arrow-up-s-line",
                        text: this.messages.text("dataGrid.collapseLevel"),
                        action: () => this.changeColumnGroupExpansion(columnName, false)
                    });
                }
            }
            if (groupingItems.length) {
                addDivider();
                items.push({
                    icon: "ri-timeline-view",
                    text: this.messages.text("dataGrid.grouping"),
                    subItems: async () => groupingItems
                });
            }
            addDivider();
            items.push({
                icon: "ri-calculator-line",
                text: this.messages.text("dataGrid.summary"),
                disabled: this._isHierarchicalData,
                subItems: async () => {
                    const summaryTypes: Array<{ label: string, value?: SummaryType }> = [
                        { label: this.messages.text("dataGrid.summary.none") },
                        { label: this.messages.text("dataGrid.summary.count"), value: "count" },
                        { label: this.messages.text("dataGrid.summary.sum"), value: "sum" },
                        { label: this.messages.text("dataGrid.summary.avg"), value: "avg" },
                        { label: this.messages.text("dataGrid.summary.min"), value: "min" },
                        { label: this.messages.text("dataGrid.summary.max"), value: "max" },
                        { label: this.messages.text("dataGrid.summary.distinct"), value: "distinct" },
                        ...(this._gridOptions.customSummaries ?? []).map(summary => ({
                            label: summary.text,
                            value: summary.name as SummaryType
                        }))
                    ];
                    const groupSummary = this._gridOptions.groupSummary?.find(s => s.field === columnName)?.summaryType;
                    const totalSummary = this._gridOptions.totalSummary?.find(s => s.field === columnName)?.summaryType;
                    return summaryTypes.map(summary => {
                        const groupMatches = groupSummary === summary.value;
                        const totalMatches = totalSummary === summary.value;
                        const sameSummary = groupSummary === totalSummary && groupMatches && totalMatches;
                        const locations = [
                            groupMatches ? "group" : undefined,
                            totalMatches ? "total" : undefined
                        ].filter(Boolean) as string[];

                        return {
                            text: summary.label,
                            tag: sameSummary || locations.length === 0 ? undefined : locations.join(", "),
                            checked: () => sameSummary,
                            action: () => this.setColumnSummary(columnName, summary.value)
                        };
                    });
                }
            });
        }

        if (context.target === "cell" || context.target === "rowHeader" || context.target === "row") {
            const session = context.row?.type === "new"
                ? this._newRowSessions.find(item => item.row === context.row!.data) : undefined;
            if (session && hasStandard("cancelNewRow")) items.push({
                icon: "ri-close-line", text: this.messages.text("dataGrid.cancelNewRow"),
                action: () => session.state === "pending" && this._newRowSessions.includes(session)
                    ? this.cancelNewRow(session) : Promise.resolve(false)
            });
            if (hasStandard("copy") && this._selection.getRanges().length > 0) {
                items.push({ icon: "ri-file-copy-line", text: this.messages.text("dataGrid.copy"), action: () => this.copySelection() });
            }
            if (hasStandard("copyWithHeaders") && this._selection.getRanges().length > 0) {
                items.push({ icon: "ri-file-copy-2-line", text: this.messages.text("dataGrid.copyWithHeaders"), action: () => this.copySelection(true) });
            }
            const active = this._selection.getActiveCell();
            if (hasStandard("paste") && this._gridOptions.allowEdit && this._dataSource.update && active
                && context.row && ["data", "node", "new"].includes(context.row.type)) {
                items.push({ icon: "ri-clipboard-line", text: this.messages.text("dataGrid.paste"), closeOnAction: false,
                    disabled: () => !!(this._pasteOperation || this._creatingNewRow || this._openingEdit
                        || this._newRowOperation || this._cellEditor?.editor.busy),
                    action: () => this.pasteFromClipboard(context) });
            }
            if (hasStandard("selectRow") && context.row && this.isSelectableGridRow(context.row)) {
                items.push({
                    icon: "ri-checkbox-multiple-line",
                    text: this.messages.text("dataGrid.selectRow"),
                    action: () => {
                        this._selection.selectSingleRow(context.row!.visibleIndex);
                        this.refresh();
                    }
                });
            }
            if (hasStandard("clearSelection") && this._selection.getRanges().length > 0) {
                items.push({ icon: "ri-close-circle-line", text: this.messages.text("dataGrid.clearSelection"), action: () => this.clearSelection() });
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

    /** Reads only after the menu action; the normal paste pipeline owns validation and mutations. */
    private async pasteFromClipboard(context: DataGridContextMenuContext<TRow>): Promise<void> {
        if (this.disposed.Value || this._pasteOperation || this._creatingNewRow || this._openingEdit
            || this._newRowOperation || this._cellEditor?.editor.busy) return;
        const rows = this._gridRows, source = this._dataSource;
        const origin = this._selection.getActiveCell();
        if (!origin) return;
        let text: string;
        try {
            const clipboard = this.dom.ownerDocument.defaultView?.navigator.clipboard;
            if (!clipboard?.readText) throw new Error(this.messages.text("dataGrid.clipboardUnavailable"));
            // Invoke immediately during the user gesture, before any asynchronous work.
            const reading = clipboard.readText();
            this._contextMenu.hide();
            text = await reading;
        } catch (error) {
            await this.showPasteFailure(context, this.messages.text("dataGrid.clipboardFailed", { message: this.messages.describe(error) }));
            return;
        }
        const current = this._selection.getActiveCell();
        // A permission prompt must not redirect a delayed paste to a different view or cell.
        if (this.disposed.Value || rows !== this._gridRows || source !== this._dataSource
            || current?.rowIndex !== origin.rowIndex || current?.colIndex !== origin.colIndex) return;
        try {
            this._tableContainer.focus();
            await this.pasteText(text);
        } catch (error) {
            await this.showPasteFailure(context, Utils.getErrorText(error));
        }
    }

    /** Uses the existing menu UI for a visible failure and a keyboard-paste fallback. */
    private async showPasteFailure(context: DataGridContextMenuContext<TRow>, message: string): Promise<void> {
        if (this.disposed.Value) return;
        await this._contextMenu.show({ point: { x: context.event.clientX, y: context.event.clientY }, items: [
            { text: message, icon: "ri-error-warning-line", disabled: true },
            { text: this.messages.text("dataGrid.clipboardHint"), action: () => this._tableContainer.focus() }
        ] });
    }

    private showContextMenu = async (
        event: MouseEvent,
        target: DataGridContextMenuContext<TRow>["target"],
        row?: GridRow,
        column?: DataGridColumn<TRow>,
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

    /**
     * Scrolls only as far as needed to show a cell, leaving visible rows in place.
     * Column indices refer to data columns, excluding the optional row header.
     * Uses current row measurements; this method does not load or select a row.
     * @example grid.ensureCellVisible(12, 0);
     */
    public ensureCellVisible(rowIndex: number, colIndex: number): void {
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

    private beginRowSelection = async (event: MouseEvent, row: GridRow) => {
        if (event.button !== 0 || !this.isSelectableGridRow(row)) return;
        event.preventDefault();
        if (this._openingEdit || this._creatingNewRow || this._newRowOperation || this._pasteOperation) return;
        const edited = !!this._cellEditor;
        if (edited && !await this.endEdit()) return;
        if (!await this.leaveNewRowFor(row.visibleIndex)) return;
        this._tableContainer.focus();
        this._selectionMouseDown = true;
        this._selectionWholeRowDrag = true;
        this._selection.handleRowHeaderClick(row.visibleIndex, event);
        if (edited) this.endSelectionDrag();
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
        return { newRowText: this.messages.text("dataGrid.newRow"), groupPanelEmptyText: this.messages.text("dataGrid.groupPanelEmpty"), ...this._gridOptions.texts };
    }

    /** (Re)builds _dataSource/_isHierarchicalData from _gridOptions.data. */
    private _rebuildDataSource() {
        this._sourceChanged?.dispose();
        this._invalidCellInputs.clear();

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
                    return (row as any)[column];
                return col.getValue ? col.getValue(row) : Utils.getMember(row as any, col.name);
            }, column => this._columnsIndex.get(column), this._gridOptions.groupIntervals, this._gridOptions.customSummaries);
        }
        this._sourceChanged = this._dataSource.changed?.subscribe(change => {
            if (change.row !== undefined && (change.kind === "delete" || change.kind === "cancel"))
                this._invalidCellInputs.delete(this.getInputRowKey(change.row));
            for (const session of this._newRowSessions) if (session.state !== "pending") {
                // Direct source-session commands deliberately bypass UI validation.
                // Discard only the editor belonging to the completed session.
                const closesEditor = this._editingRow === session.row;
                this.releaseNewRow(session);
                if (closesEditor) this.closeCellEditor(undefined, false, false);
            }
            if (this._newRowSession && this._newRowSession.state !== "pending" && !this._newRowOperation)
                this._newRowSession = undefined;
            if (this._cellEditor || this._openingEdit || this._pasteOperation || this._creatingNewRow) this._editNeedsReload = true;
            else this.reloadEditedData();
        });
    }

    private getGroupFilterFunctions = (): FilterFunctionRegistry => {
        const functions: FilterFunctionRegistry = {};
        for (const interval of this._gridOptions.groupIntervals ?? []) {
            functions[interval.name] = (value, _args, row) => interval.getGroupValue(row, value);
        }
        return functions;
    };

    /** Merges a column patch onto the existing DataGridColumn of the same name (preserving its object
     *  identity, since it's shared with _gridOptions.columns and _gridColumns[i].dataColumn), or adds
     *  it as a new column if no such name exists yet. */
    private _mergeColumnPatch(patch: Partial<DataGridColumn<TRow>> & { name: string }) {
        const existing = this._columnsIndex.get(patch.name);
        if (existing) {
            Object.assign(existing, patch);
        } else {
            const col = patch as DataGridColumn<TRow>;
            this._columnsIndex.set(col.name, col);
            this._gridOptions.columns.push(col);
        }
    }

    private bindLocalization(): boolean {
        this._messageSubscriptions.forEach(subscription => subscription.dispose());
        const contexts = new Set([this._gridOptions.localization ?? Localization.default, Localization.default]);
        this._messageSubscriptions = [...contexts].map(context => context.messagesChanged.subscribe(() => {
            if (!this.disposed.Value) this.refreshLocale();
        }));
        this._localizationChanged?.dispose();
        this._localizationChanged = undefined;
        const changed = this._resolvedLocale !== this.locale;
        this._resolvedLocale = this.locale;
        if (this._gridOptions.locale === undefined) {
            this._localizationChanged = (this._gridOptions.localization ?? Localization.default).changed.subscribe(() => {
                if (this.disposed.Value || this._resolvedLocale === this.locale) return;
                this._resolvedLocale = this.locale;
                this.refreshLocale();
            });
        }
        return changed;
    }

    private refreshLocale(): void {
        // Reformat loaded values, not the source. Preserve edits, expansion, selection and pending rows.
        for (const column of this._gridColumns) {
            if (column.isAutoWidth) column.widthMeasured = false;
            column.footerWidthVersion = undefined;
        }
        this._totalSummaryWidthVersion++;
        this.refresh();
    }

    /**
     * Patches only provided options and emits optionChanged. Locale changes repaint
     * built-in formatting without re-querying data or changing an active editor's locale.
     */
    public setOptions = (options: Partial<DataGridOptions<TRow>>) => {
        if ("columnResizeMode" in options) this._cancelActiveResize?.();
        const visualColumnDefaults = options.defaultColumnOptions
            && Object.keys(options.defaultColumnOptions).every(key => key === "editorButtonVisibility");
        if ((this._cellEditor || this._openingEdit || this._creatingNewRow || this.hasPendingNewRow || this._newRowOperation || this._pasteOperation) && Object.keys(options).some(key =>
            (key === "defaultColumnOptions" && !visualColumnDefaults) || ["data", "columns", "visibleColumns", "filter", "orderBy", "groupColumns", "hierarchyRootId",
                "pageSize", "groupIntervals", "groupSummary", "totalSummary", "customSummaries", "allowEdit"].includes(key)))
            throw new Error("Failed to change grid options. Finish or cancel the active cell edit and pending new row first.");
        const previousFooterVisible = this._gridOptions.showColumnFooters !== false;
        const previousIntervals = new Map((this._gridOptions.groupColumns ?? [])
            .map(name => [name, this._columnsIndex.get(name)?.groupInterval]));

        if (this._initialized && ("data" in options || "groupColumns" in options || "hierarchyRootId" in options
            || "pageSize" in options || "filter" in options || "orderBy" in options || "groupSummary" in options
            || "totalSummary" in options || "groupIntervals" in options || "customSummaries" in options)) {
            this._selection.clear();
        }

        // Reconcile columns by name instead of replacing the array wholesale, so DataGridColumn object
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
        if (rest.defaultColumnOptions)
            rest.defaultColumnOptions = { ...this._gridOptions.defaultColumnOptions, ...rest.defaultColumnOptions };
        Object.assign(this._gridOptions, rest);
        const localeChanged = (!this._initialized || "locale" in options || "localization" in options)
            ? this.bindLocalization() : false;

        // Resolve every optional field to a concrete default, once, so the rest of the grid (and
        // getOptions()) never has to special-case "unset".
        this._gridOptions.visibleColumns ??= this._gridOptions.columns.map(c => c.name);
        this._gridOptions.groupColumns ??= [];
        this._gridOptions.groupSummary ??= [];
        this._gridOptions.totalSummary ??= [];
        this._gridOptions.groupIntervals ??= [];
        this._gridOptions.customSummaries ??= [];
        this._gridOptions.pageSize ??= 100;
        this._gridOptions.fixedLeftColumns ??= 0;
        this._gridOptions.fixedRightColumns ??= 0;
        this._gridOptions.columnWidthMode ??= "stretch-auto";
        this._gridOptions.showRowHeader ??= true;
        this._gridOptions.showColumnHeaders ??= true;
        this._gridOptions.showGroupPanel ??= true;
        this._gridOptions.showFilterRow ??= false;
        this._gridOptions.showColumnFooters ??= true;
        this._gridOptions.showRowHover ??= false;
        this._gridOptions.allowEdit ??= false;
        this._gridOptions.showBorder ??= true;
        this._gridOptions.cellBorders ??= "rows";
        this._gridOptions.showSelection ??= true;
        this._gridOptions.cursor ??= "default";
        this._gridOptions.scrollbarMode ??= "thin";
        this._scrollEngine.scrollbarMode = this._gridOptions.scrollbarMode;
        this._gridOptions.scrollbarHoverDistance ??= 50;
        this._scrollEngine.scrollbarHoverDistance = this._gridOptions.scrollbarHoverDistance;
        this._gridOptions.hierarchyRootId ??= null;
        this._gridOptions.stickyGroupRows ??= false;
        this._gridOptions.selectableGroupRows ??= true;
        this._gridOptions.selectableHierarchyNodes ??= false;
        this._gridOptions.texts ??= {};
        this._gridOptions.contextMenu ??= true;
        this._gridOptions.standardContextMenuItems ??= null;
        this._gridOptions.sortOnHeaderClick ??= true;
        this._gridOptions.selectionMode ??= "multiple-cells";
        this._selection.setMode(this._gridOptions.selectionMode);
        this.dom.classList.toggle("elg-data-grid-hover-row", this._gridOptions.showRowHover === true);
        this.dom.classList.toggle("elg-data-grid-no-border", this._gridOptions.showBorder === false);
        this.dom.classList.toggle("elg-data-grid-no-cell-borders", this._gridOptions.cellBorders === "none");
        this.dom.classList.toggle("elg-data-grid-all-cell-borders", this._gridOptions.cellBorders === "all");
        this.dom.classList.toggle("elg-data-grid-no-selection", this._gridOptions.showSelection === false);
        this.dom.classList.toggle("elg-data-grid-cursor-default", this._gridOptions.cursor === "default");
        this.dom.classList.toggle("elg-data-grid-cursor-pointer", this._gridOptions.cursor === "pointer");
        this.dom.classList.toggle("elg-data-grid-cursor-text", this._gridOptions.cursor === "text");

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

        const groupingIntervalChanged = (this._gridOptions.groupColumns ?? []).some(name =>
            previousIntervals.has(name) && previousIntervals.get(name) !== this._columnsIndex.get(name)?.groupInterval);
        const reloadsRows = groupingIntervalChanged || "data" in options || "groupColumns" in options || "hierarchyRootId" in options
            || "pageSize" in options || "filter" in options || "orderBy" in options || "groupSummary" in options
            || "totalSummary" in options || "groupIntervals" in options || "customSummaries" in options;
        const orderByOnly = Object.keys(options).length === 1 && "orderBy" in options;
        const footerBecameVisible = "showColumnFooters" in options
            && !previousFooterVisible
            && this._gridOptions.showColumnFooters !== false;
        const invalidatesTotalSummary = "data" in options
            || "filter" in options
            || "totalSummary" in options
            || "customSummaries" in options
            || "hierarchyRootId" in options
            || (orderByOnly && this.totalSummaryDependsOnOrder());
        const changesLayout = "columns" in options || "visibleColumns" in options || "fixedLeftColumns" in options
            || "fixedRightColumns" in options || "columnWidthMode" in options || "showRowHeader" in options;
        const changesStaticRows = "showGroupPanel" in options || "showColumnHeaders" in options || "showFilterRow" in options || "showColumnFooters" in options;

        if (changesLayout) this.layoutChanged();
        if (invalidatesTotalSummary) {
            this._totalSummary = [];
            this._totalSummaryLoaded = false;
        }
        if (reloadsRows || footerBecameVisible) this.reloadRows();
        if (localeChanged) this.refreshLocale();
        if (!changesLayout && !reloadsRows && (visualColumnDefaults || "selectionMode" in options || "texts" in options || "stickyGroupRows" in options || "selectableGroupRows" in options || "selectableHierarchyNodes" in options || "showRowHover" in options || "showBorder" in options || "cellBorders" in options || "showSelection" in options || "cursor" in options || changesStaticRows)) this.refresh();
    }

    /** Returns a shallow copy of the grid's current, fully-resolved options. */
    getOptions(): DataGridOptions<TRow> {
        return { ...this._gridOptions };
    }

    /** Returns the column definition for the given name, or undefined if no such column exists. */
    getColumn(name: string): DataGridColumn<TRow> | undefined {
        return this._columnsIndex.get(name);
    }

    /** Returns the live selection controller. Refresh the grid after direct controller mutations. */
    public getSelectionManager(): SelectionManager { return this._selection; }
    /** Returns copied selection ranges in current visible row and data-column coordinates. */
    public getSelectedRanges() { return this._selection.getRanges(); }
    /** Returns the active cell coordinates, or null when no cell is active. */
    public getActiveSelectionCell() { return this._selection.getActiveCell(); }
    /** Clears ranges and active cell, then schedules a grid repaint. */
    public clearSelection() { this._selection.clear(); this.refresh(); }

    /** Patches an existing column's definition in place and updates the grid's layout accordingly. */
    setColumnOptions(name: string, patch: Partial<DataGridColumn<TRow>>) {
        if (this.editing || this._creatingNewRow || this.hasPendingNewRow || this._newRowOperation || this._pasteOperation) throw new Error("Failed to change grid column. Finish or cancel active editing and pending new rows first.");
        if (!this._columnsIndex.has(name)) {
            console.warn(`DataGrid.setColumnOptions: no column named "${name}".`);
            return;
        }
        const groupingChanged = "groupInterval" in patch && this._gridOptions.groupColumns?.includes(name)
            && this._columnsIndex.get(name)?.groupInterval !== patch.groupInterval;
        this._mergeColumnPatch({ ...patch, name });
        this.dom.dispatchEvent(new CustomEvent("optionChanged", { detail: { columns: [{ ...patch, name }] } }));
        if ("locale" in patch || "displayFormat" in patch) this.refreshLocale();
        this.layoutChanged();
        if (groupingChanged) this.reloadRows();
        else if ("displayFormat" in patch) this.reloadRows(true);
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
        const grid = this;
        return {
            dataSource: this._dataSource,
            // Cached row providers also resolve newly loaded pages against the current locale.
            get locale() { return grid.locale; },
            pageSize: this._gridOptions.pageSize!,
            columns: this._columnsIndex,
            visibleColumns: this.getVisibleColumns().map(c => c.name),
            baseFilter: this._gridOptions.filter,
            groupColumns: this._gridOptions.groupColumns,
            groupSummary: this._gridOptions.groupSummary,
            totalSummary: this._totalSummaryLoaded
                || this._gridOptions.showColumnFooters === false
                || !this._gridOptions.totalSummary?.length
                ? undefined
                : this._gridOptions.totalSummary,
            orderBy: this._gridOptions.orderBy,
            hierarchyRootId: this._gridOptions.hierarchyRootId,
        };
    }

    /** Returns whether any configured total summary can change when rows are reordered. */
    private totalSummaryDependsOnOrder = (): boolean => {
        const orderIndependent = new Set(["count", "distinct", "sum", "avg", "min", "max"]);
        return (this._gridOptions.totalSummary ?? []).some(summary => {
            if (orderIndependent.has(summary.summaryType)) return false;
            return this._gridOptions.customSummaries?.find(item => item.name === summary.summaryType)
                ?.dependsOnOrder === true;
        });
    };

    private createGridRows(expansion?: GridExpansionState) {
        const version = ++this._rowsVersion;
        this._gridRows?.dispose();
        let provider: GridRowsProvider<TRow> = new DefaultGridRowsProvider<TRow>(this.getState(), expansion);
        if (this._gridOptions.allowEdit && this._dataSource.update && this._dataSource.createNewRow)
            provider = new NewRowGridRowsProvider(provider, (index, offset) => this.getNewGridRow(index, offset), () => this._newRowSessions.length);
        return new VirtualGridRows(provider, this._gridOptions.pageSize!, (args, result) => {
            if (version !== this._rowsVersion || this.disposed.Value) return;
            if (result.totalSummary) {
                this._totalSummary = result.totalSummary;
                this._totalSummaryLoaded = true;
                this._totalSummaryWidthVersion++;
            }
            this.refresh();
        })
    }

    /**
     * Expands every group, or one zero-based grouping level. Other levels retain
     * their state; expanding a hidden child does not open its parent. Loads nested
     * group metadata through loadData(groupBy), not all data rows. Tree mode is unchanged.
     * Failed loading leaves the previous expansion state intact.
     */
    async expandAllGroups(groupIndex?: number): Promise<void> {
        await this.changeAllGroups(true, groupIndex);
    }

    /** Collapses all groups or one grouping level, without loading additional group metadata. */
    async collapseAllGroups(groupIndex?: number): Promise<void> {
        await this.changeAllGroups(false, groupIndex);
    }

    /**
     * Returns an independent snapshot of expanded groups, including hidden descendants.
     * Contains opaque group keys, not nodes or rows. Tree expansion is not included.
     * Reuse only with the same source and ordered grouping fields/intervals.
     * @example const state = grid.getExpansionState();
     */
    getExpansionState(): GridExpansionState {
        return this._gridRows.getExpansionState();
    }

    /**
     * Replaces group expansion after finishing the active row edit. An empty key list
     * collapses all groups; absent groups are ignored. Does not open a key's collapsed
     * parents implicitly. Loads grouped metadata via loadData, leaving data rows paged.
     * Failure leaves the previous expansion intact; replacing/disposing the view cancels
     * restoration. A nonempty state requires a grouped, non-hierarchical view.
     * @example await grid.setExpansionState(savedState);
     */
    async setExpansionState(state: GridExpansionState): Promise<void> {
        const snapshot = copyExpansionState(state);
        if (this._openingEdit || !await this.finishActiveRowEdit())
            throw new Error("Failed to restore group expansion. Finish or correct the active edit first.");
        if (this.disposed.Value) throw new DOMException("Failed to restore group expansion. The grid was disposed.", "AbortError");
        const rows = this._gridRows;
        await rows.setExpansionState(snapshot);
        if (rows === this._gridRows && !this.disposed.Value) this.refresh();
    }

    /** Resolve the level at activation time: a menu can outlive grouping changes. */
    private async changeColumnGroupExpansion(columnName: string, expanded: boolean): Promise<void> {
        const groupIndex = this._gridOptions.groupColumns?.indexOf(columnName) ?? -1;
        if (groupIndex < 0 || this._isHierarchicalData) return;
        await this.changeAllGroups(expanded, groupIndex, expanded);
    }

    private async changeAllGroups(expanded: boolean, groupIndex?: number, includeParents?: boolean): Promise<void> {
        if (this._openingEdit || !await this.finishActiveRowEdit())
            throw new Error("Failed to change group expansion. Finish or correct the active edit first.");
        if (this.disposed.Value) throw new DOMException("Failed to change group expansion. The grid was disposed.", "AbortError");
        const rows = this._gridRows;
        await rows.setGroupsExpanded(expanded, groupIndex, includeParents);
        if (rows === this._gridRows && !this.disposed.Value) this.refresh();
    }
    /**
         * Returns the currently visible columns
         * @returns Array of visible columns
         */
    getVisibleColumns(): DataGridColumn<TRow>[] {

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
        this._cancelActiveResize?.();
        this._columnResizeLayout = undefined;
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
        this.render(this.positionCellEditor);
        this.render(this.positionNewRowPlaceholder);

        // Phase 4: MEASURE (deferred to next frame to avoid forced reflow)
        const version = this._rowsVersion;
        requestAnimationFrame(() => {
            if (!this.disposed.Value && version === this._rowsVersion) this.measureAndAdjustScroll(view);
        })

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
        const minimumAutoWidth = 80;

        const measureText = (col: GridColumn<TRow>, text: string, minimum = minimumAutoWidth, footer = false) => {
            columnWidths ??= new Map();
            let width = Math.max(columnWidths.get(col) ?? minimum, minimum);
            if (text) {
                if (!canvasContext) {
                    canvasContext = document.createElement("canvas").getContext("2d")!;
                    canvasContext.font = "16px Arial";
                }
                width = Math.max(width, canvasContext.measureText(text).width + 24
                    + (!footer && col.groupIndex > -1 ? 100 : 0));
            }
            columnWidths.set(col, width);
        };

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
                // Measure column widths
                for (let col of pendingWidthColumns) {
                    let txt = this.getCellText(row.gridRow, col);
                    if (!txt)
                        txt = col.dataColumn?.caption ?? col.dataColumn?.name ?? "";
                    measureText(col, txt);
                }
            }
        }

        if (this._gridOptions.showColumnFooters && this._totalSummaryLoaded) {
            const footer: GridRow = { type: "footer", visibleIndex: 0, level: 0,
                cells: {}, data: { totalSummary: this._totalSummary } };
            for (const col of this._gridColumns) {
                if (!col.isAutoWidth || (col.widthMeasured
                    && col.footerWidthVersion === this._totalSummaryWidthVersion)) continue;
                // Use the displayed footer text, including labels for multiple aggregates.
                // Late/new totals may grow an auto column, but must not shrink its data baseline.
                measureText(col, this.getCellText(footer, col), col.widthMeasured ? Math.max(minimumAutoWidth, col.naturalWidth) : minimumAutoWidth, true);
                col.footerWidthVersion = this._totalSummaryWidthVersion;
            }
        }

        if (columnWidths) {
            let widthsChanged = false;
            for (let [col, width] of columnWidths) {
                const measured = col.widthMeasured || view.rows.length > 0;
                widthsChanged ||= col.naturalWidth !== width || col.widthMeasured !== measured;
                col.naturalWidth = width;
                col.widthMeasured = measured;
            }
            if (widthsChanged) {
                this.redistributeColumnWidths();
                this.refresh();
            }
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

        const reveal = this._cellToReveal;
        if (reveal) {
            this._cellToReveal = undefined;
            const active = this._selection.getActiveCell();
            if (reveal.rowsVersion === this._rowsVersion
                && active?.rowIndex === reveal.rowIndex && active.colIndex === reveal.colIndex) {
                // Measured sizes and sticky sections must both be included before
                // ensureCellVisible asks the engine to clamp the requested offset.
                this._scrollEngine.updateDimensions(this._scrollEngine.scrollWidth,
                    this._sizeManager.getOffset(this._gridRows.count()) + this._headerHeight + this._footerHeight);
                this.ensureCellVisible(reveal.rowIndex, reveal.colIndex);
            }
        }

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
            props.style.borderRightColor = "var(--elg-data-grid-sticky-border)";
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

    }

    private getTotalSummary = (gridRow: GridRow, field: string): SummaryResult[] => {
        if (gridRow.type !== "footer") return [];
        return (gridRow.data?.totalSummary as SummaryResult[] | undefined)
            ?.filter(summary => summary.field === field) ?? [];
    };

    private getCellText = (gridRow: GridRow, col: GridColumn<TRow>): string => {

        if (gridRow.type === "footer") {
            if (!col.dataColumn) return "";
            const summaries = this.getTotalSummary(gridRow, col.dataColumn.name);
            const groupSummary = this._gridOptions.groupSummary
                ?.find(summary => summary.field === col.dataColumn!.name);
            return summaries.map(summary => {
                const showType = summaries.length > 1
                    || (!!groupSummary && groupSummary.summaryType !== summary.summaryType);
                const text = DataViewFieldUtils.formatSummaryValue(col.dataColumn!, summary.value, summary.summaryType, this.locale);
                return showType
                    ? `${summary.summaryType}: ${text}`
                    : text;
            })
                .join(", ");
        }

        // First column in a group row displays the group label.
        if (false && col.visibleIndex == 1
            && gridRow.expandable
            && gridRow.type == "group")
            return gridRow.text ?? "";

        if (col.dataColumn) {
            const invalidInput = this.getInvalidCellInput(gridRow, col.dataColumn.name);
            if (invalidInput && DataViewFieldUtils.getDataType(col.dataColumn) !== "boolean") return invalidInput.text;
            const cell = gridRow.cells?.[col.dataColumn.name];
            if (col.dataColumn.displayFormat !== undefined && cell && typeof cell === "object" && "value" in cell) {
                if (gridRow.type === "group") {
                    const summary = this._gridOptions.groupSummary?.find(item => item.field === col.dataColumn!.name);
                    if (summary) return DataViewFieldUtils.formatSummaryValue(col.dataColumn, cell.value, summary.summaryType, this.locale);
                } else if (!col.dataColumn.getText && !col.dataColumn.lookup) {
                    try { return DataViewFieldUtils.formatDisplayValue(col.dataColumn, cell.value, this.locale); }
                    catch (error) { return `ERROR: ${Utils.getErrorText(error)}`; }
                }
            }
            return String(cell?.text ?? cell?.value ?? cell ?? "");
        }
        else if (col.type == "rowheader") {
            if (gridRow.type === "new") return "*";
            return String(gridRow.visibleIndex + 1)
        }

        return "";
    }

    private createCellProps = (col: GridColumn<TRow>): any => ({
        title: "",
        className: `elg-data-grid-cell elg-data-grid-cell-${col.type}`
    });

    private applyRowHeaderCell = (props: any, gridRow: GridRow, col: GridColumn<TRow>) => {
        props.textContent = this.getCellText(gridRow, col);
        if (!this.isSelectableGridRow(gridRow)) return;

        props.onmousedown = (e: MouseEvent) => this.beginRowSelection(e, gridRow);
        props.onmouseenter = () => this.enterSelection(gridRow, col.visibleIndex);
        props.oncontextmenu = (e: MouseEvent) => this.showContextMenu(e, "rowHeader", gridRow);
    };

    private createExpandIcon = (gridRow: GridRow) => v("i", {
        class: "elg-icon elg-data-grid-expand-icon " + (gridRow.expanded ? "ri-arrow-down-s-line" : "ri-arrow-right-s-line"),
        ui: ["me-1"],
        onclick: async (e, el) => {
            if (this._openingEdit || !await this.finishActiveRowEdit()) return;
            await this._gridRows.load(gridRow.visibleIndex, 1);
            const current = this._gridRows.getAt(gridRow.visibleIndex);
            if (current.key !== gridRow.key) return;
            assignElementProps(el, {
                class: "elg-spinner-ring",
                ui: ["me-1", "text-primary"]
            });

            const rows = this._gridRows;
            const rowIndex = gridRow.visibleIndex;
            try {
                await rows.setExpanded(current, !current.expanded);
                if (rows === this._gridRows && !this.disposed.Value && el.closest(".elg-data-grid-row-sticky")) this.scrollToRow(rowIndex);
            } catch (error) {
                if ((error as { name?: string })?.name !== "AbortError") console.error("Failed to change grid row expansion.", error);
            } finally {
                if (rows === this._gridRows && !this.disposed.Value) this.render(this.renderBody);
            }
        }
    });

    private createIndentedCellContent = (gridRow: GridRow, cellContent: VNode<any>): VNode<any> => {
        const wrapperProps: any = {
            ui: ["d-flex", "items-center", "min-w-0", "w-100"],
            style: { marginLeft: (this._groupPadding * gridRow.level) + "px" }
        };

        const valueContent = v("span", {
            ui: ["flex-1", "min-w-0", "overflow-hidden", "text-nowrap", "text-ellipsis"]
        }, cellContent);

        // A flat grid has no expandable/group hierarchy to align with, so the
        // first data cell should not reserve space for a hidden group icon.
        if (!this._gridOptions.groupColumns?.length && !this._isHierarchicalData)
            return valueContent;

        if (gridRow.expandable)
            wrapperProps.vnodes = [this.createExpandIcon(gridRow), valueContent];
        else
            wrapperProps.vnodes = [
                v("i", {
                    class: "elg-icon ri-arrow-right-s-line",
                    ui: ["elg", "me-1"],
                    style: { visibility: "hidden" }
                }),
                valueContent
            ];

        return v("span", wrapperProps);
    };

    private createDataCell = (gridRow: GridRow, col: GridColumn<TRow>, text: string): GridCell<TRow> | undefined => {
        if (!col.dataColumn) return;

        const resolvedCell = gridRow.cells?.[col.dataColumn.name];
        const groupData = gridRow.type === "group" ? gridRow.data?.data : undefined;
        const totalSummary = this.getTotalSummary(gridRow, col.dataColumn.name);
        const groupValue = groupData?.groupField === col.dataColumn.name
            ? groupData.groupValue
            : undefined;
        return {
            column: col.dataColumn,
            rowData: gridRow.type === "group" ? undefined : (gridRow.data?.data ?? gridRow.data) as TRow,
            value: groupValue ?? (totalSummary.length === 1
                ? totalSummary[0].value
                : totalSummary.length > 1
                    ? totalSummary.map(summary => summary.value)
                    : resolvedCell?.value ?? resolvedCell),
            gridRow,
            text
        };
    };

    private applyDataCellStyle = (props: any, dataCell: GridCell<TRow>) => {
        const customStyle = dataCell.column.customCellStyle?.(dataCell);
        if (!customStyle) return;

        if (customStyle.className) props.className += " " + customStyle.className;
        if (customStyle.style) props.style = customStyle.style;
    };

    private applyDataCellInteractions = (props: any, gridRow: GridRow, col: GridColumn<TRow>) => {
        props["data-elg-edit-row"] = String(gridRow.visibleIndex);
        props["data-elg-edit-column"] = col.dataColumn!.name;
        props.onmousedown = async (e: MouseEvent) => {
            if (this._openingEdit || this._creatingNewRow || this._newRowOperation || this._pasteOperation) { e.preventDefault(); return; }
            const edited = !!this._cellEditor;
            if (edited) {
                e.preventDefault();
                if (!await this.endEdit()) return;
            }
            if (this._newRowSession && gridRow.data !== this._newRowSession.row) {
                e.preventDefault(); if (!await this.leaveNewRowFor(gridRow.visibleIndex)) return;
            }
            this.beginCellSelection(e, gridRow, col.visibleIndex);
            if (edited) this.endSelectionDrag();
        };
        props.ondblclick = () => { void this.beginEdit(gridRow.visibleIndex, col.dataColumn!.name); };
        props.onmouseenter = () => this.enterSelection(gridRow, col.visibleIndex);
        props.oncontextmenu = (e: MouseEvent) => this.showContextMenu(
            e, "cell", gridRow, col.dataColumn, col.visibleIndex - this.rowHeaderOffset
        );
    };

    private applyDataCellContent = (
        props: any,
        gridRow: GridRow,
        col: GridColumn<TRow>,
        dataCell: GridCell<TRow>
    ) => {
        const customVNode = col.dataColumn!.renderCell?.(dataCell);
        if (gridRow.type !== "footer" && col.visibleIndex == this.rowHeaderOffset)
            props.vnodes = [
                this.createIndentedCellContent(
                    gridRow,
                    customVNode ?? v("span", dataCell.text))
            ];
        else if (customVNode)
            props.vnodes = [customVNode];
        else
            props.textContent = dataCell.text;
    };

    /** Shares explicit picker opening between the cell trigger and Alt+ArrowDown. */
    private async openCellPicker(rowIndex: number, columnName: string): Promise<void> {
        if (!await this.beginEdit(rowIndex, columnName)) return;
        if (this._editingCell?.rowIndex === rowIndex && this._editingCell.columnName === columnName)
            await this._cellEditor?.openPicker();
    }

    /** Adds a keyed, cell-owned trigger without creating an editor or changing content geometry. */
    private applyCellEditorButton(props: any, gridRow: GridRow, col: GridColumn<TRow>): void {
        const field = col.dataColumn;
        if (!field || field.readonly || !this._gridOptions.allowEdit || !this._dataSource.update
            || !["data", "node", "new"].includes(gridRow.type)) return;
        const visibility = field.editorButtonVisibility ?? this._gridOptions.defaultColumnOptions?.editorButtonVisibility ?? "hover";
        const button = visibility !== "never" ? getFieldEditorButton(field, this._gridOptions) : undefined;
        if (!button) return;
        props.className += " elg-data-grid-cell-picker";
        if (this._editingCell?.rowIndex === gridRow.visibleIndex && this._editingCell.columnName === field.name)
            props.className += " elg-data-grid-cell-editing";
        const content = props.vnodes ?? [v("span", props.textContent ?? "\u00a0")];
        props.textContent = undefined;
        props.vnodes = [...content, v("button", {
            key: "cell-editor-button", type: "button", tabIndex: -1,
            class: `elg-editor-trigger elg-data-grid-cell-editor-button elg-data-grid-cell-editor-button-${visibility}`,
            ariaLabel: button.label, title: button.label, ariaHasPopup: "dialog",
            disabled: !!(this._newRowOperation || this._pasteOperation || this._cellEditor?.editor.busy),
            onpointerdown: event => { event.preventDefault(); event.stopPropagation(); },
            onmousedown: event => { event.preventDefault(); event.stopPropagation(); },
            ondblclick: event => { event.preventDefault(); event.stopPropagation(); },
            onclick: async event => {
                event.preventDefault(); event.stopPropagation();
                try { await this.openCellPicker(gridRow.visibleIndex, field.name); }
                catch (error) { console.error("Failed to open cell picker.", error); }
            }
        }, v("i", { class: button.icon, ariaHidden: "true" }))];
    }

    private applyDataCell = (props: any, gridRow: GridRow, col: GridColumn<TRow>) => {
        if (gridRow.type === "new") {
            const session = this._newRowSessions.find(item => item.row === gridRow.data);
            const error = session ? this._pendingRowErrors.get(session) : this._newRowError;
            props.title = error ?? this.texts.newRowText;
            if (error) props.className += " elg-text-danger";
            if (error) props["aria-invalid"] = "true";
            if (!gridRow.data) {
                if (col.type === "rowheader") this.applyRowHeaderCell(props, gridRow, col);
                else if (col.dataColumn) {
                    this.applyDataCellInteractions(props, gridRow, col);
                    this.applyCellEditorButton(props, gridRow, col);
                }
                return;
            }
        }
        if (col.type == "rowheader") {
            this.applyRowHeaderCell(props, gridRow, col);
            return;
        }
        if (!col.dataColumn) return;

        const cellText = this.getCellText(gridRow, col);
        const dataCell = this.createDataCell(gridRow, col, cellText);
        if (!dataCell) return;

        this.applyDataCellStyle(props, dataCell);
        if ((gridRow.type === "data" || gridRow.type === "node") && dataCell.rowData !== undefined
            && this._dataSource.isCellModified?.(dataCell.rowData, col.dataColumn.name))
            props.className += " elg-data-grid-cell-modified";
        if (gridRow.type !== "footer")
            this.applyDataCellInteractions(props, gridRow, col);
        this.applyDataCellContent(props, gridRow, col, dataCell);
        const invalidInput = this.getInvalidCellInput(gridRow, col.dataColumn.name);
        if (invalidInput) {
            props.className += " elg-data-grid-cell-invalid";
            props["aria-invalid"] = "true";
            props.title = `${invalidInput.error}\nInput: ${JSON.stringify(invalidInput.text)}`;
            props.textContent = undefined;
            props.vnodes = [v("i", { class: "ri-error-warning-line", ariaLabel: props.title, ui: ["text-danger", "me-1"] }),
                v("span", DataViewFieldUtils.getDataType(col.dataColumn) === "boolean" ? cellText : invalidInput.text)];
        }
        this.applyCellEditorButton(props, gridRow, col);
    };

    private applyHeaderCell = (props: any, col: GridColumn<TRow>) => {
        if (col.type != "data" || !col.dataColumn) return;

        const sortDirection = this.getColumnSortDirection(col.dataColumn.name);
        const sortOrder = this.getColumnSortOrder(col.dataColumn.name);
        const showSortOrder = sortOrder !== undefined && (this._gridOptions.orderBy?.length ?? 0) > 1;
        props.vnodes = [
            v("span", this.getColumnHeaderText(col.dataColumn)),
            showSortOrder ? v("span", {
                textContent: String(sortOrder),
                ui: ["ms-1", "text-muted", "fs-80"],
                ariaLabel: this.messages.text("dataGrid.sortPriority", { priority: sortOrder })
            }) : null,
            sortDirection ? v("i", {
                class: sortDirection === "asc" ? "ri-arrow-up-line" : "ri-arrow-down-line",
                ui: ["ms-1", "text-muted"],
                ariaLabel: sortDirection === "asc" ? this.messages.text("dataGrid.sortedAscending") : this.messages.text("dataGrid.sortedDescending")
            }) : null,
            v("em", {
                class: "elg-data-grid-header-resizer",
                onmousedown: (e, el) => this.resizeColumn(e, col),
                ontouchstart: (e, el) => this.resizeColumn(e, col),
                ondblclick: (e, el) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.autoSizeColumn(col.dataColumn!.name);
                },
                onclick: e => {
                    e.preventDefault();
                    e.stopPropagation();
                }
            })
        ];
        props.onmousedown = (e: MouseEvent, td: HTMLTableCellElement) => this.startColumnDrag(e, td, col);
        props.ontouchstart = (e: TouchEvent, td: HTMLTableCellElement) => this.startColumnDrag(e, td, col);
        props.onclick = async (e: MouseEvent, td: HTMLTableCellElement) => {
            if (this._openingEdit || !await this.finishActiveRowEdit()) return;
            if (this._gridOptions.sortOnHeaderClick !== false && td.dataset["dragMoved"] !== "true")
                this.toggleColumnSort(col.dataColumn!.name, e.shiftKey);
        };
        props.oncontextmenu = (e: MouseEvent) => this.showContextMenu(e, "columnHeader", undefined, col.dataColumn);
    };

    private getFilterField = (filter: any): string | undefined => {
        if (!Array.isArray(filter) || filter.length !== 3) return undefined;
        const selector = filter[0];
        return typeof selector === "string" ? selector : selector?.field;
    };

    private removeColumnFilter = (filter: any, field: string): any => {
        if (Array.isArray(filter) && filter.length === 3
            && typeof filter[1] === "string"
            && ["=", "<>", ">", ">=", "<", "<=", "startswith", "endswith", "contains", "notcontains"].includes(filter[1])) {
            return this.getFilterField(filter) === field ? undefined : filter;
        }
        if (!Array.isArray(filter)) return filter;

        const explicit = filter[0] === "and" || filter[0] === "or";
        const operator = explicit ? filter[0] : "and";
        const children = (explicit ? filter.slice(1) : filter)
            .map((child: any) => this.removeColumnFilter(child, field))
            .filter((child: any) => child !== undefined);
        if (!children.length) return undefined;
        if (children.length === 1) return children[0];
        return [operator, ...children];
    };

    private setColumnFilter = async (column: DataGridColumn<TRow>, rawValue: string) => {
        if (this._openingEdit || !await this.finishActiveRowEdit()) return;
        const value = rawValue.trim();
        const remaining = this.removeColumnFilter(this._gridOptions.filter, column.name);
        const nextFilter = value
            ? (this._filterRow ??= new DataFilterRow(this.getVisibleColumns())).parse(column.name, value)
            : undefined;
        const targetFilter = nextFilter
            ? (remaining ? ["and", remaining, nextFilter] as any : nextFilter)
            : remaining;
        if (JSON.stringify(targetFilter) === JSON.stringify(this._gridOptions.filter)) return;
        if (!nextFilter) {
            this.setOptions({ filter: remaining });
            return;
        }

        this.setOptions({ filter: targetFilter });
    };

    private openFilterEditor = async (anchor: HTMLElement) => {
        if (this._openingEdit || !await this.finishActiveRowEdit()) return;
        this._filterPopover?.dispose();

        const editor = new FilterEditor<TRow>({
            locale: this.locale, localization: this._gridOptions.localization,
            columns: this.getVisibleColumns(),
            filter: this._gridOptions.filter,
            ui: ["elg", "p-3"],
            onApply: filter => {
                this.setOptions({ filter });
                this._filterPopover?.hide();
            },
            onCancel: () => this._filterPopover?.hide()
        });
        const popover = new Popover({
            anchorElement: anchor,
            placement: "bottom-start",
            gap: 6,
            children: editor,
            closeMode: "auto"
        });
        this._filterPopover = popover;
        this.addCleanup(() => popover.dispose());
        popover.mount(document.body);
        popover.show();
    };

    /** Uses the filter-row funnel as the stable anchor for the full filter editor. */
    private openFilterEditorFromSummary = (fallback: HTMLButtonElement) => {
        const funnel = this._contentTable.tHead?.querySelector<HTMLButtonElement>(
            ".elg-data-grid-row-filter .elg-data-grid-cell-rowheader button"
        );
        this.openFilterEditor(funnel ?? fallback);
    };

    private applyFilterCell = (props: any, col: GridColumn<TRow>) => {
        const filterRow = this._filterRow ??= new DataFilterRow(this.getVisibleColumns());
        const filterValues = filterRow.fromFilter(this._gridOptions.filter);
        const filterText = filterRow.toText(this._gridOptions.filter);
        const complexFilter = filterValues === false;
        const hasFilter = Array.isArray(this._gridOptions.filter)
            ? this._gridOptions.filter.length > 0
            : this._gridOptions.filter !== undefined;

        if (col.type === "rowheader") {
            props.vnodes = [v("button", {
                key: "filter-editor-button",
                class: "elg-data-grid-filter-button",
                ui: ["elg", "btn", "text-muted"],
                type: "button",
                ariaLabel: this.messages.text("dataGrid.editFilter"),
                onclick: (event: MouseEvent, button: HTMLButtonElement) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.openFilterEditor(button);
                }
            }, v("i", {
                class: "elg-icon ri-filter-3-line",
                ui: ["elg", hasFilter ? "text-primary" : "text-muted"]
            }))];
            return;
        }
        if (!col.dataColumn) return;

        if (!complexFilter) {
            const column = col.dataColumn;
            const inputValue = filterValues.find(value => value.field === column.name)?.text ?? "";
            const input = v("input", {
                key: `filter-${column.name}`,
                class: "elg-data-grid-filter-input",
                ui: ["elg", "w-100"],
                type: "search",
                value: inputValue,
                ariaLabel: this.messages.text("dataGrid.filterColumn", { column: column.caption ?? column.name }),
                onchange: (event: Event) => this.setColumnFilter(column, (event.target as HTMLInputElement).value),
                onkeydown: (event: KeyboardEvent) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        this.setColumnFilter(column, (event.target as HTMLInputElement).value);
                    }
                }
            } as any);
            const clearButton = inputValue
                ? v("button", {
                    key: `clear-filter-${column.name}`,
                    class: "elg-data-grid-filter-clear",
                    ui: ["elg", "btn", "text-muted", "p-0"],
                    type: "button",
                    tabIndex: -1,
                    ariaLabel: this.messages.text("dataGrid.clearColumnFilter", { column: column.caption ?? column.name }),
                    onmousedown: (event: MouseEvent) => event.preventDefault(),
                    onclick: (event: MouseEvent) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.setColumnFilter(column, "");
                    }
                }, v("i", { class: "ri-close-line" }))
                : null;
            props.vnodes = [v("span", {
                key: `filter-control-${column.name}`,
                class: "elg-data-grid-filter-control",
                ui: ["elg", "d-block", "position-relative"]
            }, input, clearButton)];
            return;
        }

        const firstDataColumn = col.visibleIndex === this.rowHeaderOffset;
        if (!firstDataColumn) {
            props.style = { ...(props.style ?? {}), display: "none" };
            props.vnodes = [];
            return;
        }

        props.colSpan = this._gridColumns.filter(item => item.type === "data").length;
        props.vnodes = [v("button", {
            key: "filter-summary",
            ui: ["elg", "d-inline-block", "text-start", "text-primary", "text-ellipsis", "no-underline", "w-100", "px-1", "py-0", "border-0", "bg-transparent"],
            type: "button",
            ariaLabel: filterText ? this.messages.text("dataGrid.editFilterExpression", { filter: filterText }) : this.messages.text("dataGrid.addFilter"),
            title: filterText || this.messages.text("dataGrid.addFilter"),
            onclick: (event: MouseEvent, button: HTMLButtonElement) => {
                event.preventDefault();
                event.stopPropagation();
                this.openFilterEditorFromSummary(button);
            }
        }, filterText || this.messages.text("dataGrid.addFilter"))];
    };

    private applyCellState = (props: any, gridRow: GridRow, col: GridColumn<TRow>) => {
        if (this._draggingColIndex === col.visibleIndex)
            props.className += " elg-column-dragging";

        const selectionColIndex = col.type === "data" ? col.visibleIndex - this.rowHeaderOffset : 0;
        if (this.isSelectableGridRow(gridRow) && col.type === "data") {
            const state = this._selection.getSelectionState(
                gridRow.visibleIndex, selectionColIndex, this.getSelectionContext()
            );
            if (state.selected) {
                props.className += " elg-selected-cell";
                for (const side of state.edges) props.className += " elg-selected-cell-" + side;
            }
        }
        if (this.isSelectableGridRow(gridRow)
            && this._selection.isWholeRowSelected(gridRow.visibleIndex)
            && col.type === "rowheader")
            props.className += " elg-selected-row-header";
        if (this.isSelectableGridRow(gridRow)
            && col.type === "data"
            && this._selection.isActive(gridRow.visibleIndex, selectionColIndex))
            props.className += " elg-active-cell";
    };

    /** Keeps empty grid cells at the normal line height without affecting real content or VNodes. */
    private ensureCellContent = (props: any) => {
        const hasVNodes = Array.isArray(props.vnodes)
            && props.vnodes.some((node: any) => node !== null && node !== undefined && node !== "");
        const hasText = typeof props.textContent === "string"
            ? props.textContent.length > 0
            : props.textContent !== undefined && props.textContent !== null;
        const hasHtml = typeof props.innerHTML === "string" && props.innerHTML.length > 0;

        if (!hasVNodes && !hasText && !hasHtml)
            props.textContent = "\u00A0";
    };

    private getCellView = (
        gridRow: GridRow,
        col: GridColumn<TRow>): CellView<TRow> => {

        const props = this.createCellProps(col);

        switch (gridRow.type) {

            case "group":
            case "data":
            case "new":
            case "node":
            case "summary":
                this.applyDataCell(props, gridRow, col);
                break;

            case "header":
                this.applyHeaderCell(props, col);
                break;

            case "footer":
                this.applyDataCell(props, gridRow, col);
                break;
            case "filter":
                this.applyFilterCell(props, col);
                break;

            default:
                // loading / empty / error / detail rows: still show a row number, placeholder data cell.
                if (col.type == "rowheader") props.textContent = this.getCellText(gridRow, col);
                break;
        }

        this.ensureCellContent(props);
        this.applyCellState(props, gridRow, col);

        return { col, props };
    }

    private resizeColumn = (e: MouseEvent | TouchEvent, col: GridColumn<TRow>) => {

        if (e instanceof MouseEvent && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        this._cancelActiveResize?.();
        this.dom.classList.add("elg-data-grid-resizing");

        const mode = this._gridOptions.columnWidthMode!;
        const resizeMode = this._gridOptions.columnResizeMode ?? (mode === "fixed" ? "independent" : "next-column");
        const columns = this._gridColumns.filter(item => item.type === "data");
        const next = resizeMode === "next-column" ? columns[columns.indexOf(col) + 1] : undefined;
        const affected = next ? [col, next] : [col];
        const start = affected.map(item => ({ column: item, width: item.width,
            naturalWidth: item.naturalWidth, isAutoWidth: item.isAutoWidth }));
        const previousLayout = this._columnResizeLayout;
        const layout = { viewportWidth: this._viewportWidth || this._tableContainer.clientWidth,
            mode, widths: new Map(columns.map(item => [item.dataColumn!.name, item.width])) };
        let moved = false;

        let cancelResize: (() => void) | undefined;
        const clearResize = () => {
            if (this._cancelActiveResize === cancelResize)
                this._cancelActiveResize = undefined;
        };

        cancelResize = trackGesture(e, {
            axis: "x",
            onMove: (dx) => {
                // Bound the pair as one delta: its total stays constant and both widths remain valid.
                // Existing widths beyond the interactive limit must not jump on the first movement.
                let lower = Math.min(0, 40 - start[0].width);
                let upper = Math.max(0, 800 - start[0].width);
                if (next) {
                    lower = Math.max(lower, start[1].width - Math.max(800, start[1].width));
                    upper = Math.min(upper, start[1].width - Math.min(40, start[1].width));
                }
                const delta = Math.max(lower, Math.min(upper, Math.round(dx)));
                if (!delta && !moved) return;
                moved = true;
                for (let index = 0; index < start.length; index++) {
                    const item = start[index];
                    const width = item.width + (index === 0 ? delta : -delta);
                    layout.widths.set(item.column.dataColumn!.name, width);
                    item.column.isAutoWidth = false;
                    // Keep stretch-all weights in their original coordinate system. For a pair,
                    // the combined weight stays constant, so ordinary fill produces this exact split.
                    const scale = mode === "stretch-all" && item.naturalWidth > 0 ? item.width / item.naturalWidth : 1;
                    item.column.naturalWidth = width / scale;
                }
                this._columnResizeLayout = layout;
                this.redistributeColumnWidths();
                this.refresh();
            },
            onEnd: () => {
                if (moved) {
                    // Persist only affected baselines. Other columns retain their configured widths
                    // and automatic eligibility. The visible split remains stable after mouseup.
                    for (const item of affected) item.dataColumn!.width = Math.max(1, item.naturalWidth
                        - (item.groupIndex >= 0 ? (item.groupIndex + 1) * this._groupPadding : 0));
                }
                this.dom.classList.remove("elg-data-grid-resizing");
                clearResize();
            },
            onCancel: () => {
                for (const item of start) {
                    item.column.width = item.width;
                    item.column.naturalWidth = item.naturalWidth;
                    item.column.isAutoWidth = item.isAutoWidth;
                }
                this._columnResizeLayout = previousLayout;
                this.redistributeColumnWidths();
                this.refresh();
                this.dom.classList.remove("elg-data-grid-resizing");
                clearResize();
            }
        });
        this._cancelActiveResize = cancelResize;
    }

    /** Releases grid-owned interaction controllers and active gestures. */
    public override dispose(): void {
        this._messageSubscriptions.forEach(subscription => subscription.dispose()); this._messageSubscriptions = [];
        this._localizationChanged?.dispose(); this._localizationChanged = undefined;
        this.cellNavigating.dispose();
        const cellCompletion = this._cellEditor?.editor.busy ? this._cellEditor.finish() : Promise.resolve();
        this._editVersion++;
        this._rowsVersion++;
        this._gridRows?.dispose();
        this._openingEdit = false; this._pendingEditText = undefined;
        this._sourceChanged?.dispose(); this._sourceChanged = undefined;
        this._cellEditor?.dispose(); this._cellEditor = undefined;
        const sessions = [...this._newRowSessions];
        this._newRowSessions = [];
        this._newRowSession = undefined;
        void Promise.allSettled([this._newRowOperation, cellCompletion, this._pasteOperation]).then(async () => {
            await Promise.all(sessions.map(async session => {
                try { if (session.state === "pending") await session.cancel(); }
                catch (error) { console.error("Failed to cancel the disposed grid's pending row.", error); }
            }));
        });
        this._invalidCellInputs.clear(); this._pendingRowErrors.clear();
        this._cancelActiveResize?.();
        this._cancelActiveResize = undefined;
        this.dom.classList.remove("elg-data-grid-resizing", "elg-data-grid-dragging");
        super.dispose();
    }

    private startColumnDrag = (e: MouseEvent | TouchEvent, headerTd: HTMLTableCellElement, col: GridColumn<TRow>) => {

        if (e instanceof MouseEvent && e.button !== 0) return;
        if (!col.dataColumn) return;

        const sourceIndex = this._gridColumns.filter(c => c.type == "data").indexOf(col);
        this._draggingColIndex = col.visibleIndex;
        this.dom.classList.add("elg-data-grid-dragging");
        headerTd.classList.add("elg-column-dragging");

        let dragMoved = false;
        headerTd.dataset["dragMoved"] = "false";
        this._dragDrop.beginDrag(
            {
                kind: "column",
                id: col.dataColumn.name,
                label: col.dataColumn.caption ?? col.dataColumn.name,
                ghostClassName: "elg-box elg-data-grid-drag-ghost",
                ghostSize: "content",
                sourceZoneId: "grid-header",
                sourceIndex
            },
            e,
            headerTd.getBoundingClientRect(),
            "x",
            () => {
                this._draggingColIndex = -1;
                this.dom.classList.remove("elg-data-grid-dragging");
                headerTd.classList.remove("elg-column-dragging");
                if (dragMoved) this.refresh();
            },
            () => {
                dragMoved = true;
                headerTd.dataset["dragMoved"] = "true";
            }
        );
    }

    private startGroupChipDrag = (e: MouseEvent | TouchEvent, chipEl: HTMLElement, columnName: string, sourceIndex: number) => {

        if (e instanceof MouseEvent && e.button !== 0) return;

        const col = this._columnsIndex.get(columnName);
        if (!col) return;

        this._activeGroupColumn = columnName;
        this.dom.classList.add("elg-data-grid-dragging");
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
                ghostClassName: "elg-box elg-data-grid-drag-ghost",
                ghostSize: "content",
                sourceZoneId: "group-panel",
                sourceIndex
            },
            e,
            anchorRect,
            "x",
            () => {
                this._activeGroupColumn = undefined;
                this.dom.classList.remove("elg-data-grid-dragging");
                chipEl.classList.remove("elg-column-dragging");
                if (dragMoved) this.refresh();
            },
            () => {
                dragMoved = true;
            }
        );
    }

    private async removeGroupColumn(name: string) {
        if (this._openingEdit || !await this.finishActiveRowEdit()) return;
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
     * re-buckets in memory). Query changes reset expansion; mutations/replay transfer
     * an independent group snapshot before disposing the old provider. Selection and
     * scroll restoration are separate from this group-expansion snapshot.
     */
    private reloadRows(preserveExpansion = false) {
        const expansion = preserveExpansion ? this._gridRows.getExpansionState() : undefined;
        this._gridRows = this.createGridRows(expansion);
        this.refresh();
    }

    /**
     * Applies a completed column drag: repositions within _gridColumns when dropped on the header,
     * or adds/reorders _groupColumns when dropped on the group panel. Triggers a real row reload
     * when the grouping actually changed.
     */
    private handleColumnDrop = async (payload: DragPayload, target: DropTarget) => {
        if (this._openingEdit || !await this.finishActiveRowEdit()) return;

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
            setElementProps(cellElements[i], cells[i].props);
        }

        // Remove excess cells
        while (ix < row.tr.cells.length)
            row.tr?.removeChild(row.tr.cells[ix]);

        setElementProps(row.tr, {
            class: "elg-data-grid-row elg-data-grid-row-" + row.gridRow.type
                + (row.gridRow.type === "new" && row.gridRow.data !== undefined ? " elg-data-grid-row-pending" : "")
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
            tr.classList.add("elg-data-grid-row-sticky");
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
                    cells: {},
                    data: { totalSummary: this._totalSummary }
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
        // The shared thead contains column/filter headers and every rendered sticky
        // group/node row. Keep the scrollbar's hit area below the entire section.
        // The grouping panel is outside this scroll viewport, so it needs no inset.
        this._scrollEngine.verticalScrollbarTop = headerHeight;
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

        if (this._isHierarchicalData || this._gridOptions.showGroupPanel === false) {
            setElementProps(this._headerPanel, { class: "elg-data-grid-header", style: { display: "none" }, vnodes: [] });
            return;
        }

        const props: ElementProps<HTMLElement> = {
            class: "elg-data-grid-header",
            vnodes: []
        };

        // Render group chips or empty text if no group columns are defined.

        const groupColumns = this._gridOptions.groupColumns!;

        if (groupColumns.length === 0) {
            props.vnodes!.push(v("span", {
                class: "elg-data-grid-header-empty"
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
                        class: "elg-data-grid-cell" + (this._activeGroupColumn === cn ? " elg-column-dragging" : ""),
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
                    v("span", this.getColumnHeaderText(col)),
                    showSortOrder
                        ? v("span", {
                            textContent: String(sortOrder),
                            ui: ["ms-1", "text-muted", "fs-80"],
                            ariaLabel: this.messages.text("dataGrid.sortPriority", { priority: sortOrder })
                        })
                        : null,
                    sortDirection
                        ? v("i", {
                            class: sortDirection === "asc" ? "ri-arrow-up-line" : "ri-arrow-down-line",
                            ui: ["ms-1", "text-muted"],
                            ariaLabel: sortDirection === "asc" ? this.messages.text("dataGrid.sortedAscending") : this.messages.text("dataGrid.sortedDescending")
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
     * Distributes spare width among eligible data columns according to columnWidthMode,
     * scaled from each column's naturalWidth baseline - never
     * from the current (possibly already-scaled) width, which would drift on repeated calls. Pure
     * width mutation; callers are responsible for triggering a render afterward.
     */
    private redistributeColumnWidths() {

        const mode = this._gridOptions.columnWidthMode ?? "stretch-auto";
        const viewportWidth = this._viewportWidth || this._tableContainer.clientWidth;
        const layout = this._columnResizeLayout;
        if (layout && layout.mode === mode && layout.viewportWidth === viewportWidth) {
            for (const col of this._gridColumns) if (col.type === "data")
                col.width = layout.widths.get(col.dataColumn!.name) ?? col.naturalWidth;
            return;
        }
        this._columnResizeLayout = undefined;
        for (const col of this._gridColumns) col.width = col.naturalWidth;
        if (mode === "fixed") return;
        const stretchColumns = this._gridColumns.filter(c => c.type === "data"
            && (mode === "stretch-all" || c.isAutoWidth));
        if (!stretchColumns.length) return;

        // Falls back to a direct (one-time) measurement if the ResizeObserver-driven _viewportWidth
        // hasn't reported yet - avoids a first-paint flash of unstretched columns.
        const fixedTotal = this._gridColumns
            .filter(c => !stretchColumns.includes(c))
            .reduce((sum, c) => sum + c.width, 0);
        const naturalTotal = stretchColumns.reduce((sum, c) => sum + c.naturalWidth, 0);
        const available = viewportWidth - fixedTotal;

        const scale = naturalTotal > 0 && available > naturalTotal ? available / naturalTotal : 1;
        for (const col of stretchColumns) {
            col.width = col.naturalWidth * scale;
        }
    }

    private renderColGroup = () => {

        this.redistributeColumnWidths();

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











