import { ValueEditor, type ValueEditorOptions } from "./ValueEditor";
import { DataGrid } from "../datagrid/DataGrid";
import type { DataGridColumn } from "../datagrid/DataGridColumn";
import type { DataSource, QueryArgs } from "../../data/DataSource";
import { Popover } from "../popup/popover";
import { ResizeHandle } from "../resize/ResizeHandle";
import { e, v, setElementProps } from "../../core/e";
import { createInputAdornment, inputAdornmentProps } from "./InputAdornment";
import type { PopoverEditorOptions } from "./PopoverEditorOptions";
import "./LookupEditor.css";

/** Search plus standard query paging and cancellation fields. */
export interface LookupQuery extends Pick<QueryArgs, "skip" | "top" | "abortSignal"> { search: string; }
/** A page and the accurate count of all matches, not just this page. */
export interface LookupResult<TItem> { items: TItem[]; totalCount: number; }
/** Lookup configuration; the host remains responsible for accepting a value. */
export interface LookupEditorOptions<TValue, TItem> extends ValueEditorOptions<TValue>, PopoverEditorOptions {
    columns: DataGridColumn<TItem>[];
    loadItems: (query: LookupQuery) => Promise<LookupResult<TItem>>;
    getItemValue: (item: TItem) => TValue;
    getItemText: (item: TItem) => string;
    /** Resolves a current value even when its item is not in a loaded page. */
    getValueText: (value: TValue) => string | Promise<string>;
    pageSize?: number;
    /** Search debounce in milliseconds; defaults to 150. */
    searchDelay?: number;
    /** Explicit popup width in pixels; otherwise matches the input, with a 200px minimum. */
    popupWidth?: number;
    popupHeight?: number;
    /** Defaults to true; resized dimensions remain for this editor instance. */
    resizable?: boolean;
}

/**
 * Text-search value picker with a resizable, virtualized multi-column popup.
 * Searching does not change value; choosing a row explicitly confirms an item.
 * Escape or outside dismissal restores the last accepted value and its text.
 */
export class LookupEditor<TValue, TItem> extends ValueEditor<TValue> {
    private readonly lookup: LookupEditorOptions<TValue, TItem>;
    private readonly auxiliary: HTMLElement;
    private popup?: Popover;
    private removeOutsidePointerDown?: () => void;
    private suppressFocusOpen = false;
    private focusOpenSuppressionTimer?: ReturnType<typeof setTimeout>;
    private popupResized = false;
    private preserveStateOnClose = false;
    private grid?: DataGrid<TItem>;
    private status?: HTMLElement;
    private searchText = "";
    private searching = false;
    private chosen?: { value: TValue };
    private labelVersion = 0;
    private searchVersion = 0;
    private navigationVersion = 0;
    private navigationTask: Promise<void> = Promise.resolve();
    private timer?: ReturnType<typeof setTimeout>;
    private searchController?: AbortController;
    private loadItem?: (index: number) => Promise<TItem | undefined>;
    private items = new Map<number, TItem>();
    private count = 0;
    private labels = new Map<TValue, string>();

