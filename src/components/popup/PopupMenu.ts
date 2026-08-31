import { Component, ComponentOptions } from "../../core/Component";
import { setElementProps, v, VNodeChild } from "../../core/e";
import type { RemixIcon } from "../../core/RemixIcon";
import { PopoverCloseMode, PopoverPlacement, PopoverPoint } from "./popover";
import "./Popover.css";
import "./PopupMenu.css";

export type { RemixIcon } from "../../core/RemixIcon";

/** A declarative action, link, divider, or nested submenu entry. */
export interface MenuItem {
    /** Stable identity used by the VNode reconciler when menu items change. */
    key?: string | number;
    /** Visible item label. */
    text?: string;
    /** Remix Icon class name rendered before the label. */
    icon?: RemixIcon;
    /** Destination URL for a leaf item. */
    url?: string;
    /** Target browsing context used with `url`. */
    urlTarget?: string;
    /** Callback invoked when a leaf item is activated. */
    action?: (event?: Event) => any;
    /** Overrides the menu default for whether this item closes the menu after activation. */
    closeOnAction?: boolean;
    /** Renders a non-interactive separator instead of an action item. */
    isDivider?: boolean;
    /** Custom CSS class names applied to the item container. */
    className?: string;
    /** Elgora UI utility styles applied to the item control. */
    ui?: ComponentOptions["ui"];
    /** Whether to omit the visible label and render an icon-only item. */
    showText?: boolean;
    /** Tooltip text and fallback accessible label. */
    hint?: string;
    /** Explicit accessible label for icon-only items. */
    ariaLabel?: string;
    /** Returns the current checked state for a menu item. */
    checked?: () => boolean;
    /** Whether the item is unavailable; may be evaluated dynamically. */
    disabled?: boolean | (() => boolean);
    /** Asynchronously returns child entries rendered as a nested submenu, or `null` when there is no submenu. */
    subItems?: () => Promise<MenuItem[] | null>;
}

/** Persistent configuration for a PopupMenu instance. */
export interface PopupMenuOptions extends Omit<ComponentOptions, "children"> {
    /** Whether to hide the menu after a leaf item is activated. */
    closeOnAction?: boolean;
}

/** Positioning and content supplied when a PopupMenu is opened. */
export interface PopupMenuShowOptions {
    /** Items rendered for this invocation. */
    items: readonly MenuItem[];
    /** Element used as the menu's positioning reference. */
    anchor?: HTMLElement;
    /** Viewport point used when showing a context menu. */
    point?: PopoverPoint;
    /** Preferred side and alignment relative to the anchor or point. */
    placement?: PopoverPlacement;
    /** Distance from the positioning reference in pixels. */
    gap?: number;
    /** Native popover dismissal mode. */
    closeMode?: PopoverCloseMode;
}

const menuId = (() => {
    let value = 0;
    return () => `elg-popup-menu-${++value}`;
})();

type MenuState = {
    item: MenuItem;
    id: string;
    subItems: MenuItem[] | null;
};

function isDisabled(item: MenuItem): boolean {
    return typeof item.disabled === "function" ? item.disabled() : !!item.disabled;
}

function itemId(item: MenuItem, path: string): string {
    return item.key === undefined ? path : `${path}:${String(item.key)}`;
}

function itemClass(item: MenuItem, open: boolean): string {
    return [
        "elg-menu-item-container",
        item.className,
        open ? "is-open" : ""
    ].filter(Boolean).join(" ");
}

function itemProps(item: MenuItem, id: string, hasSubmenu: boolean, open: boolean): Record<string, any> {
    const disabled = isDisabled(item);
    const label = item.ariaLabel || item.hint || item.text;
    const props: Record<string, any> = {
        className: "elg-menu-item",
        ui: item.ui,
        "data-menu-key": id,
        "aria-label": label,
        "aria-disabled": disabled ? "true" : undefined,
        disabled: disabled && !item.url,
        title: item.hint,
        "aria-haspopup": hasSubmenu ? "menu" : undefined,
        "aria-expanded": hasSubmenu ? String(open) : undefined,
        role: item.checked ? "menuitemcheckbox" : "menuitem"
    };

    if (item.url && !hasSubmenu) {
        props.href = item.url;
        props.target = item.urlTarget;
        if (item.urlTarget === "_blank") props.rel = "noopener noreferrer";
    }

    return props;
}

