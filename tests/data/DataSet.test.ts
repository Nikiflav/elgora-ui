import { describe, expect, it } from "vitest";
import { DataSet, DataRow } from "../../src/data/dataset/DataSet";
import type { DataSource, DataSourceChanged } from "../../src/data/DataSource";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";

const createDataSet = () => {
    let id = 0;
    return new DataSet({ createRowId: () => "client-" + ++id });
};
const createTable = () => createDataSet().createTable("orders", [
    { id: 1, region: "West", quantity: 2 }, { id: 2, region: "East", quantity: 3 }
]);

describe("DataSet foundation", () => {
    it("requires an explicit ID factory only when creating rows", async () => {
        const table = new DataSet().createTable("items", [{ id: 1 }]);
        await expect(table.createNewRow()).rejects.toThrow("Configure createRowId");
        expect((await table.loadData({})).dataItems).toHaveLength(1);
    });

    it("supports application string IDs, zero and per-table factories", async () => {
        const seen: string[] = [];
        const dataset = new DataSet({ createRowId: table => { seen.push(table.name); return "guid-A"; } });
        const a = dataset.createTable("a"), b = dataset.createTable("b", [], { createRowId: () => 0 });
        expect((await a.createNewRow()).row.key).toBe("guid-A");
        expect((await b.createNewRow()).row.key).toBe(0);
        expect(seen).toEqual(["a"]);
    });

    it("checks concurrent async generated IDs after awaiting", async () => {
        let release!: (id: string) => void;
        const id = new Promise<string>(resolve => { release = resolve; });
        const table = new DataSet({ createRowId: () => id }).createTable("items");
        const first = table.createNewRow(), second = table.createNewRow();
        release("same");
        const results = await Promise.allSettled([first, second]);
        expect(results.map(r => r.status)).toEqual(["fulfilled", "rejected"]);
        if (results[0].status === "fulfilled") await results[0].value.cancel();
        table.acceptChanges();
    });

    it("retains lazy originals and transports modified fields only", async () => {
        const table = createTable(), row = table.rows[0];
        expect(row.getOriginal("quantity")).toBe(2);
        await row.setValue("quantity", 5); await row.setValue("quantity", 7);
        expect(row.getOriginal("quantity")).toBe(2);
        expect(row.isModified("quantity")).toBe(true);
        expect(row.changes()).toEqual({ quantity: 7 });
        await row.setValue("quantity", 2);
        expect(row.isModified("quantity")).toBe(false);
        expect(table.getChanges()).toEqual([]);
    });

    it("compares structured field values by reference and restores accepted references", async () => {
        const original = { tags: ["A"] };
        const table = new DataSet().createTable("items", [{ id: 1, details: original }]);
        const row = table.rows[0];
        await row.setValue("details", original);
        expect(row.state).toBe("unchanged");
        await row.setValue("details", { tags: ["A"] });
        expect(row.state).toBe("modified");
        expect(row.getOriginal("details")).toBe(original);
        table.rejectChanges();
        expect(row.getValue("details")).toBe(original);
    });

    it("imports by ID preserving references and local edits by default", async () => {
        const table = createTable(), first = table.rows[0], second = table.rows[1];
        await first.setValue("quantity", 9);
        const imported = table.importRows([{ id: 1, quantity: 20 }, { id: 2, quantity: 30 }, { id: 3 }]);
        expect(imported[0]).toBe(first); expect(imported[1]).toBe(second);
        expect(first.getValue("quantity")).toBe(9);
        expect(second.getValue("quantity")).toBe(30);
        table.importRows([{ id: 1, quantity: 40 }], false);
        expect(first.state).toBe("unchanged"); expect(first.getValue("quantity")).toBe(40);
        expect(table.getRow(3)).toBe(imported[2]);
    });

    it("validates complete imports before changing existing values", async () => {
        const table = createTable();
        expect(() => table.importRows([{ id: 1, quantity: 99 }, { id: 1 }])).toThrow("unique");
        expect(table.rows[0].getValue("quantity")).toBe(2);
        const newRowSession = await table.createNewRow();
        expect(() => table.importRows([{ id: newRowSession.row.key }])).toThrow("pending");
        await newRowSession.cancel();
    });

    it("saves one dataset batch and accepts only after success", async () => {
        const table = createTable(), dataset = table.dataSet, row = table.rows[0];
        await row.setValue("quantity", 8);
        const calls: unknown[] = [];
        const result = await dataset.saveChanges(async changes => {
            calls.push(changes);
            expect(dataset.isSaving).toBe(true);
            expect(row.state).toBe("modified");
            return { success: true };
        });
        expect(result).toEqual({ success: true });
        expect(calls).toEqual([{ orders: [{ type: "update", key: 1, data: { quantity: 8 } }] }]);
        expect(row.state).toBe("unchanged"); expect(dataset.isSaving).toBe(false);
        expect(dataset.getChanges()).toEqual({});
        await dataset.saveChanges(async () => { throw new Error("Must not call for empty changes"); });
    });

    it("retains changes after validation failure or transport exception", async () => {
        const table = createTable(), dataset = table.dataSet;
        await table.rows[0].setValue("quantity", 9);
        expect(await dataset.saveChanges(async () => ({ success: false, error: "Invalid" })))
            .toEqual({ success: false, error: "Invalid" });
        await expect(dataset.saveChanges(async () => { throw new Error("Network"); })).rejects.toThrow("Network");
        expect(dataset.isSaving).toBe(false);
        expect(table.rows[0].state).toBe("modified");
        expect(table.getChanges()).toHaveLength(1);
    });

    it("maps inserted IDs without replacing rows and notifies after accepting all tables", async () => {
        const dataset = createDataSet(), a = dataset.createTable("a"), b = dataset.createTable("b");
        const firstNewRowSession = await a.createNewRow(), secondNewRowSession = await b.createNewRow();
        await firstNewRowSession.insert(); await secondNewRowSession.insert();
        const oldX = firstNewRowSession.row.key, oldY = secondNewRowSession.row.key, observed: string[] = [];
        a.changed.subscribe(event => {
            if (event.kind === "reset") {
                expect(firstNewRowSession.row.state).toBe("unchanged"); expect(secondNewRowSession.row.state).toBe("unchanged");
                expect(secondNewRowSession.row.key).toBe("server-Y"); observed.push(event.kind);
            }
        });
        await dataset.saveChanges(async () => ({ success: true, keyMappings: {
            a: [{ temporaryKey: oldX, key: 0 }], b: [{ temporaryKey: oldY, key: "server-Y" }]
        } }));
        expect(a.getRow(oldX)).toBeUndefined(); expect(a.getRow(0)).toBe(firstNewRowSession.row);
        expect(firstNewRowSession.row.getValue("id")).toBe(0); expect(observed).toEqual(["reset"]);
    });

    it("validates every table mapping before applying any", async () => {
        const dataset = createDataSet(), a = dataset.createTable("a"), b = dataset.createTable("b", [{ id: 1 }]);
        const firstNewRowSession = await a.createNewRow(), secondNewRowSession = await b.createNewRow();
        await firstNewRowSession.insert(); await secondNewRowSession.insert();
        const oldX = firstNewRowSession.row.key, oldY = secondNewRowSession.row.key;
        await expect(dataset.saveChanges(async () => ({ success: true, keyMappings: {
            a: [{ temporaryKey: oldX, key: 100 }], b: [{ temporaryKey: oldY, key: 1 }]
        } }))).rejects.toThrow("Duplicate mapped");
        expect(firstNewRowSession.row.key).toBe(oldX); expect(secondNewRowSession.row.key).toBe(oldY);
        expect(firstNewRowSession.row.state).toBe("added"); expect(dataset.isSaving).toBe(false);
    });

    it("rejects unknown tables, unknown keys and repeated source mappings", async () => {
        const table = createTable(), newRowSession = await table.createNewRow();
        await newRowSession.insert();
        for (const keyMappings of [
            { missing: [] },
            { orders: [{ temporaryKey: "missing", key: 5 }] },
            { orders: [{ temporaryKey: newRowSession.row.key, key: 5 }, { temporaryKey: newRowSession.row.key, key: 6 }] }
        ]) {
            await expect(table.dataSet.saveChanges(async () => ({ success: true, keyMappings }))).rejects.toThrow();
            expect(newRowSession.row.state).toBe("added");
        }
    });

    it("supports simultaneous mapped key swaps", async () => {
        const table = createTable(), firstNewRowSession = await table.createNewRow(), secondNewRowSession = await table.createNewRow();
        await firstNewRowSession.insert(); await secondNewRowSession.insert();
        const first = firstNewRowSession.row.key, second = secondNewRowSession.row.key;
        await table.dataSet.saveChanges(async () => ({ success: true, keyMappings: { orders: [
            { temporaryKey: first, key: second }, { temporaryKey: second, key: first }
        ] } }));
        expect(table.getRow(first)).toBe(secondNewRowSession.row); expect(table.getRow(second)).toBe(firstNewRowSession.row);
    });

    it("blocks mutation and concurrent saves while persistence is in flight", async () => {
        const table = createTable(), dataset = table.dataSet, row = table.rows[0];
        await row.setValue("quantity", 9);
        let release!: () => void;
        const wait = new Promise<void>(resolve => { release = resolve; });
        const saving = dataset.saveChanges(async () => { await wait; return { success: true }; });
        await expect(row.setValue("quantity", 10)).rejects.toThrow("saving");
        await expect(table.delete(row)).rejects.toThrow("saving");
        await expect(table.createNewRow()).rejects.toThrow("saving");
        await expect(dataset.saveChanges(async () => ({ success: true }))).rejects.toThrow("saving");
        expect(() => dataset.acceptChanges()).toThrow("saving");
        expect(() => dataset.rejectChanges()).toThrow("saving");
        expect(() => table.importRows([{ id: 1 }])).toThrow("saving");
        release(); await saving;
        expect(row.getValue("quantity")).toBe(9);
    });

    it("refuses saves during pending sessions or unfinished ID generation", async () => {
        const table = createTable(), newRowSession = await table.createNewRow();
        await expect(table.dataSet.saveChanges(async () => ({ success: true }))).rejects.toThrow("pending");
        await newRowSession.cancel();
        let release!: (id: string) => void;
        const table2 = new DataSet({ createRowId: () => new Promise<string>(resolve => { release = resolve; }) })
            .createTable("items");
        const creating = table2.createNewRow();
        await expect(table2.dataSet.saveChanges(async () => ({ success: true }))).rejects.toThrow("pending");
        release("new"); await (await creating).cancel();
    });
    it("owns named tables and exposes copied collections", () => {
        const dataset = new DataSet(), table = dataset.createTable("orders", [{ id: 1 }]);
        expect(dataset.getTable("orders")).toBe(table);
        expect(table.dataSet).toBe(dataset);
        expect(dataset.getTable("missing")).toBeUndefined();
        (dataset.tables as unknown[]).pop();
        (table.rows as unknown[]).pop();
        expect(dataset.tables).toHaveLength(1); expect(table.rows).toHaveLength(1);
        expect(() => dataset.createTable("orders")).toThrow("Duplicate table");
    });

    it("implements DataSource using real, unchanged value rows", async () => {
        const table = createTable(), source: DataSource<DataRow> = table;
        const result = await source.loadData({ requireTotalCount: true });
        expect(result.totalCount).toBe(2);
        expect(result.dataItems?.[0]).toBe(table.rows[0]);
        expect(table.rows[0].state).toBe("unchanged");
        expect(source.getRowId?.(table.rows[0])).toBe(1);
        expect(table.dataSet.getChanges()).toEqual({});
        expect(source.undoCoordinator).toBe(table.dataSet.undoCoordinator);
    });

    it("requires unique stable identity values", () => {
        const dataset = new DataSet();
        for (const values of [[{ id: 1 }, { id: 1 }], [{}], [{ id: NaN }], [{ id: Infinity }]])
            expect(() => dataset.createTable("bad", values)).toThrow("unique");
        expect(dataset.getTable("bad")).toBeUndefined();
        const table = dataset.createTable("custom", [{ code: "A", value: 1 }], { idField: "code" });
        expect(table.rows[0].key).toBe("A");
    });

    it("copies field containers without cloning object-valued fields", async () => {
        const values = [{ id: 1, details: { tags: ["A"] } }];
        const table = new DataSet().createTable("items", values), row = table.rows[0];
        values[0].details.tags.push("source");
        (row.getValue("details") as { tags: string[] }).tags.push("lookup");
        (row.toObject().details as { tags: string[] }).tags.push("snapshot");
        expect(row.getValue("details")).toBe(values[0].details);
        expect(row.getValue("details")).toEqual({ tags: ["A", "source", "lookup", "snapshot"] });
        row.toObject().id = 99;
        expect(row.key).toBe(1);
        expect(row.state).toBe("unchanged");
        expect((await table.loadData({})).dataItems?.[0]).toBe(row);
    });

    it("changes values through commands and reports actual row objects", async () => {
        const table = createTable(), row = table.rows[0], events: DataSourceChanged<DataRow>[] = [];
        table.changed.subscribe(e => events.push(e));
        expect(await row.setValue("quantity", 5)).toEqual({ success: true });
        expect(row.getValue("quantity")).toBe(5); expect(row.state).toBe("modified");
        expect(events).toEqual([{ kind: "update", row, fields: ["quantity"] }]);
        await row.setValue("quantity", 5);
        expect(events).toHaveLength(1);
        const changes = table.getChanges();
        expect(changes[0]).toMatchObject({ type: "update", key: 1, data: { quantity: 5 } });
        changes[0].data!.quantity = 99;
        expect(row.getValue("quantity")).toBe(5);
    });

    it("rejects foreign rows and identity changes without mutating them", async () => {
        const table = createTable(), other = createTable(), row = table.rows[0];
        expect((await table.update(other.rows[0], { quantity: 5 })).success).toBe(false);
        expect((await table.delete(other.rows[0])).success).toBe(false);
        expect((await table.update(row, { id: 2, quantity: 5 })).success).toBe(false);
        expect(row.toObject()).toEqual({ id: 1, region: "West", quantity: 2 });
        expect(() => table.getRowId(other.rows[0])).toThrow("another table");
    });

    it("does not partially apply a patch whose getter throws", async () => {
        const table = createTable(), row = table.rows[0];
        await expect(table.update(row, { quantity: 99, get invalid() { throw new Error("Invalid value"); } })).rejects.toThrow("Invalid value");
        expect(row.getValue("quantity")).toBe(2); expect(row.state).toBe("unchanged");
        expect(table.getChanges()).toEqual([]);
    });

    it("creates independent sessions with defaults retained by reference and unique keys", async () => {
        const defaults = { quantity: 0, details: { tags: ["A"] } };
        const table = createDataSet().createTable("items", [{ id: -1 }], { defaults });
        const firstNewRowSession = await table.createNewRow(), secondNewRowSession = await table.createNewRow();
        expect(firstNewRowSession.row).toBeInstanceOf(DataRow);
        expect(firstNewRowSession.row.state).toBe("added"); expect(secondNewRowSession.row.state).toBe("added");
        expect(firstNewRowSession.row.key).not.toBe(secondNewRowSession.row.key); expect(firstNewRowSession.row.key).not.toBe(-1);
        expect(firstNewRowSession.state).toBe("pending"); expect(secondNewRowSession.state).toBe("pending");
        defaults.details.tags.push("outside");
        await firstNewRowSession.row.setValue("details", { tags: ["B"] });
        expect(secondNewRowSession.row.getValue("details")).toBe(defaults.details);
        expect(secondNewRowSession.row.getValue("details")).toEqual({ tags: ["A", "outside"] });
    });

    it("notifies every pending edit but excludes pending rows from queries and changes", async () => {
        const table = createTable(), events: DataSourceChanged<DataRow>[] = [];
        table.changed.subscribe(e => events.push(e));
        const newRowSession = await table.createNewRow();
        await table.update(newRowSession.row, { quantity: 100 });
        expect(events.map(e => e.kind)).toEqual(["create", "update"]);
        expect(events[1].row).toBe(newRowSession.row);
        expect(table.rows).not.toContain(newRowSession.row);
        expect(table.getChanges()).toEqual([]);
        const result = await table.loadData({ requireTotalCount: true, totalSummary: [{ field: "quantity", summaryType: "sum" }] });
        expect(result.totalCount).toBe(2);
        expect(result.totalSummary?.[0].value).toBe(5);
        expect(result.dataItems).not.toContain(newRowSession.row);
    });

    it("allows editing confirmed rows while several drafts are pending", async () => {
        const table = createTable(), firstNewRowSession = await table.createNewRow(), secondNewRowSession = await table.createNewRow();
        await table.update(firstNewRowSession.row, { quantity: 10 });
        await table.update(secondNewRowSession.row, { quantity: 20 });
        expect(await table.update(table.rows[0], { quantity: 30 })).toEqual({ success: true });
        expect(table.rows[0].getValue("quantity")).toBe(30);
        await firstNewRowSession.cancel();
        expect(secondNewRowSession.row.getValue("quantity")).toBe(20);
        expect(table.rows[0].getValue("quantity")).toBe(30);
    });

    it("insert keeps the same row/key and added state until acceptance", async () => {
        const table = createTable(), newRowSession = await table.createNewRow(), row = newRowSession.row, key = row.key;
        await row.setValue("quantity", 10);
        expect(await newRowSession.insert()).toEqual({ success: true });
        expect(newRowSession.state).toBe("inserted"); expect(row.state).toBe("added");
        expect(table.rows).toContain(row); expect(row.key).toBe(key);
        expect(table.getChanges()).toEqual([{ type: "insert", key, data: { id: key, quantity: 10 } }]);
        expect((await table.loadData({ requireTotalCount: true })).totalCount).toBe(3);
        table.acceptChanges();
        expect(row.state).toBe("unchanged"); expect(table.getChanges()).toEqual([]);
    });

    it("insert/cancel are idempotent individually and reject incompatible transitions", async () => {
        const table = createTable(), insertedNewRowSession = await table.createNewRow();
        const events: string[] = []; table.changed.subscribe(e => events.push(e.kind));
        await insertedNewRowSession.insert(); await insertedNewRowSession.insert();
        expect(events).toEqual(["insert"]);
        await expect(insertedNewRowSession.cancel()).rejects.toThrow("inserted");
        const cancelledNewRowSession = await table.createNewRow();
        await cancelledNewRowSession.cancel(); await cancelledNewRowSession.cancel();
        await expect(cancelledNewRowSession.insert()).rejects.toThrow("cancelled");
        expect(cancelledNewRowSession.state).toBe("cancelled");
        expect((await table.update(cancelledNewRowSession.row, { quantity: 3 })).success).toBe(false);
        expect(table.rows).not.toContain(cancelledNewRowSession.row);
    });

    it("requires session cancellation instead of deleting a pending row", async () => {
        const table = createTable(), newRowSession = await table.createNewRow();
        expect(await table.delete(newRowSession.row)).toEqual({ success: false, error: "Failed to delete row. Cancel the pending session instead." });
        expect(newRowSession.state).toBe("pending");
        await newRowSession.cancel(); expect(table.getChanges()).toEqual([]);
    });

    it("marks existing rows deleted and restores them on reject", async () => {
        const table = createTable(), row = table.rows[0];
        await table.update(row, { quantity: 20 }); await table.delete(row);
        expect(row.state).toBe("deleted"); expect(table.rows).toContain(row);
        expect(table.getChanges()).toEqual([{ type: "remove", key: 1 }]);
        expect((await table.loadData({})).dataItems).not.toContain(row);
        expect((await row.setValue("quantity", 50)).success).toBe(false);
        table.rejectChanges();
        expect(row.state).toBe("unchanged"); expect(row.getValue("quantity")).toBe(2);
        expect((await table.loadData({})).dataItems).toContain(row);
    });

    it("accept removes deleted rows and reject removes added rows", async () => {
        const table = createTable(), deleted = table.rows[0];
        await table.delete(deleted); table.acceptChanges();
        expect(table.rows).not.toContain(deleted);
        expect((await table.update(deleted, { quantity: 5 })).success).toBe(false);
        const newRowSession = await table.createNewRow(); await newRowSession.insert();
        table.rejectChanges();
        expect(table.rows).not.toContain(newRowSession.row);
        expect((await table.update(newRowSession.row, { quantity: 5 })).success).toBe(false);
    });

    it("deleting an unsaved added row produces no persistence change", async () => {
        const table = createTable(), newRowSession = await table.createNewRow();
        await newRowSession.insert(); await table.delete(newRowSession.row);
        expect(table.getChanges()).toEqual([]); expect(table.rows).not.toContain(newRowSession.row);
    });

    it("preflights all tables before accept/reject when drafts remain active", async () => {
        const dataset = createDataSet();
        const first = dataset.createTable("first", [{ id: 1, quantity: 1 }]);
        const second = dataset.createTable("second");
        await first.update(first.rows[0], { quantity: 2 });
        const newRowSession = await second.createNewRow();
        expect(() => dataset.acceptChanges()).toThrow("pending");
        expect(first.rows[0].state).toBe("modified");
        expect(() => dataset.rejectChanges()).toThrow("pending");
        expect(first.rows[0].getValue("quantity")).toBe(2);
        await newRowSession.cancel(); dataset.rejectChanges();
        expect(first.rows[0].getValue("quantity")).toBe(1);
    });

    it("accept establishes a new baseline for later rejection", async () => {
        const table = createTable(), row = table.rows[0];
        await row.setValue("quantity", 5); table.dataSet.acceptChanges();
        await row.setValue("quantity", 10); table.dataSet.rejectChanges();
        expect(row.getValue("quantity")).toBe(5);
        expect(table.dataSet.getChanges()).toEqual({});
    });

    it("collects changes by table without empty tables", async () => {
        const dataset = new DataSet(), first = dataset.createTable("a", [{ id: 1 }]);
        dataset.createTable("empty"); await first.update(first.rows[0], { value: 5 });
        expect(dataset.getChanges()).toEqual({ a: [{ type: "update", key: 1, data: { value: 5 } }] });
    });

    it("reuses local filtering, sorting, paging and total summaries", async () => {
        const table = createTable();
        const args = { filter: ["quantity", ">=", 2] as [string, string, number], orderby: ["region"], top: 1,
            requireTotalCount: true, totalSummary: [{ field: "quantity", summaryType: "sum" }] };
        const result = await table.loadData(args);
        expect(result.args).toBe(args); expect(result.totalCount).toBe(2);
        expect(result.dataItems).toEqual([table.rows[1]]);
        expect(result.totalSummary?.[0].value).toBe(5);
        const grouped = await new LocalGroupingDataSource(table, async (row, field) => row.getValue(field))
            .loadData({ groupColumn: "region" });
        expect(grouped.groups?.map(g => g.groupValue)).toEqual(["East", "West"]);
    });
});
