import { describe, expect, it } from "vitest";
import { DataSet } from "../../src/data/dataset/DataSet";
import { DataRow } from "../../src/data/dataset/DataRow";

function setup() {
    let next = 0;
    const dataset = new DataSet({ createRowId: () => "draft-" + ++next });
    const table = dataset.createTable("items", [{ id: 1, value: 10 }]);
    return { dataset, table };
}

describe("DataRow.isPending", () => {
    it("exposes insert without a legacy commit alias on sessions and contexts", async () => {
        const { dataset, table } = setup();
        const session = await table.createNewRow();
        expect("commit" in session).toBe(false);
        await dataset.transaction("Insert draft", async tx => {
            expect("commit" in tx).toBe(false);
            expect("commit" in tx.context).toBe(false);
            await tx.context.insert(session);
        });
        expect(session.state).toBe("inserted");
        expect(session.row.isPending).toBe(false);
        expect(table.getRow(session.row.key)).toBe(session.row);
    });

    it("distinguishes confirmed, pending, inserted, cancelled and removed rows", async () => {
        const { table } = setup();
        expect(table.rows[0].isPending).toBe(false);
        const first = await table.createNewRow(), second = await table.createNewRow();
        expect(first.row.table).toBe(table);
        expect(first.row.isPending).toBe(true);
        expect(second.row.isPending).toBe(true);
        await first.row.setValue("value", 20);
        expect(first.row.isPending).toBe(true);
        await first.insert();
        expect(first.row.state).toBe("added");
        expect(first.row.isPending).toBe(false);
        expect(second.row.isPending).toBe(true);
        await second.cancel();
        expect(second.row.isPending).toBe(false);
        await table.delete(first.row);
        expect(first.row.isPending).toBe(false);
        expect(table.getRow(first.row.key)).toBeUndefined();
        const unregistered = new DataRow(table, { id: "unregistered" }, "added");
        expect(unregistered.isPending).toBe(false);
    });

    it("follows undo/redo of creation, insert and cancellation on the same row", async () => {
        const { dataset, table } = setup();
        const session = await table.createNewRow(), row = session.row;
        const history = dataset.undoCoordinator;
        await history.undo();
        expect(row.isPending).toBe(false);
        await history.redo();
        expect(session.row).toBe(row);
        expect(row.isPending).toBe(true);
        await session.insert();
        expect(row.isPending).toBe(false);
        await history.undo();
        expect(row.isPending).toBe(true);
        await history.redo();
        expect(row.isPending).toBe(false);
        await history.undo();
        await session.cancel();
        expect(row.isPending).toBe(false);
        await history.undo();
        expect(row.isPending).toBe(true);
        await history.redo();
        expect(row.isPending).toBe(false);
    });

    it("restores pending membership on rollback of insert or cancel", async () => {
        const { dataset, table } = setup();
        const session = await table.createNewRow();
        for (const action of ["insert", "cancel"] as const) {
            await expect(dataset.transaction("Abort " + action, async tx => {
                await tx[action](session);
                expect(session.row.isPending).toBe(false);
                throw new Error("Abort");
            })).rejects.toThrow("Abort");
            expect(session.row.isPending).toBe(true);
            expect(session.state).toBe("pending");
        }
    });

    it("reports pending state in creation rules and confirmed state after insertion", async () => {
        const { table } = setup();
        const observed: [string, boolean][] = [];
        table.rowChanged.subscribe(e => { observed.push([e.kind, e.row.isPending]); });
        const session = await table.createNewRow();
        await session.insert();
        expect(observed).toEqual([["create", true], ["insert", false]]);
    });
});
