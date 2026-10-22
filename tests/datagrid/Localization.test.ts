import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import { Localization } from "../../src/localization/Localization";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { DateEditor } from "../../src/components/editors/DateEditor";
import { DateTimeEditor } from "../../src/components/editors/DateTimeEditor";
import { TimeEditor } from "../../src/components/editors/TimeEditor";
import { LookupEditor } from "../../src/components/editors/LookupEditor";

const grids: DataGrid<any>[] = [];
const original = Localization.default.locale;
const nativeShow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "showPopover");
const nativeHide = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "hidePopover");
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ font: "", measureText: (value: string) => ({ width: value.length * 8 }) } as any);
    Object.defineProperty(HTMLElement.prototype, "showPopover", { configurable: true, value: vi.fn() });
    Object.defineProperty(HTMLElement.prototype, "hidePopover", { configurable: true, value: vi.fn() });
    const matches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function(this: HTMLElement, selector: string) {
        return selector === ":popover-open" ? false : matches.call(this, selector);
    });
});
afterEach(() => {
    grids.splice(0).forEach(grid => grid.dispose());
    Localization.default.setLocale(original);
    document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals();
    if (nativeShow) Object.defineProperty(HTMLElement.prototype, "showPopover", nativeShow);
    else delete (HTMLElement.prototype as any).showPopover;
    if (nativeHide) Object.defineProperty(HTMLElement.prototype, "hidePopover", nativeHide);
    else delete (HTMLElement.prototype as any).hidePopover;
});
function create(options: any = {}) {
    const source = new ArrayDataSource([{ id: 1, amount: 1234.5 }]);
    const load = vi.spyOn(source, "loadData");
    const grid = new DataGrid({ data: source, columns: [{ name: "amount", dataType: "number", displayFormat: "N2" }], ...options });
    grids.push(grid);
    const refresh = vi.spyOn(grid, "refresh").mockImplementation(() => {});
    const internal = grid as any;
    const column = internal._gridColumns.find((item: any) => item.dataColumn?.name === "amount");
    const text = (row: any) => internal.getCellText(row, column);
    return { grid, internal, column, refresh, load, text };
}

