import { describe, expect, it, vi } from "vitest";
import { UndoCoordinator } from "../../src/core/UndoCoordinator";

describe("UndoCoordinator", () => {
    it("has no operations at startup", async () => {
        const c = new UndoCoordinator(), scope = c.createHistory("data");
        expect(c.canUndo).toBe(false);
        expect(c.canRedo).toBe(false);
        expect(scope.canUndo).toBe(false);
        expect(await c.undo()).toBe(false);
        expect(await c.redo()).toBe(false);
        expect("undo" in scope).toBe(false);
        expect("clear" in scope).toBe(false);
    });

    it("replays data and view scopes in one global chronological journal", async () => {
        const c = new UndoCoordinator(), data = c.createHistory("data"), view = c.createHistory("view");
        const log: string[] = [];
        data.record({ undo: () => { log.push("undo data"); }, redo: () => { log.push("redo data"); } });
        view.record({ undo: () => { log.push("undo view"); }, redo: () => { log.push("redo view"); } });
        await c.undo(); await c.undo(); await c.redo(); await c.redo();
        expect(log).toEqual(["undo view", "undo data", "redo data", "redo view"]);
    });

    it("reports baseline per scope, even when another scope still has applied changes", async () => {
        const c = new UndoCoordinator(), data = c.createHistory("data"), view = c.createHistory("view");
        const dataBaseline = vi.fn(), viewBaseline = vi.fn();
        data.returnedToBaseline.subscribe(dataBaseline); view.returnedToBaseline.subscribe(viewBaseline);
        view.record({ undo() {}, redo() {} });
        data.record({ undo() {}, redo() {} });
        data.record({ undo() {}, redo() {} });
        await c.undo();
        expect(dataBaseline).not.toHaveBeenCalled();
        await c.undo();
        expect(dataBaseline).toHaveBeenCalledTimes(1);
        expect(viewBaseline).not.toHaveBeenCalled();
        expect(c.canUndo).toBe(true);
        await c.redo(); await c.undo();
        expect(dataBaseline).toHaveBeenCalledTimes(2);
    });

    it("clearing a scope removes applied/redo entries but never signals undo baseline", async () => {
        const c = new UndoCoordinator(), a = c.createHistory("a"), b = c.createHistory("b");
        const baseline = vi.fn(), undoB = vi.fn();
        a.returnedToBaseline.subscribe(baseline);
        a.record({ undo() {}, redo() {} });
        b.record({ undo: undoB, redo() {} });
        a.record({ undo() {}, redo() {} });
        await c.undo(); baseline.mockClear();
        c.clear(a);
        expect(c.canRedo).toBe(false);
        expect(a.canUndo).toBe(false);
        expect(baseline).not.toHaveBeenCalled();
        await c.undo(); expect(undoB).toHaveBeenCalledTimes(1);
    });

    it("preserves other scopes' redo order when clearing an undone scope", async () => {
        const c = new UndoCoordinator(), a = c.createHistory("a"), b = c.createHistory("b");
        const redoB = vi.fn();
        a.record({ undo() {}, redo() {} });
        b.record({ undo() {}, redo: redoB });
        await c.undo(); await c.undo();
        c.clear(a); await c.redo();
        expect(redoB).toHaveBeenCalledTimes(1);
        expect(c.canUndo).toBe(true);
    });

    it("discards every scope's redo branch when any scope records a new action", async () => {
        const c = new UndoCoordinator(), a = c.createHistory("a"), b = c.createHistory("b");
        a.record({ undo() {}, redo() {} });
        await c.undo();
        b.record({ undo() {}, redo() {} });
        expect(a.canRedo).toBe(false);
        expect(await c.redo()).toBe(false);
    });

    it("keeps position on failed undo/redo and allows retry", async () => {
        const c = new UndoCoordinator(), s = c.createHistory("data");
        let failUndo = true, failRedo = true;
        s.record({
            undo() { if (failUndo) throw new Error("undo failed"); },
            async redo() { if (failRedo) throw new Error("redo failed"); }
        });
        await expect(c.undo()).rejects.toThrow("undo failed");
        expect(c.canUndo).toBe(true); expect(c.canRedo).toBe(false); expect(c.busy).toBe(false);
        failUndo = false; await c.undo();
        await expect(c.redo()).rejects.toThrow("redo failed");
        expect(c.canUndo).toBe(false); expect(c.canRedo).toBe(true);
        failRedo = false; expect(await c.redo()).toBe(true);
    });

    it("blocks concurrent replay, recording and clearing until async undo completes", async () => {
        const c = new UndoCoordinator(), s = c.createHistory("data");
        let complete!: () => void;
        s.record({ undo: () => new Promise<void>(resolve => { complete = resolve; }), redo() {} });
        const pending = c.undo();
        expect(c.busy).toBe(true);
        await expect(c.undo()).rejects.toThrow("busy");
        await expect(c.redo()).rejects.toThrow("busy");
        expect(() => s.record({ undo() {}, redo() {} })).toThrow("busy");
        expect(() => c.clear(s)).toThrow("busy");
        complete(); await pending;
        expect(c.busy).toBe(false);
    });

    it("awaits baseline cleanup before permitting another operation", async () => {
        const c = new UndoCoordinator(), s = c.createHistory("data");
        let complete!: () => void;
        s.returnedToBaseline.subscribe(e => e.waitUntil(new Promise<void>(resolve => { complete = resolve; })));
        s.record({ undo() {}, redo() {} });
        const pending = c.undo();
        await Promise.resolve();
        expect(c.busy).toBe(true); expect(c.canUndo).toBe(false);
        await expect(c.redo()).rejects.toThrow("busy");
        complete(); await pending;
        expect(c.busy).toBe(false);
    });

    it("does not roll back a successful action when baseline cleanup fails", async () => {
        const c = new UndoCoordinator(), s = c.createHistory("data");
        s.returnedToBaseline.subscribe(e => e.waitUntil(Promise.reject(new Error("cleanup"))));
        s.record({ undo() {}, redo() {} });
        await expect(c.undo()).rejects.toThrow("cleanup");
        expect(c.canUndo).toBe(false); expect(c.canRedo).toBe(true); expect(c.busy).toBe(false);
    });

    it("rejects foreign scopes", () => {
        const first = new UndoCoordinator(), second = new UndoCoordinator();
        expect(() => first.clear(second.createHistory("data"))).toThrow("another coordinator");
    });

    it("retains callbacks even if the recorded object is modified later", async () => {
        const c = new UndoCoordinator(), s = c.createHistory("data"), undo = vi.fn();
        const operation = { undo, redo() {} };
        s.record(operation); operation.undo = vi.fn();
        await c.undo(); expect(undo).toHaveBeenCalledTimes(1);
    });

    it("commits replay position before notifying observers, even when they throw", async () => {
        const c = new UndoCoordinator(), scope = c.createHistory("data");
        let value = 1, baseline = 0;
        scope.returnedToBaseline.subscribe(() => baseline++);
        scope.record({
            undo: () => { value = 0; }, redo: () => { value = 1; },
            afterReplay: () => { throw new Error("Observer"); }
        });
        await expect(c.undo()).rejects.toThrow("Observer");
        expect(value).toBe(0);
        expect(c.canUndo).toBe(false);
        expect(c.canRedo).toBe(true);
        expect(baseline).toBe(1);
        expect(c.busy).toBe(false);
        await expect(c.redo()).rejects.toThrow("Observer");
        expect(value).toBe(1);
        expect(c.canUndo).toBe(true);
        expect(c.canRedo).toBe(false);
    });
});
