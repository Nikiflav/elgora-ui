import { Component, ComponentChild, ComponentOptions } from "../../core/Component";
import "./Popover.css";

let popupId = 0;

/** Preferred side and alignment of a popup relative to its anchor element. */
export type PopoverPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end" | "right-start" | "right" | "right-end" | "left-start" | "left" | "left-end";

/** Controls whether the browser or the caller controls popup dismissal. */
export type PopoverCloseMode = "auto" | "manual";

/** A viewport point used to position a popup without an anchor element. */
export interface PopoverPoint { x: number; y: number; }

/** Configuration for a native Popover API popup. */
export interface PopoverOptions extends Omit<ComponentOptions, "onclose"> {
    /** Element used as the popup's positioning reference. */
    anchorElement?: HTMLElement;
    /** Point used as the popup's positioning reference when no anchor exists. */
    point?: PopoverPoint;
    /** Content rendered inside the popup. */
    children?: ComponentChild;
    /** Preferred side and alignment relative to the anchor. */
    placement?: PopoverPlacement;
    /** Distance from the anchor in pixels. */
    gap?: number;
    /** Whether the popup is initially opened. */
    open?: boolean;
    /** Native Popover API dismissal mode. */
    closeMode?: PopoverCloseMode;
    /** Whether to bind the native `popovertarget` attribute to the anchor. */
    bindAnchorTarget?: boolean;
    /** Called when the native popup closes. */
    onclose?: (event: Event, popup: Popover) => void;
}

/** A native top-layer popup positioned relative to an anchor element. */
export class Popover extends Component {
    private anchor?: HTMLElement;
    private point?: PopoverPoint;
    private placement: PopoverPlacement;
    private gap: number;
    private readonly closeMode: PopoverCloseMode;
    private readonly bindAnchorTarget: boolean;
    private readonly reposition = () => this.updatePosition();

    constructor(options: PopoverOptions) {
        if (!("showPopover" in HTMLElement.prototype))
            throw new Error("Popover requires the native Popover API.");

        const { anchorElement, point, children, placement = "bottom-start", gap = 4, open, closeMode = "auto", bindAnchorTarget = true, onclose, ...rest } = options;
        if (!anchorElement && !point)
            throw new Error("Popover requires either anchorElement or point.");
        super({ ...rest, tag: options.tag || "div", children });
        this.anchor = anchorElement; this.point = point; this.placement = placement; this.gap = gap; this.closeMode = closeMode; this.bindAnchorTarget = bindAnchorTarget;
        this.dom.classList.add("elg", "elg-popover");
        Object.assign(this.dom.style, { position: "fixed", zIndex: "1000", maxWidth: "calc(100vw - 8px)", maxHeight: "calc(100vh - 8px)" });
        this.dom.setAttribute("role", this.dom.getAttribute("role") || "menu");
        this.dom.style.setProperty("--elg-popover-gap", `${gap}px`);
        this.dom.setAttribute("popover", closeMode);
        this.dom.id ||= `elg-popup-${++popupId}`;
        if (this.anchor && this.bindAnchorTarget) this.anchor.setAttribute("popovertarget", this.dom.id);

        this.listen(this.dom, "close", event => onclose?.(event, this));
        this.listen(this.dom, "toggle", this.reposition);
        if (open) this.show();
    }

    /** Changes the element used as the popup's positioning anchor. */
    setAnchor(anchor: HTMLElement): void {
        if (this.bindAnchorTarget) this.anchor?.removeAttribute("popovertarget");
        this.anchor = anchor;
        if (this.bindAnchorTarget) anchor.setAttribute("popovertarget", this.dom.id);
        this.updatePosition();
    }

    /** Replaces the content rendered inside the popover. */
    setContent(children: ComponentChild): void {
        this.dom.replaceChildren();
        this.append(children);
        this.updatePosition();
    }

    /** Changes the preferred placement of the popover. */
    setPlacement(placement: PopoverPlacement): void {
        this.placement = placement;
        this.updatePosition();
    }

