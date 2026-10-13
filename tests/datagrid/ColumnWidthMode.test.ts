import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid, type ColumnWidthMode } from "../../src/components/datagrid/DataGrid";

const grids: DataGrid<any>[] = [];
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { grids.splice(0).forEach(grid => grid.dispose()); vi.unstubAllGlobals(); });
function setup(mode?: ColumnWidthMode, header = false) {
    const grid = new DataGrid({ data: [], showRowHeader: header, columnWidthMode: mode,
        columns: [{ name: "a", width: 100 }, { name: "b" }, { name: "c", width: 100 }],
        fixedLeftColumns: 1, fixedRightColumns: 1 });
    grids.push(grid);
    const internal = grid as any;
    const data = internal._gridColumns.filter((col: any) => col.type === "data");
    data[1].naturalWidth = 200;
    data[1].widthMeasured = true;
    internal._viewportWidth = 800 + (header ? 80 : 0);
    const widths = () => data.map((col: any) => col.width);
    const distribute = () => internal.redistributeColumnWidths();
    return { grid, internal, data, widths, distribute };
}
describe("DataGrid columnWidthMode", () => {
    it.each([
        ["fixed", [100, 200, 100]],
        ["stretch-auto", [100, 600, 100]],
        ["stretch-all", [200, 400, 200]]
    ] as const)("applies %s to mixed column widths", (mode, expected) => {
        const test = setup(mode);
        test.distribute();
        expect(test.widths()).toEqual(expected);
    });
    it("defaults to stretch-auto and no longer exposes the old option", () => {
        const test = setup();
        test.distribute();
        expect(test.grid.getOptions().columnWidthMode).toBe("stretch-auto");
        expect(test.grid.getOptions()).not.toHaveProperty("autoFillViewportWidth");
        expect(test.widths()).toEqual([100, 600, 100]);
    });
    it.each(["stretch-auto", "stretch-all"] as const)("never shrinks base widths in %s", mode => {
        const test = setup(mode);
        test.internal._viewportWidth = 300;
        test.distribute();
        expect(test.widths()).toEqual([100, 200, 100]);
    });
    it("excludes the row header, but includes pinned data columns", () => {
        const test = setup("stretch-all", true);
        test.distribute();
        expect(test.widths()).toEqual([200, 400, 200]);
        expect(test.internal._gridColumns[0].width).toBe(80);
    });
    it("does not accumulate stretch across repeated resizes or mode changes", () => {
        const test = setup("stretch-all");
        for (let i = 0; i < 10; i++) {
            test.internal._viewportWidth = 1200;
            test.distribute();
            expect(test.widths()).toEqual([300, 600, 300]);
            test.internal._viewportWidth = 800;
            test.distribute();
            expect(test.widths()).toEqual([200, 400, 200]);
        }
        test.internal._gridOptions.columnWidthMode = "fixed";
        test.distribute();
        expect(test.widths()).toEqual([100, 200, 100]);
        test.internal._gridOptions.columnWidthMode = "stretch-auto";
        test.distribute();
        expect(test.widths()).toEqual([100, 600, 100]);
    });
    it("stretches explicitly sized columns even when there are no automatic columns", () => {
        const test = setup("stretch-all");
        test.data[1].isAutoWidth = false;
        test.distribute();
        expect(test.widths()).toEqual([200, 400, 200]);
    });
    it("retains explicit baselines during public mode changes and layout rebuilds", async () => {
        const test = setup("stretch-all");
        test.distribute();
        test.grid.setOptions({ columnWidthMode: "fixed" });
        await Promise.resolve();
        test.distribute();
        const columns = test.internal._gridColumns.filter((col: any) => col.type === "data");
        expect(columns[0].width).toBe(100);
        expect(columns[2].width).toBe(100);
        expect(test.grid.getColumn("a")!.width).toBe(100);
        expect(test.grid.getOptions().columnWidthMode).toBe("fixed");
    });
    it("updates the manual-resize baseline without persisting stretched screen widths", () => {
        const test = setup("stretch-all");
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { button: 0, clientX: 200 }), test.data[0]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 240 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 240 }));
        expect(test.data[0].naturalWidth).toBe(120);
        expect(test.grid.getColumn("a")!.width).toBe(120);
        test.internal._gridOptions.columnWidthMode = "fixed";
        test.distribute();
        expect(test.widths()).toEqual([120, 200, 100]);
    });
    it("restores baseline and automatic eligibility on resize cancellation", () => {
        const test = setup("stretch-all");
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { button: 0, clientX: 400 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 450 }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(test.data[1].naturalWidth).toBe(200);
        expect(test.data[1].isAutoWidth).toBe(true);
        expect(test.widths()).toEqual([200, 400, 200]);
    });
});