    /** Creates the input; the popup and result grid are initialized on first opening. */
    constructor(options: LookupEditorOptions<TValue, TItem>) {
        const { columns, loadItems, getItemValue, getItemText, getValueText, pageSize,
            searchDelay, popupWidth, popupHeight, resizable, openOnFocus, ...base } = options;
        super(base);
        this.lookup = options;
        this.installControl(e("input", { type: "text", role: "combobox", ui: ["elg", "field"],
            ariaExpanded: "false", ariaHasPopup: "dialog", autocomplete: "off" }));
        this.auxiliary = createInputAdornment(this.control as HTMLInputElement);
        this.renderTasks.push(this.renderAuxiliary);
        this.renderAuxiliary();
        this.displayValue();
        this.listen(this.control, "focus", () => {
            if (this.suppressFocusOpen) {
                return;
            }
            if (this.lookup.openOnFocus) this.open();
        });
        // A real pointer interaction starts a new open request. This also
        // prevents a delayed focus suppression from affecting the next click.
        this.listen(this.control, "pointerdown", () => this.clearFocusOpenSuppression());
        this.listen(this.control, "input", () => {
            if (!this.canEdit()) return;
            this.searchText = (this.control as HTMLInputElement).value;
            this.searching = true;
            this.chosen = undefined;
            this.notifyInput();
            if (this.popup?.isOpen()) this.scheduleSearch();
            else this.open();
        });
        this.listen(this.control, "click", () => {
            if (this.suppressFocusOpen) return;
            this.open();
        });
        this.listen(this.control, "keydown", event => this.keyDown(event as KeyboardEvent));
        this.addCleanup(() => {
            this.removeOutsidePointerDown?.();
            this.removeOutsidePointerDown = undefined;
            clearTimeout(this.focusOpenSuppressionTimer);
            clearTimeout(this.timer);
            this.labelVersion++;
            this.searchController?.abort();
            this.popup?.dispose();
        });
    }

    /** Raw search/display text; typing does not change the typed value. */
    get text(): string { return this.searchText; }
    /** Includes unconfirmed search text as well as an explicit candidate value. */
    override get modified(): boolean { return this.searching || super.modified; }

    /** Updates native input state immediately and schedules the keyed inset trigger. */
    protected override syncControl(): void {
        super.syncControl();
        if (this.auxiliary) this.render(this.renderAuxiliary);
    }

    /** Patches the trigger without replacing the input or changing its caret/focus. */
    private readonly renderAuxiliary = (): void => {
        if (this.disposed.Value) return;
        setElementProps(this.auxiliary, { ...inputAdornmentProps, vnodes: [v("button", {
            key: "lookup-trigger", type: "button", tabIndex: -1,
            ui: ["elg", "btn", "border-0", "p-0"], class: "elg-editor-trigger",
            ariaLabel: "Open lookup", ariaExpanded: String(this.popup?.isOpen() ?? false), disabled: !this.canEdit(),
            onmousedown: event => event.preventDefault(),
            onclick: () => { if (this.popup?.isOpen()) this.close(); else { this.focus(); this.open(); } }
        }, v("i", { class: "ri-arrow-down-s-line", ariaHidden: "true" }))] });
    };

    /**
     * Resolves external text only when the complete result contains one match.
     * Does not open the popup, change state, emit events, validate or save.
     * @example const id = await editor.resolveText("Northwind");
     */
    async resolveText(text: string): Promise<TValue> {
        if (this.lookup.resolveText) return this.lookup.resolveText(text);
        return this.lookup.getItemValue(await this.resolveItem(text));
    }

    /** Requests at most two items and checks the accurate complete-result count. */
    private async resolveItem(text: string): Promise<TItem> {
        const result = await this.lookup.loadItems({ search: text, skip: 0, top: 2 });
        if (result.totalCount === 0) throw new Error("Failed to resolve lookup text. No matching item was found.");
        if (result.totalCount !== 1) throw new Error("Failed to resolve lookup text. More than one item matches.");
        if (result.items.length !== 1) throw new Error("Failed to resolve lookup text. The matching item was not returned.");
        return result.items[0];
    }

    /** Resolves input or uses an explicit row choice before validation and acceptance. */
    protected override async candidate(): Promise<TValue> {
        if (this.chosen) return this.chosen.value;
        if (!this.searching) return this.value;
        if (this.lookup.resolveText) return this.resolveText(this.searchText);
        const item = await this.resolveItem(this.searchText);
        const value = this.lookup.getItemValue(item);
        this.labels.set(value, this.lookup.getItemText(item));
        return value;
    }

