import type { GridRow, GridRowsProvider, GridViewportArgs } from "./GridRow";
import { throwIfRowQueryAborted } from "./RowQuery";
import type { GridExpansionState } from "./GridExpansionState";

/** Appends pending domain rows and one empty input row outside source queries and summaries. */
export class NewRowGridRowsProvider<TRow> implements GridRowsProvider<TRow> {
    constructor(private readonly source: GridRowsProvider<TRow>,
        private readonly getNewRow: (index: number, offset: number) => Promise<GridRow>,
        private readonly pendingCount: () => number = () => 0) {}

    /** Includes the input row even when the source is empty or a page ends at its boundary. */
    async load(args: GridViewportArgs) {
        const result = await this.source.load(args);
        throwIfRowQueryAborted(args.signal);
        const count = this.pendingCount() + 1;
        const rows = [...result.rows];
        for (let offset = Math.max(0, args.skip - result.totalCount);
            offset < count && result.totalCount + offset < args.skip + args.top; offset++) {
            rows.push(await this.getNewRow(result.totalCount + offset, offset));
            throwIfRowQueryAborted(args.signal);
        }
        return { ...result, rows, totalCount: result.totalCount + count };
    }

    /** Expansion remains owned by the original query provider. */
    setExpanded(row: GridRow, expanded: boolean) { return this.source.setExpanded(row, expanded); }

    setGroupsExpanded(expanded: boolean, groupIndex?: number, includeParents?: boolean): Promise<void> {
        return this.source.setGroupsExpanded?.(expanded, groupIndex, includeParents) ?? Promise.resolve();
    }

    getExpansionState(): GridExpansionState {
        return this.source.getExpansionState?.() ?? { expandedGroupKeys: [] };
    }

    setExpansionState(state: GridExpansionState): Promise<void> {
        return this.source.setExpansionState?.(state) ?? Promise.resolve();
    }

    /** Releases the wrapped query provider; the pending editing session belongs to the grid. */
    dispose(): void { this.source.dispose?.(); }
}
