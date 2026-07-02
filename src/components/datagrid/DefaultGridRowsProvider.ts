import { filterAnd, DataFilter } from "../../data/filter";
import { DataColumn, DataColumnUtils, OrderByToken, SummaryType } from "./DataColumn";
import { DataSource, GroupItem, QueryArgs } from "./DataSource";
import { GridViewportArgs, GridResult, GridRow, GridRowsProvider } from "./GridRow";

// ========================================================
// 1. OPTIMIZED GRID NODE INTERFACE
// ========================================================
interface GridNode {
    type: "root" | "group" | "data" | "node" | "placeholder";
    key: string;
    level: number;
    localIndex: number;
    parent?: GridNode;
    data?: any;
    text?: string;
    createPaginator?: () => Paginator;
    children?: Paginator;
    childrenCount: number;
    expanded: boolean;
    totalExpandedChildren: number; // Combined footprint of all open sub-descendants
    visibleIndex: number;          // Absolute monotonic index in the viewport grid
    expandedChildren: GridNode[];  // Fast local tracking to avoid global array filtering
}

// ========================================================
// 2. PAGINATOR ASSISTANT CLASS
// ========================================================
class Paginator {
    private _node: GridNode;
    private _gridState: DataGridState<any>;
    private _groupIndex = -1;
    private _pages: Map<number, GridNode[]> = new Map();
    private _pageSize = 100;
    private _totalCount = -1;
    private _loadingPages = new Set<number>();
    private _groupFilter?: DataFilter;

    constructor(args: {
        node: GridNode,
        state: DataGridState<any>,
        groupIndex?: number,
        groupFilter?: DataFilter
    }) {
        this._node = args.node;
        this._gridState = args.state;
        this._groupIndex = args.groupIndex ?? -1;
        this._groupFilter = args.groupFilter;
    }

    get groupColumn() {
        return this._gridState.groupColumns && this._groupIndex > -1 && this._groupIndex < this._gridState.groupColumns.length
            ? this._gridState.groupColumns![this._groupIndex]
            : undefined;
    }

    get count(): number {
        return this._totalCount < 0 ? 1 : this._totalCount;
    }

    private async loadPage(pageIndex: number): Promise<GridNode[]> {
        if (this._loadingPages.has(pageIndex)) return [];
        this._loadingPages.add(pageIndex);

        try {
            const requireTotalCount = this._totalCount < 0;
            const pageOffset = this._pageSize * pageIndex;
            let filter = filterAnd(this._groupFilter, this._gridState.baseFilter);

            const result = await this._gridState.dataSource.loadData({
                skip: pageIndex * this._pageSize,
                top: this._pageSize,
                filter: filter,
                orderby: this._gridState.orderBy,
                groupColumn: this.groupColumn,
                groupSummary: this._gridState.groupSummary,
                requireTotalCount: requireTotalCount
            });

            let page: GridNode[];
            if (result.dataItems) {
                page = result.dataItems.map((x, ix) => ({
                    type: "data",
                    level: this._node.level + 1,
                    parent: this._node,
                    localIndex: ix + pageOffset,
                    visibleIndex: -1,
                    key: JSON.stringify(this._gridState.dataSource.getRowKey?.(x) ?? x),
                    data: x,
                    expanded: false,
                    childrenCount: 0,
                    totalExpandedChildren: 0,
                    expandedChildren: []
                }));
            } else if (result.groups) {
                page = result.groups.map((g, ix) => {
                    const node: GridNode = {
                        type: "group",
                        level: this._node.level + 1,
                        text: `${g.groupValue} (${g.count})`,
                        parent: this._node,
                        localIndex: ix + pageOffset,
                        visibleIndex: -1,
                        key: g.groupField + ":" + g.groupValue,
                        data: g,
                        childrenCount: g.count,
                        expanded: false,
                        totalExpandedChildren: 0,
                        expandedChildren: []
                    };
                    node.createPaginator = () => new Paginator({
                        node,
                        state: this._gridState,
                        groupIndex: this._groupIndex + 1,
                        groupFilter: filterAnd(this._groupFilter, [[g.groupField, "=", g.groupValue]])
                    });
                    return node;
                });
            } else {
                page = [];
            }

            this._pages.set(pageIndex, page);
            if (requireTotalCount && result.totalCount !== undefined) {
                this._totalCount = result.totalCount;
            }

            return page;
        } finally {
            this._loadingPages.delete(pageIndex);
        }
    }

    async getAsync(index: number): Promise<GridNode> {
        const pageIndex = Math.floor(index / this._pageSize);
        const itemIndex = index % this._pageSize;
        let page = this._pages.get(pageIndex);
        if (page) return page[itemIndex];

        page = await this.loadPage(pageIndex);
        return page[itemIndex];
    }
}

