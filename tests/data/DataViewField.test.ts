import { describe, expect, it } from "vitest";
import { getFieldDataType, type DataField } from "../../src/data/DataField";
import { DataViewFieldUtils, type DataViewField } from "../../src/data/DataViewField";
import type { DataGridColumn } from "../../src/components/datagrid/DataGridColumn";
import { getFieldGroupValue } from "../../src/data/grouping";
import { calculateSummaryResults } from "../../src/data/summary";

type Row = { quantity: number; price: number; name: string };
const row: Row = { quantity: 2, price: 15, name: "Keyboard" };

describe("Field contracts", () => {
    it("formats numeric display without modifying values and recompiles changed formats/locales", async () => {
        const field: DataViewField<Row> = { name: "price", dataType: "number", displayFormat: "C2€", locale: "en-US" };
        expect(await DataViewFieldUtils.getDataCell(field, row)).toMatchObject({ value: 15, text: "15.00\u00a0€" });
        field.displayFormat = "N0";
        expect(await DataViewFieldUtils.getText(field, row)).toBe("15");
        field.displayFormat = "N2"; field.locale = "bg-BG";
        expect(await DataViewFieldUtils.getText(field, row)).toBe("15,00");
        expect(DataViewFieldUtils.formatDisplayValue(field, null)).toBe("");
        expect(row.price).toBe(15);
    });
    it("prioritizes getText and lookup over displayFormat, and displayFormat over formatValue", async () => {
        const field: DataViewField<Row> = { name: "price", dataType: "number", displayFormat: "N2", locale: "en-US",
            formatValue: () => "editor", getText: async () => "label" };
        expect(await DataViewFieldUtils.getText(field, row)).toBe("label");
        delete field.getText;
        field.lookup = { loadItems: async () => ({ items: [], totalCount: 0 }), getValueText: () => "lookup" };
        expect(await DataViewFieldUtils.getText(field, row)).toBe("lookup");
        delete field.lookup;
        expect(await DataViewFieldUtils.getText(field, row)).toBe("15.00");
        delete field.displayFormat;
        expect(await DataViewFieldUtils.getText(field, row)).toBe("editor");
    });
    it("formats aggregates but never treats a count or custom label as a currency", () => {
        const field: DataViewField<Row> = { name: "price", dataType: "number", displayFormat: "C2€", locale: "en-US" };
        expect(DataViewFieldUtils.formatSummaryValue(field, 1234.5, "sum")).toBe("1,234.50\u00a0€");
        expect(DataViewFieldUtils.formatSummaryValue(field, 1234, "count")).toBe("1234");
        expect(DataViewFieldUtils.formatSummaryValue(field, 2, "distinct")).toBe("2");
        expect(DataViewFieldUtils.formatSummaryValue(field, "Label", "custom")).toBe("Label");
    });
    it("reuses date-only patterns without timezone conversion", () => {
        expect(DataViewFieldUtils.formatDisplayValue({ name: "date", dataType: "date", displayFormat: "dd.MM.yyyy" }, "2026-10-22"))
            .toBe("22.10.2026");
        expect(() => DataViewFieldUtils.formatDisplayValue({ name: "name", displayFormat: "N2" }, "text")).toThrow();
    });
    it("reuses value access from data field through view field to grid column", async () => {
        const field: DataField<Row> = {
            name: "amount", dataType: "number", getValue: async item => item.quantity * item.price
        };
        const view: DataViewField<Row> = { ...field, caption: "Amount" };
        const column: DataGridColumn<Row> = { ...view, width: 120, textAlign: "end" };
        expect(await DataViewFieldUtils.getValue(column, row)).toBe(30);
        expect(DataViewFieldUtils.getDataType(view)).toBe("number");
        expect(view).not.toHaveProperty("width");
        expect(field).not.toHaveProperty("caption");
    });

    it("defaults an unspecified dataType to string", () => {
        const view: DataViewField<Row> = { name: "name" };
        expect(getFieldDataType(view)).toBe("string");
        expect(DataViewFieldUtils.getDataType(view)).toBe("string");
        expect(getFieldDataType({ dataType: "date" })).toBe("date");
    });

    it("supports per-row display text and direct member access in a common view", async () => {
        const view: DataViewField<Row> = {
            name: "name", caption: "Product", getText: async item => item.name.toUpperCase()
        };
        expect(await DataViewFieldUtils.getDataCell(view, row)).toEqual({
            column: view, rowData: row, value: "Keyboard", text: "KEYBOARD"
        });
    });

    it("groups using a data-only field definition", async () => {
        const field: DataField<Row> = { name: "name", dataType: "string", groupInterval: "firstChar" };
        expect(await getFieldGroupValue(field, row)).toBe("K");
        const calculated: DataField<Row> = {
            name: "amount", getValue: async item => item.quantity * item.price,
            groupInterval: "size"
        };
        expect(await getFieldGroupValue(calculated, row, [{
            name: "size", text: "Size", getGroupValue: (_item, value) => value >= 20 ? "Large" : "Small"
        }])).toBe("Large");
    });

    it("calculates numeric summaries with only data-access metadata", async () => {
        const field: DataField<Row> = {
            name: "amount", dataType: "number", getValue: async item => item.quantity * item.price
        };
        const result = await calculateSummaryResults([row], [{ field: "amount", summaryType: "sum" }],
            async item => field.getValue!(item), () => field);
        expect(result).toEqual([{ field: "amount", summaryType: "sum", value: 30 }]);
    });

    it("infers numeric summary eligibility from values when no dataType is declared", async () => {
        const field: DataField<Row> = { name: "price" };
        const result = await calculateSummaryResults([row], [{ field: "price", summaryType: "sum" }],
            async item => item.price, () => field);
        expect(result[0].value).toBe(15);
    });

    it("does not treat an explicitly textual field as numeric", async () => {
        const view: DataViewField<Row> = { name: "price", dataType: "string" };
        const result = await calculateSummaryResults([row], [{ field: "price", summaryType: "sum" }],
            async item => item.price, () => view);
        expect(result).toEqual([]);
    });
});
