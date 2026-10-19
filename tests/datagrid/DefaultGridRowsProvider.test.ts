import { describe, expect, it, vi } from "vitest";
import { DefaultGridRowsProvider, type DataGridState } from "../../src/components/datagrid/DefaultGridRowsProvider";
import type { DataSource, DataResult, QueryArgs } from "../../src/data/DataSource";

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}
function state(loadData: DataSource<any>["loadData"], overrides: Partial<DataGridState<any>> = {}): DataGridState<any> {
    return { dataSource: { loadData }, pageSize: 2, columns: new Map(), visibleColumns: [], groupColumns: ["country"], ...overrides };
}
function groups(args: QueryArgs, values: unknown[] = ["A", "B"]): DataResult<any> {
    return { args, totalCount: values.length, groups: values.map(groupValue => ({ groupField: args.groupBy![0].field, groupValue, count: 2 })) };
}
const abort = { name: "AbortError" };

describe("DefaultGridRowsProvider async safety", () => {
    it("shares root initialization and returns the same rows to concurrent callers", async () => {
        const request = deferred<DataResult<any>>();
        const load = vi.fn((_args: QueryArgs) => request.promise);
        const provider = new DefaultGridRowsProvider(state(load));
        const first = provider.load({ skip: 0, top: 2 });
        const second = provider.load({ skip: 0, top: 2 });
        request.resolve(groups(load.mock.calls[0][0]));
        const results = await Promise.all([first, second]);
        expect(load).toHaveBeenCalledTimes(1);
        expect(results[0].rows.map(row => row.key)).toEqual(results[1].rows.map(row => row.key));
        expect(results.map(result => result.totalCount)).toEqual([2, 2]);
        provider.dispose();
    });
    it("shares a non-root-page request instead of returning an empty page to a second caller", async () => {
        const request = deferred<DataResult<any>>();
        const load = vi.fn(async (args: QueryArgs) => args.skip === 2 ? request.promise : { ...groups(args), totalCount: 4 });
        const provider = new DefaultGridRowsProvider(state(load));
        await provider.load({ skip: 0, top: 2 });
        const first = provider.load({ skip: 2, top: 2 });
        const second = provider.load({ skip: 2, top: 2 });
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
        request.resolve({ ...groups(load.mock.calls[1][0], ["C", "D"]), totalCount: 4 });
        const [a, b] = await Promise.all([first, second]);
        expect(a.rows).toHaveLength(2); expect(b.rows.map(row => row.key)).toEqual(a.rows.map(row => row.key));
        provider.dispose();
    });
    it("keeps a failed expansion collapsed, then permits a successful retry", async () => {
        let fail = true;
        const load = vi.fn(async (args: QueryArgs) => {
            if (args.groupBy?.[0]?.field) return groups(args);
            if (fail) throw new Error("Offline");
            return { args, totalCount: 2, dataItems: [{ id: 1 }, { id: 2 }] };
        });
        const provider = new DefaultGridRowsProvider(state(load));
        const row = (await provider.load({ skip: 0, top: 2 })).rows[0];
        await expect(provider.setExpanded(row, true)).rejects.toThrow("Offline");
        expect(provider.visibleCount).toBe(2);
        expect((await provider.load({ skip: 0, top: 2 })).rows[0].expanded).toBe(false);
        fail = false;
        await provider.setExpanded(row, true);
        const result = await provider.load({ skip: 0, top: 4 });
        expect(result.totalCount).toBe(4); expect(result.rows.map(row => row.type)).toEqual(["group", "data", "data", "group"]);
        provider.dispose();
    });
    it("shares concurrent expansion and does not publish an expanded row before its children arrive", async () => {
        const request = deferred<DataResult<any>>();
        const load = vi.fn(async (args: QueryArgs) => args.groupBy?.[0]?.field ? groups(args) : request.promise);
        const provider = new DefaultGridRowsProvider(state(load));
        const row = (await provider.load({ skip: 0, top: 2 })).rows[0];
        const first = provider.setExpanded(row, true);
        const second = provider.setExpanded(row, true);
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
        expect((await provider.load({ skip: 0, top: 2 })).rows[0].expanded).toBe(false);
        request.resolve({ args: load.mock.calls[1][0], totalCount: 2, dataItems: [{ id: 1 }, { id: 2 }] });
        await Promise.all([first, second]);
        expect(provider.visibleCount).toBe(4); expect(load).toHaveBeenCalledTimes(2);
        await provider.setExpanded(row, false); expect(provider.visibleCount).toBe(2);
        provider.dispose();
    });
    it("applies a collapse requested while expansion is in flight without retaining duplicate anchors", async () => {
        const request = deferred<DataResult<any>>();
        const load = vi.fn(async (args: QueryArgs) => args.groupBy?.[0]?.field ? groups(args) : request.promise);
        const provider = new DefaultGridRowsProvider(state(load));
        const row = (await provider.load({ skip: 0, top: 2 })).rows[0];
        const expand = provider.setExpanded(row, true);
        const collapse = provider.setExpanded(row, false);
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
        request.resolve({ args: load.mock.calls[1][0], totalCount: 2, dataItems: [{}, {}] });
        await Promise.all([expand, collapse]);
        expect(provider.visibleCount).toBe(2);
        await provider.setExpanded(row, true); expect(provider.visibleCount).toBe(4);
        provider.dispose();
    });
    it("does not let a cancelled viewport waiter cancel a page shared by another caller", async () => {
        const request = deferred<DataResult<any>>();
        const load = vi.fn((args: QueryArgs) => request.promise);
        const provider = new DefaultGridRowsProvider(state(load));
        const controller = new AbortController();
        const cancelled = provider.load({ skip: 0, top: 2, signal: controller.signal });
        const assertion = expect(cancelled).rejects.toMatchObject(abort);
        const retained = provider.load({ skip: 0, top: 2 });
        controller.abort(); await assertion;
        expect(load.mock.calls[0][0].abortSignal?.aborted).toBe(false);
        request.resolve(groups(load.mock.calls[0][0]));
        expect((await retained).rows).toHaveLength(2); expect(load).toHaveBeenCalledTimes(1);
        provider.dispose();
    });
    it("aborts old source queries on setState and ignores sources that resolve after cancellation", async () => {
        const request = deferred<DataResult<any>>();
        const oldLoad = vi.fn((args: QueryArgs) => request.promise);
        const provider = new DefaultGridRowsProvider(state(oldLoad));
        const obsolete = provider.load({ skip: 0, top: 2 });
        const assertion = expect(obsolete).rejects.toMatchObject(abort);
        const newLoad = vi.fn(async (args: QueryArgs) => groups(args, ["New"]));
        provider.setState(state(newLoad));
        expect(oldLoad.mock.calls[0][0].abortSignal?.aborted).toBe(true);
        await assertion;
        expect((await provider.load({ skip: 0, top: 2 })).rows[0].text).toBe("New (2)");
        request.resolve(groups(oldLoad.mock.calls[0][0]));
        await Promise.resolve();
        expect(provider.visibleCount).toBe(1);
        provider.dispose();
    });
    it("aborts pending expansion on dispose without changing its row", async () => {
        const request = deferred<DataResult<any>>();
        const load = vi.fn(async (args: QueryArgs) => args.groupBy?.[0]?.field ? groups(args) : request.promise);
        const provider = new DefaultGridRowsProvider(state(load));
        const row = (await provider.load({ skip: 0, top: 2 })).rows[0];
        const expansion = provider.setExpanded(row, true);
        const assertion = expect(expansion).rejects.toMatchObject(abort);
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
        provider.dispose(); await assertion;
        expect(load.mock.calls[1][0].abortSignal?.aborted).toBe(true);
        expect(row.data.expanded).toBe(false);
        request.resolve({ args: load.mock.calls[1][0], totalCount: 2, dataItems: [{}, {}] });
    });
    it("rejects obsolete group handles after a state replacement", async () => {
        const load = vi.fn(async (args: QueryArgs) => groups(args));
        const provider = new DefaultGridRowsProvider(state(load));
        const row = (await provider.load({ skip: 0, top: 2 })).rows[0];
        provider.setState(state(load)); await provider.load({ skip: 0, top: 2 });
        await expect(provider.setExpanded(row, true)).rejects.toMatchObject(abort);
        expect(provider.visibleCount).toBe(2); provider.dispose();
    });
    it("uses full-path keys for identical subgroup values under different parents", async () => {
        const load = vi.fn(async (args: QueryArgs) => groups(args, args.groupBy?.[0]?.field === "country" ? ["A", "B"] : ["Shared"]));
        const provider = new DefaultGridRowsProvider(state(load, { groupColumns: ["country", "city"] }));
        const parents = (await provider.load({ skip: 0, top: 2 })).rows;
        expect(parents[0].key).not.toBe(parents[1].key);
        await provider.setExpanded(parents[0], true); await provider.setExpanded(parents[1], true);
        const children = (await provider.load({ skip: 0, top: 4 })).rows.filter(row => row.level === 1);
        expect(children).toHaveLength(2); expect(children[0].key).not.toBe(children[1].key);
        expect(children[0].key!.startsWith(parents[0].key! + "/")).toBe(true);
        expect(children[1].key!.startsWith(parents[1].key! + "/")).toBe(true);
        expect(children.every(row => !("groupPath" in row.data))).toBe(true);
        expect(new Set((await provider.load({ skip: 0, top: 4 })).rows.map(row => row.key)).size).toBe(4);
        provider.dispose();
    });
    it("keeps group keys distinct with separators and quotes, and stable across collapse/reopen", async () => {
        const values = ['A/["city","string","B"]', 'A/"B'];
        const load = vi.fn(async (args: QueryArgs) => groups(args, args.groupBy?.[0]?.field === "country" ? values : ['Shared/"value"']));
        const provider = new DefaultGridRowsProvider(state(load, { groupColumns: ["country", "city"] }));
        const parents = (await provider.load({ skip: 0, top: 2 })).rows;
        await provider.setExpanded(parents[0], true); await provider.setExpanded(parents[1], true);
        const before = (await provider.load({ skip: 0, top: 4 })).rows.map(row => row.key);
        expect(new Set(before).size).toBe(4);
        await provider.setExpanded(parents[0], false); await provider.setExpanded(parents[0], true);
        expect((await provider.load({ skip: 0, top: 4 })).rows.map(row => row.key)).toEqual(before);
        provider.dispose();
    });
    it("retries failed root initialization", async () => {
        const load = vi.fn(async (args: QueryArgs) => groups(args)).mockRejectedValueOnce(new Error("Offline"));
        const provider = new DefaultGridRowsProvider(state(load));
        await expect(provider.load({ skip: 0, top: 2 })).rejects.toThrow("Offline");
        expect((await provider.load({ skip: 0, top: 2 })).rows).toHaveLength(2);
        provider.dispose();
    });
    it("does not start a request for an already cancelled viewport", async () => {
        const load = vi.fn(async (args: QueryArgs) => groups(args));
        const provider = new DefaultGridRowsProvider(state(load));
        const controller = new AbortController(); controller.abort();
        await expect(provider.load({ skip: 0, top: 2, signal: controller.signal })).rejects.toMatchObject(abort);
        expect(load).not.toHaveBeenCalled(); provider.dispose();
    });

    it("rejects a viewport computed against a structure changed during cell resolution", async () => {
        const value = deferred<string>();
        const load = vi.fn(async (args: QueryArgs) => args.groupBy?.[0]?.field ? groups(args) : { args, totalCount: 1, dataItems: [{ id: 1 }] });
        const getValue = vi.fn(() => value.promise);
        const provider = new DefaultGridRowsProvider(state(load, {
            columns: new Map([["name", { name: "name", getValue }]]), visibleColumns: ["name"]
        }));
        const group = (await provider.load({ skip: 0, top: 2 })).rows[0];
        await provider.setExpanded(group, true);
        const obsolete = provider.load({ skip: 1, top: 1 });
        const assertion = expect(obsolete).rejects.toMatchObject(abort);
        await vi.waitFor(() => expect(getValue).toHaveBeenCalled());
        await provider.setExpanded(group, false);
        value.resolve("Old value"); await assertion;
        expect(provider.visibleCount).toBe(2); provider.dispose();
    });
    it("keeps hidden descendants out of the visible count when their expansion completes after ancestor collapse", async () => {
        const request = deferred<DataResult<any>>();
        const load = vi.fn(async (args: QueryArgs) => args.groupBy?.[0]?.field ? groups(args, ["One"]) : request.promise);
        const provider = new DefaultGridRowsProvider(state(load, { groupColumns: ["country", "city"] }));
        const parent = (await provider.load({ skip: 0, top: 1 })).rows[0];
        await provider.setExpanded(parent, true);
        const child = (await provider.load({ skip: 1, top: 1 })).rows[0];
        const expansion = provider.setExpanded(child, true);
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(3));
        await provider.setExpanded(parent, false);
        request.resolve({ args: load.mock.calls[2][0], totalCount: 1, dataItems: [{ id: 1 }] });
        await expansion; expect(provider.visibleCount).toBe(1);
        await provider.setExpanded(parent, true);
        expect(provider.visibleCount).toBe(3);
        expect((await provider.load({ skip: 0, top: 3 })).rows.map(row => row.type)).toEqual(["group", "group", "data"]);
        provider.dispose();
    });

    it("aborts while hierarchy expandability checks are still pending", async () => {
        const children = deferred<boolean>();
        const hasChildren = vi.fn(() => children.promise);
        const loadData = vi.fn(async (args: QueryArgs) => ({ args, totalCount: 1, dataItems: [{ id: 1 }] }));
        const provider = new DefaultGridRowsProvider(state(loadData, { dataSource: { loadData, hasChildren } }));
        const pending = provider.load({ skip: 0, top: 1 });
        const assertion = expect(pending).rejects.toMatchObject(abort);
        await vi.waitFor(() => expect(hasChildren).toHaveBeenCalled());
        provider.dispose(); await assertion;
        children.resolve(true);
    });

    it("retains an empty root instead of loading it again", async () => {
        const loadData = vi.fn(async (args: QueryArgs) => groups(args, []));
        const provider = new DefaultGridRowsProvider(state(loadData));
        const result = await provider.load({ skip: 0, top: 2 });
        expect(result.rows).toEqual([]); expect(result.totalCount).toBe(0);
        await provider.load({ skip: 0, top: 2 });
        expect(loadData).toHaveBeenCalledTimes(1); provider.dispose();
    });

    it("retains root summaries even if the initial viewport waiter is cancelled", async () => {
        const request = deferred<DataResult<any>>();
        const loadData = vi.fn((_args: QueryArgs) => request.promise);
        const provider = new DefaultGridRowsProvider(state(loadData));
        const controller = new AbortController();
        const pending = provider.load({ skip: 0, top: 1, signal: controller.signal });
        const assertion = expect(pending).rejects.toMatchObject(abort);
        controller.abort(); await assertion;
        const summary = [{ field: "quantity", summaryType: "sum", value: 10 }];
        request.resolve({ ...groups(loadData.mock.calls[0][0]), totalSummary: summary });
        expect((await provider.load({ skip: 0, top: 1 })).totalSummary).toEqual(summary);
        expect((await provider.load({ skip: 0, top: 1 })).totalSummary).toEqual(summary);
        expect(loadData).toHaveBeenCalledTimes(1); provider.dispose();
    });
});
