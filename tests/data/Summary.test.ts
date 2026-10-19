import { describe, expect, it, vi } from "vitest";
import { calculateSummaryResults, SummaryCalculator, type SummaryDefinition, type SummaryRequest } from "../../src/data/summary";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import type { DataField } from "../../src/data/DataField";
import type { DataSource, QueryArgs } from "../../src/data/DataSource";

describe("Shared summary lifecycle", () => {
    const numeric: SummaryRequest[] = ["sum", "avg", "min", "max"].map(summaryType => ({ field: "value", summaryType }));
    const getValue = async (row: { value: any }) => row.value;

    it("stays synchronous for synchronous accessors and built-in accumulators", async () => {
        const read = vi.fn((row: { value: number }) => row.value);
        const calculator = new SummaryCalculator(numeric, read);
        expect(calculator.accumulate({ value: 2 })).toBeUndefined();
        expect(calculator.accumulate({ value: 4 })).toBeUndefined();
        expect(read).toHaveBeenCalledTimes(2);
        expect((await calculator.finalize()).map(summary => summary.value)).toEqual([6, 3, 2, 4]);
    });

    it("reads undefined once per row and preserves interleaved custom callback order", async () => {
        const read = vi.fn(() => undefined);
        const calls: string[] = [];
        const custom: SummaryDefinition<any, number> = { name: "observe", text: "Observe", start: () => 0,
            accumulate: (state, _value, _row, context) => { calls.push(context.field); return state + 1; }, finalize: state => state };
        const calculator = new SummaryCalculator(["a", "b", "a"].map(field => ({ field, summaryType: "observe" })),
            read, undefined, [custom]);
        calculator.accumulate({});
        calculator.accumulate({});
        expect(read).toHaveBeenCalledTimes(4);
        expect(calls).toEqual(["a", "b", "a", "a", "b", "a"]);
        expect((await calculator.finalize()).map(summary => summary.value)).toEqual([2, 2, 2]);
    });

    it("handles thenable accessors and async callbacks sequentially without concurrent reads", async () => {
        let pending = false;
        let resolutions = 0;
        const read = vi.fn((row: { value: number }) => {
            expect(pending).toBe(false);
            pending = true;
            return { then(resolve: (value: number) => void) {
                resolutions++;
                queueMicrotask(() => { pending = false; resolve(row.value); });
            } };
        });
        const result = await calculateSummaryResults([{ value: 2 }, { value: 4 }], numeric, read);
        expect(read).toHaveBeenCalledTimes(2);
        expect(resolutions).toBe(2);
        expect(result.map(summary => summary.value)).toEqual([6, 3, 2, 4]);
    });

    it("uses independent states per request and ignores nonfinite/non-numeric values", async () => {
        const rows = [2, 4, null, undefined, "6", false, NaN, Infinity, -Infinity].map(value => ({ value }));
        expect(await calculateSummaryResults(rows, numeric, getValue)).toEqual([
            { field: "value", summaryType: "sum", value: 6 },
            { field: "value", summaryType: "avg", value: 3 },
            { field: "value", summaryType: "min", value: 2 },
            { field: "value", summaryType: "max", value: 4 }
        ]);
    });

    it("preserves empty-result behavior without starting custom summaries", async () => {
        const start = vi.fn(() => 0);
        const custom: SummaryDefinition<any> = { name: "custom", text: "Custom", start,
            accumulate: state => state + 1, finalize: state => state };
        expect(await calculateSummaryResults([], [...numeric, { field: "value", summaryType: "count" },
            { field: "value", summaryType: "custom" }], getValue, undefined, [custom])).toEqual([]);
        expect(start).not.toHaveBeenCalled();
        expect(await calculateSummaryResults([{ value: null }], numeric, getValue)).toEqual([]);
    });

    it("retains numeric metadata checks for group and total calculators", async () => {
        const field: DataField<{ value: number }> = { name: "value", dataType: "string" };
        const calculator = new SummaryCalculator(numeric, getValue, () => field, undefined, "West");
        await calculator.accumulate({ value: 3 });
        expect(await calculator.finalize()).toEqual([]);
        expect(await calculateSummaryResults([{ value: 3 }], numeric, getValue, () => field)).toEqual([]);
    });

    it("awaits custom callbacks, passes row/group context and supports mutation or replacement states", async () => {
        const calls: string[] = [];
        const rows = [{ value: "A" }, { value: "B" }];
        const custom: SummaryDefinition<(typeof rows)[number], string[]> = {
            name: "join", text: "Join", dependsOnOrder: true,
            start: async context => {
                await Promise.resolve();
                expect(context.row).toBe(rows[0]);
                expect(context.value).toBe("A");
                expect(context.groupValue).toBe("West");
                calls.push("start");
                return [];
            },
            accumulate: async (state, value, row, context) => {
                await Promise.resolve();
                expect(row).toBe(context.row);
                expect(context.groupValue).toBe("West");
                calls.push(value);
                if (value === "A") state.push(value); // void keeps the mutated state
                else return [...state, value];
            },
            finalize: async (state, context) => {
                expect(context).toEqual({ field: "value", groupValue: "West" });
                calls.push("finalize");
                return state.join("/");
            }
        };
        const calculator = new SummaryCalculator([{ field: "value", summaryType: "join" }], getValue, undefined, [custom], "West");
        for (const row of rows) await calculator.accumulate(row);
        expect(await calculator.finalize()).toEqual([{ field: "value", summaryType: "join", value: "A/B" }]);
        expect(calls).toEqual(["start", "A", "B", "finalize"]);
    });

    it("omits unsupported and undefined summaries but retains zero", async () => {
        const custom: SummaryDefinition<any> = { name: "hidden", text: "Hidden", start: () => 0,
            accumulate: () => {}, finalize: () => undefined };
        const summaries = ["unknown", "hidden", "sum"].map(summaryType => ({ field: "value", summaryType }));
        expect(await calculateSummaryResults([{ value: 0 }], summaries, getValue, undefined, [custom]))
            .toEqual([{ field: "value", summaryType: "sum", value: 0 }]);
    });

    it("propagates asynchronous summary failures", async () => {
        const custom: SummaryDefinition<any> = { name: "fail", text: "Fail", start: () => 0,
            accumulate: async () => { throw new Error("Summary failed"); }, finalize: state => state };
        await expect(calculateSummaryResults([{ value: 1 }], [{ field: "value", summaryType: "fail" }],
            getValue, undefined, [custom])).rejects.toThrow("Summary failed");
    });
});

