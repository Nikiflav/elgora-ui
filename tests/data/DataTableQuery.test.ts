import { afterEach, describe, expect, it, vi } from "vitest";
import { DataSet } from "../../src/data/dataset/DataSet";
import { DataRow } from "../../src/data/dataset/DataRow";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import type { QueryArgs } from "../../src/data/DataSource";

const totals = [{ field: "amount", summaryType: "sum" }];
function setup() {
    let id = 2;
    const dataset = new DataSet({ createRowId: () => ++id });
    const table = dataset.createTable("items", [
        { id: 1, region: "B", amount: 10, nested: { code: "West" }, state: "stored" },
        { id: 2, region: "A", amount: 20, nested: { code: "East" }, state: "stored" }
    ]);
    const source = new LocalGroupingDataSource(table, (row, name) => row.getValue(name), name => ({ name }));
    const sum = async () => (await table.loadData({ totalSummary: totals })).totalSummary?.[0]?.value;
    const groups = async () => (await source.loadData({ groupBy: [{ field: "region" }], groupSummary: totals })).groups;
    return { dataset, table, source, sum, groups, first: table.getRow(1)!, second: table.getRow(2)! };
}

afterEach(() => vi.restoreAllMocks());

describe("Direct DataRow query engine", () => {
    it("queries original rows without creating value objects, including paths, intervals and stored reserved names", async () => {
        const { table, first } = setup();
        const toObject = vi.spyOn(DataRow.prototype, "toObject");
        const args: QueryArgs = { filter: ["and", ["nested.code", "contains", "wes"], ["state", "=", "stored"]],
            orderby: ["amount"], totalSummary: totals, requireTotalCount: true, top: 1 };
        const result = await table.loadData(args);
        expect(result.args).toBe(args);
        expect(result.dataItems).toEqual([first]);
        expect(result.dataItems![0]).toBe(first);
        expect(result.totalCount).toBe(1);
        expect(result.totalSummary?.[0].value).toBe(10);
        const interval = await table.loadData({ filter: [{ function: "firstChar", field: "region" }, "=", "B"] });
        expect(interval.dataItems).toEqual([first]);
        expect(toObject).not.toHaveBeenCalled();
        expect(table.dataSet.getChanges()).toEqual({});
    });

    it("reuses sorted/filtered pages and totals without rereading rows", async () => {
        const { table, first, second } = setup();
        const reads = vi.spyOn(DataRow.prototype, "getValue");
        const args: QueryArgs = { filter: ["amount", ">", 0], orderby: [["amount", "desc"]], totalSummary: totals };
        expect((await table.loadData({ ...args, top: 1 })).dataItems).toEqual([second]);
        const count = reads.mock.calls.length;
        expect((await table.loadData({ ...args, skip: 1, top: 1, requireTotalCount: true })).dataItems).toEqual([first]);
        expect(reads).toHaveBeenCalledTimes(count);
    });

    it("reads sort keys once per row and preserves stable multi-column ordering", async () => {
        const table = new DataSet().createTable("sort", [
            { id: 1, code: "B", amount: 2 }, { id: 2, code: "A", amount: 1 },
            { id: 3, code: "A", amount: 3 }, { id: 4, code: "A", amount: 3 }
        ]);
        const reads = vi.spyOn(DataRow.prototype, "getValue");
        const result = await table.loadData({ orderby: ["code", ["amount", "desc"]] });
        expect(reads).toHaveBeenCalledTimes(8);
        reads.mockRestore();
        expect(result.dataItems?.map(row => row.key)).toEqual([3, 4, 2, 1]);
    });

    it("caches group pages using table revisions and the DataRow member accessor", async () => {
        const { source } = setup();
        const reads = vi.spyOn(DataRow.prototype, "getValue");
        const args: QueryArgs = { groupBy: [{ field: "region" }], groupSummary: totals, totalSummary: totals, top: 1 };
        const first = await source.loadData(args);
        expect(first.groups?.[0]).toEqual({ groupField: "region", groupValue: "A", count: 1, summaryValues: { amount: 20 } });
        const count = reads.mock.calls.length;
        const second = await source.loadData({ ...args, skip: 1 });
        expect(second.groups?.[0].groupValue).toBe("B");
        expect(second.totalSummary?.[0].value).toBe(30);
        expect(reads).toHaveBeenCalledTimes(count);
    });
});

