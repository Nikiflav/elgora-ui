import { Component, type ComponentOptions } from "../../core/Component";
import { ObservableEvent } from "../../core/ElgoraUI";
import { Localization, type LocaleOptions } from "../../localization/Localization";
import { VirtualList } from "../virtual-list/VirtualList";
import "./TreeView.css";

/** Reads a hierarchy without requiring a separate TreeNode model. Keys are globally unique. */
export interface TreeDataAdapter<T> {
    /** Stable identity, unique throughout this tree. */
    getKey(item: T): string;
    /** Indicates expandability before children have been loaded. */
    hasChildren(item: T): boolean;
    /** undefined requests roots. All immediate children are loaded together; no pagination. */
    getChildren(item: T | undefined, signal: AbortSignal): readonly T[] | Promise<readonly T[]>;
}

/** Custom row content; disclosure, focus and selection remain owned by TreeView. */
export interface TreeItemRenderContext<T> {
    /** The original adapter item. */
    item: T;
    /** Content host to populate; recycled hosts are cleared before rendering. */
    element: HTMLElement;
    /** Zero-based nesting depth. */
    depth: number;
    /** Whether this row is selected. */
    selected: boolean;
    /** Whether this row has keyboard focus within the tree. */
    focused: boolean;
    /** Whether its branch is open. */
    expanded: boolean;
}

/** Options for an independently virtualized, single-selection tree. */
export interface TreeViewOptions<T> extends Omit<ComponentOptions, "children">, LocaleOptions {
    /** Hierarchical data access; synchronous and asynchronous loaders share one contract. */
    data: TreeDataAdapter<T>;
    /** Accessible row label, also used for keyboard type-ahead. */
    getText(item: T): string;
    /** Optional content renderer, called again when an item or its state changes. */
    renderItem?(context: TreeItemRenderContext<T>): void;
    /** Accessible tree name. */
    label: string;
}

type Branch<T> = {
    item?: T;
    key?: string;
    parent?: Branch<T>;
    children?: Branch<T>[];
    state: "idle" | "loading" | "loaded" | "error";
    controller?: AbortController;
    task?: Promise<void>;
    error?: unknown;
    version: number;
};
type VisibleRow<T> = { branch: Branch<T>; depth: number; position: number; siblings: number; status?: true };
let nextTree = 0;

/** Virtualized tree with lazy branch loading, cached children and independent focus/selection. */
export class TreeView<T> extends Component {
    /** Emits the original selected item; undefined when selection is cleared. */
    readonly selectionChanged = new ObservableEvent<T | undefined>();
    /** Emits when Enter or a double-click activates an item. */
    readonly itemActivated = new ObservableEvent<T>();
    /** Emits keyboard focus changes independently of confirmed selection. */
    readonly focusedItemChanged = new ObservableEvent<T | undefined>();
    /** Allows a host to attach its own context menu without embedding menu policy in TreeView. */
    readonly itemContextMenu = new ObservableEvent<{ item: T; event: MouseEvent }>();
    private readonly root: Branch<T> = { state: "idle", version: 0 };
    private readonly branches = new Map<string, Branch<T>>();
    private readonly expanded = new Set<string>();
    private rows: VisibleRow<T>[] = [];
    private selectedKey?: string;
    private focusedKey?: string;
    private readonly list: VirtualList<VisibleRow<T>>;
    private readonly treeId = `elg-tree-${++nextTree}`;
    private readonly rowIds = new Map<string, string>();
    private typeAhead = "";
    private typeAheadTime = 0;
    private readonly messages;

    /** Creates the tree; mounting starts root loading. load() can also start it explicitly. */
    constructor(private readonly options: TreeViewOptions<T>) {
        const { data, getText, renderItem, label, locale, localization, ...domOptions } = options;
        super(domOptions);
        this.messages = Localization.resolveMessages({ locale, localization });
        this.dom.classList.add("elg-tree-view");
        this.list = new VirtualList({
            data: { count: () => this.rows.length, getAt: index => this.rows[index] },
            renderRow: args => this.renderRow(args.rowElement, args.data),
            afterRender: () => this.syncActiveDescendant()
        });
        this.list.dom.setAttribute("role", "tree");
        this.list.dom.setAttribute("aria-label", label);
        this.list.dom.tabIndex = 0;
        this.append(this.list);
        this.listen(this.list.dom, "keydown", event => this.keyDown(event as KeyboardEvent));
        this.addCleanup(this.selectionChanged);
        this.addCleanup(this.itemActivated);
        this.addCleanup(this.focusedItemChanged);
        this.addCleanup(this.itemContextMenu);
        this.addCleanup(() => this.abort(this.root));
        this.subscribe((localization ?? Localization.default).messagesChanged, () => this.rebuild());
        this.subscribe((localization ?? Localization.default).changed, () => this.rebuild());
    }

