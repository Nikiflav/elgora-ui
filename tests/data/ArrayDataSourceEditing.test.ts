import { describe, expect, it, vi } from "vitest";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import { DataSet } from "../../src/data/dataset/DataSet";
import type { DataSource, DataSourceChanged } from "../../src/data/DataSource";

type Row = { id: string | number; region: string; amount: number; details?: object };
const initial = (): Row[] => [{ id: 1, region: "West", amount: 10 }, { id: 2, region: "East", amount: 20 }];

describe("ArrayDataSource editing", () => {
    it("updates the actual row and publishes only changed fields", async () => {
        const rows = initial();
        const source = new ArrayDataSource(rows);
        const events: DataSourceChanged<Row>[] = [];
        source.changed.subscribe(event => events.push(event));
        const original = rows[0];
        const details = { code: "A" };
        expect(await source.update(original, { amount: 15, region: "West", details })).toEqual({ success: true });
        expect(rows[0]).toBe(original);
        expect(rows[0].details).toBe(details);
        expect(events).toEqual([{ kind: "update", row: original, fields: ["amount", "details"] }]);
        await source.update(original, { amount: 15, details });
        expect(events).toHaveLength(1);
        expect("saveChanges" in source).toBe(false);
    });

    it("rejects foreign rows and identity changes before applying other fields", async () => {
        const rows = initial();
        const source = new ArrayDataSource(rows);
        const event = vi.fn();
        source.changed.subscribe(event);
        expect((await source.update({ ...rows[0] }, { amount: 25 })).success).toBe(false);
        expect((await source.update(rows[0], { amount: 25, id: 99 })).success).toBe(false);
        expect(rows[0].amount).toBe(10);
        expect(event).not.toHaveBeenCalled();
    });

    it("removes a confirmed row and publishes its original reference", async () => {
        const rows = initial();
        const row = rows[0];
        const source = new ArrayDataSource(rows);
        const event = vi.fn();
        source.changed.subscribe(event);
        expect(await source.delete(row)).toEqual({ success: true });
        expect(rows).toHaveLength(1);
        expect(event).toHaveBeenCalledWith({ kind: "delete", row });
        expect((await source.delete(row)).success).toBe(false);
        expect(event).toHaveBeenCalledTimes(1);
    });

    it("keeps drafts out of pages, counts, summaries and hierarchy until insertion", async () => {
        const rows = initial();
        const source = new ArrayDataSource(rows, {
            parentField: "parentId", createRowId: () => "new",
            defaults: { region: "West", amount: 30 }
        });
        const event = vi.fn();
        source.changed.subscribe(event);
        const session = await source.createNewRow();
        expect(session.state).toBe("pending");
        expect(source.getRowId!(session.row)).toBe("new");
        expect(event).toHaveBeenLastCalledWith({ kind: "create", row: session.row });
        await source.update(session.row, { amount: 40, parentId: 1 });
        expect(await source.hasChildren!(rows[0])).toBe(false);
        const before = await source.loadData({ requireTotalCount: true, totalSummary: [{ field: "amount", summaryType: "sum" }] });
        expect(before.totalCount).toBe(2);
        expect(before.totalSummary![0].value).toBe(30);
        expect(await session.insert()).toEqual({ success: true });
        expect(session.state).toBe("inserted");
        expect(rows[2]).toBe(session.row);
        expect(await source.hasChildren!(rows[0])).toBe(true);
        expect(event).toHaveBeenLastCalledWith({ kind: "insert", row: session.row });
        const after = await source.loadData({ requireTotalCount: true, totalSummary: [{ field: "amount", summaryType: "sum" }] });
        expect(after.totalCount).toBe(3);
        expect(after.totalSummary![0].value).toBe(70);
        expect((await source.loadData({ parentId: 1 })).dataItems).toEqual([session.row]);
    });

    it("cancels drafts without insertion and rejects further updates", async () => {
        const rows = initial();
        const source = new ArrayDataSource(rows);
        const event = vi.fn();
        source.changed.subscribe(event);
        const session = await source.createNewRow();
        expect(typeof session.row.id).toBe("string");
        expect((await source.delete(session.row)).success).toBe(false);
        await session.cancel();
        await session.cancel();
        expect(session.state).toBe("cancelled");
        expect(rows).toHaveLength(2);
        expect(event.mock.calls.map(call => call[0].kind)).toEqual(["create", "cancel"]);
        expect((await source.update(session.row, { amount: 20 })).success).toBe(false);
        await expect(session.insert()).rejects.toThrow("Session is cancelled");
    });

    it("inserts idempotently and forbids cancellation after insertion", async () => {
        const source = new ArrayDataSource(initial());
        const event = vi.fn();
        source.changed.subscribe(event);
        const session = await source.createNewRow();
        await session.insert();
        await session.insert();
        expect(source.array).toHaveLength(3);
        expect(event.mock.calls.map(call => call[0].kind)).toEqual(["create", "insert"]);
        await expect(session.cancel()).rejects.toThrow("already inserted");
        expect(session.state).toBe("inserted");
    });

    it("runs defaults and identity factories for each independent draft", async () => {
        let id = 0;
        const source = new ArrayDataSource<{ code: string; amount: number }>([], {
            idField: "code", createRowId: owner => { expect(owner).toBe(source); return "row-" + ++id; },
            defaults: async () => ({ code: "ignored", amount: id * 10 })
        });
        const first = await source.createNewRow();
        const second = await source.createNewRow();
        expect(first.row).toEqual({ code: "row-1", amount: 10 });
        expect(second.row).toEqual({ code: "row-2", amount: 20 });
        await first.cancel();
        await second.insert();
        expect(source.array).toEqual([second.row]);
        expect(first.state).toBe("cancelled");
        expect(second.state).toBe("inserted");
    });

    it("rejects duplicate keys in confirmed rows and pending sessions", async () => {
        const source = new ArrayDataSource(initial(), { createRowId: () => 1 });
        await expect(source.createNewRow()).rejects.toThrow("Duplicate row key");
        const pending = new ArrayDataSource<Row>([], { createRowId: () => 0 });
        const first = await pending.createNewRow();
        await expect(pending.createNewRow()).rejects.toThrow("Duplicate row key");
        await first.cancel();
        expect((await pending.createNewRow()).row.id).toBe(0);
    });

    it.each([NaN, Infinity, null, {}, undefined])("rejects invalid generated identity %s", async key => {
        const source = new ArrayDataSource<Row>([], { createRowId: () => key as number });
        await expect(source.createNewRow()).rejects.toThrow("Identity must be a string or finite number");
        expect(source.array).toEqual([]);
    });

    it("reserves keys before asynchronous defaults complete", async () => {
        let finish!: (value: Partial<Row>) => void;
        const defaults = new Promise<Partial<Row>>(resolve => { finish = resolve; });
        const source = new ArrayDataSource<Row>([], { createRowId: () => "same", defaults: () => defaults });
        const first = source.createNewRow();
        await expect(source.createNewRow()).rejects.toThrow("Duplicate row key");
        finish({ region: "West", amount: 10 });
        expect((await first).row.id).toBe("same");
    });

    it("releases reserved keys after a failed defaults factory", async () => {
        const defaults = vi.fn().mockRejectedValueOnce(new Error("Defaults failed")).mockResolvedValue({});
        const source = new ArrayDataSource<Row>([], { createRowId: () => "retry", defaults });
        await expect(source.createNewRow()).rejects.toThrow("Defaults failed");
        expect((await source.createNewRow()).row.id).toBe("retry");
    });

    it("revalidates insertion after external changes and leaves the draft recoverable", async () => {
        const source = new ArrayDataSource<Row>([], { createRowId: () => "new" });
        const session = await source.createNewRow();
        session.row.id = "changed";
        expect((await session.insert()).success).toBe(false);
        session.row.id = "new";
        const external: Row = { id: "new", region: "East", amount: 5 };
        source.array.push(external);
        expect((await session.insert()).success).toBe(false);
        expect(session.state).toBe("pending");
        await source.delete(external);
        expect((await session.insert()).success).toBe(true);
    });

    it("leaves no inaccessible draft when a creation observer throws", async () => {
        const source = new ArrayDataSource<Row>([], { createRowId: () => "retry" });
        const subscription = source.changed.subscribe(() => { throw new Error("Observer failed"); });
        await expect(source.createNewRow()).rejects.toThrow("Failed to create row. Change notification failed");
        subscription.dispose();
        expect((await source.createNewRow()).row.id).toBe("retry");
    });

    it("reports the operation when the identity factory fails", async () => {
        const source = new ArrayDataSource<Row>([], { createRowId: async () => { throw new Error("Offline"); } });
        await expect(source.createNewRow()).rejects.toThrow("Failed to create row. Identity generation failed. Offline");
    });
});