/** A dynamically rendered, nested menu backed by one native popover. */
export class PopupMenu extends Component {
    private readonly closeOnAction: boolean;
    private items: readonly MenuItem[] = [];
    private itemStates = new Map<string, MenuState>();
    private openItems = new Set<string>();
    private renderVersion = 0;
    private anchor?: HTMLElement;
    private point?: PopoverPoint;
    private placement: PopoverPlacement = "bottom-start";
    private gap = 4;
    private closeMode: PopoverCloseMode = "auto";
    private readonly reposition = () => this.updatePosition();
    private readonly onClose = () => this.stopTracking();

    constructor(options: PopupMenuOptions = {}) {
        const { closeOnAction = true, ...rest } = options;
        super({ ...rest, tag: options.tag || "div" });

        this.closeOnAction = closeOnAction;
        this.dom.classList.add("elg-popover", "elg-popup-menu");
        this.dom.setAttribute("role", "menu");
        this.dom.setAttribute("popover", this.closeMode);
        this.dom.id ||= menuId();

        this.listen(this.dom, "close", this.onClose);
        this.listen(this.dom, "click", event => this.handleClick(event as MouseEvent));
        this.listen(this.dom, "pointerover", event => this.handlePointerOver(event as PointerEvent));
        this.listen(this.dom, "focusin", event => this.handleFocusIn(event as FocusEvent));
        this.listen(this.dom, "keydown", event => this.handleKeyDown(event as KeyboardEvent));
    }

    /** Renders the supplied items and opens the menu at an anchor or viewport point. */
    async show(options: PopupMenuShowOptions): Promise<void> {
        if ((options.anchor && options.point) || (!options.anchor && !options.point)) {
            throw new Error("PopupMenu.show requires either anchor or point.");
        }

        this.items = options.items;
        this.anchor = options.anchor;
        this.point = options.point;
        this.placement = options.placement || "bottom-start";
        this.gap = options.gap ?? 4;
        this.closeMode = options.closeMode || "auto";
        this.openItems.clear();
        this.dom.setAttribute("popover", this.closeMode);
        this.dom.style.setProperty("--elg-popover-gap", `${this.gap}px`);
        const wasOpen = this.isOpen();
        const rendered = await this.renderItems();
        if (!rendered) return;
        this.anchor?.style.setProperty("anchor-name", "--elg-popup-menu-anchor");
        if (!wasOpen) (this.dom as any).showPopover();
        this.updatePosition();
        requestAnimationFrame(() => this.positionSubmenus());
        this.startTracking();
    }

    /** Closes the native popover menu. */
    hide(): void {
        if ((this.dom as any).matches(":popover-open")) (this.dom as any).hidePopover();
        else this.stopTracking();
    }

    /** Opens the menu if closed, or closes it if already open. */
    toggle(options: PopupMenuShowOptions): void {
        this.isOpen() ? this.hide() : this.show(options);
    }

    /** Returns whether the native popover is currently open. */
    isOpen(): boolean {
        return (this.dom as any).matches(":popover-open");
    }

    /** Re-renders the current items and re-evaluates dynamic item state. */
    async refresh(): Promise<void> {
        await this.renderItems();
    }

    private async renderItems(): Promise<boolean> {
        const version = ++this.renderVersion;
        const states = new Map<string, MenuState>();
        const nodes = await this.renderItemList(this.items, "0", states);
        if (version !== this.renderVersion) return false;
        this.itemStates = states;
        setElementProps(this.dom, { vnodes: nodes as any });
        this.dom.dataset.placement = this.placement;
        requestAnimationFrame(() => this.positionSubmenus());
        return true;
    }

    private async renderItemList(items: readonly MenuItem[], parentPath: string, states: Map<string, MenuState>): Promise<VNodeChild[]> {
        const rendered = await Promise.all(items.map(async (item, index) => {
            const id = itemId(item, `${parentPath}.${index}`);
            const subItems = item.subItems ? await item.subItems() : null;
            states.set(id, { item, id, subItems });

            if (item.isDivider) {
                return v("div", {
                    key: id,
                    className: "elg-menu-divider",
                    role: "separator"
                } as any);
            }

            const children = subItems || [];
            const hasSubmenu = subItems !== null;
            const open = this.openItems.has(id);
            const icon = v("i", {
                className: `elg-menu-item-icon${item.icon ? ` ${item.icon}` : ""}`,
                ariaHidden: "true"
            } as any);
            const text = item.showText === false ? null : v("span", { className: "elg-menu-item-text", vnodes: [item.text || ""] });
            const arrow = hasSubmenu ? v("i", {
                className: "elg-menu-item-arrow ri-arrow-right-s-line",
                ariaHidden: "true"
            } as any) : null;
            const check = item.checked?.() ? v("i", {
                className: "elg-menu-item-check ri-check-line",
                ariaHidden: "true"
            } as any) : null;
            const control = item.url && !hasSubmenu ? "a" : "button";

            return v("div", {
                key: id,
                className: itemClass(item, open),
                "data-menu-container": id
            } as any, v(control as any, {
                ...itemProps(item, id, hasSubmenu, open),
                key: `${id}:control`
            } as any, icon, text, check, arrow), hasSubmenu ? v("div", {
                key: `${id}:submenu`,
                className: "elg-menu-submenu",
                role: "menu",
                "aria-hidden": String(!open),
                vnodes: await this.renderItemList(children, id, states)
            } as any) : null);
        }));
        return rendered;
    }