    protected override onMount(): void { void this.load(); }

    /** Current selected adapter item, if it is present in the loaded tree. */
    get selectedItem(): T | undefined { return this.selectedKey === undefined ? undefined : this.branches.get(this.selectedKey)?.item; }
    /** Current focused adapter item. Focusing does not confirm selection. */
    get focusedItem(): T | undefined { return this.focusedKey === undefined ? undefined : this.branches.get(this.focusedKey)?.item; }
    /** Loads roots, sharing an in-flight request and retaining successful results. */
    load(): Promise<void> { return this.ensure(this.root); }
    /** Returns whether the loaded item's branch is open. */
    isExpanded(item: T): boolean { return this.expanded.has(this.options.data.getKey(item)); }

    /** Opens an already loaded item and lazily loads its children. Errors are displayed locally. */
    async expand(item: T): Promise<void> {
        const branch = this.branches.get(this.options.data.getKey(item));
        if (!branch || this.disposed.Value || !this.options.data.hasChildren(branch.item!)) return;
        this.expanded.add(branch.key!);
        this.rebuild();
        await this.ensure(branch);
    }

    /** Hides descendants but retains their cache and expansion state, including pending loads. */
    collapse(item: T): void {
        const branch = this.branches.get(this.options.data.getKey(item));
        if (!branch) return;
        this.expanded.delete(branch.key!);
        let focus = this.focusedKey === undefined ? undefined : this.branches.get(this.focusedKey);
        while (focus?.parent && focus !== branch) focus = focus.parent;
        if (focus === branch) this.setFocus(branch.key);
        this.rebuild();
    }

    /** Selects a loaded item by key. undefined clears selection; emits only for a changed key. */
    select(item: T | undefined): void {
        const key = item === undefined ? undefined : this.options.data.getKey(item);
        if (this.disposed.Value || key === this.selectedKey || (key !== undefined && !this.branches.has(key))) return;
        const previous = this.selectedKey;
        this.selectedKey = key;
        this.repaint(previous);
        this.selectionChanged.invoke(this.selectedItem);
    }

    /** Opens ancestors of a known item and scrolls it into view. Does not steal DOM focus.
     * Unknown remote descendants must first be loaded, e.g. by expanding their path.
     */
    async reveal(item: T): Promise<boolean> {
        const branch = this.branches.get(this.options.data.getKey(item));
        if (!branch || this.disposed.Value) return false;
        const path: Branch<T>[] = [];
        for (let parent = branch.parent; parent?.key !== undefined; parent = parent.parent) path.unshift(parent);
        for (const parent of path) await this.expand(parent.item!);
        if (this.branches.get(branch.key!) !== branch) return false;
        this.setFocus(branch.key);
        this.scrollToFocus();
        return true;
    }

    /** Invalidates cached descendants and reloads this branch, or the entire tree.
     * Stable keys retain selection/expansion where their items remain present.
     */
    override async refresh(item?: T): Promise<void> {
        if (!this.list || this.disposed.Value) return;
        const branch = item === undefined ? this.root : this.branches.get(this.options.data.getKey(item));
        if (!branch) return;
        this.abort(branch);
        this.removeDescendants(branch);
        branch.children = undefined;
        branch.state = "idle";
        branch.task = undefined;
        await this.ensure(branch);
    }

    private abort(branch: Branch<T>): void {
        branch.version++;
        branch.controller?.abort();
        branch.children?.forEach(child => this.abort(child));
    }

    private removeDescendants(branch: Branch<T>): void {
        branch.children?.forEach(child => { this.removeDescendants(child); this.branches.delete(child.key!); });
    }