    /** Displays accepted/loaded values and ignores stale asynchronous label responses. */
    protected displayValue(): void {
        const version = ++this.labelVersion;
        this.searching = false;
        this.chosen = undefined;
        const value = this.value;
        const known = this.labels.get(value);
        this.searchText = known ?? "";
        (this.control as HTMLInputElement).value = this.searchText;
        if (known !== undefined) return;
        Promise.resolve().then(() => this.lookup.getValueText(value)).then(text => {
            if (version !== this.labelVersion || this.disposed.Value || this.searching) return;
            this.labels.set(value, text);
            this.searchText = text;
            (this.control as HTMLInputElement).value = text;
        }).catch(error => {
            if (version === this.labelVersion && !this.disposed.Value && !this.searching) this.reportError(error);
        });
    }

    /** Opens results lazily, retaining focus in the search input. */
    open(): void {
        if (!this.canEdit()) return;
        if (!this.popup) this.createPopup();
        if (this.popup!.isOpen()) return;
        if (this.lookup.popupWidth === undefined && !this.popupResized) {
            const viewportWidth = this.control.ownerDocument.defaultView!.innerWidth;
            const width = Math.min(Math.max(0, viewportWidth - 8), Math.max(200, this.control.getBoundingClientRect().width));
            this.popup!.dom.style.width = `${width}px`;
        }
        this.popup!.show();
        this.subscribeOutsidePointerDown();
        this.control.setAttribute("aria-expanded", "true");
        this.render(this.renderAuxiliary);
        this.refreshSearch();
    }

    /** Hides results; cancel() also restores the last accepted value and text. */
    close(preserveState = false): void {
        clearTimeout(this.timer);
        this.navigationVersion++;
        this.searchController?.abort();
        this.preserveStateOnClose = preserveState;
        this.removeOutsidePointerDown?.();
        this.removeOutsidePointerDown = undefined;
        this.popup?.hide();
        this.control.setAttribute("aria-expanded", "false");
        this.render(this.renderAuxiliary);
    }

    /** Closes the picker only when a pointer starts outside the editor and popup. */
    private readonly outsidePointerDown = (event: PointerEvent): void => {
        const target = event.target;
        if (target instanceof Node && this.dom.contains(target)) return;
        this.close();
    };

    /** Subscribes once for the current open session and removes the subscription on close. */
    private subscribeOutsidePointerDown(): void {
        if (this.removeOutsidePointerDown) return;
        const ownerDocument = this.control.ownerDocument;
        ownerDocument.addEventListener("pointerdown", this.outsidePointerDown, true);
        this.removeOutsidePointerDown = () => ownerDocument.removeEventListener("pointerdown", this.outsidePointerDown, true);
    }

    /** Restores the accepted value, cancels pending searches and closes results. */
    override cancel(): boolean {
        if (!super.cancel()) return false;
        clearTimeout(this.timer);
        this.searchController?.abort();
        this.closeAfterAction(false);
        return true;
    }

    /** Closes the results after confirmation; failures remain on the editor for correction. */
    override async commit(): Promise<boolean> {
        // The results list is no longer needed once confirmation starts. Close it
        // before awaiting parsing, validation or an asynchronous onCommit callback.
        if (!this.disposed.Value) this.closeAfterAction(true);
        const accepted = await super.commit();
        return accepted;
    }

    /** Closes the popup after a user action without reopening it on restored focus. */
    private closeAfterAction(preserveState: boolean): void {
        if (this.popup?.isOpen()) this.suppressNextFocusOpen();
        this.close(preserveState);
    }

