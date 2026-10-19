import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DefaultGridRowsProvider, type DataGridState } from "../../src/components/datagrid/DefaultGridRowsProvider";
import { VirtualGridRows } from "../../src/components/datagrid/VirtualGridRows";
import { NewRowGridRowsProvider } from "../../src/components/datagrid/NewRowGridRowsProvider";
import { ArrayDataSource } from "../../src/data/ArrayDataSource";
import { LocalGroupingDataSource } from "../../src/data/LocalGroupingDataSource";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import type { DataSource, QueryArgs, DataResult } from "../../src/data/DataSource";

const data = [{ id: 1, country: "A", city: "X" }, { id: 2, country: "A", city: "Y" },
    { id: 3, country: "B", city: "X" }, { id: 4, country: "B", city: "X" }];
function setup() {
    const source = new LocalGroupingDataSource(new ArrayDataSource(data), (row, field) => (row as any)[field]);
    const load = vi.spyOn(source, "loadData");
    const state: DataGridState<any> = { dataSource: source, pageSize: 2,
        columns: new Map([["country", { name: "country" }], ["city", { name: "city" }]]), visibleColumns: [], groupColumns: ["country", "city"] };
    return { provider: new DefaultGridRowsProvider(state), state, load };
}
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
}
beforeAll(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true,
        value: () => ({ font: "", measureText: (text: string) => ({ width: text.length * 8 }) }) });
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
afterAll(() => vi.unstubAllGlobals());

