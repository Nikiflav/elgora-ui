import { describe, expect, it, vi } from "vitest";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import type { QueryArgs, GroupItem } from "../../src/data/DataSource";

const rows = [{ id: 1, country: "A", city: "X", amount: 1 }, { id: 2, country: "A", city: "Y", amount: 2 },
    { id: 3, country: "B", city: "X", amount: 3 }, { id: 4, country: "B", city: "X", amount: 4 }];
const groupBy = [{ field: "country" }, { field: "city" }];
const summaries = [{ field: "amount", summaryType: "sum" }];
const create = () => new LocalGroupingDataSource(new ArrayDataSource(rows), (row, name) => (row as any)[name]);

describe("Nested groupBy loadData contract", () => {
    it("groups a full tuple with independent parents, counts and summaries, paging only roots", async () => {
        const result = await create().loadData({ groupBy, skip: 1, top: 1, groupSummary: summaries, totalSummary: summaries });
        expect(result.dataItems).toBeUndefined();
        expect(result.totalCount).toBe(2);
        expect(result.totalSummary?.[0].value).toBe(10);
        expect(result.groups).toEqual([{ groupField: "country", groupValue: "B", count: 2, summaryValues: { amount: 7 },
            groups: [{ groupField: "city", groupValue: "X", count: 2, summaryValues: { amount: 7 } }] }]);
        const all = await create().loadData({ groupBy });
        expect(all.groups?.[0].groups?.map(group => [group.groupValue, group.count])).toEqual([["X", 1], ["Y", 1]]);
        expect(all.groups?.[1].groups?.map(group => [group.groupValue, group.count])).toEqual([["X", 2]]);
    });

    it("preserves empty vs missing buckets at every level and sorts each sibling list", async () => {
        const source = new LocalGroupingDataSource(new ArrayDataSource([
            { country: null, city: "" }, { country: null, city: null }, { country: "", city: "~" },
            { country: "A/B", city: "Y" }, { country: "A/B", city: "X" }
        ]), (row, field) => (row as any)[field]);
        const result = await source.loadData({ groupBy, orderby: [["city", "desc"]] });
        expect(result.groups?.map(group => group.groupValue)).toEqual([null, "", "A/B"]);
        expect(result.groups?.[0].groups?.map(group => group.groupValue)).toEqual(["", null]);
        expect(result.groups?.[2].groups?.map(group => group.groupValue)).toEqual(["Y", "X"]);
    });

    it("uses descriptor intervals, including multiple intervals on the same field", async () => {
        const source = new LocalGroupingDataSource(new ArrayDataSource([{ date: "2026-02-19" }, { date: "2026-10-19" }]),
            row => row.date, name => ({ name, groupInterval: "firstChar" }));
        const result = await source.loadData(JSON.parse(JSON.stringify({ groupBy: [
            { field: "date", interval: "year" }, { field: "date", interval: "month" }
        ] })));
        expect(result.groups?.[0].groupValue).toBe(2026);
        expect(result.groups?.[0].groups?.map(group => group.groupValue)).toEqual([2, 10]);
        // Omitted interval means raw values, not a hidden presentation default.
        expect((await source.loadData({ groupBy: [{ field: "date" }] })).groups?.[0].groupValue).toBe("2026-02-19");
    });

    it("protects cached nested containers and returns full children on every root page", async () => {
        const source = create();
        const first = await source.loadData({ groupBy, groupSummary: summaries, top: 1 });
        first.groups![0].groups![0].count = 999;
        first.groups![0].groups![0].summaryValues!.amount = 999;
        const again = await source.loadData({ groupBy: JSON.parse(JSON.stringify(groupBy)), groupSummary: summaries, top: 1 });
        expect(again.groups?.[0].groups?.[0].count).toBe(1);
        expect(again.groups?.[0].groups?.[0].summaryValues?.amount).toBe(1);
        expect((await source.loadData({ groupBy, top: 0 })).groups).toEqual([]);
    });

    it("passes the same nested query to a remote source without client regrouping", async () => {
        const groups: GroupItem[] = [{ groupField: "country", groupValue: "Remote", count: 5,
            groups: [{ groupField: "city", groupValue: "X", count: 5 }] }];
        const loadData = vi.fn(async (args: QueryArgs) => ({ args, groups, totalCount: 1 }));
        const read = vi.fn();
        const source = new LocalGroupingDataSource({ loadData }, read);
        const args = { groupBy, requireTotalCount: true };
        expect((await source.loadData(args)).groups).toBe(groups);
        expect(loadData).toHaveBeenCalledExactlyOnceWith(args);
        expect(read).not.toHaveBeenCalled();
    });

    it("uses one flat fallback query for all requested levels when grouping is unsupported", async () => {
        const loadData = vi.fn(async (args: QueryArgs) => args.groupBy?.length
            ? { args } : { args, dataItems: rows, totalCount: rows.length });
        const source = new LocalGroupingDataSource({ loadData }, (row, field) => (row as any)[field]);
        const result = await source.loadData({ groupBy, top: 1 });
        expect(result.groups?.[0].groups).toHaveLength(2);
        expect(loadData).toHaveBeenCalledTimes(2);
        expect(loadData.mock.calls[1][0].groupBy).toBeUndefined();
        expect(loadData.mock.calls[1][0].top).toBeUndefined();
        expect(loadData.mock.calls[1][0].select).toEqual(["country", "city"]);
    });

    it("handles no matches and an empty groupBy without inventing an empty group", async () => {
        expect((await create().loadData({ groupBy, filter: ["id", "=", 99] })).groups).toEqual([]);
        expect((await create().loadData({ groupBy: [], top: 1 })).dataItems).toEqual([rows[0]]);
    });
});
