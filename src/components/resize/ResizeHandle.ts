import { Component } from "../../core/Component";
import "./ResizeHandle.css";

/** Border-box dimensions reported by a resize handle. */
export interface ResizeSize { width: number; height: number; }
/** Reusable bottom-right resize behavior for a panel, popover or other element. */
export interface ResizeHandleOptions {
    target: HTMLElement;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    /** Viewport inset; available space takes precedence over minimum dimensions. */
    viewportGap?: number;
    onResize?: (size: ResizeSize) => void;
}

/**
 * Pointer-captured bottom-right resize grip. The target must be positioned
 * (relative, absolute or fixed). dispose() removes the grip and gesture listeners.
 * @example const grip = new ResizeHandle({ target: popup.dom, minWidth: 240 });
 */
export class ResizeHandle extends Component {
    private gesture?: { id: number; x: number; y: number; width: number; height: number; left: number; top: number };
    private readonly target: HTMLElement;
    private readonly resizeOptions: ResizeHandleOptions;
    private cursorLayer?: HTMLElement;

    /** Attaches a grip to the target; dimensions use its border box. */
    constructor(options: ResizeHandleOptions) {
        super({ tag: "div", class: "elg-resize-handle", title: "Resize", ariaHidden: "true" });
        this.target = options.target;
        this.resizeOptions = options;
        this.target.style.boxSizing = "border-box";
        this.listen(this.dom, "pointerdown", event => this.begin(event as PointerEvent));
        this.listen(this.dom, "pointermove", event => this.move(event as PointerEvent));
        this.listen(this.dom, "pointerup", () => this.finish());
        this.listen(this.dom, "pointercancel", () => this.finish());
        this.listen(this.dom, "lostpointercapture", () => this.finish());
        this.addCleanup(() => this.finish());
        this.mount(this.target);
    }

    /** Starts a primary-pointer gesture and locks the cursor with a viewport layer. */
    private begin(event: PointerEvent): void {
        if (event.button !== 0 || this.gesture) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = this.target.getBoundingClientRect();
        this.gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
            width: rect.width, height: rect.height, left: rect.left, top: rect.top };
        this.dom.setPointerCapture(event.pointerId);
        const layer = this.target.ownerDocument.createElement("div");
        layer.className = "elg-resize-cursor";
        // A child stays in the target's top layer when resizing a native popover.
        this.target.appendChild(layer);
        this.cursorLayer = layer;
    }

    /** Applies viewport-constrained dimensions during a captured gesture. */
    private move(event: PointerEvent): void {
        const start = this.gesture;
        if (!start || start.id !== event.pointerId) return;
        event.preventDefault();
        const options = this.resizeOptions;
        const viewport = this.target.ownerDocument.documentElement;
        const gap = options.viewportGap ?? 4;
        const maxWidth = Math.max(0, Math.min(options.maxWidth ?? Infinity, viewport.clientWidth - start.left - gap));
        const maxHeight = Math.max(0, Math.min(options.maxHeight ?? Infinity, viewport.clientHeight - start.top - gap));
        const width = Math.min(maxWidth, Math.max(options.minWidth ?? 160, start.width + event.clientX - start.x));
        const height = Math.min(maxHeight, Math.max(options.minHeight ?? 100, start.height + event.clientY - start.y));
        this.target.style.width = `${width}px`;
        this.target.style.height = `${height}px`;
        options.onResize?.({ width, height });
    }

    /** Releases capture and removes the temporary cursor layer on end or disposal. */
    private finish(): void {
        const gesture = this.gesture;
        this.gesture = undefined;
        this.cursorLayer?.remove();
        this.cursorLayer = undefined;
        if (gesture && this.dom.hasPointerCapture(gesture.id)) this.dom.releasePointerCapture(gesture.id);
    }
}
