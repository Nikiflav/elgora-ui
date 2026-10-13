import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectionManager, type GridContext, type SelectionMode } from "../../src/components/datagrid/SelectionManager";
import { DataGrid } from "../../src/components/datagrid/DataGrid";

const context: GridContext = { totalRows: 10, columns: ["id", "name", "amount"] };
afterEach(() => vi.unstubAllGlobals());
const key = (manager: SelectionManager, key: string, shiftKey = false, ctx = context) =>
    manager.handleKeyDown(new KeyboardEvent("keydown", { key, shiftKey }), ctx);
const rows = (manager: SelectionManager) => Array.from({ length: 10 }, (_, row) => row)
    .filter(row => manager.isWholeRowSelected(row));

describe("Selection modes", () => {
    it("defaults to existing mixed cell and row-header selection", () => {
        const manager = new SelectionManager();
        expect(manager.mode).toBe("multiple-cells");
        manager.selectSingleCell(2, 1);
        manager.extendSelection(4, 2);
        expect(manager.isSelected(3, 1)).toBe(true);
        expect(manager.isSelected(3, 0)).toBe(false);
        manager.handleRowHeaderClick(5, { shiftKey: false });
        expect(rows(manager)).toEqual([5]);
    });

    it.each(["single-row", "multiple-rows"] as SelectionMode[])("converts programmatic cells to whole rows in %s", mode => {
        const manager = new SelectionManager(mode);
        manager.selectSingleCell(2, 2);
        expect(manager.getActiveCell()).toMatchObject({ rowIndex: 2, colIndex: 2 });
        expect(rows(manager)).toEqual([2]);
        expect(manager.isSelected(2, 0)).toBe(true);
        expect(manager.getSelectionState(2, 0, context).edges).toContain("l");
        expect(manager.getSelectionState(2, 2, context).edges).toContain("r");
    });

    it.each(["addRange", "extendSelection", "addRowRange", "extendRowSelection"] as const)(
        "single-row constrains programmatic %s", method => {
            const manager = new SelectionManager("single-row");
            manager.selectSingleCell(1, 2);
            manager[method](5, 1);
            expect(rows(manager)).toEqual([5]);
            expect(manager.getRanges()).toHaveLength(1);
        });

    it("multiple-rows preserves disjoint row ranges and extension", () => {
        const manager = new SelectionManager("multiple-rows");
        manager.selectSingleCell(1, 2);
        manager.addRange(4, 1);
        manager.extendSelection(6, 2);
        expect(rows(manager)).toEqual([1, 4, 5, 6]);
        expect(manager.getActiveCell()).toMatchObject({ rowIndex: 4, colIndex: 1 });
    });

    it("single-row ignores multiplicity modifiers on cell and row-header clicks", () => {
        const manager = new SelectionManager("single-row");
        manager.handleCellClick(1, 2, { shiftKey: false });
        manager.handleCellClick(4, 1, { shiftKey: true });
        expect(rows(manager)).toEqual([4]);
        manager.handleCellClick(7, 2, { shiftKey: false, ctrlKey: true });
        expect(rows(manager)).toEqual([7]);
        manager.handleRowHeaderClick(3, { shiftKey: false, metaKey: true });
        expect(rows(manager)).toEqual([3]);
        manager.handleRowHeaderClick(6, { shiftKey: true });
        expect(rows(manager)).toEqual([6]);
    });

    it("multiple-rows uses Ctrl/Cmd and Shift for whole-row ranges", () => {
        const manager = new SelectionManager("multiple-rows");
        manager.handleCellClick(1, 2, { shiftKey: false });
        manager.handleCellClick(4, 1, { shiftKey: false, metaKey: true });
        manager.handleCellClick(6, 2, { shiftKey: true });
        expect(rows(manager)).toEqual([1, 4, 5, 6]);
    });

    it.each(["single-row", "multiple-rows"] as SelectionMode[])("constrains pointer drag in %s", mode => {
        const manager = new SelectionManager(mode);
        manager.selectSingleCell(2, 2);
        manager.handleCellMouseEnter(5, 0, false);
        expect(rows(manager)).toEqual([2]);
        manager.handleCellMouseEnter(5, 0, true);
        expect(rows(manager)).toEqual(mode === "single-row" ? [5] : [2, 3, 4, 5]);
    });

    it("single-row keyboard preserves the active column while replacing row selection", () => {
        const manager = new SelectionManager("single-row");
        manager.selectSingleCell(2, 1);
        key(manager, "ArrowDown", true);
        expect(rows(manager)).toEqual([3]);
        expect(manager.getActiveCell()).toMatchObject({ rowIndex: 3, colIndex: 1 });
        key(manager, "ArrowRight", true);
        expect(rows(manager)).toEqual([3]);
        expect(manager.getActiveCell()!.colIndex).toBe(2);
        key(manager, "Enter");
        expect(rows(manager)).toEqual([4]);
        key(manager, "Tab");
        expect(rows(manager)).toEqual([5]);
        expect(manager.getActiveCell()!.colIndex).toBe(0);
        key(manager, "Tab", true);
        expect(rows(manager)).toEqual([4]);
        expect(manager.getActiveCell()!.colIndex).toBe(2);
    });

    it("multiple-rows extends and shrinks with Shift arrows and collapses with normal arrows", () => {
        const manager = new SelectionManager("multiple-rows");
        manager.selectSingleCell(2, 1);
        key(manager, "ArrowDown", true);
        key(manager, "ArrowDown", true);
        expect(rows(manager)).toEqual([2, 3, 4]);
        expect(manager.getActiveCell()).toMatchObject({ rowIndex: 4, colIndex: 1 });
        key(manager, "ArrowUp", true);
        expect(rows(manager)).toEqual([2, 3]);
        key(manager, "ArrowRight", true);
        expect(rows(manager)).toEqual([2, 3]);
        key(manager, "ArrowDown");
        expect(rows(manager)).toEqual([4]);
    });

    it.each(["single-row", "multiple-rows"] as SelectionMode[])("skips unselectable rows and respects boundaries in %s", mode => {
        const manager = new SelectionManager(mode);
        const ctx = { ...context, isRowSelectable: (row: number) => row !== 3 };
        manager.selectSingleCell(2, 2);
        key(manager, "ArrowDown", false, ctx);
        expect(rows(manager)).toEqual([4]);
        manager.selectSingleCell(9, 2);
        key(manager, "ArrowDown", false, ctx);
        key(manager, "Tab", false, ctx);
        expect(rows(manager)).toEqual([9]);
        expect(key(manager, "a")).toBe(false);
    });

    it("normalizes existing ranges when changing modes without moving active coordinates", () => {
        const manager = new SelectionManager();
        manager.selectSingleCell(1, 1);
        manager.extendSelection(3, 2);
        manager.addRange(6, 2);
        manager.setMode("multiple-rows");
        expect(rows(manager)).toEqual([1, 2, 3, 6]);
        manager.setMode("single-row");
        expect(rows(manager)).toEqual([6]);
        expect(manager.getActiveCell()).toMatchObject({ rowIndex: 6, colIndex: 2 });
        manager.setMode("multiple-cells");
        manager.selectSingleCell(4, 1);
        expect(manager.isSelected(4, 0)).toBe(false);
    });

    it("does not select when moving active coordinates alone; returned state cannot mutate internals", () => {
        const manager = new SelectionManager("single-row");
        manager.selectSingleCell(2, 1);
        manager.setActiveCell(5, 2);
        expect(rows(manager)).toEqual([2]);
        manager.getActiveCell()!.rowIndex = 8;
        manager.getRanges()[0].anchor.wholeRow = false;
        expect(manager.getActiveCell()!.rowIndex).toBe(5);
        expect(rows(manager)).toEqual([2]);
        manager.clear();
        manager.setMode("multiple-rows");
        expect(manager.getRanges()).toEqual([]);
        expect(manager.getActiveCell()).toBeNull();
    });

    it("DataGrid applies initial and changed modes to its exposed manager", () => {
        vi.stubGlobal("ResizeObserver", class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        });
        const grid = new DataGrid({ columns: [{ name: "id" }], data: [{ id: 1 }], selectionMode: "multiple-rows" });
        const manager = grid.getSelectionManager();
        expect(manager.mode).toBe("multiple-rows");
        manager.selectSingleCell(0, 0);
        manager.addRange(2, 0);
        grid.setOptions({ selectionMode: "single-row" });
        expect(rows(manager)).toEqual([2]);
        expect(grid.getOptions().selectionMode).toBe("single-row");
        grid.dispose();
    });
});
