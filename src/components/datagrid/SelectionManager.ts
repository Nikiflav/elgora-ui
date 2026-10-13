/** Selection granularity and multiplicity; active coordinates always remain a cell. */
export type SelectionMode = "single-row" | "multiple-rows" | "multiple-cells";

/** Coordinates and selection metadata for a visible grid cell. */
export interface SelectionCell {
    /** The actual visual row index on screen at the moment of selection */
    rowIndex: number;
    /** Visual column index on screen at the moment of selection */
    colIndex: number;
    wholeRow?: boolean;
}

/** Rectangular range between an anchor cell and a focus cell. */
export interface SelectionRange {
    /** The origin cell where interaction (mouse down / click) started for this box */
    anchor: SelectionCell;
    /** The outer edge cell extended by mouse drag or Shift+Click/Arrows */
    focus: SelectionCell;
}

/** Grid callbacks and dimensions used by selection navigation. */
export interface GridContext {
    totalRows: number;
    columns: string[];
    isRowSelectable?: (rowIndex: number) => boolean;
    findNextSelectableRow?: (rowIndex: number, direction: 1 | -1) => number;
}

/**
 * The cardinal sides of a selection box a selected cell can sit on.
 * A cell is marked with every side it touches (e.g. a lone cell is on all four,
 * a single-row selection marks its cells as both top and bottom), so the renderer
 * can paint a complete border around any selection shape.
 */
export type SelectionEdge = "t" | "r" | "b" | "l";

/** Render state for a cell participating in one or more selection ranges. */
export interface CellSelectionState {
    /** Whether the cell falls inside any active selection range. */
    selected: boolean;
    /** The selection-box sides the cell sits on; empty array for interior cells. */
    edges: SelectionEdge[];
}

/** Manages keyboard, pointer, and range-based grid selection state. */
export class SelectionManager {
    private _ranges: SelectionRange[] = [];
    private _activeCell: SelectionCell | null = null;
    private _mode: SelectionMode;

    /** Creates a manager; cell ranges are the backward-compatible default. */
    constructor(mode: SelectionMode = "multiple-cells") { this._mode = mode; }

    /** Current selection rules, applied to pointer, keyboard and programmatic edits. */
    get mode(): SelectionMode { return this._mode; }

    /**
     * Changes the rules and normalizes existing ranges without moving the active cell.
     * Switching to single-row retains the active row; switching to multiple-rows
     * expands each rectangle to whole rows. Cell mode also permits row-header ranges.
     * @example manager.setMode("single-row");
     */
    setMode(mode: SelectionMode): void {
        if (mode === this._mode) return;
        this._mode = mode;
        this.normalizeRanges();
    }

    /** Enforces selection invariants after every range mutation. */
    private normalizeRanges(): void {
        if (this._mode === "multiple-cells" || !this._ranges.length) return;
        if (this._mode === "single-row") {
            const cell = { ...(this._activeCell ?? this._ranges[this._ranges.length - 1].focus), wholeRow: true };
            this._ranges = [{ anchor: cell, focus: { ...cell } }];
        } else {
            this._ranges = this._ranges.map(range => ({
                anchor: { ...range.anchor, wholeRow: true },
                focus: { ...range.focus, wholeRow: true }
            }));
        }
    }



    // =========================================================================
    // SELECTION MANIPULATION METHODS
    // =========================================================================

    /**
     * Sets a single range, clearing all existing ranges.
     */
    public selectSingleCell(rowIndex: number, colIndex: number): void {
        const cell: SelectionCell = { rowIndex, colIndex };

        this._ranges = [{ anchor: cell, focus: cell }];
        this._activeCell = cell;
        this.normalizeRanges();
    }

    public selectSingleRow(rowIndex: number): void {
        const cell: SelectionCell = { rowIndex, colIndex: 0, wholeRow: true };
        this._ranges = [{ anchor: cell, focus: { ...cell } }];
        this._activeCell = { ...cell };
        this.normalizeRanges();
    }

