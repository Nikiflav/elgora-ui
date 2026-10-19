import { describe, expect, it, vi } from "vitest";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import { LocalQueryCache } from "../../src/data/LocalQueryCache";
import type { QueryArgs } from "../../src/data/DataSource";
import type { DataField } from "../../src/data/DataField";

const summaries = [{ field: "amount", summaryType: "sum" }];
const data = () => [{ id: 1, region: "B", amount: 1 }, { id: 2, region: "A", amount: 2 }, { id: 3, region: "B", amount: 3 }];

describe("ArrayDataSource query cache", () => {
    it("reuses filtering/sorting across pages, count requests and summary selections", async () => {
        const check = vi.fn((value: number) => value);
        const rows = data();
        const source = new ArrayDataSource(rows, { filterFunctions: { check } });
        const args: QueryArgs = { filter: [{ function: "check", field: "amount" }, ">", 0], orderby: [["amount", "desc"]] };
        expect((await source.loadData({ ...args, top: 1 })).dataItems).toEqual([rows[2]]);
        const second = await source.loadData({ ...args, filter: JSON.parse(JSON.stringify(args.filter)), skip: 1, top: 1,
            requireTotalCount: true, totalSummary: summaries });
        expect(second.dataItems).toEqual([rows[1]]);
        expect(second.totalCount).toBe(3);
        expect(second.totalSummary?.[0].value).toBe(6);
        expect(check).toHaveBeenCalledTimes(3);
        second.dataItems!.length = 0;
        second.totalSummary![0].value = 100;
        expect((await source.loadData({ ...args, totalSummary: summaries })).totalSummary?.[0].value).toBe(6);
        expect(rows.map(row => row.id)).toEqual([1, 2, 3]);
    });

    it("invalidates before notifications, but not for failed/no-op mutations", async () => {
        const rows = data();
        const source = new ArrayDataSource(rows, { createRowId: () => 4, defaults: { region: "C", amount: 4 } });
        const revisions: number[] = [];
        const queries: Promise<any>[] = [];
        source.changed.subscribe(() => { revisions.push(source.revision); queries.push(source.loadData({ totalSummary: summaries })); });
        await source.loadData({ totalSummary: summaries });
        await source.update(rows[0], { amount: 10 });
        expect(source.revision).toBe(1);
        expect((await queries[0]).totalSummary[0].value).toBe(15);
        await source.update(rows[0], { amount: 10 });
        await source.update({ ...rows[0] }, { amount: 5 });
        await source.delete({ ...rows[0] });
        expect(source.revision).toBe(1);
        const pending = await source.createNewRow();
        await source.update(pending.row, { amount: 5 });
        expect(source.revision).toBe(1);
        await pending.insert();
        expect(source.revision).toBe(2);
        await pending.insert();
        expect(source.revision).toBe(2);
        await source.delete(rows[0]);
        expect(source.revision).toBe(3);
        expect(revisions).toEqual([1, 1, 1, 2, 3]);
    });

    it("does not invalidate cached queries for draft creation, editing or cancellation", async () => {
        const check = vi.fn((value: number) => value);
        const source = new ArrayDataSource(data(), { filterFunctions: { check }, createRowId: () => 4 });
        const args: QueryArgs = { filter: [{ function: "check", field: "amount" }, ">", 0], totalSummary: summaries };
        await source.loadData(args);
        const draft = await source.createNewRow();
        await source.update(draft.row, { amount: 100 });
        await draft.cancel();
        expect((await source.loadData(args)).totalSummary?.[0].value).toBe(6);
        expect(source.revision).toBe(0);
        expect(check).toHaveBeenCalledTimes(3);
    });

    it("requires manual invalidation for direct array edits and emits reset", async () => {
        const rows = data();
        const source = new ArrayDataSource(rows);
        const changed = vi.fn();
        source.changed.subscribe(changed);
        await source.loadData({ totalSummary: summaries });
        rows.push({ id: 4, region: "C", amount: 4 });
        expect((await source.loadData({ totalSummary: summaries })).totalSummary?.[0].value).toBe(6);
        source.invalidateCache();
        const result = await source.loadData({ totalSummary: summaries, requireTotalCount: true });
        expect(result.totalSummary?.[0].value).toBe(10);
        expect(result.totalCount).toBe(4);
        expect(changed).toHaveBeenCalledExactlyOnceWith({ kind: "reset" });
        expect(source.revision).toBe(1);
    });

    it("distinguishes reference equality, dates, primitive types and symbol targets", async () => {
        const object = { code: "A" }, other = { code: "A" };
        const date = new Date(2026, 0, 1), sameDate = new Date(date);
        const s1 = Symbol("same"), s2 = Symbol("same");
        const values = [null, undefined, "", 1, "1", NaN, object, other, date, sameDate, s1, s2];
        const source = new ArrayDataSource(values.map((value, id) => ({ id, value, amount: id })));
        for (const value of values) {
            const result = await source.loadData({ filter: ["value", "=", value], totalSummary: summaries });
            expect(result.dataItems?.map(row => row.id)).toEqual(values.flatMap((candidate, id) =>
                (value == null ? candidate == null : candidate === value) ? [id] : []));
        }
        expect((await source.loadData({ filter: ["value", "=", s1], totalSummary: summaries })).totalSummary?.[0].value).toBe(10);
        expect((await source.loadData({ filter: ["value", "=", s2], totalSummary: summaries })).totalSummary?.[0].value).toBe(11);
    });

    it("rebuilds date range queries when a mutable bound changes", async () => {
        const bound = new Date(2026, 0, 1);
        const source = new ArrayDataSource([{ date: new Date(2026, 0, 2) }]);
        const args: QueryArgs = { filter: ["date", ">", bound] };
        expect((await source.loadData(args)).dataItems).toHaveLength(1);
        bound.setDate(3);
        expect((await source.loadData(args)).dataItems).toHaveLength(0);
    });

    it("retains at most eight row query results and evicts least recently used entries", async () => {
        const check = vi.fn((value: number) => value);
        const source = new ArrayDataSource([{ amount: 1 }], { filterFunctions: { check } });
        const query = (target: number) => source.loadData({ filter: [{ function: "check", field: "amount" }, ">", target] });
        for (let i = 0; i < 8; i++) await query(i);
        await query(0); // keep this entry hot
        await query(8); // evicts 1
        await query(0);
        expect(check).toHaveBeenCalledTimes(9);
        await query(1);
        expect(check).toHaveBeenCalledTimes(10);
    });

    it("does not cache results of already-aborted queries", async () => {
        const check = vi.fn((value: number) => value);
        const source = new ArrayDataSource(data(), { filterFunctions: { check } });
        const controller = new AbortController();
        controller.abort();
        const args: QueryArgs = { filter: [{ function: "check", field: "amount" }, ">", 0] };
        await source.loadData({ ...args, abortSignal: controller.signal });
        await source.loadData(args);
        expect(check).toHaveBeenCalledTimes(6);
    });
});

