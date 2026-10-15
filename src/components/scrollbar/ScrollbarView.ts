import { ElgoraUI, type Disposable } from "../../core/ElgoraUI";
import type { ScrollbarMode } from "./ScrollbarMode";

type Axis = "x" | "y";

/** Shared scrollbar painting and pointer interaction; the owner supplies scroll coordinates. */
export class ScrollbarView implements Disposable {
    readonly horizontal: HTMLDivElement;
    readonly vertical: HTMLDivElement;
    readonly horizontalThumb: HTMLDivElement;
    readonly verticalThumb: HTMLDivElement;
    private axis?: Axis;
    private pointerId?: number;
    private offset = 0;
    private idleTimer?: ReturnType<typeof setTimeout>;
    private touching = false;
    private disposed = false;
    private readonly win: Window;
    private readonly hoverTarget: HTMLElement;
    private distance = 50;
    private hoverPoint?: { x: number; y: number };

    constructor(private readonly host: HTMLElement, mode: ScrollbarMode,
        private readonly scroll: (axis: Axis, ratio: number) => void,
        options: { hoverTarget?: HTMLElement; hoverDistance?: number } = {}) {
        this.distance = ScrollbarView.validateHoverDistance(options.hoverDistance ?? 50);
        this.hoverTarget = options.hoverTarget ?? host;
        this.win = host.ownerDocument.defaultView!;
        const create = (className: string) => {
            const element = host.ownerDocument.createElement("div"); element.className = className; return element;
        };
        this.horizontalThumb = create("elg-scrollbar-thumb");
        this.verticalThumb = create("elg-scrollbar-thumb");
        this.horizontal = create("elg-scrollbar elg-scrollbar-x");
        this.vertical = create("elg-scrollbar elg-scrollbar-y");
        this.horizontal.append(this.horizontalThumb); this.vertical.append(this.verticalThumb);
        host.append(this.horizontal, this.vertical);
        this.mode = mode;
        this.horizontal.addEventListener("pointerdown", this.horizontalDown);
        this.vertical.addEventListener("pointerdown", this.verticalDown);
        this.hoverTarget.addEventListener("pointermove", this.hoverMove);
        this.hoverTarget.addEventListener("pointerleave", this.hoverLeave);
        if (this.hoverTarget !== host) {
            host.addEventListener("pointermove", this.hoverMove);
            host.addEventListener("pointerleave", this.hoverLeave);
        }
    }

    set mode(value: ScrollbarMode) { this.host.setAttribute("data-scrollbar-mode", value); }
    set active(value: boolean) { this.touching = value; this.syncActivity(); }

    /** Rejects invalid proximity settings before a scroll adapter acquires resources. */
    static validateHoverDistance(value: number): number {
        if (!Number.isFinite(value) || value < 0)
            throw new Error("Failed to configure scrollbars. scrollbarHoverDistance must be a finite non-negative number.");
        return value;
    }

    get hoverDistance(): number { return this.distance; }
    set hoverDistance(value: number) { this.distance = ScrollbarView.validateHoverDistance(value); this.refreshHover(); }

    /** Rechecks proximity after layout changes, coalescing pointer movement into one frame task. */
    refreshHover(): void {
        if (!this.disposed && (this.hoverPoint || this.horizontal.classList.contains("elg-scrollbar-near") || this.vertical.classList.contains("elg-scrollbar-near")))
            ElgoraUI.scheduler.schedule(this.renderHover);
    }

    private hoverMove = (event: PointerEvent): void => {
        this.hoverPoint = event.pointerType === "touch" ? undefined : { x: event.clientX, y: event.clientY };
        this.refreshHover();
    };
    private hoverLeave = (event: PointerEvent): void => {
        const next = event.relatedTarget as Node | null;
        if (next && (this.host.contains(next) || this.hoverTarget.contains(next))) return;
        this.hoverPoint = undefined; this.refreshHover();
    };
    private readonly renderHover = (): void => {
        if (this.disposed) return;
        const point = this.hoverPoint;
        const bounds = this.host.getBoundingClientRect();
        const inside = point && point.x >= bounds.left && point.x <= bounds.right
            && point.y >= bounds.top && point.y <= bounds.bottom;
        this.horizontal.classList.toggle("elg-scrollbar-near", !!inside && this.horizontal.style.display !== "none"
            && bounds.bottom - point.y <= this.distance);
        this.vertical.classList.toggle("elg-scrollbar-near", !!inside && this.vertical.style.display !== "none"
            && bounds.right - point.x <= this.distance);
    };