    public addRowRange(rowIndex: number): void {
        if (this._mode === "single-row") { this.selectSingleRow(rowIndex); return; }
        const cell: SelectionCell = { rowIndex, colIndex: 0, wholeRow: true };
        this._ranges.push({ anchor: cell, focus: { ...cell } });
        this._activeCell = { ...cell };
        this.normalizeRanges();
    }

    public extendRowSelection(rowIndex: number): void {
        if (this._mode === "single-row") {
            this.selectSingleCell(rowIndex, this._activeCell?.colIndex ?? 0);
            return;
        }
        if (!this._ranges.length || !this._ranges[this._ranges.length - 1].anchor.wholeRow) {
            this.selectSingleRow(rowIndex);
            return;
        }
        const focus = { rowIndex, colIndex: 0, wholeRow: true };
        this._ranges[this._ranges.length - 1].focus = focus;
        this.normalizeRanges();
        // Keep the anchor as the active cell while the pointer extends the range.
        // The active cell represents the cell where the gesture started, not its current edge.
    }

    /**
     * Appends a new disjoint range (Ctrl / Cmd + Click).
     */
    public addRange(rowIndex: number, colIndex: number): void {
        if (this._mode === "single-row") { this.selectSingleCell(rowIndex, colIndex); return; }
        const cell: SelectionCell = { rowIndex, colIndex };

        this._ranges.push({ anchor: cell, focus: cell });
        this._activeCell = cell;
        this.normalizeRanges();
    }

    /**
     * Extends the focus edge of the current (last added) range (Shift + Click / Drag).
     */
    public extendSelection(rowIndex: number, colIndex: number): void {
        if (this._mode === "single-row") { this.selectSingleCell(rowIndex, colIndex); return; }
        if (this._ranges.length === 0) {
            this.selectSingleCell(rowIndex, colIndex);
            return;
        }

        const focusCell: SelectionCell = { rowIndex, colIndex };

        // Update focus of the latest active range box
        const currentRange = this._ranges[this._ranges.length - 1];
        currentRange.focus = focusCell;
        this.normalizeRanges();
        // Keep the original anchor active during mouse drag / Shift+Click.
        // Keyboard navigation explicitly changes the active cell when required.
    }

    /**
     * Moves ONLY the activeCell inside existing selection ranges (e.g., Tab / Enter navigation).
     * Does not alter anchor or focus boundaries of any range.
     */
    public setActiveCell(rowIndex: number, colIndex: number): void {
        this._activeCell = { rowIndex, colIndex };
    }

    // =========================================================================
    // EVENT HELPERS (Mouse & Keyboard)
    // =========================================================================