/** Snapshot of everything that shapes the row tree: data, visible/grouped columns, filter and order. */
export type DataGridState<TRow> = {
    /** Underlying data access layer queried for each page/level of the tree. */
    dataSource: DataSource<TRow>,
    /** All defined columns, keyed by name. */
    columns: Map<string, DataColumn<TRow>>,
    /** Names of the columns currently shown as data columns. */
    visibleColumns: string[],
    /** Ordered column names defining the grouping levels (outermost first). */
    groupColumns?: string[],
    /** Aggregations to compute per group, per column. */
    groupSummary?: { field: string, summaryType: SummaryType }[],
    /** Filter applied in addition to any per-group filter. */
    baseFilter?: DataFilter,
    orderBy?: OrderByToken[]
}

// ========================================================
// 3. REFACTORED ROWS PROVIDER (LOCALIZED REFERENCES)
// ========================================================
export class DefaultGridRowsProvider<TRow> implements GridRowsProvider<TRow> {
    private _state: DataGridState<TRow>;
    private _rootNode?: GridNode;
    private _expandedNodes: GridNode[] = []; // Chronological flat list sorted strictly by visibleIndex

    constructor(state: DataGridState<TRow>) {
        this._state = state;
    }

    public get visibleCount() {
        return this._rootNode?.totalExpandedChildren ?? 0
    }

    public getState(): DataGridState<TRow> { return this._state; }

    public setState(state: DataGridState<TRow>) {
        this._state = state;
        this._rootNode = undefined;
        this._expandedNodes = [];
    }

    async load(args: GridViewportArgs): Promise<GridResult> {
        if (!this._rootNode) {
            this._rootNode = {
                type: 'root',
                level: -1,
                localIndex: 0,
                visibleIndex: 0,
                key: '$',
                expanded: true,
                childrenCount: 0,
                totalExpandedChildren: 0,
                expandedChildren: []
            };
            this._rootNode.children = new Paginator({
                node: this._rootNode,
                state: this._state,
                groupIndex: 0
            });

            await this._rootNode.children.getAsync(0);
            this._rootNode.childrenCount = this._rootNode.children.count;
            this._rootNode.totalExpandedChildren = this._rootNode.childrenCount;
            this.refreshGlobalExpandedNodes();
        }

        const nodes: GridNode[] = [];

        if (args.top > 0 && args.skip < this._rootNode.totalExpandedChildren) {

            // Use skip+1 because our first _rootNode is not visible.
            let currentNode = await this.getNodeAt(args.skip + 1);

            while (currentNode) {
                nodes.push(currentNode);

                if (nodes.length >= args.top)
                    break;

                currentNode = await this.getNext(currentNode, 1);
            }
        }

        const gridRows: GridRow[] = [];
        const visibleColumns = this._state.visibleColumns
            .map(name => this._state.columns.get(name))
            .filter(c => c !== undefined);

        for (let node of nodes) {
            let cells = undefined;
            if (node.type === "data") {
                cells = await DataColumnUtils.getDataCells(visibleColumns, node.data);
            } else if (node.type === "group") {
                let group = <GroupItem>node.data;
                cells = group.summaryValues ?? {};
                cells[group.groupField] = `${group.groupValue} (${group.count})`;
                let parent = node.parent;
                while (parent?.type == "group" && parent.data?.groupField) {
                    cells[parent.data.groupField] = parent.data.groupValue;
                    parent = parent.parent;
                }
            }

            gridRows.push({
                type: node.type,
                visibleIndex: args.skip + gridRows.length,
                key: node.key,
                level: node.level,
                text: node.text,
                expandable: !!node.childrenCount,
                data: node,
                expanded: node.expanded,
                cells: cells
            } as GridRow);
        }

        return {
            totalCount: this._rootNode.totalExpandedChildren,
            rows: gridRows
        };
    }




    async setExpanded(row: GridRow, expanded: boolean) {
        if ((row.type === "group" || row.type === "node") && row.data) {
            await this.setNodeExpanded(row.data, expanded);
        }
    }



    /**
     * Rebuilds the flat timeline and stamps sequential absolute indices.
     */
    private refreshGlobalExpandedNodes() {
        if (!this._rootNode) return;

        this._rootNode.visibleIndex = 0;
        const flattenedList: GridNode[] = [this._rootNode];

        const collectAndIndex = (parent: GridNode, currentOffset: number): number => {
            let structuralRunningOffset = currentOffset;

            for (const child of parent.expandedChildren) {
                child.visibleIndex = structuralRunningOffset + child.localIndex;
                flattenedList.push(child);

                if (child.expanded) {
                    collectAndIndex(child, child.visibleIndex + 1);
                    structuralRunningOffset += child.totalExpandedChildren;
                }
            }
            return structuralRunningOffset;
        };

        collectAndIndex(this._rootNode, 1);
        this._expandedNodes = flattenedList;
    }