describe("Revision-aware grouped/summary cache", () => {
    function create() {
        const rows = data();
        const array = new ArrayDataSource(rows);
        const read = vi.fn((row: (typeof rows)[number], field: string) => (row as any)[field]);
        const source = new LocalGroupingDataSource(array, read);
        return { rows, array, read, source };
    }

    it("reuses all grouped pages/counts/summaries and protects returned containers", async () => {
        const { source, read } = create();
        const args: QueryArgs = { groupColumn: "region", groupSummary: summaries, totalSummary: summaries };
        const first = await source.loadData({ ...args, top: 1 });
        const reads = read.mock.calls.length;
        first.groups![0].count = 100;
        first.groups![0].summaryValues!.amount = 100;
        first.totalSummary![0].value = 100;
        const second = await source.loadData({ ...args, skip: 1, top: 1 });
        expect(second.groups).toEqual([{ groupField: "region", groupValue: "B", count: 2, summaryValues: { amount: 4 } }]);
        expect(second.totalCount).toBe(2);
        expect(second.totalSummary?.[0].value).toBe(6);
        expect(read).toHaveBeenCalledTimes(reads);
        expect((await source.loadData({ ...args, top: 1 })).groups![0].count).toBe(1);
        expect((await source.loadData({ ...args, top: 0 })).groups).toEqual([]);
    });

    it("observes the source revision after update and manual invalidation", async () => {
        const { source, array, rows, read } = create();
        const args: QueryArgs = { groupColumn: "region", groupSummary: summaries };
        await source.loadData(args);
        await array.update(rows[0], { region: "A", amount: 10 });
        expect((await source.loadData(args)).groups?.map(group => group.summaryValues?.amount)).toEqual([12, 3]);
        rows[2].amount = 30;
        array.invalidateCache();
        expect((await source.loadData(args)).groups?.map(group => group.summaryValues?.amount)).toEqual([12, 30]);
        expect(read).toHaveBeenCalledTimes(18);
    });

    it("isolates field metadata and externally captured accessor dependencies", async () => {
        const rows = data(), array = new ArrayDataSource(rows);
        let factor = 1;
        const field: DataField<(typeof rows)[number]> = { name: "amount", dataType: "number" };
        const source = new LocalGroupingDataSource(array, row => row.amount * factor, () => field);
        const args = { totalSummary: summaries };
        expect((await source.loadData(args)).totalSummary?.[0].value).toBe(6);
        factor = 2;
        array.invalidateCache();
        expect((await source.loadData(args)).totalSummary?.[0].value).toBe(12);
        field.dataType = "string";
        expect((await source.loadData(args)).totalSummary).toEqual([]);
    });

    it("does not share adapter-specific computed totals between grids", async () => {
        const array = new ArrayDataSource(data());
        const a = new LocalGroupingDataSource(array, row => row.amount);
        const b = new LocalGroupingDataSource(array, row => row.amount * 10);
        expect((await a.loadData({ totalSummary: summaries })).totalSummary?.[0].value).toBe(6);
        expect((await b.loadData({ totalSummary: summaries })).totalSummary?.[0].value).toBe(60);
    });

    it("does not cache an old async calculation after mutation or manual reset", async () => {
        for (const manual of [false, true]) {
            const rows = data(), array = new ArrayDataSource(rows);
            let release!: (value: number) => void;
            const read = vi.fn((row: (typeof rows)[number]) => read.mock.calls.length === 1
                ? new Promise<number>(resolve => { release = resolve; }) : row.amount);
            const source = new LocalGroupingDataSource(array, read);
            const first = source.loadData({ totalSummary: summaries });
            await vi.waitFor(() => expect(release).toBeTypeOf("function"));
            if (manual) { rows[0].amount = 10; array.invalidateCache(); }
            else await array.update(rows[0], { amount: 10 });
            release(1);
            expect((await first).totalSummary?.[0].value).toBe(6);
            expect((await source.loadData({ totalSummary: summaries })).totalSummary?.[0].value).toBe(15);
            await source.loadData({ totalSummary: summaries });
            expect(read).toHaveBeenCalledTimes(6);
        }
    });

    it("retries failed calculations and does not cache cancelled async results", async () => {
        const array = new ArrayDataSource(data());
        let fail = true;
        const read = vi.fn(async (row: ReturnType<typeof data>[number]) => {
            if (fail) throw new Error("Read failed");
            return row.amount;
        });
        const source = new LocalGroupingDataSource(array, read);
        await expect(source.loadData({ totalSummary: summaries })).rejects.toThrow("Read failed");
        fail = false;
        const controller = new AbortController();
        const pending = source.loadData({ totalSummary: summaries, abortSignal: controller.signal });
        controller.abort();
        await pending;
        expect((await source.loadData({ totalSummary: summaries })).totalSummary?.[0].value).toBe(6);
        expect(read).toHaveBeenCalledTimes(7);
    });

    it("does not cache remote grouped responses", async () => {
        const loadData = vi.fn(async (args: QueryArgs) => ({ args, groups: [], totalCount: 0 }));
        const source = new LocalGroupingDataSource({ loadData }, () => 0);
        await source.loadData({ groupColumn: "region" });
        await source.loadData({ groupColumn: "region" });
        expect(loadData).toHaveBeenCalledTimes(2);
    });
});

describe("LocalQueryCache LRU", () => {
    it("updates recency on reads and clears all entries", () => {
        const cache = new LocalQueryCache<number>(2);
        cache.set("a", 1); cache.set("b", 2);
        expect(cache.get("a")).toBe(1);
        cache.set("c", 3);
        expect(cache.get("b")).toBeUndefined();
        cache.clear();
        expect(cache.get("a")).toBeUndefined();
        expect(cache.get("c")).toBeUndefined();
    });
});