describe("LocalGroupingDataSource editing delegation", () => {
    it("does not expose mutation, event, history or hierarchy capabilities for a read-only source", () => {
        const readOnly: DataSource<Row> = { loadData: async args => ({ args, dataItems: initial() }) };
        const source = new LocalGroupingDataSource(readOnly, async row => row.amount);
        expect(source.update).toBeUndefined();
        expect(source.delete).toBeUndefined();
        expect(source.createNewRow).toBeUndefined();
        expect(source.changed).toBeUndefined();
        expect(source.undoCoordinator).toBeUndefined();
        expect(source.getRowId).toBeUndefined();
        expect(source.hasChildren).toBeUndefined();
    });

    it("delegates edits and session ownership to the original array source", async () => {
        const original = new ArrayDataSource(initial(), {
            parentField: "parentId", createRowId: () => "new", defaults: { region: "West", amount: 5 }
        });
        const source = new LocalGroupingDataSource(original, async (row, field) => (row as any)[field]);
        expect(source.changed).toBe(original.changed);
        const event = vi.fn();
        source.changed!.subscribe(event);
        await source.update!(original.array[0], { amount: 25 });
        const session = await source.createNewRow!();
        await source.update!(session.row, { parentId: 1 });
        expect(source.getRowId!(session.row)).toBe("new");
        expect(await source.hasChildren!(original.array[0])).toBe(false);
        await session.insert();
        expect(await source.hasChildren!(original.array[0])).toBe(true);
        const grouped = await source.loadData({ groupBy: [{ field: "region" }], groupSummary: [{ field: "amount", summaryType: "sum" }] });
        expect(grouped.groups!.find(group => group.groupValue === "West")!.summaryValues!.amount).toBe(30);
        await source.delete!(session.row);
        expect(event.mock.calls.map(call => call[0].kind)).toEqual(["update", "create", "update", "insert", "delete"]);
    });

    it("shares the dataset coordinator, notifications and reversible edits", async () => {
        const dataset = new DataSet();
        const table = dataset.createTable("items", initial());
        const source = new LocalGroupingDataSource(table, async (row, field) => row.getValue(field));
        expect(source.undoCoordinator).toBe(dataset.undoCoordinator);
        expect(source.changed).toBe(table.changed);
        await source.update!(table.rows[0], { amount: 50 });
        expect(table.rows[0].getValue("amount")).toBe(50);
        await source.undoCoordinator!.undo();
        expect(table.rows[0].getValue("amount")).toBe(10);
    });
});
