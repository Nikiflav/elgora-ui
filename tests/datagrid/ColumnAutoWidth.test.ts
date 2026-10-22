import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";

const grids: DataGrid<any>[] = [];
let measure: ReturnType<typeof vi.fn>;
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    measure = vi.fn((text: string) => ({ width: text.length * 10 }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ measureText: measure, font: "" } as any);
});
afterEach(() => { grids.splice(0).forEach(grid => grid.dispose()); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup(options: Record<string, unknown> = {}) {
    const grid = new DataGrid({ data: [], showRowHeader: false, columnWidthMode: "fixed",
        columns: [{ name: "a", caption: "An unusually long column heading" }, { name: "fixed", width: 50 }], ...options });
    grids.push(grid);
    const internal = grid as any;
    vi.spyOn(grid, "refresh").mockImplementation(() => {});
    const column = internal._gridColumns.find((c: any) => c.dataColumn?.name === "a");
    const fixed = internal._gridColumns.find((c: any) => c.dataColumn?.name === "fixed");
    const read = (text?: string) => internal.measureAndAdjustScroll({ rows: text === undefined ? [] : [{
        index: 0, tr: document.createElement("tr"), gridRow: {
            type: "data", visibleIndex: 0, level: 0,
            cells: { a: { text }, fixed: { text: "This explicit width must not change" } }
        }
    }], firstVisibleIndex: 0 });
    const totals = (value: unknown, summaryType = "sum") => {
        internal._totalSummary = [{ field: "a", summaryType, value }];
        internal._totalSummaryLoaded = true;
        internal._totalSummaryWidthVersion++;
    };
    return { grid, internal, column, fixed, read, totals };
}

describe("automatic column measurement", () => {
    it("measures the formatted total including grouping and a currency suffix", () => {
        const test = setup({ columns: [{ name: "a", dataType: "number", displayFormat: "C2€", locale: "en-US" }, { name: "fixed", width: 50 }] });
        test.totals(1234567.5); test.read("1.00\u00a0€");
        expect(measure).toHaveBeenCalledWith("1,234,567.50\u00a0€");
        expect(test.column.naturalWidth).toBe("1,234,567.50\u00a0€".length * 10 + 24);
    });
    it("uses an 80px floor without letting a populated column's caption dictate its width", () => {
        const test = setup(); test.read("1");
        expect(test.column.naturalWidth).toBe(80);
        expect(test.fixed.naturalWidth).toBe(50);
        expect(test.grid.getColumn("a")?.width).toBeUndefined();
    });
    it("takes the maximum of body and total text and measures a total only once", () => {
        const test = setup(); test.totals(1234567890); test.read("12");
        expect(test.column.naturalWidth).toBe(124);
        expect(test.column.width).toBe(124);
        const calls = measure.mock.calls.length; test.read("12");
        expect(measure).toHaveBeenCalledTimes(calls);
        expect(test.fixed.width).toBe(50);
    });
    it("grows for late totals but never shrinks the measured data baseline", () => {
        const test = setup(); test.read("Long data value");
        expect(test.column.naturalWidth).toBe(174);
        test.totals("12345678901234567890"); test.read("x");
        expect(test.column.naturalWidth).toBe(224);
        test.totals(1); test.read("x");
        expect(test.column.naturalWidth).toBe(224);
    });
    it("measures the displayed labels for multiple summaries", () => {
        const test = setup({ groupSummary: [{ field: "a", summaryType: "sum" }] });
        test.totals(12345);
        test.internal._totalSummary.push({ field: "a", summaryType: "avg", value: 6 });
        test.read("1");
        expect(measure).toHaveBeenCalledWith("sum: 12345, avg: 6");
        expect(test.column.naturalWidth).toBe("sum: 12345, avg: 6".length * 10 + 24);
    });
    it("excludes hidden footers, then measures them when enabled", () => {
        const test = setup({ showColumnFooters: false });
        test.totals(1234567890); test.read("1");
        expect(test.column.width).toBe(80);
        test.internal._gridOptions.showColumnFooters = true; test.read("1");
        expect(test.column.width).toBe(124);
    });
    it("handles footer-only results without blocking later data measurement or refreshing forever", () => {
        const test = setup(); test.totals(1234567890); test.read();
        expect(test.column.naturalWidth).toBe(124);
        expect(test.column.widthMeasured).toBe(false);
        vi.mocked(test.grid.refresh).mockClear(); test.read();
        expect(test.grid.refresh).not.toHaveBeenCalled();
        test.read("A much longer data value");
        expect(test.column.naturalWidth).toBe("A much longer data value".length * 10 + 24);
        expect(test.column.widthMeasured).toBe(true);
    });
    it("does not reserve group indentation for a total footer", () => {
        const test = setup(); test.column.groupIndex = 0;
        test.totals(1234567890); test.read();
        expect(test.column.naturalWidth).toBe(124);
    });
    it("does not reset stretched widths when a new total fits the existing baseline", () => {
        const test = setup({ columnWidthMode: "stretch-auto" });
        test.internal._viewportWidth = 800;
        test.read("1"); expect(test.column.width).toBe(750);
        test.totals(2); test.read("1");
        expect(test.column.naturalWidth).toBe(80);
        expect(test.column.width).toBe(750);
    });
    it("does not change a manually resized column when a later total arrives", () => {
        const test = setup(); test.read("1");
        test.internal.resizeColumn(new MouseEvent("mousedown", { clientX: 100 }), test.column);
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 60 }));
        window.dispatchEvent(new MouseEvent("mouseup", { clientX: 60 }));
        test.totals(1234567890); test.read("1");
        expect(test.column.isAutoWidth).toBe(false);
        expect(test.column.width).toBe(40);
        expect(test.fixed.width).toBe(50);
    });
});