describe("Local summary ownership", () => {
    const rows = [{ region: "West", quantity: 2, price: 10 },
        { region: "East", quantity: 1, price: 5 }, { region: "West", quantity: 3, price: 10 }];
    type Row = (typeof rows)[number];
    const amount: DataField<Row> = { name: "amount", dataType: "number", getValue: async row => row.quantity * row.price };
    const totalSummary: SummaryRequest[] = [{ field: "amount", summaryType: "sum" }];
    const access = async (row: Row, field: string) => field === "amount" ? amount.getValue!(row) : (row as any)[field];

    it("shares field reads within a row and reuses results until invalidation", async () => {
        const read = vi.fn((row: Row, field: string) => (row as any)[field]);
        const array = new ArrayDataSource(rows);
        const source = new LocalGroupingDataSource(array, read, name => ({ name }));
        const summaries = ["sum", "avg"].map(summaryType => ({ field: "quantity", summaryType }));
        const args = { groupBy: [{ field: "region" }], totalSummary: summaries, groupSummary: summaries };
        const first = await source.loadData(args);
        expect(read).toHaveBeenCalledTimes(3);
        expect(first.totalSummary?.map(summary => summary.value)).toEqual([6, 2]);
        await source.loadData(args);
        expect(read).toHaveBeenCalledTimes(3);
        array.invalidateCache();
        await source.loadData(args);
        expect(read).toHaveBeenCalledTimes(6);
    });

    it("loads once and resolves computed fields once per row before paging", async () => {
        const array = new ArrayDataSource(rows);
        const load = vi.spyOn(array, "loadData");
        const getValue = vi.fn(access);
        const source = new LocalGroupingDataSource(array, getValue, name => name === "amount" ? amount : undefined);
        const args: QueryArgs = { filter: ["region", "=", "West"], orderby: [["quantity", "desc"]],
            skip: 1, top: 1, totalSummary, requireTotalCount: true };
        const result = await source.loadData(args);
        expect(load).toHaveBeenCalledOnce();
        expect(load.mock.calls[0][0].totalSummary).toBeUndefined();
        expect(getValue).toHaveBeenCalledTimes(2);
        expect(result.args).toBe(args);
        expect(result.dataItems).toEqual([rows[0]]);
        expect(result.dataItems![0]).toBe(rows[0]);
        expect(result.totalCount).toBe(2);
        expect(result.totalSummary).toEqual([{ field: "amount", summaryType: "sum", value: 50 }]);
    });

    it("calculates async custom totals only once in sorted source order", async () => {
        const start = vi.fn(() => "");
        const custom: SummaryDefinition<Row, string> = { name: "sequence", text: "Sequence", dependsOnOrder: true,
            start, accumulate: async (state, value) => state + value, finalize: async state => state };
        const source = new LocalGroupingDataSource(new ArrayDataSource(rows), access, undefined, undefined, [custom]);
        const result = await source.loadData({ orderby: [["quantity", "desc"]], top: 0,
            totalSummary: [{ field: "quantity", summaryType: "sequence" }] });
        expect(result.dataItems).toEqual([]);
        expect(result.totalSummary?.[0].value).toBe("321");
        expect(start).toHaveBeenCalledOnce();
    });

    it("shares lifecycle rules for group and total summaries over the full set before group paging", async () => {
        const source = new LocalGroupingDataSource(new ArrayDataSource(rows), access,
            name => name === "amount" ? amount : { name });
        const result = await source.loadData({ groupBy: [{ field: "region" }], skip: 1, top: 1, totalSummary,
            groupSummary: [{ field: "amount", summaryType: "sum" }, { field: "amount", summaryType: "avg" }] });
        expect(result.totalCount).toBe(2);
        expect(result.totalSummary?.[0].value).toBe(55);
        // Public group results contain one value per field: the last request wins,
        // but sum/avg accumulation must use independent states.
        expect(result.groups).toEqual([{ groupField: "region", groupValue: "West", count: 2, summaryValues: { amount: 25 } }]);
    });

    it("isolates custom group states from each other and from the total", async () => {
        const starts: any[] = [];
        const custom: SummaryDefinition<Row, number[]> = { name: "list", text: "List", dependsOnOrder: true,
            start: async context => { starts.push(context.groupValue); return []; },
            accumulate: async (state, value) => { state.push(value); },
            finalize: async state => state.join(",") };
        const source = new LocalGroupingDataSource(new ArrayDataSource(rows), access, undefined, undefined, [custom]);
        const summaries = [{ field: "quantity", summaryType: "list" }];
        const result = await source.loadData({ groupBy: [{ field: "region" }], orderby: [["quantity", "desc"]],
            groupSummary: summaries, totalSummary: summaries });
        expect(starts).toEqual([undefined, "West", "East"]);
        expect(result.totalSummary?.[0].value).toBe("3,2,1");
        expect(result.groups?.map(group => group.summaryValues?.quantity)).toEqual(["1", "3,2"]);
    });

    it("passes remote totals and grouped responses through unchanged", async () => {
        const loadData = vi.fn(async (args: QueryArgs) => ({ args, groups: [], totalCount: 0,
            totalSummary: [{ field: "amount", summaryType: "sum", value: 900 }] }));
        const getValue = vi.fn(access);
        const source: DataSource<Row> = new LocalGroupingDataSource({ loadData }, getValue);
        const args = { groupBy: [{ field: "region" }], totalSummary };
        const result = await source.loadData(args);
        expect(loadData).toHaveBeenCalledExactlyOnceWith(args);
        expect(result).toBe(await loadData.mock.results[0].value);
        expect(result.totalSummary?.[0].value).toBe(900);
        expect(getValue).not.toHaveBeenCalled();
    });

    it("leaves flat remote paging and totals to the source", async () => {
        const loadData = vi.fn(async (args: QueryArgs) => ({ args, dataItems: [rows[1]],
            totalSummary: [{ field: "amount", summaryType: "sum", value: 900 }] }));
        const source = new LocalGroupingDataSource({ loadData }, access);
        const args = { skip: 1, top: 1, totalSummary };
        const result = await source.loadData(args);
        expect(loadData).toHaveBeenCalledExactlyOnceWith(args);
        expect(result.totalSummary?.[0].value).toBe(900);
    });

    it("does not ask fallback flat queries to calculate discarded totals", async () => {
        const loadData = vi.fn(async (args: QueryArgs) => ({ args, dataItems: rows }));
        const source = new LocalGroupingDataSource({ loadData }, access);
        const result = await source.loadData({ groupBy: [{ field: "region" }], totalSummary });
        expect(loadData).toHaveBeenCalledTimes(2);
        expect(loadData.mock.calls[0][0].totalSummary).toEqual(totalSummary);
        expect(loadData.mock.calls[1][0].totalSummary).toBeUndefined();
        expect(result.totalSummary?.[0].value).toBe(55);
    });
});