    /** Builds a read-only picker grid and a reusable resize grip inside the popover. */
    private createPopup(): void {
        this.status = e("div", { ui: ["text-muted", "px-2", "py-1"], role: "status" });
        this.grid = new DataGrid<TItem>({ columns: this.lookup.columns, data: [], selectionMode: "single-row",
            showGroupPanel: false, showRowHeader: false, showColumnHeaders: this.lookup.columns.length > 1,
            showColumnFooters: false, showFilterRow: false, showRowHover: true, showBorder: false,
            cellBorders: this.lookup.columns.length > 1 ? "rows" : "none", showSelection: true, cursor: "default",
            contextMenu: false, sortOnHeaderClick: false,
            pageSize: this.lookup.pageSize ?? 50, columnWidthMode: "stretch-all" });
        this.grid.dom.classList.toggle("elg-lookup-grid-single-column", this.lookup.columns.length === 1);
        Object.assign(this.grid.dom.style, { flex: "1", minHeight: "0", width: "100%" });
        this.popup = new Popover({ anchorElement: this.control, bindAnchorTarget: false, closeMode: "manual", role: "dialog",
            ariaLabel: `${this.lookup.label ?? "Lookup"} results`,
            children: [this.grid, this.status] });
        this.control.setAttribute("aria-controls", this.popup.dom.id);
        Object.assign(this.popup.dom.style, { width: `${this.lookup.popupWidth ?? 200}px`, boxSizing: "border-box",
            height: `${this.lookup.popupHeight ?? 300}px`, padding: "4px 4px 16px", overflow: "hidden" });
        this.popup.dom.classList.add("elg-lookup-popup");
        this.popup.mount(this.dom);
        this.popup.addCleanup(this.grid);
        if (this.lookup.resizable !== false) this.popup.addCleanup(new ResizeHandle({
            target: this.popup.dom, minWidth: 200, minHeight: 140,
            onResize: () => { this.popupResized = true; }
        }));
        this.listen(this.popup.dom, "toggle", () => {
            this.render(this.renderAuxiliary);
            if (!this.popup?.isOpen()) {
                this.removeOutsidePointerDown?.();
                this.removeOutsidePointerDown = undefined;
                this.control.setAttribute("aria-expanded", "false");
                if (!this.preserveStateOnClose && !this.busy && this.modified) this.cancel();
                this.preserveStateOnClose = false;
            }
        });
        this.listen(this.grid.dom, "click", event => {
            if (!(event.target as Element).closest(".elg-data-grid-row-data")) return;
            const index = this.grid?.getActiveSelectionCell()?.rowIndex;
            const item = index === undefined ? undefined : this.items.get(index);
            if (item !== undefined) void this.choose(item);
            else this.suppressFocusOpen = false;
        });
        // Grid pointer handling focuses its viewport; restore the search field
        // after the selection handlers without blocking them.
        this.listen(this.grid.dom, "mousedown", event => {
            queueMicrotask(() => {
                if (!this.disposed.Value && !this.busy) this.focus();
            });
        });
    }

    /** Invalidates old results immediately, then debounces the next search request. */
    private scheduleSearch(): void {
        clearTimeout(this.timer);
        this.searchVersion++;
        this.navigationVersion++;
        this.searchController?.abort();
        this.items.clear();
        this.count = 0;
        this.loadItem = undefined;
        this.grid?.clearSelection();
        this.timer = setTimeout(() => this.refreshSearch(), this.lookup.searchDelay ?? 150);
    }

    /** Adapts search requests to the existing grid's demand-driven page loading. */
    private refreshSearch(): void {
        clearTimeout(this.timer);
        this.searchController?.abort();
        const controller = this.searchController = new AbortController();
        const version = ++this.searchVersion;
        const search = this.searching ? this.searchText : "";
        this.items.clear();
        this.count = 0;
        // Navigation and virtual scrolling await the same page request. This also
        // allows keyboard navigation across an unloaded page without losing a key.
        const pages = new Map<string, Promise<LookupResult<TItem>>>();
        const request = (skip: number, top: number): Promise<LookupResult<TItem>> => {
            const key = `${skip}:${top}`;
            let pending = pages.get(key);
            if (pending) return pending;
            pending = Promise.resolve().then(() => this.lookup.loadItems({ search, skip, top, abortSignal: controller.signal })).then(result => {
                if (controller.signal.aborted || version !== this.searchVersion || this.disposed.Value)
                    throw new DOMException("Search superseded", "AbortError");
                this.count = result.totalCount;
                result.items.forEach((item, index) => this.items.set(skip + index, item));
                this.status!.textContent = result.totalCount ? `${result.totalCount} matches` : "No matching items";
                return result;
            }).catch(error => { pages.delete(key); throw error; });
            pages.set(key, pending);
            return pending;
        };
        this.loadItem = async index => {
            const size = this.lookup.pageSize ?? 50;
            await request(Math.floor(index / size) * size, size);
            return this.items.get(index);
        };
        const source: DataSource<TItem> = { loadData: async args => {
            try {
                const result = await request(args.skip ?? 0, args.top ?? this.lookup.pageSize ?? 50);
                return { args, dataItems: result.items, totalCount: result.totalCount };
            } catch (error) {
                if (controller.signal.aborted || version !== this.searchVersion || this.disposed.Value)
                    throw new DOMException("Search superseded", "AbortError");
                this.status!.textContent = "Failed to load lookup items.";
                this.reportError(error);
                return { args, dataItems: [], totalCount: 0 };
            }
        } };
        this.status!.textContent = "Loading…";
        this.grid!.setOptions({ data: source });
    }

