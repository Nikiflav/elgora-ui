import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { TextEditor } from "../../src/components/editors/ValueEditor";

const grids: DataGrid<any>[] = [];
const settle = () => new Promise(resolve => setTimeout(resolve, 45));
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ font: "", measureText: () => ({ width: 50 }) } as any);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
});
afterEach(async () => {
    grids.splice(0).forEach(grid => grid.dispose()); await settle();
    document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
async function create(data?: any) {
    const rows: any[] = [];
    const source = data ?? new ArrayDataSource(rows, { defaults: () => ({ name: "Default", amount: 2 }) });
    const factory = source.createNewRow ? vi.spyOn(source, "createNewRow") : undefined;
    const grid = new DataGrid({ data: source, allowEdit: true, showGroupPanel: false,
        columns: [{ name: "name", required: true }, { name: "amount", dataType: "number" }] });
    grids.push(grid); grid.mount(document.body); await settle(); (grid as any).updateLayout();
    return { grid, source, rows, factory };
}
function input(grid: DataGrid<any>, text: string) {
    const el = grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!;
    el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); return el;
}
describe("DataGrid new-row sessions", () => {
    it("marks only pending rows across border modes and removes the mark after insertion", async () => {
        const { grid } = await create();
        const session = await grid.createNewRow();
        for (const cellBorders of ["none", "rows", "all"] as const) {
            grid.setOptions({ cellBorders, showBorder: false });
            await settle(); (grid as any).updateLayout(); await settle();
            const pending = grid.dom.querySelectorAll(".elg-data-grid-row-pending");
            expect(pending.length).toBe(1);
            expect(pending[0].classList.contains("elg-data-grid-row-new")).toBe(true);
            expect(grid.dom.querySelectorAll(".elg-data-grid-row-new:not(.elg-data-grid-row-pending)").length).toBe(1);
        }
        expect(await grid.insertNewRow(session)).toBe(true);
        await settle(); (grid as any).updateLayout(); await settle();
        expect(grid.dom.querySelector(".elg-data-grid-row-pending")).toBeNull();
    });

    it("exposes snapshot source sessions and cancels a non-last row explicitly", async () => {
        const { grid, factory } = await create();
        const first = await grid.createNewRow();
        const snapshot = grid.newRowSessions;
        const second = await grid.createNewRow();
        expect(snapshot).toEqual([first]); expect(grid.newRowSessions).toEqual([first, second]);
        expect(first).toBe(await factory!.mock.results[0].value);
        expect(await grid.cancelNewRow(first)).toBe(true);
        expect(first.state).toBe("cancelled"); expect(grid.newRowSessions).toEqual([second]);
        await expect(grid.cancelNewRow(first)).rejects.toThrow("not pending in this grid");
    });

    it("rejects foreign sessions and does not close another row's editor", async () => {
        const { grid } = await create();
        const first = await grid.createNewRow(), second = await grid.createNewRow();
        await grid.beginEdit(1, "name"); const active = input(grid, "Still editing second");
        expect(await grid.cancelNewRow(first)).toBe(true);
        expect(grid.editing).toBe(true); expect(active.isConnected).toBe(true);
        expect(active.value).toBe("Still editing second");
        await grid.endEdit();
        expect(second.row).toMatchObject({ name: "Still editing second" });
        const other = (await create()).grid;
        await expect(other.insertNewRow(second)).rejects.toThrow("not pending in this grid");
        await expect(other.cancelNewRow(second)).rejects.toThrow("not pending in this grid");
    });

    it("inserts a specified row without confirming another row's editor", async () => {
        const { grid, rows } = await create();
        const first = await grid.createNewRow(), second = await grid.createNewRow();
        await grid.beginEdit(1, "name"); const active = input(grid, "Unconfirmed second");
        expect(await grid.insertNewRow(first)).toBe(true);
        expect(rows).toEqual([first.row]); expect(grid.editing).toBe(true);
        expect(active.value).toBe("Unconfirmed second"); expect(second.row).toMatchObject({ name: "Default" });
        grid.cancelEdit(); expect(second.row).toMatchObject({ name: "Default" });
    });

    it("reacts to direct source commands while distinguishing bypassed UI checks", async () => {
        const { grid, rows } = await create();
        const first = await grid.createNewRow(), second = await grid.createNewRow();
        await grid.beginEdit(0, "amount"); input(grid, "invalid"); await grid.endEdit();
        expect(await grid.insertNewRow(first)).toBe(false);
        expect(await first.insert()).toEqual({ success: true });
        expect(grid.newRowSessions).toEqual([second]); expect(grid.hasValidationErrors).toBe(false);
        await (grid as any)._gridRows.load(0, 10);
        await grid.beginEdit(1, "name"); input(grid, "Discarded by direct cancellation");
        await second.cancel();
        expect(grid.editing).toBe(false); expect(grid.newRowSessions).toEqual([]);
        expect(rows).toEqual([first.row]);
    });

    it("guarantees completion without source events and rejects overlapping row commands", async () => {
        let release!: (result: any) => void;
        const row = { name: "Pending", amount: 1 };
        let state = "pending";
        const session = { row, get state() { return state; },
            insert: vi.fn(() => new Promise(resolve => { release = resolve; })),
            cancel: vi.fn(async () => { state = "cancelled"; }) };
        const { grid } = await create({ loadData: async (args: any) => ({ args, dataItems: [], totalCount: 0 }),
            update: async () => ({ success: true }), createNewRow: async () => session });
        const created = await grid.createNewRow();
        const operation = grid.insertNewRow(created);
        expect(grid.insertNewRow(created)).toBe(operation);
        expect(await grid.cancelNewRow(created)).toBe(false);
        state = "inserted"; release({ success: true });
        expect(await operation).toBe(true); expect(grid.newRowSessions).toEqual([]);
        expect(session.insert).toHaveBeenCalledTimes(1); expect(session.cancel).not.toHaveBeenCalled();
    });

    it("cancels the row-header context target rather than the active session", async () => {
        const { grid } = await create();
        const first = await grid.createNewRow(), second = await grid.createNewRow();
        await (grid as any)._gridRows.load(0, 10);
        grid.getSelectionManager().selectSingleCell(1, 0);
        const row = (grid as any)._gridRows.getAt(0);
        const items = await (grid as any).getContextMenuItems({ target: "rowHeader", row, rowIndex: 0,
            selectedRanges: grid.getSelectedRanges(), event: new MouseEvent("contextmenu") });
        await items.find((item: any) => item.text === "Cancel new row").action();
        expect(first.state).toBe("cancelled"); expect(second.state).toBe("pending");
        expect(grid.newRowSessions).toEqual([second]);
    });
    it("renders session defaults and hides the label before constructing the editor without re-querying", async () => {
        const row = { name: "Default", amount: 42 };
        const loadData = vi.fn(async (args: any) => ({ args, dataItems: [], totalCount: 0 }));
        const { grid } = await create({ loadData, update: async () => ({ success: true }),
            createNewRow: async () => ({ row, state: "pending", cancel: async () => {} }) });
        const factory = vi.fn(context => {
            expect(context.row).toBe(row);
            expect(grid.dom.querySelector('[data-elg-edit-row="0"][data-elg-edit-column="amount"]')!.textContent).toBe("42");
            expect(grid.dom.querySelector<HTMLElement>(".elg-data-grid-new-row-placeholder")!.hidden).toBe(true);
            expect(grid.dom.querySelector(".elg-data-grid-editor input")).toBeNull();
            return new TextEditor({ value: context.value, onCommit: context.onCommit });
        });
        grid.setColumnOptions("name", { createEditor: factory }); await settle();
        const loadsBefore = loadData.mock.calls.length;
        expect(await grid.beginEdit(0, "name")).toBe(true);
        expect(factory).toHaveBeenCalledTimes(1); expect(loadData).toHaveBeenCalledTimes(loadsBefore);
    });
    it("places a separate label across the viewport while retaining each empty input cell", async () => {
        const { grid } = await create();
        const cells = grid.dom.querySelectorAll<HTMLElement>('[data-elg-edit-row="0"]');
        expect(cells).toHaveLength(2);
        expect(Array.from(cells).every(cell => !cell.textContent?.includes("New row"))).toBe(true);
        const rect = (left: number, top: number, width: number, height: number) =>
            ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON() {} });
        vi.spyOn(grid.dom, "getBoundingClientRect").mockReturnValue(rect(0, 0, 400, 200));
        vi.spyOn((grid as any)._tableContainer, "getBoundingClientRect").mockReturnValue(rect(0, 0, 400, 200));
        vi.spyOn((grid as any)._contentTable.tHead, "getBoundingClientRect").mockReturnValue(rect(0, 0, 400, 30));
        const cellBounds = vi.spyOn(cells[0], "getBoundingClientRect").mockReturnValue(rect(80, 30, 40, 36));
        const rowHeader = cells[0].parentElement!.querySelector<HTMLElement>(".elg-data-grid-cell-rowheader")!;
        vi.spyOn(rowHeader, "getBoundingClientRect").mockReturnValue(rect(0, 30, 80, 36));
        (grid as any).positionNewRowPlaceholder();
        const label = grid.dom.querySelector<HTMLElement>(".elg-data-grid-new-row-placeholder")!;
        expect(label.parentElement).toBe(grid.dom); expect(label.hidden).toBe(false);
        expect(label.style.width).toBe("320px"); expect(label.style.left).toBe("80px");
        expect(label.getAttribute("aria-hidden")).toBe("true");
        cellBounds.mockReturnValue(rect(80, 250, 40, 36));
        (grid as any).positionNewRowPlaceholder(); expect(label.hidden).toBe(true);
        cellBounds.mockReturnValue(rect(80, 30, 40, 36));
        expect(await grid.beginEdit(0, "name")).toBe(true);
        (grid as any).positionNewRowPlaceholder(); expect(label.hidden).toBe(true);
    });
    it("releases a session created after its opening edit was cancelled", async () => {
        let release!: (value: any) => void;
        const cancel = vi.fn(async () => {});
        const { grid } = await create({ loadData: async (args: any) => ({ args, dataItems: [], totalCount: 0 }),
            update: async () => ({ success: true }),
            createNewRow: () => new Promise(resolve => { release = resolve; }) });
        const opening = grid.beginEdit(0, "name", "a");
        await vi.waitFor(() => expect(release).toBeDefined());
        expect(await grid.beginEdit(0, "amount")).toBe(false);
        grid.cancelEdit(); release({ row: { name: "Draft" }, state: "pending", cancel });
        expect(await opening).toBe(false); expect(cancel).toHaveBeenCalledTimes(1);
        expect(grid.hasPendingNewRow).toBe(false);
    });
    it("retains initial typing while the source initializes defaults asynchronously", async () => {
        let release!: (value: any) => void;
        const { grid } = await create({ loadData: async (args: any) => ({ args, dataItems: [], totalCount: 0 }),
            update: async () => ({ success: true }),
            createNewRow: () => new Promise(resolve => { release = resolve; }) });
        const opening = grid.beginEdit(0, "name", "a");
        await vi.waitFor(() => expect(release).toBeDefined());
        grid.dom.querySelector(".elg-data-grid-viewport")!
            .dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true, cancelable: true }));
        release({ row: { name: "Default" }, state: "pending", cancel: async () => {} });
        expect(await opening).toBe(true);
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("ab");
    });
    it("cancellation in cellNavigating prevents insertion as well as movement", async () => {
        const { grid, rows } = await create();
        grid.cellNavigating.subscribe(event => { event.cancel = true; });
        await grid.beginEdit(0, "name");
        input(grid, "First").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(grid.hasPendingNewRow).toBe(true); expect(rows).toHaveLength(0);
    });
    it("inserts before clicking a different row", async () => {
        const rows = [{ id: "1", name: "Existing", amount: 1 }];
        const { grid } = await create(new ArrayDataSource(rows));
        expect(await grid.beginEdit(1, "name"), grid.newRowError).toBe(true); input(grid, "New"); await grid.endEdit(); await settle();
        grid.dom.querySelector<HTMLElement>('[data-elg-edit-row="0"][data-elg-edit-column="name"]')!
            .dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
        await vi.waitFor(() => expect(rows).toHaveLength(2));
        expect(grid.hasPendingNewRow).toBe(false);
    });
    it("coalesces insertion requests and blocks editing until they finish", async () => {
        let release!: (value: any) => void;
        const insert = vi.fn(() => new Promise(resolve => { release = resolve; }));
        const { grid } = await create({ loadData: async (args: any) => ({ args, dataItems: [], totalCount: 0 }),
            update: async () => ({ success: true }), createNewRow: async () => ({ row: { name: "Draft" }, state: "pending", insert, cancel: async () => {} }) });
        await grid.beginEdit(0, "name"); grid.cancelEdit();
        const first = grid.insertNewRow(grid.newRowSessions[0]), second = grid.insertNewRow(grid.newRowSessions[0]);
        await vi.waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
        expect(await grid.beginEdit(0, "name")).toBe(false); expect(await grid.cancelNewRow(grid.newRowSessions[0])).toBe(false);
        release({ success: true }); expect(await first).toBe(true); expect(await second).toBe(true);
    });
    it("renders a lazy placeholder and creates a real defaulted row before validation", async () => {
        const { grid, rows, factory } = await create();
        await vi.waitFor(() => expect(grid.dom.textContent).toContain("New row"));
        expect(factory).not.toHaveBeenCalled();
        expect(await grid.beginEdit(0, "name")).toBe(true);
        expect(factory).toHaveBeenCalledTimes(1); expect(grid.hasPendingNewRow).toBe(true);
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("Default");
        input(grid, "First"); expect(await grid.endEdit()).toBe(true);
        expect(rows).toHaveLength(0); expect(grid.hasPendingNewRow).toBe(true);
        await grid.beginEdit(0, "amount"); input(grid, "3"); await grid.endEdit();
        expect(factory).toHaveBeenCalledTimes(1);
        expect(await grid.insertNewRow(grid.newRowSessions[0])).toBe(true); expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ name: "First", amount: 3 });
        expect(grid.hasPendingNewRow).toBe(false); await settle();
        expect(grid.dom.textContent).toContain("New row");
    });
    it("retains the pending session after invalid input and cancels it separately from the cell", async () => {
        const { grid, rows } = await create(); await grid.beginEdit(0, "amount");
        input(grid, "invalid"); expect(await grid.insertNewRow(grid.newRowSessions[0])).toBe(false);
        expect(grid.editing).toBe(false); expect(grid.hasPendingNewRow).toBe(true);
        expect(grid.cancelEdit()).toBe(true); expect(grid.hasPendingNewRow).toBe(true);
        expect(await grid.cancelNewRow(grid.newRowSessions[0])).toBe(true); expect(grid.hasPendingNewRow).toBe(false);
        expect(rows).toHaveLength(0);
    });
    it("inserts on Enter at the input-row boundary, without opening the next editor", async () => {
        const { grid, rows } = await create(); await grid.beginEdit(0, "name");
        input(grid, "First").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(rows).toHaveLength(1));
        await vi.waitFor(() => expect(grid.hasPendingNewRow).toBe(false));
        expect(grid.editing).toBe(false); expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 1, colIndex: 0 });
    });
    it("reveals the entire next input row after an asynchronous insert grows the scroll range", async () => {
        vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(180);
        vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function(this: HTMLElement) {
            return ["TR", "THEAD", "TFOOT"].includes(this.tagName) ? 36 : 180;
        });
        const rows = Array.from({ length: 6 }, (_, id) => ({ id, name: `Row ${id}`, amount: 1 }));
        const storage = new ArrayDataSource(rows, { defaults: () => ({ name: "New", amount: 1 }) });
        let release!: () => void;
        const source = {
            loadData: storage.loadData.bind(storage), update: storage.update.bind(storage),
            createNewRow: async () => {
                const session = await storage.createNewRow();
                return { row: session.row, get state() { return session.state; }, cancel: session.cancel,
                    insert: async () => { await new Promise<void>(resolve => { release = resolve; }); return session.insert(); } };
            }
        };
        const { grid } = await create(source);
        grid.setOptions({ totalSummary: [{ field: "amount", summaryType: "sum" }] }); await settle();
        expect(await grid.beginEdit(6, "name")).toBe(true);
        input(grid, "Added").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(release).toBeDefined()); release();
        await vi.waitFor(() => expect(grid.getActiveSelectionCell()).toEqual({ rowIndex: 7, colIndex: 0 }));
        await vi.waitFor(() => {
            const internal = grid as any;
            const bottom = internal._sizeManager.getOffset(7) + internal._sizeManager.getSize(7);
            const visibleBottom = internal._scrollEngine.scrollTop + internal._viewportHeight - internal._headerHeight - internal._footerHeight;
            expect(visibleBottom).toBeGreaterThanOrEqual(bottom);
        });
        expect(document.activeElement).toBe(grid.dom.querySelector(".elg-data-grid-viewport"));
        expect(grid.editing).toBe(false);
    });
    it("shows insert failure and keeps the pending row for a successful retry", async () => {
        const row = { name: "Draft", amount: 2 }; let accepted = false;
        const insert = vi.fn(async () => accepted ? { success: true } : { success: false, error: "Name is unavailable." });
        const source = { loadData: async (args: any) => ({ args, dataItems: [], totalCount: 0 }),
            update: async () => ({ success: true }), createNewRow: async () => ({ row, state: "pending", insert, cancel: async () => {} }) };
        const { grid } = await create(source); await grid.beginEdit(0, "name"); grid.cancelEdit();
        expect(await grid.insertNewRow(grid.newRowSessions[0])).toBe(false); expect(grid.newRowError).toBe("Name is unavailable.");
        expect(grid.hasPendingNewRow).toBe(true); accepted = true;
        expect(await grid.insertNewRow(grid.newRowSessions[0])).toBe(true); expect(grid.newRowError).toBeUndefined();
    });
    it("does not append a placeholder for a read-only source", async () => {
        const { grid } = await create({ loadData: async (args: any) => ({ args, dataItems: [], totalCount: 0 }) });
        expect(grid.dom.textContent).not.toContain("New row"); expect(await grid.beginEdit(0, "name")).toBe(false);
    });
});