    private handleClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const control = target.closest<HTMLElement>("[data-menu-key]");
        if (!control || !this.dom.contains(control)) return;

        const id = control.getAttribute("data-menu-key");
        if (!id) return;
        const state = this.itemStates.get(id);
        if (!state || isDisabled(state.item)) {
            event.preventDefault();
            return;
        }

        if (state.subItems !== null) {
            event.preventDefault();
            void this.toggleSubmenu(id);
            return;
        }

        const result = state.item.action?.(event);
        if (state.item.closeOnAction ?? this.closeOnAction) this.hide();
        else void Promise.resolve(result).then(() => this.renderItems());
    }

    private handlePointerOver(event: PointerEvent): void {
        const target = event.target as HTMLElement;
        const control = target.closest<HTMLElement>("[data-menu-key]");
        if (!control) return;
        const id = control.getAttribute("data-menu-key");
        const state = id ? this.itemStates.get(id) : undefined;
        const container = control.closest<HTMLElement>("[data-menu-container]");
        if (container && event.relatedTarget instanceof Node && container.contains(event.relatedTarget)) return;
        if (id && state && container) this.showOrHideSubmenu(id, state, container);
    }

    private handleFocusIn(event: FocusEvent): void {
        const target = event.target as HTMLElement;
        const id = target.closest<HTMLElement>("[data-menu-key]")?.getAttribute("data-menu-key");
        const state = id ? this.itemStates.get(id) : undefined;
        const container = target.closest<HTMLElement>("[data-menu-container]");
        if (id && state && container) this.showOrHideSubmenu(id, state, container);
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        const control = target.closest<HTMLElement>("[data-menu-key]");
        if (!control) return;
        const id = control.getAttribute("data-menu-key");
        const state = id ? this.itemStates.get(id) : undefined;
        if (!id || !state) return;

        if (event.key === "ArrowRight" && state.subItems !== null) {
            event.preventDefault();
            void this.openSubmenu(id).then(() => this.focusFirst(id));
        } else if (event.key === "ArrowLeft") {
            const container = control.closest<HTMLElement>("[data-menu-container]");
            const parent = container?.parentElement?.closest<HTMLElement>("[data-menu-container]");
            if (parent) {
                event.preventDefault();
                this.closeSubmenusFrom(id);
                parent.querySelector<HTMLElement>("[data-menu-key]")?.focus();
            }
        } else if (event.key === "Escape") {
            event.preventDefault();
            this.hide();
        }
    }

    private async openSubmenu(id: string): Promise<void> {
        for (const openId of this.openItems) {
            if (openId !== id && !id.startsWith(`${openId}.`)) this.openItems.delete(openId);
        }
        this.openItems.add(id);
        await this.renderItems();
    }

    private showOrHideSubmenu(id: string, state: MenuState, container: HTMLElement): void {
        const siblingClosed = this.closeSiblingSubmenus(container);
        const canOpen = state.subItems !== null && !isDisabled(state.item);

        if (canOpen) void this.openSubmenu(id);
        else if (siblingClosed) void this.renderItems();
    }

    private closeSiblingSubmenus(container: HTMLElement): boolean {
        const menu = container.parentElement;
        if (!menu) return false;

        let changed = false;
        for (const sibling of Array.from(menu.children)) {
            if (sibling === container) continue;
            const siblingId = (sibling as HTMLElement).getAttribute("data-menu-container");
            if (!siblingId) continue;

            for (const openId of this.openItems) {
                if (openId === siblingId || openId.startsWith(`${siblingId}.`)) {
                    this.openItems.delete(openId);
                    changed = true;
                }
            }
        }

        return changed;
    }

    private async toggleSubmenu(id: string): Promise<void> {
        this.openItems.has(id) ? this.closeSubmenusFrom(id) : await this.openSubmenu(id);
    }

    private closeSubmenusFrom(id: string): void {
        for (const openId of this.openItems) {
            if (openId === id || openId.startsWith(`${id}.`) || openId.startsWith(`${id}:`)) this.openItems.delete(openId);
        }
        void this.renderItems();
    }

    private focusFirst(parentId: string): void {
        requestAnimationFrame(() => this.dom.querySelector<HTMLElement>(`[data-menu-container="${CSS.escape(parentId)}"] > .elg-menu-submenu [data-menu-key]`)?.focus());
    }

    /** Keeps visible nested submenus inside the viewport by flipping their sides when necessary. */
    private positionSubmenus(): void {
        const viewportGap = 4;
        const submenuGap = 2;

        for (const submenu of Array.from(this.dom.querySelectorAll<HTMLElement>(".elg-menu-submenu"))) {
            if (getComputedStyle(submenu).display === "none") continue;
            const container = submenu.parentElement;
            if (!container) continue;

            submenu.classList.remove("is-left", "is-up");
            const containerRect = container.getBoundingClientRect();
            let submenuRect = submenu.getBoundingClientRect();

            const canOpenLeft = containerRect.left - submenuRect.width - submenuGap >= viewportGap;
            if (submenuRect.right > innerWidth - viewportGap && canOpenLeft) {
                submenu.classList.add("is-left");
                submenuRect = submenu.getBoundingClientRect();
            }

            const canOpenUp = containerRect.bottom - submenuRect.height + submenuGap >= viewportGap;
            if (submenuRect.bottom > innerHeight - viewportGap && canOpenUp) {
                submenu.classList.add("is-up");
            }
        }
    }

    private startTracking(): void {
        addEventListener("resize", this.reposition, { passive: true });
        addEventListener("scroll", this.reposition, { passive: true, capture: true });
    }

    private stopTracking(): void {
        this.anchor?.style.removeProperty("anchor-name");
        removeEventListener("resize", this.reposition);
        removeEventListener("scroll", this.reposition, true);
    }

    /**
     * Stops viewport tracking and releases all component-owned listeners.
     */
    public override dispose(): void {
        this.stopTracking();
        super.dispose();
    }

    private updatePosition(): void {
        if (!this.isOpen()) return;
        const anchor = this.anchor?.getBoundingClientRect();
        const popup = this.dom.getBoundingClientRect();
        const point = this.point;
        const viewportGap = 4;
        const preferredSide = this.placement.split("-")[0];
        const alignment = this.placement.includes("-") ? this.placement.split("-")[1] : "center";
        const available = {
            top: anchor ? anchor.top - viewportGap : (point?.y ?? 0) - viewportGap,
            bottom: anchor ? innerHeight - anchor.bottom - viewportGap : innerHeight - (point?.y ?? 0) - viewportGap,
            left: anchor ? anchor.left - viewportGap : (point?.x ?? 0) - viewportGap,
            right: anchor ? innerWidth - anchor.right - viewportGap : innerWidth - (point?.x ?? 0) - viewportGap
        };
        const opposite: Record<string, string> = { top: "bottom", bottom: "top", left: "right", right: "left" };
        const size = preferredSide === "top" || preferredSide === "bottom" ? popup.height : popup.width;
        const fallbackSide = opposite[preferredSide];
        const side = available[preferredSide as keyof typeof available] >= size || available[preferredSide as keyof typeof available] >= available[fallbackSide as keyof typeof available] ? preferredSide : fallbackSide;
        let top: number;
        let left: number;

        if (side === "top") top = (anchor ? anchor.top : point!.y) - popup.height - this.gap;
        else if (side === "bottom") top = (anchor ? anchor.bottom : point!.y) + this.gap;
        else top = alignment === "end" ? (anchor ? anchor.bottom : point!.y) - popup.height : alignment === "center" ? (anchor ? anchor.top + (anchor.height - popup.height) / 2 : point!.y - popup.height / 2) : (anchor ? anchor.top : point!.y);

        if (side === "left") left = (anchor ? anchor.left : point!.x) - popup.width - this.gap;
        else if (side === "right") left = (anchor ? anchor.right : point!.x) + this.gap;
        else left = alignment === "end" ? (anchor ? anchor.right : point!.x) - popup.width : alignment === "center" ? (anchor ? anchor.left + (anchor.width - popup.width) / 2 : point!.x - popup.width / 2) : (anchor ? anchor.left : point!.x);

        this.dom.dataset.placement = `${side}-${alignment}`;
        this.dom.style.top = `${Math.max(viewportGap, Math.min(top, innerHeight - popup.height - viewportGap))}px`;
        this.dom.style.left = `${Math.max(viewportGap, Math.min(left, innerWidth - popup.width - viewportGap))}px`;
    }
}

export default PopupMenu;