    /**
     * Handles MouseDown or Click events on a cell.
     */
    public handleCellClick(
        rowIndex: number,
        colIndex: number,
        event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean }
    ): void {
        const isMultiKey = !!(event.ctrlKey || event.metaKey);

        if (event.shiftKey && this._ranges.length > 0) {
            // Shift + Click: Extend focus of current range
            this.extendSelection(rowIndex, colIndex);
        } else if (isMultiKey) {
            // Ctrl/Cmd + Click: Add new disjoint range
            this.addRange(rowIndex, colIndex);
        } else {
            // Normal Click: Replace all ranges with a single new range
            this.selectSingleCell(rowIndex, colIndex);
        }
    }

    public handleRowHeaderClick(
        rowIndex: number,
        event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean }
    ): void {
        const isMultiKey = !!(event.ctrlKey || event.metaKey);
        if (event.shiftKey && this._ranges.length > 0 && this._ranges[this._ranges.length - 1].anchor.wholeRow) {
            this.extendRowSelection(rowIndex);
        } else if (isMultiKey) {
            this.addRowRange(rowIndex);
        } else {
            this.selectSingleRow(rowIndex);
        }
    }

    /**
     * Handles MouseMove events when dragging to extend the selection range.
     */
    public handleCellMouseEnter(
        rowIndex: number,
        colIndex: number,
        isMouseDown: boolean
    ): void {
        if (isMouseDown) {
            this.extendSelection(rowIndex, colIndex);
        }
    }

    /**
     * Handles Keyboard Navigation (Arrow Keys, Shift+Arrows, Tab, Enter).
     * Returns true if the key event was handled by selection.
     */
    public handleKeyDown(event: KeyboardEvent, ctx: GridContext): boolean {
        if (!this._activeCell || this._ranges.length === 0) return false;
        if (this._mode !== "multiple-cells") return this.handleRowKeyDown(event, ctx);

        const { key, shiftKey } = event;
        const lastRange = this._ranges[this._ranges.length - 1];
        const currentFocus = lastRange.focus;
        const currentActive = this._activeCell;
        const colIdx = currentFocus.colIndex;

        let targetRow = currentFocus.rowIndex;
        let targetColIdx = colIdx;

        // 1. Shift + Arrow Navigation (Extends active selection range focus)
        if (shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            if (lastRange.anchor.wholeRow && (key === 'ArrowUp' || key === 'ArrowDown')) {
                const direction = key === 'ArrowUp' ? -1 : 1;
                const target = this.findSelectableRow(currentFocus.rowIndex, direction, ctx);
                this.extendRowSelection(target);
                return true;
            }
            if (key === 'ArrowUp') targetRow = this.findSelectableRow(targetRow, -1, ctx);
            if (key === 'ArrowDown') targetRow = this.findSelectableRow(targetRow, 1, ctx);
            if (key === 'ArrowLeft') targetColIdx = Math.max(0, targetColIdx - 1);
            if (key === 'ArrowRight') targetColIdx = Math.min(ctx.columns.length - 1, targetColIdx + 1);

            this.extendSelection(targetRow, targetColIdx);
            return true;
        }

        targetColIdx = currentActive.colIndex;
        targetRow = currentActive.rowIndex;

        // 2. Standard Arrow Navigation (Clears ranges and collapses to single active cell)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            if (lastRange.anchor.wholeRow && (key === 'ArrowUp' || key === 'ArrowDown')) {
                const direction = key === 'ArrowUp' ? -1 : 1;
                const target = this.findSelectableRow(targetRow, direction, ctx);
                this.selectSingleRow(target);
                return true;
            }
            if (key === 'ArrowUp') targetRow = this.findSelectableRow(targetRow, -1, ctx);
            if (key === 'ArrowDown') targetRow = this.findSelectableRow(targetRow, 1, ctx);
            if (key === 'ArrowLeft') targetColIdx = Math.max(0, targetColIdx - 1);
            if (key === 'ArrowRight') targetColIdx = Math.min(ctx.columns.length - 1, targetColIdx + 1);

            this.selectSingleCell(targetRow, targetColIdx);
            return true;
        }

        // 3. Tab / Shift+Tab Navigation (Cycles ActiveCell Inside Current Range)
        if (key === 'Tab') {
            if (this.isSingleCellSelection(lastRange)) this.navigateTabAcrossGrid(shiftKey, ctx);
            else this.navigateTab(shiftKey, ctx);
            return true;
        }

        // 4. Enter / Shift+Enter Navigation (Cycles ActiveCell Vertically Inside Current Range)
        if (key === 'Enter') {
            if (this.isSingleCellSelection(lastRange)) this.navigateEnterAcrossGrid(shiftKey, ctx);
            else this.navigateEnter(shiftKey, ctx);
            return true;
        }

        return false;
    }

    /** Navigates active coordinates while creating only mode-compatible row ranges. */
    private handleRowKeyDown(event: KeyboardEvent, ctx: GridContext): boolean {
        const active = this._activeCell!;
        if (event.key === "Tab") {
            this.navigateTabAcrossGrid(event.shiftKey, ctx);
            return true;
        }
        if (event.key === "Enter") {
            this.navigateEnterAcrossGrid(event.shiftKey, ctx);
            return true;
        }
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return false;
        const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
        const direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
        const last = this._ranges[this._ranges.length - 1];
        const origin = event.shiftKey && this._mode === "multiple-rows" ? last.focus.rowIndex : active.rowIndex;
        const row = vertical ? this.findSelectableRow(origin, direction, ctx) : active.rowIndex;
        const col = vertical ? active.colIndex : Math.max(0, Math.min(ctx.columns.length - 1, active.colIndex + direction));
        if (event.shiftKey && this._mode === "multiple-rows") {
            if (vertical) this.extendSelection(row, col);
            this.setActiveCell(row, col);
        } else this.selectSingleCell(row, col);
        return true;
    }

    private findSelectableRow(rowIndex: number, direction: 1 | -1, ctx: GridContext): number {
        if (ctx.findNextSelectableRow) return ctx.findNextSelectableRow(rowIndex, direction);
        let target = rowIndex + direction;
        let checked = 0;
        while (target >= 0 && target < ctx.totalRows && checked < 20) {
            if (!ctx.isRowSelectable || ctx.isRowSelectable(target)) return target;
            target += direction;
            checked++;
        }
        return rowIndex;
    }

    private isSingleCellSelection(range: SelectionRange): boolean {
        return !range.anchor.wholeRow && !range.focus.wholeRow
            && range.anchor.rowIndex === range.focus.rowIndex
            && range.anchor.colIndex === range.focus.colIndex;
    }

    private navigateTabAcrossGrid(shiftKey: boolean, ctx: GridContext): void {
        if (!this._activeCell || ctx.columns.length === 0) return;

        const direction = shiftKey ? -1 : 1;
        let row = this._activeCell.rowIndex;
        let col = this._activeCell.colIndex + direction;

        if (col < 0 || col >= ctx.columns.length) {
            const nextRow = this.findSelectableRow(row, direction, ctx);
            if (nextRow === row) return;
            row = nextRow;
            col = shiftKey ? ctx.columns.length - 1 : 0;
        }

        this.selectSingleCell(row, col);
    }

    private navigateEnterAcrossGrid(shiftKey: boolean, ctx: GridContext): void {
        if (!this._activeCell) return;

        const direction = shiftKey ? -1 : 1;
        const row = this.findSelectableRow(this._activeCell.rowIndex, direction, ctx);
        if (row === this._activeCell.rowIndex) return;

        this.selectSingleCell(row, this._activeCell.colIndex);
    }

    /**
     * Cycles activeCell left/right inside the active selection bounding box on Tab/Shift+Tab.
     */
    private navigateTab(shiftKey: boolean, ctx: GridContext): void {
        if (!this._activeCell || this._ranges.length === 0) return;

        const currentRange = this._ranges[this._ranges.length - 1];
        const { anchor, focus } = currentRange;

        const minRow = Math.min(anchor.rowIndex, focus.rowIndex);
        const maxRow = Math.max(anchor.rowIndex, focus.rowIndex);

        const minColIdx = Math.min(anchor.colIndex, focus.colIndex);
        const maxColIdx = Math.max(anchor.colIndex, focus.colIndex);

        let curRow = this._activeCell.rowIndex;
        let curColIdx = this._activeCell.colIndex;

        if (!shiftKey) {
            // Move Right
            curColIdx++;
            if (curColIdx > maxColIdx) {
                curColIdx = minColIdx;
                curRow++;
                if (curRow > maxRow) curRow = minRow; // Wrap to top-left
            }
        } else {
            // Move Left
            curColIdx--;
            if (curColIdx < minColIdx) {
                curColIdx = maxColIdx;
                curRow--;
                if (curRow < minRow) curRow = maxRow; // Wrap to bottom-right
            }
        }

        this.setActiveCell(curRow, curColIdx);
    }

    /**
     * Cycles activeCell up/down inside the active selection bounding box on Enter/Shift+Enter.
     */
    private navigateEnter(shiftKey: boolean, ctx: GridContext): void {
        if (!this._activeCell || this._ranges.length === 0) return;

        const currentRange = this._ranges[this._ranges.length - 1];
        const { anchor, focus } = currentRange;

        const minRow = Math.min(anchor.rowIndex, focus.rowIndex);
        const maxRow = Math.max(anchor.rowIndex, focus.rowIndex);

        const minColIdx = Math.min(anchor.colIndex, focus.colIndex);
        const maxColIdx = Math.max(anchor.colIndex, focus.colIndex);

        let curRow = this._activeCell.rowIndex;
        let curColIdx = this._activeCell.colIndex;

        if (!shiftKey) {
            // Move Down
            curRow++;
            if (curRow > maxRow) {
                curRow = minRow;
                curColIdx++;
                if (curColIdx > maxColIdx) curColIdx = minColIdx; // Wrap to top-left
            }
        } else {
            // Move Up
            curRow--;
            if (curRow < minRow) {
                curRow = maxRow;
                curColIdx--;
                if (curColIdx < minColIdx) curColIdx = maxColIdx; // Wrap to bottom-right
            }
        }

        this.setActiveCell(curRow, curColIdx);
    }

    // =========================================================================
    // QUERIES & STATE CHECKS
    // =========================================================================

    /**
     * Checks if a cell is the single active focus cell receiving keyboard input & editing.
     */
    public isActive(rowIndex: number, colIndex: number): boolean {
        if (!this._activeCell) return false;


        return this._activeCell.rowIndex === rowIndex && this._activeCell.colIndex === colIndex;
    }

    /**
     * 2D hit test checking if a cell at (rowIndex, colIndex) falls inside ANY active range.
     */
    public isSelected(rowIndex: number, colIndex: number): boolean {
        if (this._ranges.length === 0) return false;

        for (const range of this._ranges) {
            const { anchor, focus } = range;

            const minRow = Math.min(anchor.rowIndex, focus.rowIndex);
            const maxRow = Math.max(anchor.rowIndex, focus.rowIndex);

            if (rowIndex >= minRow && rowIndex <= maxRow) {
                if (anchor.wholeRow || focus.wholeRow) return true;
                const minCol = Math.min(anchor.colIndex, focus.colIndex);
                const maxCol = Math.max(anchor.colIndex, focus.colIndex);

                if (colIndex >= minCol && colIndex <= maxCol) {
                    return true;
                }
            }
        }

        return false;
    }

    /** 2D hit test that also reports which selection-box sides the cell sits on.
     * A selected cell is marked with every edge it touches (top/right/bottom/left),
     * so thin selections (single row/column/single cell) still get a full border.
     * `ctx` is required to resolve the full column span of whole-row ranges.
     */
    public getSelectionState(
        rowIndex: number,
        colIndex: number,
        ctx?: GridContext
    ): CellSelectionState {
        if (this._ranges.length === 0) return { selected: false, edges: [] };

        for (const range of this._ranges) {
            const { anchor, focus } = range;

            const minRow = Math.min(anchor.rowIndex, focus.rowIndex);
            const maxRow = Math.max(anchor.rowIndex, focus.rowIndex);
            if (rowIndex < minRow || rowIndex > maxRow) continue;

            // Whole-row ranges span every data column.
            let minCol: number;
            let maxCol: number;
            if (anchor.wholeRow || focus.wholeRow) {
                minCol = 0;
                maxCol = (ctx?.columns.length ?? 0) - 1;
            } else {
                minCol = Math.min(anchor.colIndex, focus.colIndex);
                maxCol = Math.max(anchor.colIndex, focus.colIndex);
            }
            if (colIndex < minCol || colIndex > maxCol) continue;

            const edges: SelectionEdge[] = [];
            if (rowIndex === minRow) edges.push("t");
            if (colIndex === maxCol) edges.push("r");
            if (rowIndex === maxRow) edges.push("b");
            if (colIndex === minCol) edges.push("l");

            return { selected: true, edges };
        }

        return { selected: false, edges: [] };
    }

    /**
     * Returns the single active cell receiving keyboard focus and editing.
     */
    public getActiveCell(): SelectionCell | null {
        return this._activeCell ? { ...this._activeCell } : null;
    }

    /**
     * Returns all currently active selection ranges.
     */
    public getRanges(): SelectionRange[] {
        return this._ranges.map(range => ({ anchor: { ...range.anchor }, focus: { ...range.focus } }));
    }

    public isWholeRowSelected(rowIndex: number): boolean {
        return this._ranges.some(range => {
            if (!range.anchor.wholeRow && !range.focus.wholeRow) return false;
            return rowIndex >= Math.min(range.anchor.rowIndex, range.focus.rowIndex)
                && rowIndex <= Math.max(range.anchor.rowIndex, range.focus.rowIndex);
        });
    }

    /**
     * Clears all current ranges and active cell states.
     */
    public clear(): void {
        this._ranges = [];
        this._activeCell = null;
    }


}
