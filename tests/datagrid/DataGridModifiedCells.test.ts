import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import { DataSet } from "../../src/data/dataset/DataSet";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const grids: DataGrid<any>[] = [];
const settle = () => new Promise(done => setTimeout(done, 45));
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
async function repaint(grid: DataGrid<any>) {
    await (grid as any)._gridRows.load(0, 100); (grid as any).updateLayout(); await settle();
}
async function create() {
    const dataset = new DataSet();
    const table = dataset.createTable("items", [{ id: 1, quantity: 2, total: 20 }], {
        createRowId: () => 2, defaults: () => ({ quantity: 1, total: 10 })
    });
    table.rowChanged.subscribe(async event => {
        if (event.kind === "update" && event.fields.includes("quantity"))
            await event.context.update(event.row, { total: Number(event.row.getValue("quantity")) * 10 });
    });
    const grid = new DataGrid({ data: table, allowEdit: true, showGroupPanel: false,
        columns: ["quantity", "total"].map(name => ({ name, dataType: "number" as const,
            getValue: (row: any) => row.getValue(name) })) });
    grids.push(grid); grid.mount(document.body); await repaint(grid);
    return { grid, dataset, table, row: table.rows[0] };
}
function marked(grid: DataGrid<any>) { return grid.dom.querySelectorAll("tbody .elg-data-grid-cell-modified"); }

describe("source-owned modified cells", () => {
    it("tracks business changes and restores markers on undo/redo", async () => {
        const { grid, table, row, dataset } = await create();
        expect(marked(grid)).toHaveLength(0);
        await table.update(row, { quantity: 3 }); await repaint(grid);
        expect(marked(grid)).toHaveLength(2);
        await dataset.undoCoordinator.undo(); await repaint(grid);
        expect(marked(grid)).toHaveLength(0);
        await dataset.undoCoordinator.redo(); await repaint(grid);
        expect(marked(grid)).toHaveLength(2);
        await table.update(row, { quantity: 2 }); await repaint(grid);
        expect(marked(grid)).toHaveLength(0);
    });

    it("retains marks after a failed save and clears them only after successful acceptance", async () => {
        const { grid, table, row, dataset } = await create();
        await table.update(row, { quantity: 3 }); await repaint(grid);
        await dataset.saveChanges(async () => ({ success: false, error: "Offline" })); await repaint(grid);
        expect(marked(grid)).toHaveLength(2);
        await dataset.saveChanges(async () => ({ success: true })); await repaint(grid);
        expect(marked(grid)).toHaveLength(0);
        await table.update(row, { quantity: 4 }); await repaint(grid);
        table.acceptChanges(); await repaint(grid);
        expect(marked(grid)).toHaveLength(0);
    });

    it("does not tint pending sessions or placeholders, then marks present fields after insertion", async () => {
        const { grid, table } = await create();
        const session = await grid.createNewRow();
        await table.update(session.row, { quantity: 3 }); await repaint(grid);
        expect(marked(grid)).toHaveLength(0);
        expect(await grid.insertNewRow(session)).toBe(true); await repaint(grid);
        expect(marked(grid)).toHaveLength(2);
        expect(grid.dom.querySelector(".elg-data-grid-cell-rowheader.elg-data-grid-cell-modified")).toBeNull();
        table.acceptChanges(); await repaint(grid); expect(marked(grid)).toHaveLength(0);
    });

    it("delegates the optional capability without inventing it and retains the source receiver", async () => {
        const array = new ArrayDataSource([{ id: 1 }]);
        const fallback = new LocalGroupingDataSource(array, (row: any, name) => row[name]);
        expect(fallback.isCellModified).toBeUndefined();
        const { table, row } = await create();
        const wrapped = new LocalGroupingDataSource(table, (row, name) => row.getValue(name));
        await table.update(row, { quantity: 3 });
        expect(wrapped.isCellModified!(row, "quantity")).toBe(true);
        const foreign = new DataSet().createTable("other", [{ id: 1 }]);
        expect(() => table.isCellModified(foreign.rows[0], "id")).toThrow("Failed to check cell modification.");
    });

    it("preserves custom base colors and selection classes when marking a cell", async () => {
        const { grid, table, row } = await create();
        grid.setColumnOptions("quantity", { customCellStyle: () => ({ style: { "--elg-data-grid-cell-bg": "#fff4d6" } }) });
        grid.getSelectionManager().selectSingleCell(0, 0);
        grid.getSelectionManager().extendSelection(0, 1);
        await table.update(row, { quantity: 3 }); await repaint(grid);
        const cell = marked(grid)[0] as HTMLElement;
        expect(cell.classList.contains("elg-selected-cell")).toBe(true);
        expect(cell.style.getPropertyValue("--elg-data-grid-cell-bg")).toBe("#fff4d6");
        // jsdom does not compute color-mix; verify the real CSS composition path.
        const css = readFileSync(resolve("src/components/datagrid/DataGrid.css"), "utf8");
        expect(css).toContain("var(--elg-data-grid-state-color) var(--elg-data-grid-bg-tint), var(--elg-data-grid-cell-render-bg)");
        expect(css).toContain("var(--elg-success-color) 10%, var(--elg-data-grid-cell-base-bg)");
    });

    it("uses table equality when checking differences from accepted field values", async () => {
        const table = new DataSet().createTable("codes", [{ id: 1, code: "Alpha" }], {
            equals: (field, a, b) => field === "code" ? String(a).toLowerCase() === String(b).toLowerCase() : Object.is(a, b)
        });
        const row = table.rows[0];
        await table.update(row, { code: "Beta" }); expect(table.isCellModified(row, "code")).toBe(true);
        await table.update(row, { code: "ALPHA" }); expect(table.isCellModified(row, "code")).toBe(false);
    });

    it("does not infer modification state for an ArrayDataSource", async () => {
        const rows = [{ id: 1, quantity: 2 }];
        const source = new ArrayDataSource(rows);
        const grid = new DataGrid({ data: source, allowEdit: true, showGroupPanel: false, columns: [{ name: "quantity" }] });
        grids.push(grid); grid.mount(document.body); await repaint(grid);
        await source.update(rows[0], { quantity: 3 }); await repaint(grid);
        expect(marked(grid)).toHaveLength(0);
    });
});
