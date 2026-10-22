import { DataFilter, filterAnd } from "../../data/filter";
import type { DataGridColumn } from "./DataGridColumn";
import { DataViewFieldUtils } from "../../data/DataViewField";
import type { OrderByToken } from "../../data/grouping";
import { encodeGroupKeySegment, getGroupFilter, normalizeGroupValue } from "../../data/grouping";
import type { SummaryType, SummaryResult } from "../../data/summary";
import type { DataSource, GroupItem, QueryArgs } from "../../data/DataSource";
import { GridViewportArgs, GridResult, GridRow, GridRowsProvider } from "./GridRow";
import { throwIfRowQueryAborted, waitForRowQuery } from "./RowQuery";
import { copyExpansionState, type GridExpansionState } from "./GridExpansionState";

// ========================================================
// 1. OPTIMIZED GRID NODE INTERFACE
// ========================================================
interface GridNode {
    type: "root" | "group" | "data" | "node";
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
    /** Direct children whose expanded state is retained even while this node is collapsed. */
    expandedChildren: GridNode[];
    canExpand?: boolean;           // type: "node" only - from DataSource.hasChildren(row); childrenCount is unknown until first expand
}

// ========================================================
// 2. PAGINATOR ASSISTANT CLASS
// ========================================================
class Paginator {
    private _node: GridNode;
    private _gridState: DataGridState<any>;
    private _groupIndex = -1;
    private _pages: Map<number, GridNode[]> = new Map();
    private _pageSize: number;
    private _totalCount = -1;
    private _loadingPages = new Map<number, Promise<{ page: GridNode[], totalSummary?: SummaryResult[] }>>();
    private readonly _signal: AbortSignal;
    private _groupFilter?: DataFilter;
    private _parentId?: any;
    private _isHierarchy: boolean;

    constructor(args: {
        node: GridNode,
        state: DataGridState<any>,
        groupIndex?: number,
        groupFilter?: DataFilter,
        parentId?: any,
        signal: AbortSignal,
        groups?: GroupItem[]
    }) {
        this._node = args.node;
        this._signal = args.signal;
        this._gridState = args.state;
        this._groupIndex = args.groupIndex ?? -1;
        this._groupFilter = args.groupFilter;
        this._parentId = args.parentId;
        this._isHierarchy = !!this._gridState.dataSource.hasChildren;
        this._pageSize = args.state.pageSize;
        if (args.groups) {
            this._totalCount = args.groups.length;
            const nodes = this.createGroupNodes(args.groups, 0);
            this._pages.set(0, []);
            for (let index = 0; index < nodes.length; index += this._pageSize)
                this._pages.set(index / this._pageSize, nodes.slice(index, index + this._pageSize));
        }
    }

    get groupField() {
        return this._gridState.groupColumns && this._groupIndex > -1 && this._groupIndex < this._gridState.groupColumns.length
            ? this._gridState.groupColumns![this._groupIndex]
            : undefined;
    }

    get count(): number {
        return this._totalCount < 0 ? 1 : this._totalCount;
    }

    private loadPage(pageIndex: number): Promise<{ page: GridNode[], totalSummary?: SummaryResult[] }> {
        const existing = this._loadingPages.get(pageIndex);
        if (existing) return existing;
        const task = waitForRowQuery(this.fetchPage(pageIndex), this._signal).finally(() => {
            if (this._loadingPages.get(pageIndex) === task) this._loadingPages.delete(pageIndex);
        });
        this._loadingPages.set(pageIndex, task);
        return task;
    }

