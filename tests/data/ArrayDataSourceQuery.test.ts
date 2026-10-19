import { describe, expect, it } from "vitest";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import type { OrderByToken } from "../../src/data/grouping";

describe("ArrayDataSource sorting", () => {
    const rows = [
        { id: 1, country: "West", quantity: 2, c: "A" },
        { id: 2, country: "East", quantity: 3, c: "Z" },
        { id: 3, country: "East", quantity: 1, c: "M" }
    ];

    it.each<{ orderby: OrderByToken[]; ids: number[] }>([
        { orderby: ["country"], ids: [2, 3, 1] },
        { orderby: [["country", "asc"]], ids: [2, 3, 1] },
        { orderby: [["country", "desc"]], ids: [1, 2, 3] },
        { orderby: ["country", ["quantity", "desc"]], ids: [2, 3, 1] },
        { orderby: [["country", "asc"], "quantity"], ids: [3, 2, 1] }
    ])("sorts using $orderby without changing the source array", async ({ orderby, ids }) => {
        const source = new ArrayDataSource(rows);
        const result = await source.loadData({ orderby });
        expect(result.dataItems?.map(row => row.id)).toEqual(ids);
        expect(rows.map(row => row.id)).toEqual([1, 2, 3]);
    });

    it("sorts before paging and retains the filtered total count", async () => {
        const source = new ArrayDataSource(rows);
        const result = await source.loadData({
            filter: ["country", "=", "East"], orderby: ["quantity"],
            skip: 1, top: 1, requireTotalCount: true
        });
        expect(result.dataItems).toEqual([rows[1]]);
        expect(result.totalCount).toBe(2);
    });

    it("returns an independent page even when no processing needs a full array copy", async () => {
        const input = [...rows];
        const source = new ArrayDataSource(input);
        const result = await source.loadData({ top: 2 });
        result.dataItems!.pop();
        expect(input).toHaveLength(3);
        expect(input[0]).toBe(rows[0]);
    });

    it("snapshots row membership before yielding to an asynchronous summary", async () => {
        const input = [...rows];
        const source = new ArrayDataSource(input);
        const promise = source.loadData({ totalSummary: [{ field: "quantity", summaryType: "sum" }] });
        input.push({ id: 4, country: "North", quantity: 100, c: "N" });
        const result = await promise;
        expect(result.dataItems).toHaveLength(3);
        expect(result.totalSummary?.[0].value).toBe(6);
    });
});
