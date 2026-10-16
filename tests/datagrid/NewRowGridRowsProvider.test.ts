import { describe, expect, it, vi } from "vitest";
import { NewRowGridRowsProvider } from "../../src/components/datagrid/NewRowGridRowsProvider";
import type { GridRow, GridRowsProvider } from "../../src/components/datagrid/GridRow";

describe("NewRowGridRowsProvider", () => {
    it.each([0, 1, 99, 100, 101])("appends exactly one input row after %i query rows across page boundaries", async count => {
        const rows: GridRow[] = Array.from({ length: count }, (_, visibleIndex) => ({ type: "data", visibleIndex, level: 0 }));
        const source: GridRowsProvider<any> = {
            load: async args => ({ rows: rows.slice(args.skip, args.skip + args.top), totalCount: count }),
            setExpanded: async () => {}
        };
        const getNew = vi.fn(async (visibleIndex: number): Promise<GridRow> => ({ type: "new", visibleIndex, level: 0 }));
        const provider = new NewRowGridRowsProvider(source, getNew);
        const loaded: GridRow[] = [];
        for (let skip = 0; skip < count + 1; skip += 100) {
            const result = await provider.load({ skip, top: 100 });
            expect(result.totalCount).toBe(count + 1); loaded.push(...result.rows);
        }
        expect(loaded).toHaveLength(count + 1);
        expect(loaded.at(-1)).toMatchObject({ type: "new", visibleIndex: count });
        expect(getNew).toHaveBeenCalledTimes(1); expect(rows).toHaveLength(count);
    });
});