    private async fetchPage(pageIndex: number): Promise<{ page: GridNode[], totalSummary?: SummaryResult[] }> {
        throwIfRowQueryAborted(this._signal);
        const requireTotalCount = this._totalCount < 0;
        const pageOffset = this._pageSize * pageIndex;
        const filter = filterAnd(this._groupFilter, this._gridState.baseFilter);

        const groupField = this.groupField;
        const result = await waitForRowQuery(this._gridState.dataSource.loadData({
            skip: pageIndex * this._pageSize,
            top: this._pageSize,
            filter: filter,
            orderby: this._gridState.orderBy,
            groupBy: groupField ? [{ field: groupField, interval: this._gridState.columns.get(groupField)?.groupInterval }] : undefined,
            groupSummary: this._gridState.groupSummary,
            totalSummary: this._node.type === "root" ? this._gridState.totalSummary : undefined,
            parentId: this._isHierarchy ? this._parentId : undefined,
            requireTotalCount: requireTotalCount,
            abortSignal: this._signal
        }), this._signal);

        let page: GridNode[];
        if (this._isHierarchy && result.dataItems) {
            page = await Promise.all(result.dataItems.map(async (x, ix) => {
                const node: GridNode = {
                    type: "node",
                    level: this._node.level + 1,
                    parent: this._node,
                    localIndex: ix + pageOffset,
                    visibleIndex: -1,
                    key: JSON.stringify(this._gridState.dataSource.getRowId?.(x) ?? x),
                    data: x,
                    expanded: false,
                    childrenCount: 0,
                    totalExpandedChildren: 0,
                    expandedChildren: []
                };
                node.canExpand = await this._gridState.dataSource.hasChildren!(x);
                if (node.canExpand) {
                    const parentId = this._gridState.dataSource.getRowId?.(x);
                    node.createPaginator = () => new Paginator({
                        node,
                        state: this._gridState,
                        parentId,
                        signal: this._signal
                    });
                }
                return node;
            }));
        } else if (result.dataItems) {
            page = result.dataItems.map((x, ix) => ({
                type: "data",
                level: this._node.level + 1,
                parent: this._node,
                localIndex: ix + pageOffset,
                visibleIndex: -1,
                key: JSON.stringify(this._gridState.dataSource.getRowId?.(x) ?? x),
                data: x,
                expanded: false,
                childrenCount: 0,
                totalExpandedChildren: 0,
                expandedChildren: []
            }));
        } else if (result.groups) {
            page = this.createGroupNodes(result.groups, pageOffset);
        } else {
            page = [];
        }

        throwIfRowQueryAborted(this._signal);
        this._pages.set(pageIndex, page);
        if (requireTotalCount && result.totalCount !== undefined) {
            this._totalCount = result.totalCount;
        }
        if (this._node.type === "root" && result.totalSummary)
            return { page, totalSummary: result.totalSummary };

        return { page };
    }

    /** Uses the same node/paginator path for ordinary pages and complete nested group results. */
    private createGroupNodes(groups: GroupItem[], pageOffset: number): GridNode[] {
        return groups.map((g, ix) => {
                const groupValue = normalizeGroupValue(g.groupValue);
                const node: GridNode = {
                    type: "group",
                    level: this._node.level + 1,
                    text: `${groupValue === null ? "(No value)" : groupValue === "" ? "(Empty text)" : groupValue} (${g.count})`,
                    parent: this._node,
                    localIndex: ix + pageOffset,
                    visibleIndex: -1,
                    // Empty text: $/Bulgaria/. Missing: $/Bulgaria/~. Literal ~: %7E.
                    key: this._node.key + "/" + encodeGroupKeySegment(groupValue),
                    data: { ...g, groupValue },
                    childrenCount: g.groups?.length ?? g.count,
                    expanded: false,
                    totalExpandedChildren: 0,
                    expandedChildren: []
                };
                node.createPaginator = () => new Paginator({
                    node,
                    state: this._gridState,
                    groupIndex: this._groupIndex + 1,
                    signal: this._signal,
                    groups: g.groups,
                    groupFilter: filterAnd(
                        this._groupFilter,
                        getGroupFilter(this._gridState.columns.get(g.groupField) ?? { name: g.groupField }, groupValue)
                    )
                });
                if (g.groups) node.children = node.createPaginator();
                return node;
            });
    }

    /** All materialized children, including collapsed ones, in local order. No fetching. */
    knownNodes(): GridNode[] {
        return [...this._pages.values()].flat().sort((a, b) => a.localIndex - b.localIndex);
    }

    async getAsync(index: number): Promise<GridNode> {
        return (await this.getAsyncWithResult(index)).node;
    }

    async getAsyncWithResult(index: number): Promise<{ node: GridNode, totalSummary?: SummaryResult[] }> {
        const pageIndex = Math.floor(index / this._pageSize);
        const itemIndex = index % this._pageSize;
        let page = this._pages.get(pageIndex);
        if (page) return { node: page[itemIndex] };

        const result = await this.loadPage(pageIndex);
        return { node: result.page[itemIndex], totalSummary: result.totalSummary };
    }
}

