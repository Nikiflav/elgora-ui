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
    it("updates both pair baselines without persisting stretched screen widths", () => {
        const test = setup("stretch-all");
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { button: 0, clientX: 200 }), test.data[0]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 240 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 240 }));
        expect(test.data[0].naturalWidth).toBe(120);
        expect(test.grid.getColumn("a")!.width).toBe(120);
        test.internal._gridOptions.columnWidthMode = "fixed";
        test.distribute();
        expect(test.widths()).toEqual([120, 180, 100]);
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

    it.each(["fixed", "stretch-auto", "stretch-all"] as const)("uses the default manual behavior for %s and remains stable after mouseup", mode => {
        const test = setup(mode);
        test.distribute();
        const before = test.widths();
        test.internal.resizeColumn(new MouseEvent("mousedown", { button: 0, clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 130 }));
        const expected = [before[0], before[1] + 30, before[2] - (mode === "fixed" ? 0 : 30)];
        expect(test.widths()).toEqual(expected);
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 130 }));
        test.distribute();
        test.grid.refresh();
        test.internal.renderColGroup();
        expect(test.widths()).toEqual(expected);
        expect(test.data[0].naturalWidth).toBe(100);
        expect(test.grid.getColumn("a")!.width).toBe(100);
    });

    it.each(["stretch-auto", "stretch-all"] as const)("does not move auto columns before the resized column in %s", mode => {
        const test = setup(mode);
        test.data[0].isAutoWidth = true;
        test.distribute();
        const before = test.widths();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 125 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 125 }));
        test.distribute();
        expect(test.widths()).toEqual([before[0], before[1] + 25, before[2] - 25]);
        expect(test.data[0].isAutoWidth).toBe(true);
    });

    it.each(["fixed", "stretch-auto", "stretch-all"] as const)("allows an independent override in %s, including shrinking without automatic refill", mode => {
        const test = setup(mode);
        test.grid.setOptions({ columnResizeMode: "independent" });
        test.distribute();
        const before = test.widths();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 60 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 60 }));
        test.distribute();
        expect(test.widths()).toEqual([before[0], before[1] - 40, before[2]]);
        expect(test.grid.getOptions().columnResizeMode).toBe("independent");
    });

    it("supports next-column in fixed mode and clamps the pair at the neighbor minimum", () => {
        const test = setup("fixed");
        test.grid.setOptions({ columnResizeMode: "next-column" });
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 500 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 500 }));
        test.distribute();
        expect(test.widths()).toEqual([100, 260, 40]);
        expect(test.grid.getColumn("b")!.width).toBe(260);
        expect(test.grid.getColumn("c")!.width).toBe(40);
    });

    it("resizes the last column independently, without changing the row header", () => {
        const test = setup("stretch-all", true);
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[2]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 140 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 140 }));
        test.distribute();
        expect(test.widths()).toEqual([200, 400, 240]);
        expect(test.internal._gridColumns[0].width).toBe(80);
    });

    it("restores both columns and the prior independent layout on Escape", () => {
        const test = setup("stretch-all");
        test.grid.setOptions({ columnResizeMode: "independent" });
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[0]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 120 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 120 }));
        const before = test.widths();
        test.grid.setOptions({ columnResizeMode: "next-column" });
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 130 }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        test.distribute();
        expect(test.widths()).toEqual(before);
        expect(test.data[1].isAutoWidth).toBe(true);
        expect(test.grid.getColumn("b")!.width).toBeUndefined();
    });

    it("does not change width or auto eligibility for a click without movement", () => {
        const test = setup("stretch-auto");
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 100 }));
        expect(test.data[1].isAutoWidth).toBe(true);
        expect(test.grid.getColumn("b")!.width).toBeUndefined();
    });

    it("resumes responsive stretching after an actual viewport resize", () => {
        const test = setup("stretch-all");
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[0]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 140 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 140 }));
        test.internal._viewportWidth = 1000;
        test.distribute();
        expect(test.widths()).toEqual([300, 450, 250]);
        test.internal._viewportWidth = 800;
        test.distribute();
        expect(test.widths()).toEqual([240, 360, 200]);
    });

    it("uses the next visible column after reordering, skipping hidden definitions", async () => {
        const test = setup("fixed");
        test.grid.setOptions({ columnResizeMode: "next-column", visibleColumns: ["c", "a"] });
        await Promise.resolve();
        const visible = test.internal._gridColumns.filter((col: any) => col.type === "data");
        test.distribute();
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), visible[0]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 120 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 120 }));
        expect(visible.map((col: any) => col.width)).toEqual([120, 80]);
        expect(test.grid.getColumn("b")!.width).toBeUndefined();
    });

    it("restores the original pair on touch cancellation", () => {
        const test = setup("stretch-all");
        test.distribute();
        const touch = (x: number) => ({ identifier: 1, clientX: x, clientY: 0 }) as Touch;
        test.internal.resizeColumn(new TouchEvent("touchstart", { touches: [touch(100)], changedTouches: [touch(100)] }), test.data[0]);
        window.dispatchEvent(new TouchEvent("touchmove", { touches: [touch(130)], changedTouches: [touch(130)] }));
        expect(test.widths()).toEqual([230, 370, 200]);
        window.dispatchEvent(new TouchEvent("touchcancel", { changedTouches: [touch(130)] }));
        expect(test.widths()).toEqual([200, 400, 200]);
        expect(test.grid.getColumn("a")!.width).toBe(100);
        expect(test.grid.getColumn("b")!.width).toBeUndefined();
    });

    it("applies resize-mode changes without reloading data and cancels an active gesture first", () => {
        const test = setup("fixed");
        test.distribute();
        const reload = vi.spyOn(test.grid, "reloadRows");
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 140 }));
        test.grid.setOptions({ columnResizeMode: "next-column" });
        expect(test.widths()).toEqual([100, 200, 100]);
        expect(test.data[1].isAutoWidth).toBe(true);
        expect(reload).not.toHaveBeenCalled();
        test.grid.setOptions({ columnResizeMode: undefined });
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.data[1]);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 120 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 120 }));
        expect(test.widths()).toEqual([100, 220, 100]);
    });
});