    /**
     * O(log K) binary lookup to check if a specific local index tier is expanded
     */
    private findExpandedChildBinary(parent: GridNode, localIndex: number): GridNode | undefined {
        let low = 0;
        let high = parent.expandedChildren.length - 1;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const midNode = parent.expandedChildren[mid];

            if (midNode.localIndex === localIndex) {
                return midNode;
            } else if (midNode.localIndex < localIndex) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return undefined;
    }

    /**
     * O(log K) binary search to find the correct sorted slot for a newly expanded child
     */
    private findInsertionIndexBinary(array: GridNode[], localIndex: number): number {
        let low = 0;
        let high = array.length - 1;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            if (array[mid].localIndex === localIndex) {
                return mid;
            } else if (array[mid].localIndex < localIndex) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return low;
    }

    async setNodeExpanded(node: GridNode, expanded: boolean) {
        if (node.expanded === expanded) return;

        if (expanded) {
            node.expanded = true;
            if (!node.children && node.createPaginator) {
                node.children = node.createPaginator();
            }
            if (node.children) {
                await node.children.getAsync(0);
                node.childrenCount = node.children.count;
            }
            node.totalExpandedChildren = node.childrenCount;

            // OPTIMIZED: High-speed binary slice placement instead of sorting an entire array
            if (node.parent) {
                const insertIdx = this.findInsertionIndexBinary(node.parent.expandedChildren, node.localIndex);
                node.parent.expandedChildren.splice(insertIdx, 0, node);
            }
        } else {
            node.expanded = false;
            node.totalExpandedChildren = 0;
            node.expandedChildren = [];

            if (node.parent) {
                // Direct reference filtering equality check (fastest possible native exclusion match)
                node.parent.expandedChildren = node.parent.expandedChildren.filter(n => n !== node);
            }
        }

        // Upward pass: Recalculate weights up the tree hierarchy from this pivot node
        let current: GridNode | undefined = node.parent;
        while (current) {
            let total = current.childrenCount;
            for (const child of current.expandedChildren) {
                total += child.totalExpandedChildren;
            }
            current.totalExpandedChildren = total;
            current = current.parent;
        }

        // Downward pass: Clean linear rebuild of global tracking array
        this.refreshGlobalExpandedNodes();
    }

    /**
     * Fast structural lookup that uses a global binary search to locate the 
     * closest expanded anchor node, then dives directly into its sub-tree branch.
     */
    private async getNodeAt(targetIndex: number): Promise<GridNode | undefined> {
        // 1. Find the closest preceding expanded node globally in O(log N)
        const expandedParent = this.findClosestPrecedingExpandedNode(targetIndex);

        if (!expandedParent)
            return undefined;

        if (expandedParent.visibleIndex === targetIndex)
            return expandedParent;

        const offset = targetIndex - expandedParent.visibleIndex;

        return await this.getNext(expandedParent, offset);
    }

    private async getNext(anchor: GridNode, offset: number, expand = true): Promise<GridNode | undefined> {
        if (offset == 0)
            return anchor;

        if (expand && anchor.expanded && anchor.childrenCount) {
            // Move to first child and call getNext again.
            const firstChild = await anchor.children?.getAsync(0);
            if (!firstChild)
                return undefined;
            return this.getNext(firstChild, offset - 1);
        }
        // Check siblings.
        let siblingCount = anchor.parent?.childrenCount ?? 0;
        if (anchor.localIndex + offset < siblingCount) {
            return await anchor.parent?.children?.getAsync(anchor.localIndex + offset);
        }

        if (!anchor.parent)
            return undefined;

        // Move to parent next sibling.
        return await this.getNext(
            anchor.parent,
            anchor.localIndex + offset - siblingCount + 1,
            false);

    }

    /**
     * Standard O(log N) binary search over the global timeline to find 
     * the nearest expanded node whose visibleIndex is <= targetIndex.
     */
    private findClosestPrecedingExpandedNode(targetIndex: number): GridNode | undefined {
        let low = 0;
        let high = this._expandedNodes.length - 1;
        let candidate: GridNode | undefined = undefined;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const midNode = this._expandedNodes[mid];

            if (midNode.visibleIndex === targetIndex) {
                return midNode; // Perfect match found instantly
            } else if (midNode.visibleIndex < targetIndex) {
                candidate = midNode; // This node is before our target; track it as a candidate
                low = mid + 1;       // Look for a closer one
            } else {
                high = mid - 1;
            }
        }
        return candidate;
    }


}