import { Component, ComponentChild } from "../../core/Component";
import { ElementProps, setElementProps } from "../../core/e";
import { Popover, PopoverPlacement } from "./popover";
import "./Popover.css";
import "./Tooltip.css";

/** Content accepted by the shared Tooltip popover. */
export type TooltipContent = string | HTMLElement | Component | ElementProps<HTMLElement>;

/** Positioning, content, and timing options for Tooltip.show(). */
export interface TooltipShowOptions {
    /** Element described by the tooltip. */
    anchor: HTMLElement;
    /** Content rendered inside the tooltip. */
    content: TooltipContent;
    /** Preferred side and alignment relative to the anchor. */
    placement?: PopoverPlacement;
    /** Distance from the anchor in pixels. */
    gap?: number;
    /** Delay before showing on hover. */
    delay?: number;
}

/** A universal singleton tooltip backed by one reusable Popover element. */
export class Tooltip {
    private static popover?: Popover;
    private static anchor?: HTMLElement;
    private static showTimer?: number;
    private static hideTimer?: number;
    private static readonly id = "elg-tooltip";

    /** Shows tooltip content for an anchor, optionally after a delay. */
    static show(options: TooltipShowOptions): void {
        this.clearTimers();
        if (this.anchor && this.anchor !== options.anchor) this.anchor.removeAttribute("aria-describedby");
        this.anchor = options.anchor;

        const delay = options.delay ?? 0;
        if (delay > 0) {
            this.showTimer = window.setTimeout(() => this.showNow(options), delay);
        } else {
            this.showNow(options);
        }
    }

    /** Hides the tooltip. If an anchor is supplied, only that anchor can hide it. */
    static hide(anchor?: HTMLElement): void {
        if (anchor && this.anchor !== anchor) return;
        this.clearTimers();
        this.anchor?.removeAttribute("aria-describedby");
        this.popover?.hide();
        this.anchor = undefined;
    }

    /** Returns whether the shared tooltip popover is open. */
    static isOpen(): boolean {
        return !!this.popover?.isOpen();
    }

    /** Adds hover and focus listeners and returns a function that removes them. */
    static attach(anchor: HTMLElement, content: TooltipContent, options: Omit<TooltipShowOptions, "anchor" | "content"> = {}): () => void {
        const show = () => this.show({ ...options, anchor, content });
        const hide = () => this.hide(anchor);
        anchor.addEventListener("pointerenter", show);
        anchor.addEventListener("focusin", show);
        anchor.addEventListener("pointerleave", hide);
        anchor.addEventListener("focusout", hide);
        return () => {
            anchor.removeEventListener("pointerenter", show);
            anchor.removeEventListener("focusin", show);
            anchor.removeEventListener("pointerleave", hide);
            anchor.removeEventListener("focusout", hide);
            hide();
        };
    }

    private static showNow(options: TooltipShowOptions): void {
        const content = this.normalizeContent(options.content);

        if (!this.popover) {
            this.popover = new Popover({
                anchorElement: options.anchor,
                children: content,
                closeMode: "manual",
                bindAnchorTarget: false,
                role: "tooltip",
                placement: options.placement || "top",
                gap: options.gap ?? 6
            });
            this.popover.dom.classList.add("elg-tooltip");
            this.popover.dom.id = this.id;
            this.popover.mount(document.body);
        } else {
            this.popover.setAnchor(options.anchor);
            this.popover.setContent(content);
            if (options.placement) this.popover.setPlacement(options.placement);
            if (options.gap !== undefined) this.popover.setGap(options.gap);
        }

        options.anchor.setAttribute("aria-describedby", this.id);
        if (!this.popover.isOpen()) this.popover.show();
    }

    private static normalizeContent(content: TooltipContent): ComponentChild {
        if (typeof content === "string" || content instanceof Component || content instanceof HTMLElement) return content;
        const element = document.createElement("div");
        setElementProps(element, content);
        return element;
    }

    private static clearTimers(): void {
        if (this.showTimer !== undefined) window.clearTimeout(this.showTimer);
        if (this.hideTimer !== undefined) window.clearTimeout(this.hideTimer);
        this.showTimer = undefined;
        this.hideTimer = undefined;
    }
}

export default Tooltip;
