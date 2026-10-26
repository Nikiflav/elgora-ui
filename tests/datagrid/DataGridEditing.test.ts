import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import type { DataSource, MutationResult } from "../../src/data/DataSource";
import { ObservableEvent } from "../../src/core/ElgoraUI";
import { DataSet } from "../../src/data/dataset/DataSet";

type Row = { id: number; name: string; amount: number };
const grids: DataGrid<any>[] = [];
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    // jsdom has no layout; give the virtual viewport room for both fixture rows.
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ font: "", measureText: (value: string) => ({ width: value.length * 8 }) } as any);
});
afterEach(() => { grids.splice(0).forEach(grid => grid.dispose()); document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function create(options: any = {}) {
    const rows: Row[] = [{ id: 1, name: "Alpha", amount: 10 }, { id: 2, name: "Beta", amount: 20 }];
    const grid = new DataGrid<Row>({ data: rows, allowEdit: true, showGroupPanel: false,
        columns: [{ name: "name", dataType: "string" }, { name: "amount", dataType: "number" }], ...options });
    grids.push(grid); grid.mount(document.body); return { grid, rows };
}
function type(grid: DataGrid<any>, value: string) {
    const input = grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!;
    expect(input).not.toBeNull(); input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true })); return input;
}
const settle = () => new Promise(resolve => setTimeout(resolve, 40));
describe("DataGrid cell editing", () => {
    it("preserves expansion across DataTable changes and undo/redo notifications", async () => {
        const dataset = new DataSet();
        const table = dataset.createTable("items", [{ id: 1, name: "Alpha", amount: 10 }, { id: 2, name: "Beta", amount: 20 }]);
        const { grid } = create({ data: table, groupColumns: ["name"], columns: [
            { name: "name", getValue: (row: any) => row.getValue("name") },
            { name: "amount", dataType: "number", getValue: (row: any) => row.getValue("amount") }
        ] });
        await grid.expandAllGroups();
        const saved = grid.getExpansionState();
        await table.rows[0].setValue("amount", 25);
        await (grid as any)._gridRows.load(0, 1);
        expect(grid.getExpansionState()).toEqual(saved);
        await dataset.undoCoordinator.undo();
        await (grid as any)._gridRows.load(0, 1);
        expect(grid.getExpansionState()).toEqual(saved);
        await dataset.undoCoordinator.redo();
        await (grid as any)._gridRows.load(0, 1);
        expect(grid.getExpansionState()).toEqual(saved);
    });

    it("renders buttons columns as actions without starting cell editing", async () => {
        const calls: any[] = [];
        const { grid, rows } = create({ columns: [
            { name: "name", dataType: "string" },
            { name: "amount", dataType: "number" },
            { name: "actions", type: "buttons", buttons: [
                { id: "inspect", text: "Inspect", icon: "ri-eye-line", ui: "btn-ghost", onClick: context => calls.push(context) }
            ] }
        ] });
        await settle();
        const button = grid.dom.querySelector<HTMLButtonElement>(".elg-data-grid-action-button")!;
        expect(button).not.toBeNull();
        button.click();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(calls).toHaveLength(1);
        expect(calls[0].row).toBe(rows[0]);
        expect(calls[0].field.name).toBe("actions");
        expect(grid.dom.querySelector(".elg-data-grid-editor")).toBeNull();
        expect(button.textContent).not.toContain("Inspect");
        expect(button.title).toBe("Inspect");
        expect(button.classList.contains("elg-btn-ghost")).toBe(true);
    });

    it("treats action buttons as separate keyboard targets inside a buttons cell", async () => {
        const { grid } = create({ columns: [
            { name: "name", dataType: "string" },
            { name: "amount", dataType: "number" },
            { name: "actions", type: "buttons", buttons: [
                { id: "inspect", text: "Inspect" },
                { id: "more", text: "More" }
            ] }
        ] });
        await settle();

        const viewport = grid.dom.querySelector<HTMLElement>(".elg-data-grid-viewport")!;
        const buttons = () => Array.from(grid.dom.querySelectorAll<HTMLButtonElement>(".elg-data-grid-action-button"));
        grid.getSelectionManager().selectSingleCell(0, 2);
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await settle();
        expect(document.activeElement).toBe(buttons()[0]);

        const next = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        buttons()[0].dispatchEvent(next);
        await settle();
        expect(next.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(buttons()[1]);

        const last = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        buttons()[1].dispatchEvent(last);
        await settle();
        expect(last.defaultPrevented).toBe(true);
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 0 });

        grid.getSelectionManager().selectSingleCell(0, 2);
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true, cancelable: true }));
        await settle();
        const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
        buttons()[0].dispatchEvent(escape);
        expect(escape.defaultPrevented).toBe(true);
        expect(document.activeElement).toMatchObject({
            getAttribute: expect.any(Function)
        });
        expect((document.activeElement as HTMLElement).getAttribute("data-elg-edit-column")).toBe("actions");
    });

    it("applies column alignment to text and buttons cells", async () => {
        const { grid } = create({ columns: [
            { name: "name", dataType: "string", textAlign: "end" },
            { name: "amount", dataType: "number" },
            { name: "actions", type: "buttons", buttons: [{ id: "inspect", icon: "ri-eye-line" }] },
            { name: "centerActions", type: "buttons", textAlign: "center", buttonVisibility: "always", buttons: [{ id: "inspect", icon: "ri-eye-line" }] }
        ] });
        await settle();

        const cell = (column: string) => grid.dom.querySelector<HTMLElement>(
            `[data-elg-edit-row="0"][data-elg-edit-column="${column}"]`
        )!;
        expect(cell("name").style.textAlign).toBe("right");
        expect(cell("amount").style.textAlign).toBe("right");
        expect(cell("actions").style.textAlign).toBe("right");
        expect(cell("actions").querySelector<HTMLElement>(".elg-data-grid-buttons")?.style.justifyContent).toBe("flex-end");
        expect(cell("actions").querySelector<HTMLElement>(".elg-data-grid-buttons")?.style.paddingRight).toBe("");
        expect(cell("actions").querySelector<HTMLElement>(".elg-data-grid-buttons")?.classList.contains("elg-data-grid-buttons-hover")).toBe(true);
        expect(cell("centerActions").style.textAlign).toBe("center");
        expect(cell("centerActions").querySelector<HTMLElement>(".elg-data-grid-buttons")?.style.justifyContent).toBe("center");
        expect(cell("centerActions").querySelector<HTMLElement>(".elg-data-grid-buttons")?.style.paddingRight).toBe("12px");
        expect(cell("centerActions").querySelector<HTMLElement>(".elg-data-grid-buttons")?.classList.contains("elg-data-grid-buttons-always")).toBe(true);
    });

    it("clears expansion for source and grouped interval changes through public setters", async () => {
        const { grid } = create({ groupColumns: ["name"] });
        await grid.expandAllGroups();
        grid.setColumnOptions("name", { groupInterval: "firstChar" });
        await (grid as any)._gridRows.load(0, 1);
        expect(grid.getExpansionState()).toEqual({ expandedGroupKeys: [] });
        await grid.expandAllGroups();
        expect(grid.getExpansionState().expandedGroupKeys).toEqual(["$/A", "$/B"]);
        grid.setOptions({ columns: [{ name: "name", groupInterval: undefined }, { name: "amount", dataType: "number" }] });
        await (grid as any)._gridRows.load(0, 1);
        expect(grid.getExpansionState()).toEqual({ expandedGroupKeys: [] });
        await grid.expandAllGroups();
        grid.setOptions({ data: [{ id: 3, name: "Alpha", amount: 30 }] });
        await (grid as any)._gridRows.load(0, 1);
        expect(grid.getExpansionState()).toEqual({ expandedGroupKeys: [] });
    });

    it("preserves group expansion after a successful cell edit", async () => {
        const { grid, rows } = create({ groupColumns: ["name"] });
        await grid.expandAllGroups();
        const saved = grid.getExpansionState();
        expect(saved.expandedGroupKeys).toEqual(["$/Alpha", "$/Beta"]);
        expect(await grid.beginEdit(1, "amount")).toBe(true);
        type(grid, "55");
        expect(await grid.endEdit()).toBe(true);
        await (grid as any)._gridRows.load(0, 1);
        expect(rows[0].amount).toBe(55);
        expect(grid.getExpansionState()).toEqual(saved);
        expect((grid as any)._gridRows.count()).toBe(5); // two groups, two data rows and the new-row placeholder
        grid.setOptions({ groupColumns: [] });
        expect(grid.getExpansionState()).toEqual({ expandedGroupKeys: [] });
    });

    it("ignores groups removed by editing and does not implicitly expand a newly created group", async () => {
        const { grid, rows } = create({ groupColumns: ["name"] });
        await grid.expandAllGroups();
        expect(await grid.beginEdit(1, "name")).toBe(true);
        type(grid, "Gamma");
        expect(await grid.endEdit()).toBe(true);
        await (grid as any)._gridRows.load(0, 1);
        expect(rows[0].name).toBe("Gamma");
        expect(grid.getExpansionState()).toEqual({ expandedGroupKeys: ["$/Beta"] });
        expect((grid as any)._gridRows.count()).toBe(4); // Beta + its data, closed Gamma, placeholder
    });

    it("preserves expansion through pending-row updates and insertion reloads", async () => {
        const { grid, rows } = create({ groupColumns: ["name"] });
        await grid.expandAllGroups();
        const saved = grid.getExpansionState();
        expect(await grid.beginEdit((grid as any)._gridRows.count() - 1, "name")).toBe(true);
        type(grid, "Gamma");
        expect(await grid.insertNewRow(grid.newRowSessions[0])).toBe(true);
        await (grid as any)._gridRows.load(0, 1);
        expect(rows).toHaveLength(3);
        expect(grid.getExpansionState()).toEqual(saved);
        expect((grid as any)._gridRows.count()).toBe(6);
    });

    it("cancels post-edit navigation without undoing the save or changing the selected block", async () => {
        const { grid, rows } = create(); const manager = grid.getSelectionManager();
        manager.selectSingleCell(0, 0); manager.extendSelection(1, 1);
        const ranges = grid.getSelectedRanges();
        const handler = vi.fn(event => {
            expect(rows[0].name).toBe("Saved");
            expect(grid.getSelectedRanges()).toEqual(ranges);
            expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
            expect(event.currentCell).toEqual({ rowIndex: 0, colIndex: 0 });
            expect(event.targetCell).toEqual({ rowIndex: 1, colIndex: 0 });
            event.cancel = true;
        });
        grid.cellNavigating.subscribe(handler);
        await grid.beginEdit(); type(grid, "Saved").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(handler).toHaveBeenCalledTimes(1); expect(rows[0].name).toBe("Saved");
        expect(grid.getSelectedRanges()).toEqual(ranges);
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
    });
    it("redirects Tab before selection changes, preserves a containing block, and exposes Shift", async () => {
        const { grid } = create(); const manager = grid.getSelectionManager();
        manager.selectSingleCell(0, 0); manager.extendSelection(1, 1);
        const ranges = grid.getSelectedRanges();
        grid.cellNavigating.subscribe(event => {
            expect(event.key).toBe("Tab"); expect(event.shiftKey).toBe(true);
            expect(event.targetCell).toEqual({ rowIndex: 1, colIndex: 1 });
            event.targetCell = { rowIndex: 1, colIndex: 0 };
        });
        await grid.beginEdit();
        type(grid, "Saved").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 0 });
        expect(grid.getSelectedRanges()).toEqual(ranges);
    });
    it("supports cancellation and redirection in a read-only grid, with disposable subscriptions", async () => {
        const { grid } = create({ allowEdit: false }); await settle();
        grid.getSelectionManager().selectSingleCell(0, 0);
        const handler = vi.fn(event => { event.cancel = true; });
        const subscription = grid.cellNavigating.subscribe(handler);
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        const key = () => new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        const cancelled = key(); viewport.dispatchEvent(cancelled);
        expect(cancelled.defaultPrevented).toBe(true);
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
        subscription.dispose();
        grid.cellNavigating.subscribe(event => { event.targetCell = { rowIndex: 0, colIndex: 1 }; });
        viewport.dispatchEvent(key()); expect(handler).toHaveBeenCalledTimes(1);
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 1 });
        expect(grid.getSelectedRanges()).toEqual([{ anchor: { rowIndex: 0, colIndex: 1 }, focus: { rowIndex: 0, colIndex: 1 } }]);
    });
    it("raises navigation after failed parsing while retaining the rejected input", async () => {
        const { grid } = create(); const handler = vi.fn(); grid.cellNavigating.subscribe(handler);
        grid.getSelectionManager().selectSingleCell(0, 1);
        grid.dom.querySelector(".elg-data-grid-viewport")!
            .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.dom.querySelector(".elg-data-grid-editor input")).not.toBeNull());
        type(grid, "invalid").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(grid.hasValidationErrors).toBe(true);
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it.each([
        { rowIndex: -1, colIndex: 0 }, { rowIndex: 2, colIndex: 0 },
        { rowIndex: 0, colIndex: 2 }, { rowIndex: 0.5, colIndex: 0 },
        { rowIndex: 0, colIndex: NaN }
    ])("treats an invalid redirected destination %j as cancellation", async targetCell => {
        const { grid } = create({ allowEdit: false }); await settle();
        grid.getSelectionManager().selectSingleCell(0, 0);
        grid.cellNavigating.subscribe(event => { event.targetCell = targetCell; });
        grid.dom.querySelector(".elg-data-grid-viewport")!
            .dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
    });
    it("waits for successful asynchronous saving before offering arrow navigation", async () => {
        let resolve!: (result: MutationResult) => void;
        const row = { id: 1, name: "Alpha", amount: 10 };
        const { grid } = create({ data: {
            loadData: async (args: any) => ({ args, dataItems: [row], totalCount: 1 }),
            update: () => new Promise<MutationResult>(done => { resolve = done; })
        } });
        const handler = vi.fn(event => { event.cancel = true; });
        grid.cellNavigating.subscribe(handler);
        await grid.beginEdit(0, "name", "New");
        const input = grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!;
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(resolve).toBeDefined());
        expect(handler).not.toHaveBeenCalled(); expect(grid.editing).toBe(true);
        resolve({ success: true });
        await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
        expect(handler.mock.calls[0][0].key).toBe("ArrowRight");
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
    });
    it.each(["single-row", "multiple-rows"])("normalizes redirected selection in %s mode", async selectionMode => {
        const { grid } = create({ allowEdit: false, selectionMode }); await settle();
        grid.getSelectionManager().selectSingleCell(0, 0);
        grid.cellNavigating.subscribe(event => { event.targetCell = { rowIndex: 1, colIndex: 1 }; });
        grid.dom.querySelector(".elg-data-grid-viewport")!
            .dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        expect(grid.getActiveSelectionCell()).toMatchObject({ rowIndex: 1, colIndex: 1 });
        expect(grid.getSelectedRanges()[0].anchor).toMatchObject({ rowIndex: 1, wholeRow: true });
    });
    it.each(["Enter", "F2"])("starts explicit editing with %s, then Enter confirms without editing the next cell", async key => {
        const { grid, rows } = create(); grid.getSelectionManager().selectSingleCell(0, 0);
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")?.value).toBe("Alpha"));
        const input = type(grid, "Changed");
        const arrow = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
        input.dispatchEvent(arrow); expect(arrow.defaultPrevented).toBe(false);
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(rows[0].name).toBe("Changed");
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 0 });
        expect(grid.dom.querySelector(".elg-data-grid-editor")).toBeNull();
    });
    it.each([
        ["ArrowRight", 0, 0, 0, 1], ["ArrowLeft", 0, 1, 0, 0],
        ["ArrowDown", 0, 0, 1, 0], ["ArrowUp", 1, 0, 0, 0]
    ] as const)("passes the typed character to the editor and confirms before %s navigation", async (key, row, col, nextRow, nextCol) => {
        const { grid, rows } = create(); await settle();
        (grid as any).updateLayout();
        grid.getSelectionManager().selectSingleCell(row, col);
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "7", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")?.value).toBe("7"));
        grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!
            .dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(col === 0 ? rows[row].name : rows[row].amount).toBe(col === 0 ? "7" : 7);
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: nextRow, colIndex: nextCol });
    });
    it("retains a failed replacement while an arrow leaves its cell", async () => {
        const { grid, rows } = create(); await grid.beginEdit(0, "amount", "invalid");
        const input = grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!;
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(grid.hasValidationErrors).toBe(true);
        expect(rows[0].amount).toBe(10); expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 1 });
        await grid.beginEdit(0, "amount");
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("invalid");
    });
    it("switches replacement entry to caret navigation after clicking inside the input", async () => {
        const { grid, rows } = create(); await grid.beginEdit(0, "name", "New");
        const input = grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!;
        input.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        const arrow = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
        input.dispatchEvent(arrow); await settle();
        expect(arrow.defaultPrevented).toBe(false); expect(grid.editing).toBe(true);
        expect(rows[0].name).toBe("Alpha");
    });
    it.each([
        ["Tab", false, [[0, 1], [1, 0], [1, 1], [0, 0]]],
        ["Enter", false, [[1, 0], [0, 1], [1, 1], [0, 0]]],
        ["Tab", true, [[1, 1], [1, 0], [0, 1], [0, 0]]],
        ["Enter", true, [[1, 1], [0, 1], [1, 0], [0, 0]]]
    ] as const)("preserves a block through repeated edits with %s (backwards=%s)", async (key, shiftKey, destinations) => {
        const { grid } = create(); const manager = grid.getSelectionManager();
        manager.selectSingleCell(0, 0); manager.extendSelection(1, 1);
        const ranges = grid.getSelectedRanges();
        for (let index = 0; index < destinations.length; index++) {
            const active = grid.getActiveSelectionCell()!;
            expect(await grid.beginEdit()).toBe(true);
            expect(grid.getSelectedRanges()).toEqual(ranges);
            type(grid, active.colIndex === 0 ? `Edit ${index}` : String(30 + index))
                .dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }));
            await vi.waitFor(() => expect(grid.editing).toBe(false));
            expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: destinations[index][0], colIndex: destinations[index][1] });
            expect(grid.getSelectedRanges()).toEqual(ranges);
        }
    });
    it("preserves the block and navigates after validation fails", async () => {
        const { grid, rows } = create(); const manager = grid.getSelectionManager();
        manager.selectSingleCell(0, 0); manager.extendSelection(1, 1); manager.setActiveCell(0, 1);
        const ranges = grid.getSelectedRanges();
        await grid.beginEdit(); const input = type(grid, "invalid");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 0 });
        expect(grid.getSelectedRanges()).toEqual(ranges); expect(rows[0].amount).toBe(10);
        await grid.beginEdit(0, "amount");
        type(grid, "Cancelled").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        expect(grid.editing).toBe(false); expect(grid.getSelectedRanges()).toEqual(ranges);
    });
    it("collapses the block on grid arrow navigation, but not on input arrows", async () => {
        const { grid } = create(); const manager = grid.getSelectionManager();
        manager.selectSingleCell(0, 0); manager.extendSelection(1, 1); manager.setActiveCell(0, 1);
        const ranges = grid.getSelectedRanges(); await grid.beginEdit();
        const input = type(grid, "10");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(input.value).toBe("11"));
        expect(grid.getSelectedRanges()).toEqual(ranges);
        grid.cancelEdit();
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 1 });
        expect(grid.getSelectedRanges()).toEqual([{ anchor: { rowIndex: 1, colIndex: 1 }, focus: { rowIndex: 1, colIndex: 1 } }]);
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true, bubbles: true, cancelable: true }));
        expect(grid.getSelectedRanges()[0].focus).toEqual({ rowIndex: 1, colIndex: 0 });
    });
    it("selects the destination cell for PageUp/PageDown and Home/End", async () => {
        const { grid } = create();
        await (grid as any)._gridRows.load(0, 2);
        const manager = grid.getSelectionManager();
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        manager.selectSingleCell(0, 0);
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 1 });
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 1 }));
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", ctrlKey: true, bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 }));
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "End", ctrlKey: true, bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 2, colIndex: 1 }));
    });
    it("extends selection and raises cellNavigating for page and edge keys", async () => {
        const { grid } = create();
        await (grid as any)._gridRows.load(0, 2);
        const manager = grid.getSelectionManager();
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        const navigating = vi.fn(); grid.cellNavigating.subscribe(navigating);
        manager.selectSingleCell(0, 0);
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown", shiftKey: true, bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.getSelectedRanges()[0].focus.rowIndex).toBe(1));
        expect(manager.getActiveCell()).toEqual({ rowIndex: 1, colIndex: 0 });
        expect(navigating).toHaveBeenCalledWith(expect.objectContaining({ key: "PageDown", shiftKey: true,
            currentCell: { rowIndex: 0, colIndex: 0 }, targetCell: { rowIndex: 1, colIndex: 0 } }));
    });
    it("loads a remote page before Ctrl+End selects its last cell", async () => {
        const data = Array.from({ length: 150 }, (_, index) => ({ id: index + 1, name: `Item ${index + 1}`, amount: index }));
        const skips: number[] = [];
        const source = { loadData: async (args: any) => {
            skips.push(args.skip);
            return { args, dataItems: data.slice(args.skip, args.skip + args.top), totalCount: data.length };
        } };
        const { grid } = create({ data: source });
        await (grid as any)._gridRows.load(0, 1);
        const manager = grid.getSelectionManager();
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        manager.selectSingleCell(0, 0);
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "End", ctrlKey: true, bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 149, colIndex: 1 }));
        expect(skips).toContain(100);
    });
    it("starts a new selection only when an explicit edit targets a cell outside it", async () => {
        const { grid } = create(); const manager = grid.getSelectionManager();
        manager.selectSingleCell(0, 0); manager.extendSelection(1, 0);
        await grid.beginEdit(1, "amount");
        expect(grid.getSelectedRanges()).toEqual([{ anchor: { rowIndex: 1, colIndex: 1 }, focus: { rowIndex: 1, colIndex: 1 } }]);
    });
    it("keeps replacement typing while an initial row is loading", async () => {
        let release!: () => void;
        const ready = new Promise<void>(resolve => { release = resolve; });
        const row = { id: 1, name: "Alpha", amount: 10 };
        const { grid } = create({ data: { loadData: async (args: any) => {
            await ready; return { args, dataItems: [row], totalCount: 1 };
        }, update: async () => ({ success: true }) } });
        const opening = grid.beginEdit(0, "name", "a");
        const viewport = grid.dom.querySelector(".elg-data-grid-viewport")!;
        for (const key of ["b", "c"])
            viewport.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
        release(); expect(await opening).toBe(true);
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("abc");
    });
    it("cancels an opening edit without mounting stale UI after its load completes", async () => {
        let release!: () => void;
        const ready = new Promise<void>(resolve => { release = resolve; });
        const { grid } = create({ data: { loadData: async (args: any) => {
            await ready; return { args, dataItems: [{ id: 1, name: "Alpha", amount: 10 }], totalCount: 1 };
        }, update: async () => ({ success: true }) } });
        const opening = grid.beginEdit(0, "name"); expect(grid.cancelEdit()).toBe(true);
        release(); expect(await opening).toBe(false);
        expect(grid.editing).toBe(false); expect(grid.dom.querySelector(".elg-data-grid-editor")).toBeNull();
    });
    it("preserves external focus after a successful blur commit", async () => {
        const { grid, rows } = create(); await grid.beginEdit(0, "name"); type(grid, "Blurred");
        const outside = document.createElement("input"); document.body.append(outside); outside.focus();
        await settle(); expect(rows[0].name).toBe("Blurred"); expect(grid.editing).toBe(false);
        expect(document.activeElement).toBe(outside);
    });
    it("confirms a checkbox without requiring an extra Enter", async () => {
        const rows = [{ id: 1, name: "Alpha", amount: 10, approved: false }];
        const { grid } = create({ data: rows, columns: [{ name: "approved", dataType: "boolean" }] });
        await grid.beginEdit(0, "approved");
        grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.click();
        await settle(); expect(rows[0].approved).toBe(true); expect(grid.editing).toBe(false);
    });
    it("requires explicit permission, a writable source and a writable field", async () => {
        const disabled = create({ allowEdit: false }).grid;
        expect(await disabled.beginEdit(0, "amount")).toBe(false);
        const source: DataSource<Row> = { loadData: async args => ({ args, dataItems: [], totalCount: 0 }) };
        expect(await create({ data: source }).grid.beginEdit(0, "amount")).toBe(false);
        expect(await create({ columns: [{ name: "name", readonly: true }] }).grid.beginEdit(0, "name")).toBe(false);
    });
    it("updates an array through its source and replaces the editor after each edit", async () => {
        const { grid, rows } = create();
        expect(await grid.beginEdit(0, "amount")).toBe(true);
        const old = (grid as any)._cellEditor.editor;
        type(grid, "25"); expect(rows[0].amount).toBe(10);
        expect(await grid.endEdit()).toBe(true);
        expect(rows[0].amount).toBe(25); expect(grid.editing).toBe(false);
        expect(old.disposed.Value).toBe(true);
        await grid.beginEdit(0, "name");
        expect((grid as any)._cellEditor.editor).not.toBe(old);
        type(grid, "Changed"); grid.cancelEdit(); expect(rows[0].name).toBe("Alpha");
    });
    it("retains parsing, field validation and server validation failures", async () => {
        const { grid, rows } = create({ columns: [{ name: "amount", dataType: "number", validate: (value: number) => value > 0 ? undefined : "Must be positive" }] });
        await grid.beginEdit(0, "amount"); type(grid, "invalid");
        expect(await grid.endEdit()).toBe(true); expect(grid.editing).toBe(false);
        expect(grid.hasValidationErrors).toBe(true);
        await grid.beginEdit(0, "amount");
        type(grid, "-1"); expect(await grid.endEdit()).toBe(true);
        await grid.beginEdit(0, "amount");
        expect((grid as any)._cellEditor.editor.error).toBe("Must be positive");
        expect(rows[0].amount).toBe(10);
        type(grid, "12"); expect(await grid.endEdit()).toBe(true);
        expect(grid.hasValidationErrors).toBe(false);
    });
    it("waits for asynchronous save, blocks concurrent editing and coalesces confirmations", async () => {
        let resolve!: (result: MutationResult) => void;
        const row = { id: 1, name: "Alpha", amount: 10 };
        const update = vi.fn(() => new Promise<MutationResult>(done => { resolve = done; }));
        const source: DataSource<Row> = { loadData: async args => ({ args, dataItems: [row], totalCount: 1 }), update };
        const { grid } = create({ data: source });
        const navigating = vi.fn(); grid.cellNavigating.subscribe(navigating);
        grid.getSelectionManager().selectSingleCell(0, 0);
        grid.getSelectionManager().extendSelection(0, 1);
        const ranges = grid.getSelectedRanges();
        await grid.beginEdit(0, "amount"); const input = type(grid, "30");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        const first = grid.endEdit(), second = grid.endEdit();
        await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
        expect(input.disabled).toBe(true); expect(await grid.beginEdit(0, "name")).toBe(false);
        expect(grid.cancelEdit()).toBe(false); expect(grid.editing).toBe(true);
        expect(grid.getSelectedRanges()).toEqual(ranges);
        await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1));
        expect(update.mock.calls[0][0]).toBe(row);
        resolve({ success: false, error: "Rejected", fieldErrors: { amount: "Too large" } });
        expect(await first).toBe(true); expect(await second).toBe(true);
        expect(grid.editing).toBe(false); expect(grid.hasValidationErrors).toBe(true);
        expect(grid.getSelectedRanges()).toEqual(ranges);
        expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
        expect(navigating).toHaveBeenCalledTimes(1);
        await grid.beginEdit(0, "amount");
        expect((grid as any)._cellEditor.editor.error).toBe("Too large");
    });
    it("lets number input arrows reach the editor and keeps grid selection still", async () => {
        const { grid } = create(); await grid.beginEdit(0, "amount");
        const before = grid.getActiveSelectionCell(); const input = type(grid, "10");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
        await settle(); expect(input.value).toBe("11"); expect(grid.getActiveSelectionCell()).toEqual(before);
    });
    it("confirms on Enter then navigates, and Escape never writes", async () => {
        const { grid, rows } = create(); await grid.beginEdit(0, "amount");
        type(grid, "41").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await settle(); expect(rows[0].amount).toBe(41); expect(grid.editing).toBe(false);
        expect(grid.getActiveSelectionCell()?.rowIndex).toBe(1);
        await grid.beginEdit(0, "name");
        type(grid, "Discard").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        expect(rows[0].name).toBe("Alpha"); expect(grid.editing).toBe(false);
    });
    it("defers changed notifications until editing ends and unsubscribes on disposal", async () => {
        const changed = new ObservableEvent<any>();
        const row = { id: 1, name: "Alpha", amount: 10 };
        const source: DataSource<Row> = { changed, loadData: async args => ({ args, dataItems: [row], totalCount: 1 }),
            update: async (_row, values) => { Object.assign(row, values); changed.invoke({ row }); return { success: true }; } };
        const { grid } = create({ data: source }); await grid.beginEdit(0, "amount");
        const reload = vi.spyOn(grid as any, "reloadRows");
        const input = type(grid, "77"); changed.invoke({ row }); expect(reload).not.toHaveBeenCalled();
        expect(input.isConnected).toBe(true); await grid.endEdit(); expect(reload).toHaveBeenCalledTimes(1);
        grid.dispose(); changed.invoke({ row }); expect(reload).toHaveBeenCalledTimes(1);
    });
    it("uses DataTable domain rows and leaves undo to its coordinator", async () => {
        const data = new DataSet(); const table = data.createTable("lines", [{ id: 1, amount: 10 }]);
        const { grid } = create({ data: table, columns: [{ name: "amount", dataType: "number", getValue: async (row: any) => row.getValue("amount") }] });
        await grid.beginEdit(0, "amount"); type(grid, "55"); expect(await grid.endEdit()).toBe(true);
        expect(table.rows[0].getValue("amount")).toBe(55);
        await data.undoCoordinator.undo(); expect(table.rows[0].getValue("amount")).toBe(10);
    });
    it("does not discard drafts on query or column changes", async () => {
        const { grid } = create(); await grid.beginEdit(0, "name"); const input = type(grid, "Draft");
        expect(() => grid.setOptions({ filter: ["amount", ">", 0] })).toThrow("Finish or cancel");
        expect(input.value).toBe("Draft"); grid.cancelEdit();
        expect(() => grid.setOptions({ filter: ["amount", ">", 0] })).not.toThrow();
    });
    it("disposes safely during an asynchronous update", async () => {
        let resolve!: (result: MutationResult) => void;
        const row = { id: 1, name: "Alpha", amount: 10 };
        const { grid } = create({ data: { loadData: async (args: any) => ({ args, dataItems: [row], totalCount: 1 }),
            update: () => new Promise<MutationResult>(done => { resolve = done; }) } });
        await grid.beginEdit(0, "amount"); type(grid, "99"); const done = grid.endEdit();
        await vi.waitFor(() => expect(resolve).toBeDefined()); grid.dispose(); resolve({ success: true });
        expect(await done).toBe(true); expect(grid.dom.querySelector(".elg-data-grid-editor")).toBeNull();
    });
});
