import { describe, expect, it } from "vitest";
import { DataSet } from "../../src/data/dataset/DataSet";
import type { DataTransaction } from "../../src/data/dataset/DataTransaction";
import type { DataRow } from "../../src/data/dataset/DataRow";
import type { NewRowSession } from "../../src/data/DataSource";

function setup() {
    let id = 0;
    const dataset = new DataSet({ createRowId: () => "new-" + ++id });
    const a = dataset.createTable("a", [{ id: 1, value: 10 }, { id: 2, value: 20 }]);
    const b = dataset.createTable("b", [{ id: 1, value: 30 }]);
    return { dataset, a, b, first: a.rows[0], second: a.rows[1], other: b.rows[0] };
}

describe("DataSet transactions", () => {
    it("publishes automatic edits only after completion", async () => {
        const { a, first } = setup();
        const seen: unknown[] = [];
        a.changed.subscribe(() => seen.push([first.getValue("value"), first.state]));
        await first.setValue("value", 11);
        expect(seen).toEqual([[11, "modified"]]);
    });

    it("commits several tables before publishing any event", async () => {
        const { dataset, a, b, first, other } = setup();
        const seen: unknown[] = [];
        for (const table of [a, b]) table.changed.subscribe(() =>
            seen.push([first.getValue("value"), other.getValue("value")]));
        expect(await dataset.transaction("Two tables", async tx => {
            await tx.update(a, first, { value: 11 });
            expect(seen).toEqual([]);
            await tx.update(b, other, { value: 31 });
            expect(seen).toEqual([]);
        })).toEqual({ success: true });
        expect(seen).toEqual([[11, 31], [11, 31]]);
    });

    it("rolls back all tables on exception without notifications", async () => {
        const { dataset, a, b, first, other } = setup();
        const seen: string[] = [];
        for (const table of [a, b]) table.changed.subscribe(e => seen.push(e.kind));
        await expect(dataset.transaction("Fail", async tx => {
            await tx.update(a, first, { value: 99 });
            await tx.delete(b, other);
            throw new Error("Abort");
        })).rejects.toThrow("Abort");
        expect(first.getValue("value")).toBe(10);
        expect(first.state).toBe("unchanged");
        expect(other.state).toBe("unchanged");
        expect(dataset.getChanges()).toEqual({});
        expect(seen).toEqual([]);
    });

    it("rolls back ignored validation failures and explicit unsuccessful results", async () => {
        const { dataset, a, first, second } = setup();
        const result = await dataset.transaction("Invalid identity", async tx => {
            await tx.update(a, first, { value: 99 });
            await tx.update(a, second, { id: 100 });
        });
        expect(result.success).toBe(false);
        expect(first.getValue("value")).toBe(10);
        expect(await dataset.transaction("Rejected", async tx => {
            await tx.update(a, first, { value: 88 });
            return { success: false, error: "Business rule" };
        })).toEqual({ success: false, error: "Business rule" });
        expect(dataset.getChanges()).toEqual({});
    });

    it("restores previously modified values and their accepted baseline", async () => {
        const { dataset, a, first } = setup();
        await first.setValue("value", 15);
        await expect(dataset.transaction("Fail", async tx => {
            await tx.update(a, first, { value: 16, extra: true });
            await tx.update(a, first, { value: 17 });
            throw new Error("Abort");
        })).rejects.toThrow("Abort");
        expect(first.toObject()).toEqual({ id: 1, value: 15 });
        expect(first.getOriginal("value")).toBe(10);
        expect(first.state).toBe("modified");
        expect(first.changes()).toEqual({ value: 15 });
    });

    it("restores removed added rows at their previous positions", async () => {
        const { dataset, a } = setup();
        const sessions = [await a.createNewRow(), await a.createNewRow()];
        for (const session of sessions) await session.insert();
        const rows = [...a.rows];
        await expect(dataset.transaction("Remove", async tx => {
            await tx.delete(a, sessions[0].row);
            await tx.delete(a, sessions[1].row);
            throw new Error("Abort");
        })).rejects.toThrow("Abort");
        expect(a.rows).toEqual(rows);
        expect(a.rows[2]).toBe(sessions[0].row);
        expect(a.rows[3]).toBe(sessions[1].row);
    });

    it("cancels sessions created by a rolled-back transaction", async () => {
        const { dataset, a } = setup();
        let session!: NewRowSession<DataRow>;
        await expect(dataset.transaction("Create", async tx => {
            session = await tx.createNewRow(a);
            await tx.update(a, session.row, { value: 42 });
            await tx.insert(session);
            throw new Error("Abort");
        })).rejects.toThrow("Abort");
        expect(session.state).toBe("cancelled");
        expect(a.getRow(session.row.key)).toBeUndefined();
        expect(a.rows).toHaveLength(2);
        expect(dataset.getChanges()).toEqual({});
        dataset.acceptChanges();
    });

    it("restores existing pending sessions after insert or cancellation rollback", async () => {
        const { dataset, a } = setup();
        const session = await a.createNewRow();
        await session.row.setValue("value", 7);
        for (const action of ["insert", "cancel"] as const) {
            await expect(dataset.transaction(action, async tx => {
                await tx.update(a, session.row, { value: 8 });
                await tx[action](session);
                throw new Error("Abort");
            })).rejects.toThrow("Abort");
            expect(session.state).toBe("pending");
            expect(session.row.getValue("value")).toBe(7);
            expect(a.rows).not.toContain(session.row);
        }
        await session.insert();
        expect(a.getRow(session.row.key)).toBe(session.row);
    });

    it("creates and confirms a new row in one transaction", async () => {
        const { dataset, a } = setup();
        let session!: NewRowSession<DataRow>;
        await dataset.transaction("Insert", async tx => {
            session = await tx.createNewRow(a);
            await tx.update(a, session.row, { value: 50 });
            await tx.insert(session);
        });
        expect(session.state).toBe("inserted");
        expect(a.getRow(session.row.key)).toBe(session.row);
        expect(a.getChanges()[0]).toMatchObject({ type: "insert", data: { value: 50 } });
    });

    it("blocks unrelated writes and persistence across asynchronous continuations", async () => {
        const { dataset, a, first } = setup();
        const session = await a.createNewRow();
        let release!: () => void;
        const wait = new Promise<void>(resolve => { release = resolve; });
        const running = dataset.transaction("Async", async tx => {
            await tx.update(a, first, { value: 11 });
            await wait;
            await tx.update(a, first, { value: 12 });
        });
        await expect(first.setValue("value", 99)).rejects.toThrow("transaction");
        await expect(a.delete(first)).rejects.toThrow("transaction");
        await expect(a.createNewRow()).rejects.toThrow("transaction");
        await expect(session.insert()).rejects.toThrow("transaction");
        await expect(session.cancel()).rejects.toThrow("transaction");
        await expect(dataset.transaction("Nested", () => {})).rejects.toThrow("transaction");
        await expect(dataset.saveChanges(async () => ({ success: true }))).rejects.toThrow("transaction");
        expect(() => a.importRows([{ id: 1 }])).toThrow("transaction");
        expect(() => dataset.acceptChanges()).toThrow("transaction");
        expect(() => dataset.rejectChanges()).toThrow("transaction");
        release();
        await running;
        await session.cancel();
        await first.setValue("value", 13);
        expect(first.getValue("value")).toBe(13);
    });

    it("rejects completed contexts and tables from another dataset", async () => {
        const { dataset, a, first } = setup();
        let context!: DataTransaction;
        await dataset.transaction("Empty", tx => { context = tx; });
        expect(() => context.update(a, first, { value: 99 })).toThrow("not active");
        const foreign = setup();
        await expect(dataset.transaction("Foreign", async tx => {
            await tx.update(a, first, { value: 99 });
            await tx.update(foreign.a, foreign.first, { value: 88 });
        })).rejects.toThrow("not active");
        expect(first.getValue("value")).toBe(10);
        expect(foreign.first.getValue("value")).toBe(10);
    });

    it("waits for started operations even if the callback does not await them", async () => {
        let release!: (id: string) => void;
        const id = new Promise<string>(resolve => { release = resolve; });
        const dataset = new DataSet({ createRowId: () => id }), table = dataset.createTable("items");
        let sessionPromise!: Promise<NewRowSession<DataRow>>, completed = false;
        const running = dataset.transaction("Create", tx => { sessionPromise = tx.createNewRow(table); })
            .then(result => { completed = true; return result; });
        await Promise.resolve();
        expect(completed).toBe(false);
        release("new");
        await running;
        expect((await sessionPromise).state).toBe("pending");
        await (await sessionPromise).cancel();
    });

    it("settles asynchronous creation before rollback when the callback throws", async () => {
        let release!: (id: string) => void;
        const dataset = new DataSet({ createRowId: () => new Promise<string>(resolve => { release = resolve; }) });
        const table = dataset.createTable("items");
        let sessionPromise!: Promise<NewRowSession<DataRow>>;
        const running = dataset.transaction("Fail", tx => {
            sessionPromise = tx.createNewRow(table);
            throw new Error("Abort");
        });
        const assertion = expect(running).rejects.toThrow("Abort");
        release("new");
        await assertion;
        expect((await sessionPromise).state).toBe("cancelled");
        expect(table.rows).toEqual([]);
        dataset.acceptChanges();
    });

    it("does not commit a tracked rejection even if the callback catches it", async () => {
        const { dataset, a, first } = setup();
        const foreign = setup();
        await expect(dataset.transaction("Caught", async tx => {
            await tx.update(a, first, { value: 99 });
            try { await tx.createNewRow(foreign.a); } catch { /* Still aborts the transaction. */ }
        })).rejects.toThrow("not active");
        expect(first.getValue("value")).toBe(10);
    });

    it("keeps committed data if an observer throws and releases the write guard", async () => {
        const { a, first } = setup();
        const subscription = a.changed.subscribe(() => { throw new Error("Observer"); });
        await expect(first.setValue("value", 11)).rejects.toThrow("Observer");
        expect(first.getValue("value")).toBe(11);
        subscription.dispose();
        await first.setValue("value", 12);
        expect(first.getValue("value")).toBe(12);
    });

    it("restores previous references, not internal object mutations", async () => {
        const original = { nested: 1 };
        const dataset = new DataSet(), table = dataset.createTable("items", [{ id: 1, value: original, number: NaN }]);
        const row = table.rows[0];
        await row.setValue("number", NaN);
        expect(row.state).toBe("unchanged");
        await expect(dataset.transaction("Fail", async tx => {
            original.nested = 2;
            await tx.update(table, row, { value: { nested: 3 }, number: 0 });
            throw new Error("Abort");
        })).rejects.toThrow("Abort");
        expect(row.getValue("value")).toBe(original);
        expect(original.nested).toBe(2);
        expect(row.state).toBe("unchanged");
        await row.setValue("number", 0);
        await row.setValue("number", -0);
        expect(Object.is(row.getValue("number"), -0)).toBe(true);
    });
});
