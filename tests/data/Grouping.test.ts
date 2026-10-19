import { describe, expect, it } from "vitest";
import { createGroupValueGetter, encodeGroupKeySegment, getFieldGroupValue, getGroupFilter, getGroupFilterSelector, normalizeGroupValue } from "../../src/data/grouping";
import type { DataType } from "../../src/data/DataField";
import { evalFilter } from "../../src/data/filter";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import { DefaultGridRowsProvider } from "../../src/components/datagrid/DefaultGridRowsProvider";

describe("Canonical group values and escaped keys", () => {
    it("groups through named intervals and invalidates cached results when their evaluator changes", async () => {
        const intervals = [{ name: "size", text: "Size", getGroupValue: (_row: { amount: number }, value: number) => value >= 20 ? "Large" : "Small" }];
        const source = new LocalGroupingDataSource(new ArrayDataSource([{ amount: 10 }, { amount: 30 }]),
            row => row.amount, () => ({ name: "amount", dataType: "number" }), intervals);
        const args = { groupBy: [{ field: "amount", interval: "size" }] };
        expect((await source.loadData(args)).groups?.map(group => [group.groupValue, group.count]))
            .toEqual([["Large", 1], ["Small", 1]]);
        intervals[0].getGroupValue = () => "All";
        expect((await source.loadData(args)).groups?.map(group => [group.groupValue, group.count]))
            .toEqual([["All", 2]]);
        expect((await source.loadData({ groupBy: [{ field: "amount" }] })).groups?.map(group => group.groupValue))
            .toEqual([10, 30]);
    });
    it("prepares synchronous grouping and still awaits asynchronous values and intervals", async () => {
        const sync = createGroupValueGetter({ name: "code", groupInterval: "firstChar" });
        expect(sync({ code: "West" })).toBe("W");
        const asyncValue = createGroupValueGetter({ name: "code", getValue: async () => "West", groupInterval: "firstChar" });
        expect(await asyncValue({})).toBe("W");
        const asyncInterval = createGroupValueGetter({ name: "code", groupInterval: "bucket" }, [
            { name: "bucket", text: "Bucket", getGroupValue: async (_row, value) => value === "West" ? undefined : value }
        ]);
        expect(await asyncInterval({ code: "West" })).toBeNull();
    });
    it.each([null, undefined])("uses a reserved missing-value segment for %s", value => {
        expect(normalizeGroupValue(value)).toBe(null);
        expect(encodeGroupKeySegment(value)).toBe("~");
    });
    it("keeps empty text and literal markers distinct from missing values", () => {
        expect(normalizeGroupValue("")).toBe("");
        expect(encodeGroupKeySegment("")).toBe("");
        expect(encodeGroupKeySegment("~")).toBe("%7E");
        expect(encodeGroupKeySegment("%7E")).toBe("%257E");
        expect(encodeGroupKeySegment("A~B")).toBe("A%7EB");
    });
    it("escapes separators, percent signs, quotes and Unicode without collisions", () => {
        expect(encodeGroupKeySegment("A/B")).toBe("A%2FB");
        expect(encodeGroupKeySegment("%2F")).toBe("%252F");
        for (const value of ['"Sofia"', "София", "A/B", "%2F", "0", "false"]) {
            expect(decodeURIComponent(encodeGroupKeySegment(value))).toBe(value);
        }
        expect(encodeGroupKeySegment(0)).toBe("0");
        expect(encodeGroupKeySegment(false)).toBe("false");
    });
    it("preserves nonempty values without converting their type", () => {
        for (const value of [1, "1", "01", "1.0", "invalid", " ", false, 0, 1n, "FALSE"]) {
            expect(normalizeGroupValue(value)).toBe(value);
        }
    });
    it("preserves raw dates and retains the result of an explicit interval", async () => {
        const iso = "2026-10-19T10:00:00.000Z";
        const date = new Date(iso);
        expect(normalizeGroupValue(date)).toBe(date);
        expect(normalizeGroupValue(iso)).toBe(iso);
        expect(await getFieldGroupValue({ name: "date", dataType: "date", groupInterval: "year" }, { date: iso })).toBe(2026);
    });
    it.each([undefined, "string", "number", "boolean", "date", "datetime"] as (DataType | undefined)[])(
        "uses the same values for grouping and child filters (%s)", async dataType => {
            const field = { name: "value", dataType };
            const selector = getGroupFilterSelector(field);
            expect(selector).toBe("value");
            for (const value of [null, undefined, "", 0, 1, "1", "01", false, "false", "invalid"]) {
                const group = await getFieldGroupValue(field, { value });
                expect(evalFilter({ value }, getGroupFilter(field, group))).toBe(true);
            }
        }
    );
    it.each(["firstChar", "year", "month", "yearMonth", "week", "dayOfWeek", "hour"])(
        "matches empty, invalid and valid values for interval %s", async groupInterval => {
            const field = { name: "value", dataType: "date" as const, groupInterval };
            const selector = getGroupFilterSelector(field);
            expect(selector).toEqual({ function: groupInterval, field: "value" });
            for (const value of [null, undefined, "", "invalid", "2026-10-19T10:00:00Z"]) {
                const group = await getFieldGroupValue(field, { value });
                expect(evalFilter({ value }, getGroupFilter(field, group))).toBe(true);
            }
            const missingFilter = JSON.parse(JSON.stringify(getGroupFilter(field, null)));
            const emptyFilter = JSON.parse(JSON.stringify(getGroupFilter(field, "")));
            expect(evalFilter({ value: "" }, missingFilter)).toBe(false);
            expect(evalFilter({ value: null }, emptyFilter)).toBe(false);
            expect(evalFilter({}, missingFilter)).toBe(true);
        }
    );
    it("does not weaken ordinary equality", () => {
        expect(evalFilter({ value: "1" }, ["value", "=", 1])).toBe(false);
        expect(evalFilter({ value: null }, ["value", "=", ""])).toBe(false);
    });
    it("serializes missing and empty child queries without undefined or special selectors", () => {
        const field = { name: "value" };
        for (const value of [null, undefined, "", 0, false, "~"]) {
            const filter = getGroupFilter(field, value);
            expect(filter).toEqual(["value", "=", value ?? null]);
            const remoteFilter = JSON.parse(JSON.stringify(filter));
            for (const candidate of [null, undefined, "", 0, false, "~"]) {
                expect(evalFilter({ value: candidate }, remoteFilter)).toBe((candidate ?? null) === (value ?? null));
            }
        }
        expect(evalFilter({}, ["value", "=", null])).toBe(true);
        for (const value of [null, undefined, "", 0, false]) {
            expect(evalFilter({ value }, ["value", "<>", null])).toBe(value != null);
        }
    });
    it("sorts month buckets numerically rather than sorting their key strings", async () => {
        const field = { name: "date", dataType: "date" as const, groupInterval: "month" };
        const source = new LocalGroupingDataSource(new ArrayDataSource([{ date: "2026-10-19" }, { date: "2026-02-19" }]),
            async row => row.date, () => field);
        expect((await source.loadData({ groupBy: [{ field: "date", interval: "month" }] })).groups?.map(group => group.groupValue)).toEqual([2, 10]);
    });
    it.each([undefined, []])("groups without summary state when summaries are %s", async groupSummary => {
        const source = new LocalGroupingDataSource(new ArrayDataSource([
            { code: "B" }, { code: "A" }, { code: "B" }
        ]), async row => row.code);
        const result = await source.loadData({ groupBy: [{ field: "code" }], groupSummary });
        expect(result.groups).toEqual([
            { groupField: "code", groupValue: "A", count: 1 },
            { groupField: "code", groupValue: "B", count: 2 }
        ]);
    });
    it("separates missing and empty groups, includes their own children, and computes their summaries", async () => {
        const data = [null, undefined, "", 1, 1, 1, 0, 2].map((code, id) => ({ id, code, amount: 10 }));
        const field = { name: "code", dataType: "number" as const };
        const source = new LocalGroupingDataSource(new ArrayDataSource(data), async (row, name) => (row as any)[name], name => name === "code" ? field : undefined);
        const buckets = await source.loadData({ groupBy: [{ field: "code" }], groupSummary: [{ field: "amount", summaryType: "sum" }] });
        expect(buckets.groups?.map(group => group.groupValue)).toEqual([null, "", 0, 1, 2]);
        expect(buckets.groups?.find(group => group.groupValue === null)?.count).toBe(2);
        expect(buckets.groups?.find(group => group.groupValue === null)?.summaryValues?.amount).toBe(20);
        expect(buckets.groups?.find(group => group.groupValue === "")?.count).toBe(1);
        expect(buckets.groups?.find(group => group.groupValue === "")?.summaryValues?.amount).toBe(10);
        const descending = await source.loadData({ groupBy: [{ field: "code" }], orderby: [["code", "desc"]], skip: 3, top: 2 });
        expect(descending.groups?.map(group => group.groupValue)).toEqual(["", null]);
        expect(buckets.groups?.find(group => group.groupValue === 1)?.summaryValues?.amount).toBe(30);
        const provider = new DefaultGridRowsProvider({ dataSource: source, pageSize: 20, columns: new Map([["code", field]]), visibleColumns: [], groupColumns: ["code"] });
        const root = await provider.load({ skip: 0, top: 20 });
        expect(new Set(root.rows.map(row => row.key)).size).toBe(root.rows.length);
        const empty = root.rows.find(row => row.key === "$/")!;
        const missing = root.rows.find(row => row.key === "$/~")!;
        await provider.setExpanded(missing, true);
        expect((await provider.load({ skip: 0, top: 20 })).rows.filter(row => row.type === "data").map(row => row.data.data.id)).toEqual([0, 1]);
        await provider.setExpanded(missing, false);
        await provider.setExpanded(empty, true);
        expect((await provider.load({ skip: 0, top: 20 })).rows.filter(row => row.type === "data").map(row => row.data.data.id)).toEqual([2]);
        await provider.setExpanded(empty, false);
        const one = root.rows.find(row => row.key === "$/1")!;
        await provider.setExpanded(one, true);
        expect((await provider.load({ skip: 0, top: 20 })).rows.filter(row => row.type === "data").map(row => row.data.data.id)).toEqual([3, 4, 5]);
        provider.dispose();
    });
});
