import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { parseClipboardText } from "../../src/components/datagrid/ClipboardText";
import { LookupEditor } from "../../src/components/editors/LookupEditor";
import { DataSet } from "../../src/data/dataset/DataSet";

type Row = { id: number; name: string; amount: number };
const grids: DataGrid<Row>[] = [];
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ font: "", measureText: () => ({ width: 50 }) } as any);
});
afterEach(async () => {
    grids.splice(0).forEach(grid => grid.dispose());
    await new Promise(resolve => setTimeout(resolve, 25));
    document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
async function create(rows: Row[] = [], options: any = {}) {
    let id = Math.max(0, ...rows.map(row => row.id));
    const source = new ArrayDataSource(rows, { createRowId: () => ++id,
        defaults: () => ({ name: "", amount: 1 }) });
    const grid = new DataGrid<Row>({ data: source, allowEdit: true, showGroupPanel: false,
        columns: [{ name: "name", required: true }, { name: "amount", dataType: "number" }], ...options });
    grids.push(grid); grid.mount(document.body);
    await (grid as any)._gridRows.load(0, 100);
    grid.getSelectionManager().selectSingleCell(0, 0);
    return { grid, source: (grid as any)._dataSource as ArrayDataSource<Row>, rows };
}
function type(grid: DataGrid<Row>, text: string) {
    const input = grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!;
    input.value = text; input.dispatchEvent(new Event("input", { bubbles: true })); return input;
}

describe("clipboard text", () => {
    it("reads quoted tabs, line breaks, empty fields and escaped quotes", () => {
        expect(parseClipboardText('"A\tB"\t"C""D"\r\n"two\nlines"\t\r\n'))
            .toEqual([["A\tB", 'C"D'], ["two\nlines", ""]]);
        expect(parseClipboardText("\t")).toEqual([["", ""]]);
        expect(() => parseClipboardText('"broken')).toThrow("not terminated");
    });
});

describe("grid paste and rejected cell input", () => {
    async function pasteItem(grid: DataGrid<Row>, row = (grid as any)._gridRows.getAt(0)) {
        const items = await (grid as any).getContextMenuItems({ target: "cell", row, rowIndex: 0,
            column: grid.getColumn("name"), colIndex: 0, selectedRanges: grid.getSelectedRanges(),
            event: new MouseEvent("contextmenu", { clientX: 10, clientY: 20 }) });
        return items.find((item: any) => item.text === "Paste");
    }

    function clipboard(readText?: () => Promise<string>) {
        vi.stubGlobal("navigator", Object.create(navigator, { clipboard: { value: readText ? { readText } : undefined } }));
    }

    it("reads the clipboard only when Paste is activated and uses the normal validation pipeline", async () => {
        const { grid, rows } = await create([{ id: 1, name: "A", amount: 1 }]);
        const readText = vi.fn(async () => "Pasted\tinvalid"); clipboard(readText);
        vi.spyOn((grid as any)._contextMenu, "hide").mockImplementation(() => {});
        const item = await pasteItem(grid);
        expect(readText).not.toHaveBeenCalled();
        expect(item.disabled()).toBe(false);
        await item.action();
        expect(readText).toHaveBeenCalledOnce();
        expect(rows[0]).toMatchObject({ name: "Pasted", amount: 1 });
        expect(grid.hasValidationErrors).toBe(true);
    });

    it.each(["unavailable", "denied"])("offers keyboard paste when clipboard reading is %s", async failure => {
        const { grid, rows } = await create([{ id: 1, name: "A", amount: 1 }]);
        clipboard(failure === "denied" ? async () => { throw new DOMException("Access denied", "NotAllowedError"); } : undefined);
        const show = vi.spyOn((grid as any)._contextMenu, "show").mockResolvedValue(undefined);
        vi.spyOn((grid as any)._contextMenu, "hide").mockImplementation(() => {});
        await (await pasteItem(grid)).action();
        const options = show.mock.calls[0][0] as any;
        expect(options.items[0].text).toContain("Failed to read clipboard.");
        expect(options.items[1].text).toContain("Ctrl+V / Command+V");
        expect(rows[0].name).toBe("A");
    });

    it("omits Paste for read-only grids, excluded commands, and metadata rows", async () => {
        const readonly = (await create([], { allowEdit: false })).grid;
        expect(await pasteItem(readonly)).toBeUndefined();
        const excluded = (await create([], { standardContextMenuItems: ["copy"] })).grid;
        expect(await pasteItem(excluded)).toBeUndefined();
        const { grid } = await create();
        for (const type of ["group", "footer", "loading"])
            expect(await pasteItem(grid, { type, visibleIndex: 0 })).toBeUndefined();
        const sourceWithoutUpdate = (await create([], { data: { loadData: async (args: any) => ({ args, dataItems: [], totalCount: 0 }) } })).grid;
        expect(await pasteItem(sourceWithoutUpdate)).toBeUndefined();
    });

    it("does not redirect a delayed clipboard read to a newly selected cell", async () => {
        const { grid, rows } = await create([{ id: 1, name: "A", amount: 1 }]);
        let resolve!: (text: string) => void;
        clipboard(() => new Promise(done => { resolve = done; }));
        vi.spyOn((grid as any)._contextMenu, "hide").mockImplementation(() => {});
        const operation = (await pasteItem(grid)).action();
        grid.getSelectionManager().selectSingleCell(0, 1);
        resolve("Changed"); await operation;
        expect(rows[0]).toEqual({ id: 1, name: "A", amount: 1 });
    });

    it("ignores a clipboard result after grid disposal", async () => {
        const { grid, rows } = await create([{ id: 1, name: "A", amount: 1 }]);
        let resolve!: (text: string) => void;
        clipboard(() => new Promise(done => { resolve = done; }));
        vi.spyOn((grid as any)._contextMenu, "hide").mockImplementation(() => {});
        const operation = (await pasteItem(grid)).action();
        grid.dispose(); resolve("Changed"); await operation;
        expect(rows[0].name).toBe("A");
    });

    it.each([
        { pending: false, reopen: false }, { pending: false, reopen: true },
        { pending: true, reopen: false }, { pending: true, reopen: true }
    ])("Escape restores the real cell value before row cancellation (pending=$pending, editor=$reopen)", async ({ pending, reopen }) => {
        const { grid, source, rows } = await create(pending ? [] : [{ id: 1, name: "A", amount: 5 }]);
        const session = pending ? await grid.createNewRow() : undefined;
        if (session) await source.update!(session.row, { name: "A" });
        grid.getSelectionManager().selectSingleCell(0, 1);
        await grid.pasteText("bad");
        if (reopen) await grid.beginEdit(0, "amount");
        const viewport = grid.dom.querySelector<HTMLElement>(".elg-data-grid-viewport")!;
        const target = grid.dom.querySelector(".elg-data-grid-editor input") ?? viewport;
        target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(grid.hasValidationErrors).toBe(false));
        expect(grid.editing).toBe(false);
        if (session) { expect(session.state).toBe("pending"); expect(grid.newRowSessions).toEqual([session]); }
        await vi.waitFor(() => {
            const cell = grid.dom.querySelector<HTMLElement>('[data-elg-edit-row="0"][data-elg-edit-column="amount"]')!;
            expect(cell.textContent).toBe(pending ? "1" : "5");
            expect(cell.getAttribute("aria-invalid")).not.toBe("true");
        });
        viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        if (session) await vi.waitFor(() => expect(session.state).toBe("cancelled"));
        else expect(rows[0].amount).toBe(5);
    });

    it("Escape on an error-free cell cancels its pending row even if another cell has invalid input", async () => {
        const { grid } = await create();
        await grid.pasteText("A\tbad\nB\tbad");
        const [first, second] = grid.newRowSessions;
        await (grid as any)._gridRows.load(0, 100);
        grid.getSelectionManager().selectSingleCell(0, 0);
        grid.dom.querySelector(".elg-data-grid-viewport")!
            .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(first.state).toBe("cancelled"));
        expect(grid.newRowSessions).toEqual([second]); expect(grid.hasValidationErrors).toBe(true);
    });

    it("Escape in a clean pending-row editor cancels the entire session in one step", async () => {
        const { grid } = await create();
        const session = await grid.createNewRow();
        await grid.beginEdit(0, "name");
        type(grid, "Not saved").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(session.state).toBe("cancelled"));
        expect(grid.editing).toBe(false); expect(grid.newRowSessions).toEqual([]);
        expect(session.row.name).toBe("");
    });

    it("continues after invalid new-row cells, retaining multiple real sessions and a placeholder", async () => {
        const { grid, source, rows } = await create();
        const createRow = vi.spyOn(source, "createNewRow");
        await grid.pasteText("First\tbad\nSecond\twrong\nThird\t3");
        expect(rows).toEqual([{ id: 3, name: "Third", amount: 3 }]);
        expect(createRow).toHaveBeenCalledTimes(3);
        expect(grid.hasPendingNewRow).toBe(true); expect(grid.hasValidationErrors).toBe(true);
        await (grid as any)._gridRows.load(0, 100);
        expect((grid as any)._gridRows.count()).toBe(4);
        expect((grid as any)._gridRows.getAt(1).data).toMatchObject({ name: "First", amount: 1 });
        expect((grid as any)._gridRows.getAt(2).data).toMatchObject({ name: "Second", amount: 1 });
        expect((grid as any)._gridRows.getAt(3).data).toBeUndefined();
        expect(await grid.beginEdit(1, "amount")).toBe(true);
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("bad");
        type(grid, "7"); await grid.endEdit();
        expect(await grid.insertNewRow(grid.newRowSessions[0])).toBe(true);
        expect(rows.map(row => row.name)).toEqual(["Third", "First"]);
        expect(grid.hasPendingNewRow).toBe(true); expect(grid.hasValidationErrors).toBe(true);
    });

    it("stops on creation failure without rolling back earlier insertions", async () => {
        const { grid, source, rows } = await create();
        const createRow = source.createNewRow.bind(source);
        vi.spyOn(source, "createNewRow").mockImplementationOnce(createRow)
            .mockRejectedValueOnce(new Error("Creation rejected"));
        await expect(grid.pasteText("First\t2\nSecond\t3\nThird\t4")).rejects.toThrow("Creation rejected");
        expect(rows).toEqual([{ id: 1, name: "First", amount: 2 }]);
        expect(source.createNewRow).toHaveBeenCalledTimes(2);
    });

    it("captures existing destinations before sorting moves accepted rows", async () => {
        const rows = [{ id: 1, name: "Alpha", amount: 1 }, { id: 2, name: "Beta", amount: 2 }];
        const { grid } = await create(rows, { orderBy: ["name"] });
        await grid.pasteText("Zulu\tbad\nAaron\t8");
        expect(rows).toEqual([{ id: 1, name: "Zulu", amount: 1 }, { id: 2, name: "Aaron", amount: 8 }]);
        await (grid as any)._gridRows.load(0, 100);
        await grid.beginEdit(1, "amount");
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("bad");
    });

    it("retains insert field errors and continues with subsequent rows", async () => {
        const { grid, source, rows } = await create();
        const createRow = source.createNewRow.bind(source);
        vi.spyOn(source, "createNewRow").mockImplementationOnce(async () => {
            const session = await createRow();
            return { get row() { return session.row; }, get state() { return session.state; }, cancel: () => session.cancel(),
                insert: async () => ({ success: false as const, error: "Rejected", fieldErrors: { amount: "Too large" } }) };
        });
        await grid.pasteText("First\t100\nSecond\t2");
        expect(rows).toHaveLength(1); expect(rows[0].name).toBe("Second");
        expect(grid.hasPendingNewRow).toBe(true);
        await (grid as any)._gridRows.load(0, 100);
        await grid.beginEdit(1, "amount");
        expect((grid as any)._cellEditor.editor.error).toBe("Too large");
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("100");
    });

    it("keeps an invalid cell visible on blur and restores its text without losing external focus", async () => {
        const { grid, rows } = await create([{ id: 1, name: "Alpha", amount: 5 }]);
        await grid.beginEdit(0, "amount"); type(grid, "invalid");
        const outside = document.createElement("input"); document.body.append(outside); outside.focus();
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(document.activeElement).toBe(outside); expect(rows[0].amount).toBe(5);
        await vi.waitFor(() => expect(grid.dom.querySelector('[data-elg-edit-column="amount"][aria-invalid="true"]')?.textContent).toBe("invalid"));
        await grid.beginEdit(0, "amount"); expect(type(grid, "5").value).toBe("5");
        await grid.endEdit(); expect(grid.hasValidationErrors).toBe(false);
    });

    it("releases every failed pending session on disposal", async () => {
        const { grid, source } = await create();
        const createRow = source.createNewRow.bind(source);
        const cancel = vi.fn();
        vi.spyOn(source, "createNewRow").mockImplementation(async () => {
            const session = await createRow();
            return { row: session.row, get state() { return session.state; }, insert: () => session.insert(),
                cancel: async () => { cancel(); await session.cancel(); } };
        });
        await grid.pasteText("A\tbad\nB\tbad"); grid.dispose();
        await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(2));
    });

    it("restores rejected lookup text even after its asynchronous label finishes loading", async () => {
        let release!: (text: string) => void;
        const { grid } = await create([{ id: 1, name: "Alpha", amount: 5 }], { columns: [{ name: "name", createEditor: (context: any) => new LookupEditor({
            value: context.value, onCommit: context.onCommit, columns: [{ name: "text" }],
            getItemValue: (item: string) => item, getItemText: (item: string) => item,
            loadItems: async () => ({ items: [], totalCount: 0 }),
            getValueText: () => new Promise<string>(resolve => { release = resolve; })
        }) }] });
        await grid.pasteText("Unknown");
        await grid.beginEdit(0, "name");
        await vi.waitFor(() => expect(release).toBeDefined());
        release("Alpha"); await Promise.resolve(); await Promise.resolve();
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("Unknown");
        expect(grid.hasValidationErrors).toBe(true);
    });

    it("can leave one invalid manual new row and start another without losing the first session", async () => {
        const { grid, rows } = await create();
        await grid.beginEdit(0, "amount"); type(grid, "bad"); await grid.endEdit();
        await (grid as any)._gridRows.load(0, 100);
        expect(await grid.beginEdit(1, "name")).toBe(true);
        type(grid, "Second"); await grid.endEdit();
        expect(await grid.insertNewRow(grid.newRowSessions[1])).toBe(true);
        expect(rows.map(row => row.name)).toEqual(["Second"]);
        await (grid as any)._gridRows.load(0, 100);
        await grid.beginEdit(1, "amount");
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.value).toBe("bad");
    });

    it("serializes paste and prevents insertion after disposal during an asynchronous update", async () => {
        const { grid, source, rows } = await create();
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const update = source.update!.bind(source);
        const updateSpy = vi.spyOn(source, "update").mockImplementation(async (row, values) => { await gate; return update(row, values); });
        const createRow = source.createNewRow.bind(source);
        const insert = vi.fn(), cancel = vi.fn();
        vi.spyOn(source, "createNewRow").mockImplementation(async () => {
            const session = await createRow();
            return { row: session.row, get state() { return session.state; },
                insert: async () => { insert(); return session.insert(); },
                cancel: async () => { cancel(); await session.cancel(); } };
        });
        const operation = grid.pasteText("A\t1\nB\t2");
        expect(grid.pasteText("Ignored")).toBe(operation);
        await vi.waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1));
        expect(await grid.beginEdit(0, "name")).toBe(false);
        grid.dispose(); release(); await operation;
        await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
        expect(insert).not.toHaveBeenCalled(); expect(source.createNewRow).toHaveBeenCalledTimes(1);
        expect(rows).toEqual([]);
    });

    it("uses boolean conversion without shifting read-only columns", async () => {
        const rows = [{ id: 1, name: "Alpha", amount: 5, approved: false }];
        const { grid } = await create(rows, { columns: [{ name: "name", readonly: true },
            { name: "amount", dataType: "number" }, { name: "approved", dataType: "boolean" }] });
        await grid.pasteText("Unchanged\t7\ttrue");
        expect(rows[0]).toMatchObject({ name: "Alpha", amount: 7, approved: true });
        await grid.pasteText("Unchanged\t8\tnot a boolean");
        expect(rows[0]).toMatchObject({ name: "Alpha", amount: 8, approved: true });
        expect(grid.hasValidationErrors).toBe(true);
    });

    it("keeps DataTable pending business-rule values outside confirmed rows", async () => {
        const dataset = new DataSet();
        let id = 0;
        const table = dataset.createTable("items", [], { createRowId: () => ++id,
            defaults: () => ({ name: "", amount: 1, total: 2 }) });
        table.rowChanged.subscribe(async event => {
            if (event.kind === "update" && event.fields.includes("amount"))
                await event.context.update(event.row, { total: Number(event.row.getValue("amount")) * 2 });
        });
        const { grid } = await create([], { data: table, columns: [
            { name: "name", getValue: (row: any) => row.getValue("name") },
            { name: "amount", dataType: "number", getValue: (row: any) => row.getValue("amount") }
        ] });
        await grid.pasteText("A\tbad\nB\twrong\nC\t3");
        expect(table.rows).toHaveLength(1);
        expect(table.rows[0].getValue("total")).toBe(6);
        await (grid as any)._gridRows.load(0, 100);
        await grid.beginEdit(1, "amount"); type(grid, "5"); await grid.endEdit();
        expect(await grid.insertNewRow(grid.newRowSessions[0])).toBe(true);
        expect(table.rows.map(row => row.getValue("total"))).toEqual([6, 10]);
        expect(grid.hasPendingNewRow).toBe(true);
    });

    it("removes rejected input when its source row is deleted", async () => {
        const { grid, source, rows } = await create([{ id: 1, name: "A", amount: 1 }]);
        grid.getSelectionManager().selectSingleCell(0, 1);
        await grid.pasteText("invalid"); expect(grid.hasValidationErrors).toBe(true);
        await source.delete!(rows[0]); expect(grid.hasValidationErrors).toBe(false);
    });

    it("keeps invalid boolean text only in the tooltip and does not accept it on focus/blur", async () => {
        const rows = [{ id: 1, name: "A", amount: 1, approved: false }];
        const { grid, source } = await create(rows, { columns: [{ name: "approved", dataType: "boolean" }] });
        const update = vi.spyOn(source, "update");
        await grid.pasteText("something");
        const invalidInput = [...(grid as any)._invalidCellInputs.values()][0].get("approved");
        expect(invalidInput).toEqual({ text: "something", error: expect.any(String) });
        await (grid as any)._gridRows.load(0, 100);
        await grid.beginEdit(0, "approved");
        const input = grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!;
        expect(input.checked).toBe(false);
        expect((grid as any)._cellEditor.editor.error).toContain('"something"');
        await grid.endEdit();
        expect(grid.hasValidationErrors).toBe(true); expect(update).not.toHaveBeenCalled();
        await vi.waitFor(() => {
            const cell = grid.dom.querySelector<HTMLElement>('[data-elg-edit-column="approved"][aria-invalid="true"]')!;
            expect(cell.title).toContain('"something"');
            expect(cell.textContent).toBe("false");
        });
        await grid.beginEdit(0, "approved");
        grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.click();
        await vi.waitFor(() => expect(grid.editing).toBe(false));
        expect(rows[0].approved).toBe(true); expect(grid.hasValidationErrors).toBe(false);
    });

    it("serializes rejected checkbox actions as text and reopens at the accepted boolean value", async () => {
        const rows = [{ id: 1, name: "A", amount: 1, approved: false }];
        const { grid } = await create(rows, { columns: [{ name: "approved", dataType: "boolean",
            validate: (value: boolean) => value ? "Not allowed" : undefined }] });
        await grid.beginEdit(0, "approved");
        grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.click();
        await vi.waitFor(() => expect((grid as any)._cellEditor.editor.error).toBe("Not allowed"));
        await grid.endEdit();
        expect([...(grid as any)._invalidCellInputs.values()][0].get("approved")).toEqual({ text: "true", error: "Not allowed" });
        await grid.beginEdit(0, "approved");
        expect(grid.dom.querySelector<HTMLInputElement>(".elg-data-grid-editor input")!.checked).toBe(false);
        expect((grid as any)._cellEditor.editor.error).toContain('"true"');
        await grid.endEdit(); expect(grid.hasValidationErrors).toBe(true);
    });
});
