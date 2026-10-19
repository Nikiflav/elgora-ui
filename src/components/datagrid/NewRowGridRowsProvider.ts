import type { GridRow, GridRowsProvider, GridViewportArgs } from "./GridRow";
import { throwIfRowQueryAborted } from "./RowQuery";

/** Appends one input row outside the source query, sort order and summaries. */
export class NewRowGridRowsProvider<TRow> implements GridRowsProvider<TRow> {
    constructor(private readonly source: GridRowsProvider<TRow>,
        private readonly getNewRow: (index: number) => Promise<GridRow>) {}

    /** Includes the input row even when the source is empty or a page ends at its boundary. */
    async load(args: GridViewportArgs) {
        const result = await this.source.load(args);
        throwIfRowQueryAborted(args.signal);
        const index = result.totalCount;
        const rows = index >= args.skip && index < args.skip + args.top
            ? [...result.rows, await this.getNewRow(index)] : result.rows;
        return { ...result, rows, totalCount: index + 1 };
    }

    /** Expansion remains owned by the original query provider. */
    setExpanded(row: GridRow, expanded: boolean) { return this.source.setExpanded(row, expanded); }

    /** Releases the wrapped query provider; the pending editing session belongs to the grid. */
    dispose(): void { this.source.dispose?.(); }
}