describe("Batch grouping through loadData", () => {
    it("requests the whole group tree once and does not fetch leaf rows until viewport loading", async () => {
        const { provider, load } = setup();
        await provider.load({ skip: 0, top: 2 });
        await provider.setGroupsExpanded(true);
        expect(load).toHaveBeenCalledTimes(2);
        expect(load.mock.calls[1][0].groupBy).toEqual([{ field: "country", interval: undefined }, { field: "city", interval: undefined }]);
        expect(load.mock.calls.every(([args]) => args.groupBy?.length)).toBe(true);
        expect(provider.visibleCount).toBe(9);
        const viewport = await provider.load({ skip: 0, top: 20 });
        expect(viewport.rows.filter(row => row.type === "data").map(row => row.data.data.id)).toEqual([1, 2, 3, 4]);
        expect(viewport.rows.map(row => row.visibleIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        expect(viewport.rows.filter(row => row.type === "group").map(row => row.key)).toEqual(["$/A", "$/A/X", "$/A/Y", "$/B", "$/B/X"]);
        provider.dispose();
    });

    it("collapses without requests, resets all descendants, and reopens only the chosen parent", async () => {
        const { provider, load } = setup();
        await provider.load({ skip: 0, top: 2 });
        await provider.setGroupsExpanded(true);
        const calls = load.mock.calls.length;
        await provider.setGroupsExpanded(false);
        expect(provider.visibleCount).toBe(2);
        expect(load).toHaveBeenCalledTimes(calls);
        const root = await provider.load({ skip: 0, top: 2 });
        await provider.setExpanded(root.rows[0], true);
        expect(provider.visibleCount).toBe(4); // two roots + A's two collapsed city groups
        provider.dispose();
    });

    it("preserves other levels and supports expansion beneath a collapsed parent", async () => {
        const { provider } = setup();
        await provider.load({ skip: 0, top: 2 });
        await provider.setGroupsExpanded(true, 1);
        expect(provider.visibleCount).toBe(2);
        const root = await provider.load({ skip: 0, top: 2 });
        expect(root.rows.map(row => row.expanded)).toEqual([false, false]);
        await provider.setExpanded(root.rows[0], true);
        expect(provider.visibleCount).toBe(6); // A + city groups + their data, B still closed
        await provider.setGroupsExpanded(false, 0);
        expect(provider.visibleCount).toBe(2);
        await provider.setGroupsExpanded(true, 0);
        expect(provider.visibleCount).toBe(9); // hidden child expansion was retained for both roots
        await provider.setGroupsExpanded(false, 1);
        expect(provider.visibleCount).toBe(5); // roots plus three closed city groups
        provider.dispose();
    });

    it("expands up to a level in one metadata query and preserves deeper state", async () => {
        const { provider, state, load } = setup();
        provider.setState({ ...state, groupColumns: ["country", "city", "id"] });
        await provider.load({ skip: 0, top: 2 });
        load.mockClear();
        await provider.setGroupsExpanded(true, 1, true);
        expect(load).toHaveBeenCalledOnce();
        expect(load.mock.calls[0][0].groupBy?.map(group => group.field)).toEqual(["country", "city", "id"]);
        expect(provider.visibleCount).toBe(9); // country + city + closed id groups; no data rows
        const rows = (await provider.load({ skip: 0, top: 20 })).rows;
        expect(rows.filter(row => row.type === "group" && row.level <= 1).every(row => row.expanded)).toBe(true);
        expect(rows.filter(row => row.type === "group" && row.level === 2).every(row => !row.expanded)).toBe(true);
        await provider.setGroupsExpanded(true, 2);
        expect(provider.visibleCount).toBe(13);
        await provider.setGroupsExpanded(false, 0);
        expect(provider.visibleCount).toBe(2);
        await provider.setGroupsExpanded(true, 1, true);
        expect(provider.visibleCount).toBe(13); // previously open deeper groups stay open
        const calls = load.mock.calls.length;
        await provider.setGroupsExpanded(false, 1);
        expect(provider.visibleCount).toBe(5);
        expect(load).toHaveBeenCalledTimes(calls);
        await provider.setGroupsExpanded(true, 1, true);
        expect(provider.visibleCount).toBe(13);
        provider.dispose();
    });

    it("keeps the old tree on failed/incomplete remote metadata and supports retry", async () => {
        const { provider, state } = setup();
        const original = (await provider.load({ skip: 0, top: 2 })).rows;
        const load = vi.spyOn(state.dataSource, "loadData");
        load.mockImplementationOnce(async args => ({ args, totalCount: 2, groups: [
            { groupField: "country", groupValue: "A", count: 2 }, { groupField: "country", groupValue: "B", count: 2 }
        ] }));
        await expect(provider.setGroupsExpanded(true)).rejects.toThrow("complete nested groups");
        expect(provider.visibleCount).toBe(2);
        expect((await provider.load({ skip: 0, top: 2 })).rows[0].data).toBe(original[0].data);
        await provider.setGroupsExpanded(true);
        expect(provider.visibleCount).toBe(9);
        provider.dispose();
    });

    it("rejects partial root pages instead of publishing an incomplete expand-all", async () => {
        const { provider, state } = setup();
        await provider.load({ skip: 0, top: 2 });
        vi.spyOn(state.dataSource, "loadData").mockResolvedValueOnce({ args: {}, totalCount: 100, groups: [] });
        await expect(provider.setGroupsExpanded(true)).rejects.toThrow("all requested outer groups");
        expect(provider.visibleCount).toBe(2);
        provider.dispose();
    });

    it.each(["state", "dispose"])("cancels an in-flight batch on %s without publishing late data", async action => {
        const { provider, state } = setup();
        await provider.load({ skip: 0, top: 2 });
        const request = deferred<DataResult<any>>();
        const load = vi.spyOn(state.dataSource, "loadData").mockClear().mockImplementationOnce(() => request.promise);
        const pending = provider.setGroupsExpanded(true);
        const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
        await vi.waitFor(() => expect(load).toHaveBeenCalled());
        const args = load.mock.calls[0][0];
        if (action === "state") provider.setState(state); else provider.dispose();
        await assertion;
        expect(args.abortSignal?.aborted).toBe(true);
        request.resolve({ args, groups: [], totalCount: 0 });
        if (action === "state") {
            expect((await provider.load({ skip: 0, top: 2 })).totalCount).toBe(2);
            provider.dispose();
        } else expect(provider.visibleCount).toBe(0);
    });

    it("supports empty sources and rejects invalid grouping indices", async () => {
        const { provider, state } = setup();
        state.dataSource = new LocalGroupingDataSource(new ArrayDataSource([]), () => undefined);
        provider.setState(state);
        await provider.setGroupsExpanded(true);
        expect(provider.visibleCount).toBe(0);
        for (const index of [-1, 2, 0.5]) await expect(provider.setGroupsExpanded(true, index)).rejects.toThrow("groupIndex");
        provider.dispose();
    });

    it("serializes overlapping batch commands in invocation order", async () => {
        const { provider, load } = setup();
        await provider.load({ skip: 0, top: 2 });
        const expand = provider.setGroupsExpanded(true);
        const collapse = provider.setGroupsExpanded(false);
        await Promise.all([expand, collapse]);
        expect(provider.visibleCount).toBe(2);
        expect(load).toHaveBeenCalledTimes(2);
        provider.dispose();
    });

    it("does not expand hierarchy nodes", async () => {
        const loadData = vi.fn(async (args: QueryArgs) => ({ args, dataItems: [{ id: 1 }], totalCount: 1 }));
        const source: DataSource<any> = { loadData, hasChildren: async () => true, getRowId: row => row.id };
        const provider = new DefaultGridRowsProvider({ ...setup().state, dataSource: source, groupColumns: [] });
        await provider.load({ skip: 0, top: 1 });
        await provider.setGroupsExpanded(true);
        expect(loadData).toHaveBeenCalledOnce();
        expect(provider.visibleCount).toBe(1);
        provider.dispose();
    });

    it("forwards batch changes through the new-row and virtual viewport wrappers", async () => {
        const { provider } = setup();
        const wrapped = new NewRowGridRowsProvider(provider, async index => ({ type: "new", visibleIndex: index, level: 0 }));
        const virtual = new VirtualGridRows(wrapped, 20);
        await virtual.load(0, 1);
        await virtual.setGroupsExpanded(true, 1, true);
        expect(virtual.count()).toBe(10);
        expect((await virtual.load(9, 1))[0].type).toBe("new");
        await virtual.setGroupsExpanded(false);
        expect(virtual.count()).toBe(3);
        virtual.dispose();
    });

    it("exposes awaited commands on DataGrid", async () => {
        const grid = new DataGrid({ data, groupColumns: ["country", "city"],
            columns: [{ name: "country" }, { name: "city" }] });
        grid.mount(document.body);
        try {
            await grid.expandAllGroups();
            expect((grid as any)._gridRows.count()).toBe(9);
            await grid.collapseAllGroups();
            expect((grid as any)._gridRows.count()).toBe(2);
        } finally { grid.dispose(); }
    });

    it("organizes grouping actions and intervals in one submenu and omits empty submenus", async () => {
        const column = { name: "country", caption: "Country" };
        const grid = new DataGrid({ data, columns: [column],
            groupIntervals: [{ name: "bucket", text: "Custom bucket", getGroupValue: (_row, value) => value }] });
        grid.mount(document.body);
        const menu = () => (grid as any).getContextMenuItems({ target: "columnHeader",
            column, selectedRanges: [], event: new MouseEvent("contextmenu") });
        try {
            const top = await menu();
            expect(top.some((item: any) => item.text === "Summary")).toBe(true);
            expect(top.some((item: any) => item.text === "Interval" || item.text === "Group by Country")).toBe(false);
            const children = await top.find((item: any) => item.text === "Grouping").subItems();
            expect(children.map((item: any) => item.text)).toEqual(["Group by Country", "Interval"]);
            const intervals = await children.find((item: any) => item.text === "Interval").subItems();
            expect(intervals.map((item: any) => item.text)).toEqual(["Exact value", "First character", "Custom bucket"]);
            await children[0].action();
            const grouped = await (await menu()).find((item: any) => item.text === "Grouping").subItems();
            expect(grouped[0].text).toBe("Ungroup Country");
            expect(grouped.filter((item: any) => item.isDivider)).toHaveLength(1);
            await grouped[0].action();
            grid.setOptions({ standardContextMenuItems: ["expandGroupsToLevel", "collapseGroupsAtLevel"] });
            expect((await menu()).some((item: any) => item.text === "Grouping")).toBe(false);
            grid.setOptions({ standardContextMenuItems: [] });
            expect((await menu()).some((item: any) => item.text === "Grouping")).toBe(false);
        } finally { grid.dispose(); }
    });

    it("offers level commands on grouped headers and chips and executes them through one batch", async () => {
        const grid = new DataGrid({ data, groupColumns: ["country", "city"],
            columns: [{ name: "country" }, { name: "city" }, { name: "id" }] });
        grid.mount(document.body);
        const menu = async (name: string) => {
            const items = await (grid as any).getContextMenuItems({ target: "columnHeader",
                column: { name }, selectedRanges: [], event: new MouseEvent("contextmenu") });
            expect(items.some((item: any) => item.text === "Expand to this level")).toBe(false);
            return await items.find((item: any) => item.text === "Grouping")?.subItems() ?? [];
        };
        try {
            expect((await menu("id")).some((item: any) => item.text === "Expand to this level")).toBe(false);
            const items = await menu("city");
            const expand = items.find((item: any) => item.text === "Expand to this level");
            const collapse = items.find((item: any) => item.text === "Collapse this level");
            expect(expand).toBeDefined();
            expect(collapse).toBeDefined();
            const changes = vi.spyOn((grid as any)._gridRows, "setGroupsExpanded");
            await expand.action();
            expect(changes).toHaveBeenCalledExactlyOnceWith(true, 1, true);
            expect((grid as any)._gridRows.count()).toBe(9);
            await collapse.action();
            expect(changes).toHaveBeenLastCalledWith(false, 1, false);
            expect((grid as any)._gridRows.count()).toBe(5);
            grid.setOptions({ standardContextMenuItems: ["collapseGroupsAtLevel"] });
            const limited = await menu("city");
            expect(limited.some((item: any) => item.text === "Expand to this level")).toBe(false);
            expect(limited.some((item: any) => item.text === "Collapse this level")).toBe(true);
            grid.setOptions({ groupColumns: ["country"] });
            const staleChanges = vi.spyOn((grid as any)._gridRows, "setGroupsExpanded");
            await expand.action(); // the field was ungrouped while this menu was open
            expect(staleChanges).not.toHaveBeenCalled();
        } finally { grid.dispose(); }
    });
});
