import { Utils } from "../../core/Utils"
import { DataFilter } from "../../data/filter"
import { VirtualDataSource } from "../virtual-list/VirtualList"
import { DataColumn, OrderByToken } from "./DataColumn"
import { GridResult, GridRow, GridRowsProvider, GridViewportArgs } from "./GridRow"


export class VirtualGridRows<T> implements VirtualDataSource<GridRow> {

    private _onLoad?: (args: GridViewportArgs, result: GridResult) => void
    private _source: GridRowsProvider<T>;
    private _pageSize: number
    private _pages: Map<number, GridRow[]> = new Map()
    private _totalCount = 0
    private _loadingPages = new Set<number>()
    private readonly MAX_PAGE_COUNT = 100;


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
        this._pages.clear();
        await this._source.setExpanded(row, expanded);
        // Wait for the page to be loaded
        await this.load(row.visibleIndex, 1);
    }

    private getPageIndex(rowIndex: number) {
        return Math.floor(rowIndex / this._pageSize);
    }

    private async loadPage(pageIndex: number) {

        if (this._loadingPages.has(pageIndex)) {
            return;
        }

        if (this._loadingPages.size > 1) {
            return;
        }

        this._loadingPages.add(pageIndex);
        try {

            const skip = pageIndex * this._pageSize;
            const viewPortArgs: GridViewportArgs = {
                skip,
                top: this._pageSize
            };

            const result = await this._source.load(viewPortArgs);

            this._totalCount = result.totalCount ?? 0;

            this._pages.set(pageIndex, result.rows);
            this._onLoad?.(viewPortArgs, result);
        }
        finally {
            this._loadingPages.delete(pageIndex);
        }

    }


}
