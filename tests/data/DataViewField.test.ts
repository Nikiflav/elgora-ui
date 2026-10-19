import { describe, expect, it } from "vitest";
import { getFieldDataType, type DataField } from "../../src/data/DataField";
import { DataViewFieldUtils, type DataViewField } from "../../src/data/DataViewField";
import type { DataGridColumn } from "../../src/components/datagrid/DataGridColumn";
import { getFieldGroupValue } from "../../src/data/grouping";
import { calculateSummaryResults } from "../../src/data/summary";

type Row = { quantity: number; price: number; name: string };
const row: Row = { quantity: 2, price: 15, name: "Keyboard" };

describe("Field contracts", () => {
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