/** Snapshot of everything that shapes the row tree: data, visible/grouped columns, filter and order. */
export type DataGridState<TRow> = {
    /** Resolved host locale for cell and summary presentation; not part of the data-source query. */
    locale?: string;
    /** Underlying data access layer queried for each page/level of the tree. */
    dataSource: DataSource<TRow>,
    /** Page size used when querying the DataSource. */
    pageSize: number,
    /** All defined columns, keyed by name. */
    columns: Map<string, DataGridColumn<TRow>>,
    /** Names of the columns currently shown as data columns. */
    visibleColumns: string[],
    /** Ordered column names defining the grouping levels (outermost first). */
    groupColumns?: string[],
    /** Aggregations to compute per group, per column. */
    groupSummary?: { field: string, summaryType: SummaryType }[],
    /** Aggregations for the complete filtered result, independently of paging and grouping. */
    totalSummary?: { field: string, summaryType: SummaryType }[],
    /** Filter applied in addition to any per-group filter. */
    baseFilter?: DataFilter,
    orderBy?: OrderByToken[],
    /** Value passed as parentId for the root-level query, when the data source is hierarchical. Defaults to null. */
    hierarchyRootId?: any
}

// ========================================================
// 3. REFACTORED ROWS PROVIDER (LOCALIZED REFERENCES)
// ========================================================
export class DefaultGridRowsProvider<TRow> implements GridRowsProvider<TRow> {
    private _state: DataGridState<TRow>;
    private _rootNode?: GridNode;
    private _expandedNodes: GridNode[] = []; // Chronological flat list sorted strictly by visibleIndex
    private _controller = new AbortController();
    private _rootReady = false;
    private _rootSummary?: SummaryResult[];
    private _initializing?: Promise<SummaryResult[] | undefined>;
    private _revision = 0;
    private _disposed = false;
    private _batch?: Promise<void>;
    private _expansions = new WeakMap<GridNode, Promise<void>>();
    private readonly _activeChanges = new Set<Promise<void>>();
    private _initialExpansion?: GridExpansionState;

    constructor(state: DataGridState<TRow>, expansion?: GridExpansionState) {
        this._state = state;
        if (expansion) this._initialExpansion = copyExpansionState(expansion);
    }

    public get visibleCount() {
        return this._rootNode?.totalExpandedChildren ?? 0
    }

    public getState(): DataGridState<TRow> { return this._state; }

    public setState(state: DataGridState<TRow>) {
        this._controller.abort();
        this._controller = new AbortController();
        if (this._disposed) this._controller.abort();
        this._revision++;
        this._rootReady = false;
        this._rootSummary = undefined;
        this._initializing = undefined;
        this._state = state;
        this._rootNode = undefined;
        this._expandedNodes = [];
        this._batch = undefined;
        this._expansions = new WeakMap();
        this._activeChanges.clear();
        this._initialExpansion = undefined;
    }

    /** Aborts all pages, including queries started by a pending expansion. */
    dispose(): void {
        this._disposed = true;
        this._controller.abort();
        this._rootNode = undefined;
        this._expandedNodes = [];
        this._initializing = undefined;
        this._rootSummary = undefined;
    }

    private initializeRoot(): Promise<SummaryResult[] | undefined> {
        throwIfRowQueryAborted(this._controller.signal);
        if (this._rootReady) return Promise.resolve(this._rootSummary);
        if (this._initializing) return this._initializing;
        const signal = this._controller.signal;
        const task = this.loadRoot(signal).finally(() => {
            if (this._initializing === task) this._initializing = undefined;
        });
        this._initializing = task;
        return task;
    }

    private async loadRoot(signal: AbortSignal): Promise<SummaryResult[] | undefined> {
        if (this._initialExpansion?.expandedGroupKeys.length && this._state.groupColumns?.length && !this._state.dataSource.hasChildren) {
            const keys = new Set(this._initialExpansion.expandedGroupKeys);
            const { root, summary } = await this.loadGroupedRoot(signal);
            throwIfRowQueryAborted(signal);
            this.applyGroupExpansion(root, node => keys.has(node.key));
            throwIfRowQueryAborted(signal);
            this._rootNode = root;
            this._rootSummary = summary;
            this._rootReady = true;
            this._initialExpansion = undefined;
            this.refreshGlobalExpandedNodes();
            return summary;
        }
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
        this._rootNode.children = this._state.dataSource.hasChildren
            ? new Paginator({
                node: this._rootNode,
                state: this._state,
                signal,
                parentId: this._state.hierarchyRootId ?? null
            })
            : new Paginator({
                node: this._rootNode,
                state: this._state,
                signal,
                groupIndex: 0
            });

        const initial = await this._rootNode.children.getAsyncWithResult(0);
        throwIfRowQueryAborted(signal);
        this._rootNode.childrenCount = this._rootNode.children.count;
        this._rootNode.totalExpandedChildren = this._rootNode.childrenCount;
        this.refreshGlobalExpandedNodes();
        this._rootReady = true;
        this._rootSummary = initial.totalSummary;
        return initial.totalSummary;
    }