    private ensure(branch: Branch<T>): Promise<void> {
        if (this.disposed.Value || branch.state === "loaded") return Promise.resolve();
        if (branch.task) return branch.task;
        const version = ++branch.version, controller = new AbortController();
        branch.controller = controller;
        branch.state = "loading";
        branch.error = undefined;
        this.rebuild();
        const current = () => !this.disposed.Value && !controller.signal.aborted && branch.version === version;
        const task = Promise.resolve().then(() => this.options.data.getChildren(branch.item, controller.signal)).then(async items => {
            if (!current()) return;
            const keys = new Set<string>();
            const children = items.map(item => {
                const key = this.options.data.getKey(item);
                if (typeof key !== "string" || keys.has(key) || this.branches.has(key))
                    throw new Error("TreeView requires globally unique string keys.");
                keys.add(key);
                return { item, key, parent: branch, state: "idle", version: 0 } as Branch<T>;
            });
            branch.children = children;
            children.forEach(child => this.branches.set(child.key!, child));
            branch.state = "loaded";
            this.rebuild();
            await Promise.all(children.filter(child => this.expanded.has(child.key!) && this.options.data.hasChildren(child.item!)).map(child => this.ensure(child)));
        }).catch(error => {
            if (!current()) return;
            branch.state = "error";
            branch.error = error;
            this.rebuild();
        }).finally(() => {
            if (!current()) return;
            branch.task = undefined;
            this.reconcileSelection();
        });
        branch.task = task;
        return task;
    }

    private reconcileSelection(): void {
        const loading = this.root.state === "loading" || [...this.branches.values()].some(branch => branch.state === "loading");
        if (loading) return;
        if (this.selectedKey !== undefined && !this.branches.has(this.selectedKey)) this.select(undefined);
        if (this.focusedKey !== undefined && !this.branches.has(this.focusedKey)) this.setFocus(undefined);
        this.rebuild();
    }

    private rebuild(): void {
        if (!this.list || this.disposed.Value) return;
        const rows: VisibleRow<T>[] = [];
        const visit = (parent: Branch<T>, depth: number) => {
            if (parent.state === "loading" || parent.state === "error") {
                rows.push({ branch: parent, depth, position: 0, siblings: 0, status: true });
                return;
            }
            const children = parent.children ?? [];
            children.forEach((branch, index) => {
                rows.push({ branch, depth, position: index + 1, siblings: children.length });
                if (this.expanded.has(branch.key!)) visit(branch, depth + 1);
            });
        };
        visit(this.root, 0);
        this.rows = rows;
        this.list.dom.setAttribute("aria-busy", String(this.root.state === "loading"));
        if (this.focusedKey === undefined) this.setFocus(rows.find(row => !row.status)?.branch.key);
        this.syncActiveDescendant();
        this.list.refresh();
    }

    private repaint(previous?: string): void {
        this.rows.forEach((row, index) => {
            if (!row.status && [previous, this.selectedKey, this.focusedKey].includes(row.branch.key)) this.list.invalidateRow(index);
        });
        this.syncActiveDescendant();
    }

    private rowId(key: string): string {
        let id = this.rowIds.get(key);
        if (!id) { id = `${this.treeId}-${this.rowIds.size + 1}`; this.rowIds.set(key, id); }
        return id;
    }

    private syncActiveDescendant(): void {
        const id = this.focusedKey === undefined ? undefined : this.rowId(this.focusedKey);
        const element = id ? this.list.dom.querySelector<HTMLElement>(`#${id}`) : undefined;
        if (element && element.style.display !== "none") this.list.dom.setAttribute("aria-activedescendant", id!);
        else this.list.dom.removeAttribute("aria-activedescendant");
    }

    private setFocus(key?: string): void {
        if (key === this.focusedKey) return;
        const previous = this.focusedKey;
        this.focusedKey = key;
        this.repaint(previous);
        this.focusedItemChanged.invoke(this.focusedItem);
    }

    private scrollToFocus(): void {
        const index = this.rows.findIndex(row => !row.status && row.branch.key === this.focusedKey);
        if (index < 0) return;
        const top = index * 30, viewport = this.list.dom.clientHeight;
        if (top < this.list.dom.scrollTop) this.list.dom.scrollTop = top;
        else if (top + 30 > this.list.dom.scrollTop + viewport) this.list.dom.scrollTop = Math.max(0, top + 30 - viewport);
        this.list.refresh();
    }