    /** Keeps auto-hidden scrollbars visible until scrolling has been idle for 600ms; thin thumbs stay thin. */
    flash(): void {
        if (this.disposed) return;
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => { this.idleTimer = undefined; this.syncActivity(); }, 600);
        this.syncActivity();
    }

    private syncActivity(): void {
        this.host.classList.toggle("elg-scrolling", this.axis !== undefined || this.touching || this.idleTimer !== undefined);
        this.horizontal.classList.toggle("elg-scrollbar-dragging", this.axis === "x");
        this.vertical.classList.toggle("elg-scrollbar-dragging", this.axis === "y");
    }

    private horizontalDown = (event: PointerEvent) => this.pointerDown(event, "x");
    private verticalDown = (event: PointerEvent) => this.pointerDown(event, "y");

    private pointerDown(event: PointerEvent, axis: Axis): void {
        if (event.button !== 0) return;
        event.preventDefault(); event.stopPropagation();
        const thumb = axis === "x" ? this.horizontalThumb : this.verticalThumb;
        if (event.target !== thumb) {
            const track = (axis === "x" ? this.horizontal : this.vertical).getBoundingClientRect();
            const size = axis === "x" ? thumb.clientWidth : thumb.clientHeight;
            const length = (axis === "x" ? track.width : track.height) - size;
            const position = axis === "x" ? event.clientX - track.left : event.clientY - track.top;
            this.scroll(axis, length > 0 ? Math.max(0, Math.min((position - size / 2) / length, 1)) : 0);
            return;
        }
        const rect = thumb.getBoundingClientRect();
        this.offset = axis === "x" ? event.clientX - rect.left : event.clientY - rect.top;
        this.axis = axis; this.pointerId = event.pointerId;
        this.host.setPointerCapture(event.pointerId);
        this.win.addEventListener("pointermove", this.pointerMove);
        this.win.addEventListener("pointerup", this.pointerEnd);
        this.win.addEventListener("pointercancel", this.pointerEnd);
        this.syncActivity();
    }

    private pointerMove = (event: PointerEvent): void => {
        if (!this.axis || event.pointerId !== this.pointerId) return;
        const horizontal = this.axis === "x";
        const track = (horizontal ? this.horizontal : this.vertical).getBoundingClientRect();
        const thumb = horizontal ? this.horizontalThumb : this.verticalThumb;
        const available = (horizontal ? track.width : track.height) - (horizontal ? thumb.clientWidth : thumb.clientHeight);
        const position = (horizontal ? event.clientX - track.left : event.clientY - track.top) - this.offset;
        this.scroll(this.axis, available > 0 ? Math.max(0, Math.min(position / available, 1)) : 0);
    };

    private pointerEnd = (event?: PointerEvent): void => {
        if (event && event.pointerId !== this.pointerId) return;
        if (this.pointerId !== undefined) {
            try { this.host.releasePointerCapture(this.pointerId); } catch { /* Capture may have ended with the pointer. */ }
        }
        this.axis = undefined; this.pointerId = undefined;
        this.win.removeEventListener("pointermove", this.pointerMove);
        this.win.removeEventListener("pointerup", this.pointerEnd);
        this.win.removeEventListener("pointercancel", this.pointerEnd);
        this.syncActivity();
    };

    /** Removes pointer capture, listeners, timers, state and owned scrollbar elements. */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.pointerEnd(); clearTimeout(this.idleTimer); this.idleTimer = undefined;
        this.horizontal.removeEventListener("pointerdown", this.horizontalDown);
        this.vertical.removeEventListener("pointerdown", this.verticalDown);
        this.hoverTarget.removeEventListener("pointermove", this.hoverMove);
        this.hoverTarget.removeEventListener("pointerleave", this.hoverLeave);
        if (this.hoverTarget !== this.host) {
            this.host.removeEventListener("pointermove", this.hoverMove);
            this.host.removeEventListener("pointerleave", this.hoverLeave);
        }
        this.horizontal.remove(); this.vertical.remove();
        this.host.classList.remove("elg-scrolling", "elg-scrollbar-both");
        this.host.removeAttribute("data-scrollbar-mode");
    }
}