    /** Changes the distance from the anchor or point. */
    setGap(gap: number): void {
        this.gap = gap;
        this.dom.style.setProperty("--elg-popover-gap", `${gap}px`);
        this.updatePosition();
    }

    /** Changes the point used to position an anchorless popup. */
    setPoint(x: number, y: number): void {
        this.anchor?.removeAttribute("popovertarget");
        this.point = { x, y };
        this.anchor = undefined;
        this.updatePosition();
    }

    /** Shows the popup using the native Popover API. */
    show(): void {
        this.anchor?.style.setProperty("anchor-name", "--elg-popup-anchor");
        (this.dom as any).showPopover();
        this.updatePosition();
        addEventListener("resize", this.reposition, { passive: true });
        addEventListener("scroll", this.reposition, { passive: true, capture: true });
    }
    /** Hides the popup using the native Popover API. */
    hide(): void {
        if ((this.dom as any).matches(":popover-open")) (this.dom as any).hidePopover();
        removeEventListener("resize", this.reposition); removeEventListener("scroll", this.reposition, true);
        this.anchor?.style.removeProperty("anchor-name");
    }
    /** Toggles the popup between its open and closed states. */
    toggle(): void { this.isOpen() ? this.hide() : this.show(); }

    /** Returns whether the browser currently considers the popup open. */
    isOpen(): boolean { return (this.dom as any).matches(":popover-open"); }

    /**
     * Stops viewport tracking, removes the anchor marker, and releases all
     * component-owned listeners and subscriptions.
     */
    public override dispose(): void {
        this.hide();
        super.dispose();
    }

    private updatePosition(): void {
        if (!this.isOpen()) return;
        const a = this.anchor?.getBoundingClientRect();
        const p = this.dom.getBoundingClientRect();
        const viewportGap = 4;
        const preferredSide = this.placement.split("-")[0];
        const alignment = this.placement.includes("-") ? this.placement.split("-")[1] : "center";
        const available = {
            top: a ? a.top - viewportGap : (this.point?.y ?? 0) - viewportGap,
            bottom: a ? innerHeight - a.bottom - viewportGap : innerHeight - (this.point?.y ?? 0) - viewportGap,
            left: a ? a.left - viewportGap : (this.point?.x ?? 0) - viewportGap,
            right: a ? innerWidth - a.right - viewportGap : innerWidth - (this.point?.x ?? 0) - viewportGap
        };
        const opposite: Record<string, string> = { top: "bottom", bottom: "top", left: "right", right: "left" };
        const size = preferredSide === "top" || preferredSide === "bottom" ? p.height : p.width;
        const fallbackSide = opposite[preferredSide];
        const side = available[preferredSide as keyof typeof available] >= size
            || available[preferredSide as keyof typeof available] >= available[fallbackSide as keyof typeof available]
            ? preferredSide
            : fallbackSide;
        let top: number;
        let left: number;

        if (side === "top") top = (a ? a.top : this.point!.y) - p.height - this.gap;
        else if (side === "bottom") top = (a ? a.bottom : this.point!.y) + this.gap;
        else top = alignment === "end" ? (a ? a.bottom : this.point!.y) - p.height : alignment === "center" ? (a ? a.top + (a.height - p.height) / 2 : this.point!.y - p.height / 2) : (a ? a.top : this.point!.y);

        if (side === "left") left = (a ? a.left : this.point!.x) - p.width - this.gap;
        else if (side === "right") left = (a ? a.right : this.point!.x) + this.gap;
        else left = alignment === "end" ? (a ? a.right : this.point!.x) - p.width : alignment === "center" ? (a ? a.left + (a.width - p.width) / 2 : this.point!.x - p.width / 2) : (a ? a.left : this.point!.x);

        top = Math.max(viewportGap, Math.min(top, innerHeight - p.height - viewportGap));
        left = Math.max(viewportGap, Math.min(left, innerWidth - p.width - viewportGap));
        this.dom.dataset.placement = `${side}-${alignment}`;
        this.dom.style.top = `${top}px`;
        this.dom.style.left = `${left}px`;
    }

}
export default Popover;