describe("Transaction-aware query invalidation", () => {
    it("shows new data inside rowChanged while UI notifications remain deferred", async () => {
        const { table, first, sum, groups } = setup();
        const ui = vi.fn();
        table.changed.subscribe(ui);
        await sum(); await groups();
        table.rowChanging.subscribe(async event => {
            if (event.kind === "update") expect(await sum()).toBe(30);
        });
        table.rowChanged.subscribe(async event => {
            if (event.kind !== "update") return;
            expect(await sum()).toBe(35);
            expect((await groups())?.map(group => group.summaryValues?.amount)).toEqual([20, 15]);
            expect(table.revision).toBeGreaterThan(0);
            expect(ui).not.toHaveBeenCalled();
        });
        await first.setValue("amount", 15);
        expect(ui).toHaveBeenCalledOnce();
    });

    it("invalidates between consecutive edits in the same transaction", async () => {
        const { dataset, table, first, second, sum } = setup();
        await sum();
        const ui = vi.fn(); table.changed.subscribe(ui);
        await dataset.transaction("Two changes", async tx => {
            await tx.update(table, first, { amount: 15 });
            expect(await sum()).toBe(35);
            await tx.update(table, second, { amount: 25 });
            expect(await sum()).toBe(40);
            expect(ui).not.toHaveBeenCalled();
        });
        expect(ui).toHaveBeenCalledTimes(2);
    });

    it("invalidates intermediate results after validation rollback", async () => {
        const { dataset, table, first, sum, groups } = setup();
        await sum(); await groups();
        const ui = vi.fn(); table.changed.subscribe(ui);
        const result = await dataset.transaction("Rejected", async tx => {
            await tx.update(table, first, { amount: 100, region: "A" });
            expect(await sum()).toBe(120);
            expect((await groups())?.[0].count).toBe(2);
            return { success: false, error: "Rejected" } as const;
        });
        expect(result.success).toBe(false);
        expect(await sum()).toBe(30);
        expect((await groups())?.map(group => group.count)).toEqual([1, 1]);
        expect(ui).not.toHaveBeenCalled();
    });

    it("restores membership/cache when insertion fails after being query-visible", async () => {
        const { dataset, table, sum } = setup();
        await sum();
        const session = await table.createNewRow();
        await session.row.setValue("amount", 7);
        await expect(dataset.transaction("Insert then fail", async tx => {
            await tx.insert(session);
            expect(await sum()).toBe(37);
            throw new Error("Stop");
        })).rejects.toThrow("Stop");
        expect(session.state).toBe("pending");
        expect(await sum()).toBe(30);
    });

    it("leaves query revision/cache intact for pending sessions and no-op edits", async () => {
        const { dataset, table, first, sum } = setup();
        await sum();
        const revision = table.revision;
        await first.setValue("amount", 10);
        const session = await table.createNewRow();
        await session.row.setValue("amount", 100);
        expect(await sum()).toBe(30);
        await session.cancel();
        await dataset.undoCoordinator.undo(); // cancellation -> pending
        expect(session.state).toBe("pending");
        expect(table.revision).toBe(revision);
        expect(await sum()).toBe(30);
    });

    it("updates cached data on undo/redo of updates, deletion and insertion", async () => {
        const { dataset, table, first, second, sum } = setup();
        const history = dataset.undoCoordinator;
        await sum();
        await first.setValue("amount", 15);
        expect(await sum()).toBe(35);
        await history.undo(); expect(await sum()).toBe(30);
        await history.redo(); expect(await sum()).toBe(35);
        await table.delete(second); expect(await sum()).toBe(15);
        await history.undo(); expect(await sum()).toBe(35);
        await history.redo(); expect(await sum()).toBe(15);
        const session = await table.createNewRow();
        await session.row.setValue("amount", 7);
        await session.insert(); expect(await sum()).toBe(22);
        await history.undo(); expect(await sum()).toBe(15);
        await history.redo(); expect(await sum()).toBe(22);
        expect(table.getRow(session.row.key)).toBe(session.row);
    });

    it("invalidates import/reject/accept results before notifying consumers", async () => {
        const { table, first, second, sum } = setup();
        await sum();
        const observed: Promise<unknown>[] = [];
        table.changed.subscribe(() => observed.push(sum()));
        table.importRows([{ id: 1, region: "B", amount: 40 }], false);
        expect(await sum()).toBe(60);
        expect(table.getRow(1)).toBe(first);
        await first.setValue("amount", 50);
        expect(await sum()).toBe(70);
        table.rejectChanges(); expect(await sum()).toBe(60);
        await table.delete(second); expect(await sum()).toBe(40);
        table.acceptChanges(); expect(await sum()).toBe(40);
        expect(table.getRow(2)).toBeUndefined();
        expect(await Promise.all(observed)).toEqual([60, 70, 60, 40, 40]);
    });

    it("invalidates mapped identities without replacing rows", async () => {
        const { dataset, table, source } = setup();
        const session = await table.createNewRow();
        await session.insert();
        const temporaryKey = session.row.key;
        const query: QueryArgs = { filter: ["id", "=", temporaryKey] };
        expect((await table.loadData(query)).dataItems).toEqual([session.row]);
        await source.loadData({ groupBy: [{ field: "id" }] });
        await dataset.saveChanges(async () => ({ success: true, keyMappings: { items: [{ temporaryKey, key: 30 }] } }));
        expect((await table.loadData(query)).dataItems).toEqual([]);
        expect((await table.loadData({ filter: ["id", "=", 30] })).dataItems).toEqual([session.row]);
        expect((await source.loadData({ groupBy: [{ field: "id" }] })).groups?.map(group => group.groupValue)).toEqual([1, 2, 30]);
    });

    it("does not cache an async adapter result computed across a table mutation", async () => {
        const { table, first } = setup();
        let release!: (value: number) => void;
        let reads = 0;
        const source = new LocalGroupingDataSource(table, row => ++reads === 1
            ? new Promise<number>(resolve => { release = resolve; }) : row.getValue("amount"));
        const pending = source.loadData({ totalSummary: totals });
        await vi.waitFor(() => expect(release).toBeTypeOf("function"));
        await first.setValue("amount", 15);
        release(10);
        expect((await pending).totalSummary?.[0].value).toBe(30);
        expect((await source.loadData({ totalSummary: totals })).totalSummary?.[0].value).toBe(35);
        await source.loadData({ totalSummary: totals });
        expect(reads).toBe(4);
    });

    it("supports explicit invalidation for object changes without tracking an edit", async () => {
        const { dataset, table, first } = setup();
        const args: QueryArgs = { filter: ["nested.code", "=", "West"] };
        await table.loadData(args);
        (first.getValue("nested") as { code: string }).code = "North";
        expect((await table.loadData(args)).dataItems).toHaveLength(1);
        const ui = vi.fn(); table.changed.subscribe(ui);
        table.invalidateCache();
        expect((await table.loadData(args)).dataItems).toHaveLength(0);
        expect(ui).toHaveBeenCalledExactlyOnceWith({ kind: "reset" });
        expect(dataset.getChanges()).toEqual({});
        await dataset.transaction("No UI resets during edits", async () => {
            expect(() => table.invalidateCache()).toThrow("transaction is active");
        });
    });
});
