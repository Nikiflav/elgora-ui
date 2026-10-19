import { describe, expect, it, vi } from "vitest";
import { VirtualGridRows } from "../../src/components/datagrid/VirtualGridRows";
import type { GridResult, GridRowsProvider } from "../../src/components/datagrid/GridRow";

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}
const group = { type: "group" as const, key: "group:A", visibleIndex: 0, level: 0 };
const result = (key: string, totalCount = 1): GridResult => ({ totalCount, rows: [{ ...group, key }] });

describe("VirtualGridRows awaited page loading", () => {
    it("waits for the render-started request instead of returning a loading placeholder", async () => {
        let complete!: (result: GridResult) => void;
        const load = vi.fn(() => new Promise<GridResult>(resolve => { complete = resolve; }));
        const provider: GridRowsProvider<any> = { load, setExpanded: async () => {} };
        const rows = new VirtualGridRows(provider);
        const awaited = rows.load(0, 1);
        const row = { type: "data" as const, visibleIndex: 0, level: 0, data: { id: 1 } };
        complete({ totalCount: 1, rows: [row] });
        expect(await awaited).toEqual([row]); expect(load).toHaveBeenCalledTimes(1);
    });
    it("does not silently skip the third concurrent requested page", async () => {
        const provider: GridRowsProvider<any> = { setExpanded: async () => {}, load: vi.fn(async args => {
            await Promise.resolve();
            return { totalCount: 30, rows: Array.from({ length: 10 }, (_, index) => ({
                type: "data" as const, visibleIndex: args.skip + index, level: 0
            })) };
        }) };
        const rows = new VirtualGridRows(provider, 10);
        const pages = await Promise.all([rows.load(0, 1), rows.load(10, 1), rows.load(20, 1)]);
        expect(pages.map(page => page[0].visibleIndex)).toEqual([0, 10, 20]);
        expect(provider.load).toHaveBeenCalledTimes(3);
    });

    it("aborts stale viewport loads during expansion and never publishes late responses", async () => {
        const old = deferred<GridResult>();
        const load = vi.fn(async (_args: any) => result("new", 3)).mockImplementationOnce(() => old.promise);
        const onLoad = vi.fn();
        const provider: GridRowsProvider<any> = { load, setExpanded: vi.fn(async () => {}) };
        const rows = new VirtualGridRows(provider, 10, onLoad);
        const oldSignal = load.mock.calls[0][0].signal as AbortSignal;
        const waiting = rows.load(0, 1);
        await rows.setExpanded(group, true);
        expect(oldSignal.aborted).toBe(true); expect(await waiting).toEqual([]);
        old.resolve(result("old", 99)); await Promise.resolve();
        expect(rows.getAt(0).key).toBe("new"); expect(rows.count()).toBe(3);
        expect(onLoad).toHaveBeenCalledTimes(1); rows.dispose();
    });
    it("does not remove a newer in-flight page when an obsolete page settles", async () => {
        const old = deferred<GridResult>(); const fresh = deferred<GridResult>();
        const load = vi.fn((_args: any) => fresh.promise).mockImplementationOnce(() => old.promise);
        const rows = new VirtualGridRows({ load, setExpanded: async () => {} }, 10);
        const expand = rows.setExpanded(group, true);
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
        old.resolve(result("obsolete")); await Promise.resolve();
        const waiting = rows.load(0, 1);
        expect(load).toHaveBeenCalledTimes(2);
        fresh.resolve(result("fresh")); await expand;
        expect((await waiting)[0].key).toBe("fresh"); rows.dispose();
    });
    it("waits for a structural mutation before querying new viewport pages", async () => {
        const change = deferred<void>();
        const load = vi.fn(async () => result("group"));
        const rows = new VirtualGridRows({ load, setExpanded: () => change.promise }, 10);
        await rows.load(0, 1);
        const expand = rows.setExpanded(group, true);
        const during = rows.load(0, 1);
        await Promise.resolve(); await Promise.resolve();
        expect(load).toHaveBeenCalledTimes(1);
        change.resolve(); await expand; await during;
        expect(rows.getAt(0).key).toBe("group"); rows.dispose();
    });
    it("can reload the unchanged structure after a failed expansion", async () => {
        const rows = new VirtualGridRows({
            load: async () => result("collapsed"), setExpanded: async () => { throw new Error("Offline"); }
        });
        await rows.load(0, 1);
        await expect(rows.setExpanded(group, true)).rejects.toThrow("Offline");
        expect((await rows.load(0, 1))[0].key).toBe("collapsed"); rows.dispose();
    });
    it("disposes the provider and rejects pending work even when the source ignores cancellation", async () => {
        const request = deferred<GridResult>();
        const load = vi.fn((_args: any) => request.promise);
        const dispose = vi.fn(); const onLoad = vi.fn();
        const rows = new VirtualGridRows({ load, setExpanded: async () => {}, dispose }, 10, onLoad);
        const waiting = rows.load(0, 1);
        rows.dispose(); rows.dispose();
        expect(await waiting).toEqual([]);
        expect(load.mock.calls[0][0].signal.aborted).toBe(true);
        expect(dispose).toHaveBeenCalledTimes(1);
        request.resolve(result("late", 50)); await Promise.resolve();
        expect(onLoad).not.toHaveBeenCalled(); expect(rows.count()).toBe(0);
    });
    it("rejects an expansion promptly when the view is disposed", async () => {
        const change = deferred<void>();
        const rows = new VirtualGridRows({ load: async () => result("group"), setExpanded: () => change.promise });
        await rows.load(0, 1);
        const pending = rows.setExpanded(group, true);
        const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
        await Promise.resolve(); await Promise.resolve(); rows.dispose();
        await assertion; change.resolve();
    });
});