describe("grid localization", () => {
    it("pins the same locale in lazily created calendars, time pickers and lookup grids", () => {
        const localization = new Localization({ locale: "en-US" });
        const editors = [
            new DateEditor({ value: "2026-10-22", localization, dateFormat: "d" }),
            new DateTimeEditor({ value: "2026-10-22T10:00", localization, dateFormat: "d" }),
            new TimeEditor({ value: "10:00", localization }),
            new LookupEditor({ value: 1, localization, columns: [{ name: "name" }],
                loadItems: async () => ({ items: [], totalCount: 0 }), getItemValue: () => 1,
                getItemText: () => "Item", getValueText: () => "Item" })
        ];
        localization.setLocale("bg-BG");
        try {
            for (const editor of editors) {
                const internal = editor as any;
                const popup = internal.createPopup();
                try {
                    expect(editor.locale).toBe("en-US");
                    if (internal.datePicker) expect(internal.datePicker.locale).toBe("en-US");
                    if (internal.picker) expect(internal.picker.locale).toBe("en-US");
                    if (internal.grid) expect(internal.grid.locale).toBe("en-US");
                    expect(editor.dom.hasAttribute("localization")).toBe(false);
                    expect(editor.dom.hasAttribute("locale")).toBe(false);
                } finally { popup.dispose(); }
            }
        } finally { editors.forEach(editor => editor.dispose()); }
    });
    it("reformats cached cells, group sums and totals without querying or changing selection", async () => {
        Localization.default.setLocale("en-US");
        const test = create({ groupSummary: [{ field: "amount", summaryType: "sum" }] });
        await test.internal._gridRows.load(0, 1);
        const row = test.internal._gridRows.getAt(0);
        const footer = { type: "footer", data: { totalSummary: [{ field: "amount", summaryType: "sum", value: 1234.5 }] } };
        const group = { type: "group", cells: { amount: { value: 1234.5, text: "old label" } } };
        expect(test.text(row)).toBe("1,234.50");
        test.grid.getSelectionManager().selectSingleCell(0, 0);
        const queries = test.load.mock.calls.length;
        Localization.default.setLocale("bg-BG");
        expect(test.text(row)).toBe("1\u00a0234,50");
        expect(test.text(group)).toBe("1\u00a0234,50");
        expect(test.text(footer)).toBe("1\u00a0234,50");
        expect(test.load).toHaveBeenCalledTimes(queries);
        expect(test.grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 });
        expect(test.grid.getOptions().locale).toBeUndefined();
        expect(test.refresh).toHaveBeenCalled();
        test.grid.setColumnOptions("amount", { locale: "de-DE" });
        expect(test.text(row)).toBe("1.234,50");
        expect(test.load).toHaveBeenCalledTimes(queries);
        test.grid.setColumnOptions("amount", { locale: undefined });
        expect(test.text(row)).toBe("1\u00a0234,50");
    });
    it("supports independent contexts, explicit overrides, reattachment and disposal", () => {
        const localization = new Localization({ locale: "en-US" });
        const test = create({ localization });
        test.refresh.mockClear();
        Localization.default.setLocale("bg-BG");
        expect(test.refresh).not.toHaveBeenCalled();
        localization.setLocale("de-DE"); expect(test.grid.locale).toBe("de-DE");
        test.grid.setOptions({ locale: "en-GB" }); test.refresh.mockClear();
        localization.setLocale("bg-BG"); expect(test.refresh).not.toHaveBeenCalled();
        expect(test.grid.locale).toBe("en-GB");
        test.grid.setOptions({ locale: undefined }); expect(test.grid.locale).toBe("bg-BG");
        const next = new Localization({ locale: "en-US" });
        test.grid.setOptions({ localization: next }); test.refresh.mockClear();
        localization.setLocale("de-DE"); expect(test.refresh).not.toHaveBeenCalled();
        next.setLocale("bg-BG"); expect(test.refresh).toHaveBeenCalledTimes(1);
        test.grid.dispose(); test.refresh.mockClear();
        next.setLocale("en-US"); expect(test.refresh).not.toHaveBeenCalled();
    });
    it("preserves lookup/custom labels, invalid input and explicit column locales", () => {
        const test = create({ locale: "en-US", columns: [{ name: "amount", dataType: "number", displayFormat: "N2", locale: "de-DE" }] });
        const row = { type: "data", cells: { amount: { value: 1234.5, text: "cached" } } };
        expect(test.text(row)).toBe("1.234,50");
        test.column.dataColumn.getText = async () => "custom";
        expect(test.text(row)).toBe("cached");
        delete test.column.dataColumn.getText;
        vi.spyOn(test.internal, "getInvalidCellInput").mockReturnValue({ text: "bad input", error: "Invalid" });
        expect(test.text(row)).toBe("bad input");
    });
    it("provides the resolved locale for paste factories and normal cell editing", async () => {
        const seen: string[] = [];
        const test = create({ allowEdit: true, locale: "de-DE", columns: [{ name: "amount", dataType: "number",
            resolveText: (text: string, context: any) => { seen.push(context.locale); return Number(text); } }] });
        test.grid.getSelectionManager().selectSingleCell(0, 0);
        await test.grid.pasteText("20");
        expect(seen).toEqual(["de-DE"]);
        expect(await test.grid.beginEdit(0, "amount")).toBe(true);
        const editor = test.internal._cellEditor.editor;
        expect(editor.locale).toBe("de-DE");
        test.grid.setOptions({ locale: "bg-BG" });
        expect(editor.locale).toBe("de-DE");
        expect(test.internal._cellEditor.editor).toBe(editor);
        test.grid.cancelEdit();
    });
});