    private renderRow(element: HTMLElement, row: VisibleRow<T>): void {
        // Retain the icon for the same item so CSS can transition its rotation.
        // Recycled rows for different items must not animate the previous item's state.
        const preservedToggle = !row.status && element.id === this.rowId(row.branch.key!)
            ? element.querySelector<HTMLElement>(":scope > .elg-tree-disclosure") : null;
        for (const child of [...element.childNodes]) if (child !== preservedToggle) child.remove();
        for (const attribute of [...element.attributes]) if (attribute.name !== "style") element.removeAttribute(attribute.name);
        element.className = "elg-tree-row";
        element.style.paddingInlineStart = `${row.depth * 18 + 4}px`;
        element.onclick = null; element.ondblclick = null; element.oncontextmenu = null;
        const branch = row.branch;
        if (row.status) {
            element.setAttribute("role", "none");
            const status = document.createElement("span");
            status.setAttribute("role", "status");
            status.textContent = this.messages.text(branch.state === "error" ? "treeView.loadError" : "treeView.loading");
            element.append(status);
            if (branch.state === "error") {
                const retry = document.createElement("button");
                retry.type = "button"; retry.className = "elg elg-btn elg-btn-ghost";
                retry.textContent = this.messages.text("treeView.retry");
                retry.onclick = () => { void this.ensure(branch); };
                element.append(retry);
            }
            return;
        }
        const item = branch.item!, key = branch.key!, expanded = this.expanded.has(key);
        const expandable = this.options.data.hasChildren(item) && !(branch.state === "loaded" && !branch.children?.length);
        element.id = this.rowId(key);
        element.setAttribute("role", "treeitem");
        element.setAttribute("aria-label", this.options.getText(item));
        element.setAttribute("aria-level", String(row.depth + 1));
        element.setAttribute("aria-posinset", String(row.position));
        element.setAttribute("aria-setsize", String(row.siblings));
        element.setAttribute("aria-selected", String(this.selectedKey === key));
        element.setAttribute("aria-busy", String(branch.state === "loading"));
        if (expandable) element.setAttribute("aria-expanded", String(expanded));
        element.classList.toggle("elg-tree-focused", this.focusedKey === key);
        const toggle = preservedToggle ?? document.createElement("span");
        toggle.className = "elg-tree-disclosure elg-icon ri-arrow-right-s-line elg-rotate-on-open";
        toggle.setAttribute("aria-hidden", "true");
        toggle.style.visibility = expandable ? "" : "hidden";
        toggle.onclick = event => {
            event.stopPropagation(); this.list.dom.focus(); this.setFocus(key);
            if (expandable) expanded ? this.collapse(item) : void this.expand(item);
        };
        const content = document.createElement("span");
        content.className = "elg-tree-label";
        if (this.options.renderItem) this.options.renderItem({ item, element: content, depth: row.depth,
            expanded, focused: this.focusedKey === key, selected: this.selectedKey === key });
        else content.textContent = this.options.getText(item);
        if (!preservedToggle) element.append(toggle);
        element.append(content);
        element.onclick = () => { this.list.dom.focus(); this.setFocus(key); this.select(item); };
        element.ondblclick = () => this.itemActivated.invoke(item);
        element.oncontextmenu = event => this.itemContextMenu.invoke({ item, event });
    }

    private keyDown(event: KeyboardEvent): void {
        if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.target !== this.list.dom) return;
        const items = this.rows.filter(row => !row.status), index = items.findIndex(row => row.branch.key === this.focusedKey);
        const command = ["ArrowDown", "ArrowUp", "Home", "End", "ArrowRight", "ArrowLeft", "Enter", " "].includes(event.key);
        if (!command && (event.key.length !== 1 || !items.length)) return;
        // A selection listener may close a popup and focus an editor. Cancel the
        // native action before calling it, so Enter/Space cannot edit that target.
        event.preventDefault();
        const branch = items[index]?.branch;
        let next: Branch<T> | undefined;
        switch (event.key) {
            case "ArrowDown": next = items[Math.min(items.length - 1, index + 1)]?.branch; break;
            case "ArrowUp": next = items[Math.max(0, index - 1)]?.branch; break;
            case "Home": next = items[0]?.branch; break;
            case "End": next = items[items.length - 1]?.branch; break;
            case "ArrowRight":
                if (branch && this.options.data.hasChildren(branch.item!)) {
                    if (!this.expanded.has(branch.key!)) void this.expand(branch.item!);
                    else next = branch.children?.[0];
                }
                break;
            case "ArrowLeft":
                if (branch && this.expanded.has(branch.key!)) this.collapse(branch.item!);
                else if (branch?.parent?.key !== undefined) next = branch.parent;
                break;
            case "Enter": case " ":
                if (branch) { this.select(branch.item); if (event.key === "Enter") this.itemActivated.invoke(branch.item!); }
                break;
            default:
                if (event.key.length !== 1 || !items.length) return;
                if (Date.now() - this.typeAheadTime > 700) this.typeAhead = "";
                this.typeAheadTime = Date.now();
                this.typeAhead += event.key.toLocaleLowerCase();
                next = [...items.slice(index + 1), ...items.slice(0, index + 1)].find(row => this.options.getText(row.branch.item!).toLocaleLowerCase().startsWith(this.typeAhead))?.branch;
        }
        if (next) this.setFocus(next.key);
        this.scrollToFocus();
    }
}