    /** Chooses a concrete item, unlike row navigation or text searching. */
    private async choose(item: TItem): Promise<void> {
        if (!this.canEdit()) {
            this.suppressFocusOpen = false;
            return;
        }
        const value = this.lookup.getItemValue(item);
        const text = this.lookup.getItemText(item);
        this.chosen = { value };
        this.draft = value;
        this.labels.set(value, text);
        this.searchText = text;
        (this.control as HTMLInputElement).value = text;
        this.notifyInput();
        await this.commit();
    }

    /** Suppresses one focus-triggered open caused by closing the picker. */
    private suppressNextFocusOpen(): void {
        this.suppressFocusOpen = true;
        clearTimeout(this.focusOpenSuppressionTimer);
        this.focusOpenSuppressionTimer = setTimeout(() => {
            this.clearFocusOpenSuppression();
        }, 500);
    }

    /** Clears the temporary guard before a new explicit input interaction. */
    private clearFocusOpenSuppression(): void {
        this.suppressFocusOpen = false;
        clearTimeout(this.focusOpenSuppressionTimer);
        this.focusOpenSuppressionTimer = undefined;
    }

    /** Navigates result pages while keeping native keyboard focus in the input. */
    private async navigate(direction: 1 | -1): Promise<void> {
        if (!this.canEdit()) return;
        this.open();
        if (!this.count || !this.grid) return;
        const version = ++this.navigationVersion;
        const searchVersion = this.searchVersion;
        const active = this.grid.getActiveSelectionCell();
        const index = Math.max(0, Math.min(this.count - 1, active ? active.rowIndex + direction : 0));
        try {
            await this.loadItem?.(index);
            if (version !== this.navigationVersion || searchVersion !== this.searchVersion) return;
            this.grid.ensureCellVisible(index, 0);
        } catch (error) {
            if (searchVersion === this.searchVersion && !this.disposed.Value && (error as Error)?.name !== "AbortError") this.reportError(error);
            return;
        }
        if (version !== this.navigationVersion || searchVersion !== this.searchVersion || !this.items.has(index)) return;
        this.grid.getSelectionManager().selectSingleCell(index, 0);
        this.grid.refresh();
    }

    /** Handles popup keys without confirming during IME composition. */
    private keyDown(event: KeyboardEvent): void {
        if (event.isComposing) return;
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); this.cancel(); }
        else if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault(); event.stopPropagation(); this.open();
        }
        else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); event.stopPropagation();
            this.open();
            const generation = this.searchVersion;
            const direction = event.key === "ArrowDown" ? 1 : -1;
            this.navigationTask = this.navigationTask.then(async () => {
                if (generation === this.searchVersion && this.popup?.isOpen()) await this.navigate(direction);
            });
        } else if (event.key === "Enter") {
            event.preventDefault(); event.stopPropagation();
            const generation = this.searchVersion;
            void this.navigationTask.then(async () => {
                if (generation !== this.searchVersion || !this.canEdit()) return;
                const index = this.grid?.getActiveSelectionCell()?.rowIndex;
                const item = this.popup?.isOpen() && index !== undefined ? this.items.get(index) : undefined;
                if (item !== undefined) await this.choose(item);
                else await this.commit();
            });
        }
    }
}
