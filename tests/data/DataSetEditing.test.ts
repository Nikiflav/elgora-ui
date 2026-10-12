import { describe, expect, it } from "vitest";
import { DataSet } from "../../src/data/dataset/DataSet";
import { UndoCoordinator } from "../../src/core/UndoCoordinator";
import type { DataEditContext, DataRowChangeEvent } from "../../src/data/dataset/DataEditContext";

function setup(coordinator?: UndoCoordinator) {
    let next = 0;
    const dataset = new DataSet({ undoCoordinator: coordinator, createRowId: () => "new-" + ++next });
    const orders = dataset.createTable("orders", [{ id: 1, quantity: 2, price: 10, total: 20 }]);
    const totals = dataset.createTable("totals", [{ id: 1, amount: 20 }]);
    return { dataset, orders, totals, row: orders.rows[0], total: totals.rows[0], history: dataset.undoCoordinator };
}

describe("DataSet business rules and history", () => {
    it("awaits before handlers in order before applying the proposed value", async () => {
        const { orders, row } = setup();
        const log: string[] = [];
        orders.rowChanging.subscribe(async e => {
            if (!e.fields.includes("quantity")) return;
            await Promise.resolve();
            expect(row.getValue("quantity")).toBe(2);
            log.push("first");
            await e.context.setValue(row, "total", 30);
        });
        orders.rowChanging.subscribe(e => {
            if (!e.fields.includes("quantity")) return;
            expect(row.getValue("total")).toBe(30);
            expect(row.getValue("quantity")).toBe(2);
            log.push("second");
        });
        await row.setValue("quantity", 3);
        expect(log).toEqual(["first", "second"]);
        expect(row.getValue("quantity")).toBe(3);
    });

    it("stops later rules on rejection after await and rolls back derived edits", async () => {
        const { orders, row, history } = setup();
        let later = false;
        orders.rowChanged.subscribe(async e => {
            if (!e.fields.includes("quantity")) return;
            await e.context.setValue(row, "total", 100);
            await Promise.resolve();
            e.reject("Rejected after await");
        });
        orders.rowChanged.subscribe(e => {
            if (e.fields.includes("quantity")) later = true;
        });
        expect(await row.setValue("quantity", 3)).toMatchObject({ success: false, error: "Rejected after await" });
        expect(row.getValue("quantity")).toBe(2);
        expect(row.getValue("total")).toBe(20);
        expect(later).toBe(false);
        expect(history.canUndo).toBe(false);
    });

    it("stops later rules on an asynchronous exception", async () => {
        const { orders, row } = setup();
        let later = false;
        orders.rowChanged.subscribe(async () => {
            await Promise.resolve();
            throw new Error("Async rule");
        });
        orders.rowChanged.subscribe(() => { later = true; });
        await expect(row.setValue("quantity", 3)).rejects.toThrow("Async rule");
        expect(later).toBe(false);
        expect(row.getValue("quantity")).toBe(2);
    });

    it("records a direct edit and all derived changes as one operation", async () => {
        const { dataset, orders, totals, row, total, history } = setup();
        let rules = 0;
        orders.rowChanged.subscribe(e => {
            if (!e.fields.includes("quantity")) return;
            rules++;
            expect(e.context.getTable("totals")).toBe(totals);
            e.context.setValue(e.row, "total", Number(e.row.getValue("quantity")) * 10);
            e.context.setValue(total, "amount", Number(e.row.getValue("quantity")) * 10);
        });
        await row.setValue("quantity", 3);
        expect(row.getValue("total")).toBe(30);
        expect(total.getValue("amount")).toBe(30);
        await history.undo();
        expect(row.toObject()).toEqual({ id: 1, quantity: 2, price: 10, total: 20 });
        expect(total.getValue("amount")).toBe(20);
        expect(dataset.getChanges()).toEqual({});
        expect(history.canUndo).toBe(false);
        await history.redo();
        expect(row.getValue("quantity")).toBe(3);
        expect(row.getValue("total")).toBe(30);
        expect(total.getValue("amount")).toBe(30);
        expect(rules).toBe(1);
    });

    it("publishes UI events only after all business effects finish", async () => {
        const { orders, row } = setup();
        const seen: number[] = [];
        orders.rowChanged.subscribe(e => {
            if (e.fields.includes("quantity")) e.context.setValue(row, "total", 50);
        });
        orders.changed.subscribe(() => seen.push(Number(row.getValue("total"))));
        await row.setValue("quantity", 5);
        expect(seen).toEqual([50, 50]);
    });

    it("provides before/after values and lets a before rule reject with field errors", async () => {
        const { orders, row, history } = setup();
        let after = 0;
        orders.rowChanged.subscribe(() => { after++; });
        orders.rowChanging.subscribe(e => {
            expect(row.getValue("quantity")).toBe(2);
            expect(e.oldValues).toEqual({ quantity: 2 });
            expect(e.values).toEqual({ quantity: -1 });
            e.reject("Invalid quantity", { quantity: "Must be positive" });
        });
        expect(await row.setValue("quantity", -1)).toEqual({
            success: false, error: "Invalid quantity", fieldErrors: { quantity: "Must be positive" }
        });
        expect(row.getValue("quantity")).toBe(2);
        expect(after).toBe(0);
        expect(history.canUndo).toBe(false);
    });

    it("rolls back direct and derived changes if an after rule rejects", async () => {
        const { orders, row, total, history } = setup();
        const seen: string[] = [];
        orders.changed.subscribe(e => seen.push(e.kind));
        orders.rowChanged.subscribe(e => {
            if (e.fields.includes("quantity")) {
                e.context.setValue(total, "amount", 100);
                e.reject("Business rule");
            }
        });
        expect((await row.setValue("quantity", 3)).success).toBe(false);
        expect(row.getValue("quantity")).toBe(2);
        expect(total.getValue("amount")).toBe(20);
        expect(seen).toEqual([]);
        expect(history.canUndo).toBe(false);
    });

    it("awaits asynchronous subscribers", async () => {
        const { orders, row } = setup();
        let release!: () => void;
        const wait = new Promise<void>(resolve => { release = resolve; });
        orders.rowChanged.subscribe(async e => {
            if (e.fields.includes("quantity")) {
                await wait;
                await e.context.setValue(row, "total", 70);
            }
        });
        const edit = row.setValue("quantity", 7);
        await Promise.resolve();
        release();
        await edit;
        expect(row.getValue("total")).toBe(70);
    });

    it("rolls back on synchronous and asynchronous rule exceptions", async () => {
        for (const asynchronous of [false, true]) {
            const { orders, row, history } = setup();
            orders.rowChanged.subscribe(e => {
                if (asynchronous) return Promise.reject(new Error("Rule error"));
                else throw new Error("Rule error");
            });
            await expect(row.setValue("quantity", 3)).rejects.toThrow("Rule error");
            expect(row.getValue("quantity")).toBe(2);
            expect(history.canUndo).toBe(false);
        }
    });

    it("rejects use of a completed event context and exposes no waitUntil", async () => {
        const { orders, row } = setup();
        let event!: DataRowChangeEvent;
        orders.rowChanged.subscribe(e => { event = e; });
        await row.setValue("quantity", 3);
        expect(() => event.context.setValue(row, "quantity", 4)).toThrow("not active");
        expect("waitUntil" in event).toBe(false);
    });

    it("does not invoke rules, replace references or record history for equal values", async () => {
        const original = { x: 1 };
        const dataset = new DataSet();
        const table = dataset.createTable("items", [{ id: 1, point: original }], {
            equals: (field, a, b) => field === "point"
                ? (a as { x: number }).x === (b as { x: number }).x : Object.is(a, b)
        });
        let events = 0;
        table.rowChanging.subscribe(() => { events++; });
        table.rowChanged.subscribe(() => { events++; });
        await table.rows[0].setValue("point", { x: 1 });
        expect(table.rows[0].getValue("point")).toBe(original);
        expect(events).toBe(0);
        expect(dataset.undoCoordinator.canUndo).toBe(false);
    });

    it("uses custom equality for differences from accepted values", async () => {
        const dataset = new DataSet();
        const table = dataset.createTable("items", [{ id: 1, value: { x: 1 } }], {
            equals: (_field, a, b) => typeof a === "object" && a && b
                ? (a as { x: number }).x === (b as { x: number }).x : Object.is(a, b)
        });
        const row = table.rows[0];
        await row.setValue("value", { x: 2 });
        expect(row.isModified("value")).toBe(true);
        await row.setValue("value", { x: 1 });
        expect(row.isModified("value")).toBe(false);
        expect(table.getChanges()).toEqual([]);
    });

    it("rolls back a transaction if equals throws", async () => {
        const dataset = new DataSet();
        const table = dataset.createTable("items", [{ id: 1, value: 1 }], {
            equals: (_field, a, b) => { if (b === 3) throw new Error("Comparison"); return Object.is(a, b); }
        });
        await expect(dataset.transaction("Compare", async tx => {
            await tx.update(table, table.rows[0], { value: 2 });
            await tx.update(table, table.rows[0], { value: 3 });
        })).rejects.toThrow("Comparison");
        expect(table.rows[0].getValue("value")).toBe(1);
        expect(dataset.undoCoordinator.canUndo).toBe(false);
    });

    it("stops recursive rules when the requested value is unchanged", async () => {
        const { orders, row } = setup();
        let calls = 0;
        orders.rowChanged.subscribe(e => {
            calls++;
            e.context.setValue(row, "quantity", row.getValue("quantity"));
        });
        await row.setValue("quantity", 3);
        expect(calls).toBe(1);
    });

    it("detects synchronous and asynchronous causal cycles and restores all changes", async () => {
        for (const asynchronous of [false, true]) {
            const { orders, row, history } = setup();
            orders.rowChanged.subscribe(e => {
                const run = async () => {
                    if (asynchronous) await Promise.resolve();
                    if (e.fields.includes("quantity")) await e.context.setValue(row, "total", 100);
                    if (e.fields.includes("total")) await e.context.setValue(row, "quantity", 9);
                };
                return run();
            });
            await expect(row.setValue("quantity", 3)).rejects.toThrow("Cyclic change");
            expect(row.getValue("quantity")).toBe(2);
            expect(row.getValue("total")).toBe(20);
            expect(history.canUndo).toBe(false);
        }
    });

    it("allows separate sequential edits of one field in an explicit transaction", async () => {
        const { dataset, orders, row, history } = setup();
        await dataset.transaction("Two edits", async tx => {
            await tx.context.setValue(row, "quantity", 3);
            await tx.context.setValue(row, "quantity", 4);
        });
        expect(row.getValue("quantity")).toBe(4);
        await history.undo();
        expect(row.getValue("quantity")).toBe(2);
        expect(history.canUndo).toBe(false);
        expect(orders.rows[0]).toBe(row);
    });

    it("awaits sibling rules in order while retaining independent causal contexts", async () => {
        const { orders, row } = setup();
        orders.rowChanged.subscribe(async e => {
            if (e.fields.includes("quantity")) {
                await Promise.resolve();
                await e.context.setValue(row, "total", 30);
            }
        });
        orders.rowChanged.subscribe(async e => {
            if (e.fields.includes("quantity")) {
                expect(row.getValue("total")).toBe(30);
                await e.context.setValue(row, "total", 40);
            }
        });
        await row.setValue("quantity", 3);
        expect(row.getValue("total")).toBe(40);
    });

    it("tracks pending row creation, field edits, insert and cancellation separately", async () => {
        const { orders, history } = setup();
        const session = await orders.createNewRow();
        await session.row.setValue("quantity", 1);
        await session.row.setValue("price", 2);
        await history.undo();
        expect(session.row.getValue("price")).toBeUndefined();
        await history.undo();
        expect(session.row.getValue("quantity")).toBeUndefined();
        await history.undo();
        expect(session.state).toBe("cancelled");
        expect(history.canUndo).toBe(false);
        await history.redo();
        expect(session.state).toBe("pending");
        await history.redo();
        await history.redo();
        await session.insert();
        expect(session.state).toBe("inserted");
        await history.undo();
        expect(session.state).toBe("pending");
        expect(orders.rows).not.toContain(session.row);
        await session.cancel();
        await history.undo();
        expect(session.state).toBe("pending");
        expect(session.row.getValue("quantity")).toBe(1);
        await history.redo();
        expect(session.state).toBe("cancelled");
    });

    it("lets creation rules initialize the new row, but not other rows", async () => {
        const { orders, row, history } = setup();
        const subscription = orders.rowChanged.subscribe(e => {
            if (e.kind === "create") e.context.setValue(e.row, "quantity", 5);
        });
        const session = await orders.createNewRow();
        expect(session.row.getValue("quantity")).toBe(5);
        await history.undo();
        expect(session.state).toBe("cancelled");
        subscription.dispose();
        orders.rowChanged.subscribe(e => {
            if (e.kind === "create") e.context.setValue(row, "quantity", 99);
        });
        await expect(orders.createNewRow()).rejects.toThrow("pending-row");
        expect(row.getValue("quantity")).toBe(2);
    });

    it("restores deletes without rerunning rules and retains row identity", async () => {
        const { orders, row, history } = setup();
        let calls = 0;
        orders.rowChanged.subscribe(() => { calls++; });
        await orders.delete(row);
        expect(row.state).toBe("deleted");
        await history.undo();
        expect(row.state).toBe("unchanged");
        expect(orders.getRow(1)).toBe(row);
        await history.redo();
        expect(row.state).toBe("deleted");
        expect(calls).toBe(1);
    });

    it("clears only dataset history on successful save, retaining unrelated scopes", async () => {
        const history = new UndoCoordinator(), view = history.createHistory("view");
        let viewValue = 1;
        view.record({ undo: () => { viewValue = 0; }, redo: () => { viewValue = 1; } });
        const { dataset, row } = setup(history);
        await row.setValue("quantity", 3);
        await dataset.saveChanges(async () => ({ success: true }));
        expect(dataset.undoHistory.canUndo).toBe(false);
        await history.undo();
        expect(viewValue).toBe(0);
        expect(row.getValue("quantity")).toBe(3);
    });

    it("retains history after failed save and clears it on explicit reject or accept", async () => {
        const { dataset, row, history } = setup();
        await row.setValue("quantity", 3);
        await dataset.saveChanges(async () => ({ success: false, error: "Server" }));
        expect(history.canUndo).toBe(true);
        dataset.rejectChanges();
        expect(history.canUndo).toBe(false);
        expect(row.getValue("quantity")).toBe(2);
        await row.setValue("quantity", 4);
        dataset.acceptChanges();
        expect(history.canUndo).toBe(false);
    });

    it("clears stale replay snapshots when importing refreshed values", async () => {
        const { orders, row, history } = setup();
        await row.setValue("quantity", 3);
        orders.importRows([{ id: 1, quantity: 7 }], false);
        expect(history.canUndo).toBe(false);
        expect(row.getValue("quantity")).toBe(7);
    });

    it("does not lose committed replay position if a UI observer throws", async () => {
        const { orders, row, history } = setup();
        await row.setValue("quantity", 3);
        const subscription = orders.changed.subscribe(() => { throw new Error("Observer"); });
        await expect(history.undo()).rejects.toThrow("Observer");
        expect(row.getValue("quantity")).toBe(2);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(true);
        expect(history.busy).toBe(false);
        subscription.dispose();
        await history.redo();
        expect(row.getValue("quantity")).toBe(3);
    });

    it("rejects replay while a dataset transaction is active without moving the cursor", async () => {
        const { dataset, row, history } = setup();
        await row.setValue("quantity", 3);
        let release!: () => void;
        const wait = new Promise<void>(resolve => { release = resolve; });
        const transaction = dataset.transaction("Wait", async () => { await wait; });
        await expect(history.undo()).rejects.toThrow("operation is active");
        expect(history.canUndo).toBe(true);
        release();
        await transaction;
        await history.undo();
        expect(row.getValue("quantity")).toBe(2);
    });

    it("supports dynamic and asynchronous defaults on every new row", async () => {
        let next = 0;
        const dataset = new DataSet({ createRowId: () => ++next });
        let calls = 0;
        const table = dataset.createTable("items", [], {
            defaults: async owner => ({ label: owner.name, sequence: ++calls, createdAt: new Date(), id: 999 })
        });
        const first = await table.createNewRow(), second = await table.createNewRow();
        expect(first.row.key).toBe(1);
        expect(second.row.key).toBe(2);
        expect(first.row.getValue("sequence")).toBe(1);
        expect(second.row.getValue("sequence")).toBe(2);
        expect(first.row.getValue("createdAt")).not.toBe(second.row.getValue("createdAt"));
        expect(second.row.getValue("label")).toBe("items");
    });

    it("does not leave pending state or history behind when a default factory rejects", async () => {
        const dataset = new DataSet({ createRowId: () => "new" });
        const table = dataset.createTable("items", [], {
            defaults: async () => { throw new Error("Defaults"); }
        });
        await expect(table.createNewRow()).rejects.toThrow("Defaults");
        dataset.acceptChanges();
        expect(dataset.undoCoordinator.canUndo).toBe(false);
        expect(table.rows).toEqual([]);
    });

    it("retains context ownership across table lookups", async () => {
        const { dataset, row } = setup();
        let context!: DataEditContext;
        await dataset.transaction("Context", async tx => {
            context = tx.context;
            expect(context.getTable("missing")).toBeUndefined();
            await context.update(row, { quantity: 4 });
        });
        expect(() => context.getTable("orders")).toThrow("not active");
    });

    it("rejects creation with an exception instead of returning an invalid session", async () => {
        const { dataset, orders, history } = setup();
        orders.rowChanged.subscribe(e => {
            if (e.kind === "create") e.reject("Draft rejected");
        });
        await expect(orders.createNewRow()).rejects.toThrow("Failed to create new row. Draft rejected");
        expect(orders.rows).toHaveLength(1);
        expect(history.canUndo).toBe(false);
        dataset.acceptChanges();
    });

    it("returns rejected insertion results and leaves the session pending", async () => {
        const { orders, history } = setup();
        const session = await orders.createNewRow();
        orders.rowChanging.subscribe(e => {
            if (e.kind === "insert") e.reject("Missing required fields");
        });
        expect(await session.insert()).toMatchObject({ success: false, error: "Missing required fields" });
        expect(session.state).toBe("pending");
        expect(orders.rows).not.toContain(session.row);
        await history.undo();
        expect(session.state).toBe("cancelled");
    });

    it("rejects cancellation with an exception and restores the session", async () => {
        const { orders, history } = setup();
        const session = await orders.createNewRow();
        orders.rowChanging.subscribe(e => {
            if (e.kind === "cancel") e.reject("Cancellation rejected");
        });
        await expect(session.cancel()).rejects.toThrow("Failed to cancel new row. Cancellation rejected");
        expect(session.state).toBe("pending");
        await history.undo();
        expect(session.state).toBe("cancelled");
    });

    it("rolls back completion that overlaps an unrelated asynchronous replay", async () => {
        const history = new UndoCoordinator(), view = history.createHistory("view");
        const { dataset, row } = setup(history);
        let finishEdit!: () => void, finishReplay!: () => void;
        const editWait = new Promise<void>(resolve => { finishEdit = resolve; });
        view.record({ undo: () => new Promise<void>(resolve => { finishReplay = resolve; }), redo() {} });
        const edit = dataset.transaction("Edit", async tx => {
            await tx.context.setValue(row, "quantity", 9);
            await editWait;
        });
        // Wait until the direct edit has applied, before the unrelated replay starts.
        while (row.getValue("quantity") !== 9) await Promise.resolve();
        const replay = history.undo();
        const assertion = expect(edit).rejects.toThrow("busy");
        finishEdit();
        await assertion;
        expect(row.getValue("quantity")).toBe(2);
        expect(dataset.undoHistory.canUndo).toBe(false);
        finishReplay();
        await replay;
    });

    it("blocks dataset replay during persistence and preserves the history position", async () => {
        const { dataset, row, history } = setup();
        await row.setValue("quantity", 3);
        let finish!: () => void;
        const wait = new Promise<void>(resolve => { finish = resolve; });
        const saving = dataset.saveChanges(async () => { await wait; return { success: false, error: "Server" }; });
        await expect(history.undo()).rejects.toThrow("operation is active");
        expect(history.canUndo).toBe(true);
        finish();
        await saving;
        await history.undo();
        expect(row.getValue("quantity")).toBe(2);
    });
});
