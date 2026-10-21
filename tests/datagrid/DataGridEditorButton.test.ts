import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { PopoverEditor } from "../../src/components/editors/PopoverEditor";
import { TimeEditor } from "../../src/components/editors/TimeEditor";
import { getFieldEditorButton } from "../../src/components/editors/createFieldEditor";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const grids: DataGrid<any>[] = [];
const settle = () => new Promise(done => setTimeout(done, 50));
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ font: "", measureText: () => ({ width: 50 }) } as any);
});
afterEach(async () => {
    grids.splice(0).forEach(grid => grid.dispose()); await settle();
    document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
async function create(options: any = {}) {
    const source = new ArrayDataSource([{ id: 1, date: "2026-10-21", name: "A" }], {
        createRowId: () => 2, defaults: () => ({ date: "2026-10-21", name: "" })
    });
    const grid = new DataGrid({ data: source, allowEdit: true, showGroupPanel: false,
        columns: [{ name: "date", dataType: "date" }, { name: "name" }], ...options });
    grids.push(grid); grid.mount(document.body);
    await (grid as any)._gridRows.load(0, 10);
    (grid as any).updateLayout(); await settle();
    return grid;
}
function buttons(grid: DataGrid<any>) {
    return Array.from(grid.dom.querySelectorAll<HTMLButtonElement>("tbody .elg-data-grid-cell-editor-button"));
}

describe("DataGrid cell picker buttons", () => {
    it("creates keyed hover buttons only for picker fields, including the new-row placeholder", async () => {
        const grid = await create();
        expect(buttons(grid)).toHaveLength(2);
        expect(buttons(grid).every(button => button.classList.contains("elg-data-grid-cell-editor-button-hover"))).toBe(true);
        expect(buttons(grid)[0].getAttribute("aria-label")).toBe("Open calendar");
        expect(grid.editing).toBe(false);
    });

    it("supports always/never defaults, per-column overrides, and switching while a row is pending", async () => {
        const grid = await create({ columns: [{ name: "date", dataType: "date", editorButtonVisibility: "always" },
            { name: "other", dataType: "datetime" }] });
        await grid.createNewRow();
        grid.setOptions({ defaultColumnOptions: { editorButtonVisibility: "never" } });
        await settle();
        expect(buttons(grid).every(button => button.classList.contains("elg-data-grid-cell-editor-button-always"))).toBe(true);
        grid.setOptions({ defaultColumnOptions: { editorButtonVisibility: "always" } });
        await settle();
        expect(buttons(grid)).toHaveLength(6);
        expect(buttons(grid).every(button => button.classList.contains("elg-data-grid-cell-editor-button-always"))).toBe(true);
    });

    it("does not render triggers for read-only grids or columns", async () => {
        expect(buttons(await create({ allowEdit: false }))).toHaveLength(0);
        expect(buttons(await create({ columns: [{ name: "date", dataType: "date", readonly: true }] }))).toHaveLength(0);
    });

    it("opens the picker with one click without cell mousedown or double-click handling", async () => {
        const open = vi.spyOn(PopoverEditor.prototype, "open").mockResolvedValue();
        const grid = await create();
        const button = buttons(grid)[0];
        const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
        button.dispatchEvent(down); expect(down.defaultPrevented).toBe(true);
        button.click(); await settle(); await settle();
        expect(grid.editing).toBe(true); expect(open).toHaveBeenCalledOnce();
        expect(grid.getSelectionManager().getActiveCell()).toEqual({ rowIndex: 0, colIndex: 0 });
    });

    it("a touch-style trigger click on the placeholder creates one session and opens its picker", async () => {
        const open = vi.spyOn(PopoverEditor.prototype, "open").mockResolvedValue();
        const grid = await create({ defaultColumnOptions: { editorButtonVisibility: "always" } });
        const button = buttons(grid)[1];
        const pointer = new Event("pointerdown", { bubbles: true, cancelable: true });
        Object.defineProperty(pointer, "pointerType", { value: "touch" });
        button.dispatchEvent(pointer); expect(pointer.defaultPrevented).toBe(true);
        button.click(); await settle(); await settle(); await settle();
        expect(grid.newRowSessions).toHaveLength(1);
        expect(grid.editing).toBe(true); expect(open).toHaveBeenCalledOnce();
    });

    it("Alt+Down opens a picker even when cell buttons are hidden", async () => {
        const open = vi.spyOn(PopoverEditor.prototype, "open").mockResolvedValue();
        const grid = await create({ defaultColumnOptions: { editorButtonVisibility: "never" } });
        grid.getSelectionManager().selectSingleCell(0, 0);
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true });
        grid.dom.querySelector(".elg-data-grid-viewport")!.dispatchEvent(event);
        await settle(); await settle();
        expect(event.defaultPrevented).toBe(true); expect(open).toHaveBeenCalledOnce();
    });

    it("custom factories declare metadata without being instantiated for cell rendering", async () => {
        const factory = vi.fn(context => new TimeEditor({ value: context.value, onCommit: context.onCommit }));
        const grid = await create({ columns: [{ name: "time", createEditor: factory,
            editorButton: { icon: "ri-time-line", label: "Choose time" } }] });
        expect(factory).not.toHaveBeenCalled(); expect(buttons(grid)).toHaveLength(2);
        expect(buttons(grid)[0].title).toBe("Choose time");
        expect(getFieldEditorButton({ name: "x", dataType: "date", createEditor: factory })).toBeUndefined();
    });

    it("keeps always visibility independent of hover-capability media queries", () => {
        const css = readFileSync(resolve("src/components/datagrid/DataGrid.css"), "utf8");
        expect(css).toMatch(/\.elg-data-grid-cell-editor-button-always\s*\{\s*visibility: visible;/);
        expect(css).toContain("@media (hover: hover)");
    });
});
