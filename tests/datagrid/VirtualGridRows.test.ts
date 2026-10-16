import { describe, expect, it, vi } from "vitest";
import { VirtualGridRows } from "../../src/components/datagrid/VirtualGridRows";
import type { GridResult, GridRowsProvider } from "../../src/components/datagrid/GridRow";

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
});