    load(args: GridViewportArgs): Promise<GridResult> {
        if (args.signal?.aborted) return Promise.reject(new DOMException("Failed to load grid rows. The query was cancelled.", "AbortError"));
        return waitForRowQuery(waitForRowQuery(this.loadCurrent(args), this._controller.signal), args.signal);
    }

    private async loadCurrent(args: GridViewportArgs): Promise<GridResult> {
        const signal = this._controller.signal;
        const revision = this._revision;
        const check = () => {
            throwIfRowQueryAborted(signal);
            throwIfRowQueryAborted(args.signal);
            if (revision !== this._revision) throw new DOMException("Failed to load grid rows. The row structure changed.", "AbortError");
        };
        const totalSummary = await this.initializeRoot();
        check();
        const root = this._rootNode!;

        const nodes: GridNode[] = [];

        if (args.top > 0 && args.skip < root.totalExpandedChildren) {

            // Use skip+1 because our first _rootNode is not visible.
            let currentNode = await this.getNodeAt(args.skip + 1);
            check();

            while (currentNode) {
                nodes.push(currentNode);

                if (nodes.length >= args.top)
                    break;

                currentNode = await this.getNext(currentNode, 1);
                check();
            }
        }

        const gridRows: GridRow[] = [];
        const visibleColumns = this._state.visibleColumns
            .map(name => this._state.columns.get(name))
            .filter(c => c !== undefined);

        for (let node of nodes) {
            let cells = undefined;
            if (node.type === "data" || node.type === "node") {
                cells = await DataViewFieldUtils.getDataCells(visibleColumns, node.data, this._state.locale);
                check();
            } else if (node.type === "group") {
                let group = <GroupItem>node.data;
                cells = { ...group.summaryValues };
                // Presentation only: retain raw aggregate values for custom renderers and data operations.
                for (const field of visibleColumns) {
                    const summary = this._state.groupSummary?.find(item => item.field === field.name);
                    if (field.displayFormat !== undefined && summary && Object.prototype.hasOwnProperty.call(group.summaryValues ?? {}, field.name)) {
                        const value = group.summaryValues![field.name];
                        cells[field.name] = { value, text: DataViewFieldUtils.formatSummaryValue(field, value, summary.summaryType, this._state.locale) };
                    }
                }
                cells[group.groupField] = node.text;
                let parent = node.parent;
                while (parent?.type == "group" && parent.data?.groupField) {
                    cells[parent.data.groupField] = parent.data.groupValue;
                    parent = parent.parent;
                }
            }

            gridRows.push({
                type: node.type,
                visibleIndex: args.skip + gridRows.length,
                parentRowIndex: !node.parent || node.parent.type === "root"
                    ? undefined
                    : node.parent.visibleIndex - 1,
                key: node.key,
                level: node.level,
                text: node.text,
                expandable: node.type === "node" ? !!node.canExpand : !!node.childrenCount,
                data: node,
                expanded: node.expanded,
                cells: cells
            } as GridRow);
        }

        return {
            totalCount: root.totalExpandedChildren,
            rows: gridRows,
            totalSummary
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

        const collectAndIndex = (parent: GridNode, currentOffset: number): void => {
            let structuralRunningOffset = currentOffset;

            for (const child of parent.expandedChildren) {
                child.visibleIndex = structuralRunningOffset + child.localIndex;
                flattenedList.push(child);

                if (child.expanded) {
                    collectAndIndex(child, child.visibleIndex + 1);
                    structuralRunningOffset += child.totalExpandedChildren;
                }
            }
        };

        collectAndIndex(this._rootNode, 1);
        this._expandedNodes = flattenedList;
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

    setNodeExpanded(node: GridNode, expanded: boolean): Promise<void> {
        const signal = this._controller.signal;
        const previous = this._expansions.get(node) ?? Promise.resolve();
        const task = Promise.all([previous.catch(() => {}), this._batch?.catch(() => {})]).then(() =>
            this.changeNodeExpanded(node, expanded, signal));
        this._expansions.set(node, task);
        this._activeChanges.add(task);
        return task.finally(() => {
            this._activeChanges.delete(task);
            if (this._expansions.get(node) === task) this._expansions.delete(node);
        });
    }

    /** Batch barriers retain concurrent per-node loading while making batch publication atomic. */
    private queueChange(change: (signal: AbortSignal) => void | Promise<void>): Promise<void> {
        const signal = this._controller.signal;
        const active = [...this._activeChanges];
        const task = (this._batch ?? Promise.resolve()).catch(() => {}).then(async () => {
            await Promise.allSettled(active);
            throwIfRowQueryAborted(signal);
            return change(signal);
        });
        this._batch = task;
        return task.finally(() => {
            if (this._batch === task) this._batch = undefined;
        });
    }

    /** Loads only group metadata through loadData, then publishes one complete structural change. */
    async setGroupsExpanded(expanded: boolean, groupIndex?: number, includeParents = false): Promise<void> {
        const fields = this._state.groupColumns ?? [];
        if (groupIndex !== undefined && (!Number.isInteger(groupIndex) || groupIndex < 0 || groupIndex >= fields.length))
            throw new Error("Failed to change group expansion. groupIndex must identify a configured grouping level.");
        if (!fields.length || this._state.dataSource.hasChildren) return;
        return this.queueChange(async signal => {
            if (expanded) await this.initializeRoot();
            throwIfRowQueryAborted(signal);
            if (!this._rootNode || !this._rootReady) return;
            const previous = new Set(this.getExpansionState().expandedGroupKeys);
            let root = this._rootNode;
            let summary = this._rootSummary;
            if (expanded) {
                const loaded = await this.loadGroupedRoot(signal);
                root = loaded.root;
                summary = loaded.summary ?? summary;
            }
            this.applyGroupExpansion(root, node => groupIndex === undefined || node.level === groupIndex
                || (expanded && includeParents && node.level < groupIndex) ? expanded : previous.has(node.key));
            throwIfRowQueryAborted(signal);
            this._rootNode = root;
            this._rootSummary = summary;
            this._revision++;
            this.refreshGlobalExpandedNodes();
        });
    }

    /** Copies even hidden descendants; snapshots never contain live nodes or mutable provider collections. */
    getExpansionState(): GridExpansionState {
        if (!this._rootReady && this._initialExpansion) return copyExpansionState(this._initialExpansion);
        const keys: string[] = [];
        const visit = (node: GridNode) => {
            if (node.type === "group" && node.expanded) keys.push(node.key);
            for (const child of node.children?.knownNodes() ?? []) if (child.type === "group") visit(child);
        };
        if (this._rootNode) visit(this._rootNode);
        return { expandedGroupKeys: keys };
    }

    /** Restores through the same atomic metadata path as expand-all; absent keys are simply not materialized. */
    async setExpansionState(state: GridExpansionState): Promise<void> {
        const snapshot = copyExpansionState(state);
        if (!this._state.groupColumns?.length || this._state.dataSource.hasChildren) {
            if (snapshot.expandedGroupKeys.length)
                throw new Error("Failed to restore group expansion. A nonempty snapshot requires a grouped, non-hierarchical view.");
            return;
        }
        return this.queueChange(async signal => {
            // An initial viewport query may already own initialization. Never race its publication.
            if (this._initializing) await this.initializeRoot();
            throwIfRowQueryAborted(signal);
            let root = this._rootNode;
            let summary = this._rootSummary;
            if (snapshot.expandedGroupKeys.length) {
                const loaded = await this.loadGroupedRoot(signal);
                root = loaded.root;
                summary = loaded.summary ?? summary;
            }
            if (!root || (!this._rootReady && !snapshot.expandedGroupKeys.length)) return;
            const keys = new Set(snapshot.expandedGroupKeys);
            this.applyGroupExpansion(root, node => keys.has(node.key));
            throwIfRowQueryAborted(signal);
            this._rootNode = root;
            this._rootSummary = summary;
            this._rootReady = true;
            this._initialExpansion = undefined;
            this._revision++;
            this.refreshGlobalExpandedNodes();
        });
    }

    /** Complete grouped metadata, never leaf rows. Build detached nodes before publishing a replacement view. */
    private async loadGroupedRoot(signal: AbortSignal): Promise<{ root: GridNode; summary?: SummaryResult[] }> {
        const fields = this._state.groupColumns ?? [];
        const result = await waitForRowQuery(this._state.dataSource.loadData({
            groupBy: fields.map(field => ({ field, interval: this._state.columns.get(field)?.groupInterval })),
            filter: this._state.baseFilter, orderby: this._state.orderBy,
            groupSummary: this._state.groupSummary, totalSummary: this._state.totalSummary,
            requireTotalCount: true, abortSignal: signal
        }), signal);
        throwIfRowQueryAborted(signal);
        if (!Array.isArray(result.groups) || result.totalCount !== result.groups.length)
            throw new Error("Failed to load group expansion. loadData must return all requested outer groups and an accurate totalCount.");
        const validate = (groups: GroupItem[], level: number) => {
            for (const group of groups) {
                if (group.groupField !== fields[level] || !Number.isInteger(group.count) || group.count < 0)
                    throw new Error("Failed to load group expansion. Invalid grouped metadata returned by loadData.");
                if (level + 1 < fields.length) {
                    if (!Array.isArray(group.groups) || group.groups.reduce((count, child) => count + child.count, 0) !== group.count)
                        throw new Error("Failed to load group expansion. loadData must return complete nested groups for every groupBy level.");
                    validate(group.groups, level + 1);
                }
            }
        };
        validate(result.groups, 0);
        const root: GridNode = { type: "root", key: "$", level: -1, localIndex: 0, visibleIndex: 0,
            expanded: true, childrenCount: result.groups.length, totalExpandedChildren: 0, expandedChildren: [] };
        root.children = new Paginator({ node: root, state: this._state, groupIndex: 0, signal, groups: result.groups });
        return { root, summary: result.totalSummary };
    }

    /** Recalculates structural weights once, while retaining flags for groups under collapsed parents. */
    private applyGroupExpansion(root: GridNode, expanded: (node: GridNode) => boolean): void {
        const apply = (node: GridNode) => {
            if (node.type === "group") {
                node.expanded = expanded(node);
                if (node.expanded && !node.children) node.children = node.createPaginator?.();
            }
            const children = node.children?.knownNodes().filter(child => child.type === "group") ?? [];
            for (const child of children) apply(child);
            node.expandedChildren = children.filter(child => child.expanded);
            node.totalExpandedChildren = node.expanded
                ? node.childrenCount + node.expandedChildren.reduce((count, child) => count + child.totalExpandedChildren, 0) : 0;
        };
        apply(root);
    }

    private async changeNodeExpanded(node: GridNode, expanded: boolean, signal: AbortSignal) {
        throwIfRowQueryAborted(signal);
        let root = node;
        while (root.parent) root = root.parent;
        if (root !== this._rootNode) throw new DOMException("Failed to expand grid row. The row belongs to an obsolete query.", "AbortError");
        if (node.expanded === expanded) return;

        if (expanded) {
            if (!node.children && node.createPaginator) {
                node.children = node.createPaginator();
            }
            if (node.children) {
                await node.children.getAsync(0);
                throwIfRowQueryAborted(signal);
                node.childrenCount = node.children.count;
            }
            // Publish only after child loading succeeds; failures remain retryable.
            node.expanded = true;
            node.totalExpandedChildren = node.childrenCount;
            for (const child of node.expandedChildren) {
                node.totalExpandedChildren += child.totalExpandedChildren;
            }

            // OPTIMIZED: High-speed binary slice placement instead of sorting an entire array
            if (node.parent) {
                const insertIdx = this.findInsertionIndexBinary(node.parent.expandedChildren, node.localIndex);
                node.parent.expandedChildren.splice(insertIdx, 0, node);
            }
        } else {
            node.expanded = false;
            node.totalExpandedChildren = 0;

            if (node.parent) {
                // Direct reference filtering equality check (fastest possible native exclusion match)
                node.parent.expandedChildren = node.parent.expandedChildren.filter(n => n !== node);
            }
        }

        // Upward pass: Recalculate weights up the tree hierarchy from this pivot node
        let current: GridNode | undefined = node.parent;
        while (current) {
            let total = current.expanded ? current.childrenCount : 0;
            for (const child of current.expandedChildren) {
                if (current.expanded) total += child.totalExpandedChildren;
            }
            current.totalExpandedChildren = total;
            current = current.parent;
        }

        // Downward pass: Clean linear rebuild of global tracking array
        this._revision++;
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
