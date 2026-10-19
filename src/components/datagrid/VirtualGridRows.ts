import { VirtualDataSource } from "../virtual-list/VirtualList"
import { GridResult, GridRow, GridRowsProvider, GridViewportArgs } from "./GridRow"
import { throwIfRowQueryAborted, waitForRowQuery } from "./RowQuery";


export class VirtualGridRows<T> implements VirtualDataSource<GridRow> {

    private _onLoad?: (args: GridViewportArgs, result: GridResult) => void
    private _source: GridRowsProvider<T>;
    private _pageSize: number
    private _pages: Map<number, GridRow[]> = new Map()
    private _totalCount = 0
    private readonly _pageLoads = new Map<number, Promise<void>>();
    private _controller = new AbortController();
    private readonly _lifetime = new AbortController();
    private _change?: Promise<void>;
    private _disposed = false;


    constructor(source: GridRowsProvider<T>, pageSize = 100, onLoad?: (args: GridViewportArgs, result: GridResult) => void) {
        this._source = source;
        this._pageSize = pageSize;
        this._onLoad = onLoad;

        // Perform initial load
        this.getAt(0);
    }

    count(): number {
        return this._totalCount;
    }

    async load(start: number, count: number): Promise<GridRow[]> {
        const signal = this._controller.signal;
        if (signal.aborted) return [];
        const rows: GridRow[] = [];

        for (let index = start; index < start + count; index++) {

            if (rows.length >= count)
                break;

            const pageIndex = this.getPageIndex(index);

            let page = this._pages.get(pageIndex);

            if (!page) {
                // Load the page asynchronously
                await this.loadPage(pageIndex).catch(x => {
                    if (x?.name !== 'AbortError') {
                        console.error(x);
                    }
                });
                page = this._pages.get(pageIndex);
            }

            if (signal.aborted) return [];

            if (page) {

                const gr = page[index % this._pageSize];
                if (!gr)
                    break; // Unexpected null row!
                rows.push(gr);
            } else {
                break;
            }
        }
        return rows;
    }

    getAt(index: number): GridRow {
        if (this._disposed) return { type: "loading", visibleIndex: index, level: 0 };

        // Get the row from the cache

        const pageIndex = this.getPageIndex(index);
        const page = this._pages.get(pageIndex);
        if (page) {
            let row = page[index % this._pageSize];
            if (row)
                return row;
            else {
                console.warn(`Row not found at index ${index}. Page ${pageIndex} is loaded but row is missing. Page count ${page.length}, ix: ${index % this._pageSize}`);
                return {
                    type: "loading",
                    visibleIndex: index,
                    level: 0
                };
            }
        }
        // Load the page asynchronously
        this.loadPage(pageIndex).catch(x => {
            if (x?.name !== 'AbortError') {
                console.error(x);
            }
        });

        return {
            type: "loading",
            visibleIndex: index,
            level: 0
        };
    }



    async setExpanded(row: GridRow, expanded: boolean) {
        await this.changeStructure(() => this._source.setExpanded(row, expanded));
        await this.load(row.visibleIndex, 1);
    }

    async setGroupsExpanded(expanded: boolean, groupIndex?: number, includeParents?: boolean): Promise<void> {
        await this.changeStructure(() => this._source.setGroupsExpanded?.(expanded, groupIndex, includeParents) ?? Promise.resolve());
        await this.load(0, 1);
    }

    private async changeStructure(change: () => Promise<void>): Promise<void> {
        const lifetime = this._change ?? Promise.resolve();
        const operation = lifetime.catch(() => {}).then(async () => {
            if (this._disposed) throw new DOMException("Failed to expand grid row. The view was disposed.", "AbortError");
            await waitForRowQuery(change(), this._lifetime.signal);
        });
        this._change = operation;
        this.invalidate();
        try {
            await operation;
        } finally {
            if (this._change === operation) this._change = undefined;
            this.invalidate();
        }
    }

    /** Rejects obsolete viewport work before it can repopulate the cache. */
    private invalidate(): void {
        this._controller.abort();
        this._controller = new AbortController();
        if (this._disposed) this._controller.abort();
        this._pages.clear();
        this._pageLoads.clear();
    }

    /** Cancels viewport and provider-owned queries when the grid is replaced or disposed. */
    dispose(): void {
        if (this._disposed) return;
        this._disposed = true;
        this._lifetime.abort();
        this.invalidate();
        this._source.dispose?.();
        this._onLoad = undefined;
    }

    private getPageIndex(rowIndex: number) {
        return Math.floor(rowIndex / this._pageSize);
    }

    /** Shares an in-flight load so callers can await rows already being fetched by rendering. */
    private loadPage(pageIndex: number): Promise<void> {
        const existing = this._pageLoads.get(pageIndex);
        if (existing) return existing;
        const task = this.fetchPage(pageIndex, this._controller.signal).finally(() => {
            if (this._pageLoads.get(pageIndex) === task) this._pageLoads.delete(pageIndex);
        });
        this._pageLoads.set(pageIndex, task);
        return task;
    }

    private async fetchPage(pageIndex: number, signal: AbortSignal) {
        throwIfRowQueryAborted(signal);
        // Do not read a partially changed structure while an expansion is pending.
        if (this._change) await waitForRowQuery(this._change.catch(() => {}), signal);
        throwIfRowQueryAborted(signal);

        const skip = pageIndex * this._pageSize;
        const viewPortArgs: GridViewportArgs = {
            skip,
            top: this._pageSize,
            signal
        };

        const result = await waitForRowQuery(this._source.load(viewPortArgs), signal);
        throwIfRowQueryAborted(signal);

        this._totalCount = result.totalCount ?? 0;

        this._pages.set(pageIndex, result.rows);
        this._onLoad?.(viewPortArgs, result);
    }


}
