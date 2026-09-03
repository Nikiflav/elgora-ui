import { trackGesture, GestureAxis } from "./DragGesture";
import type { Disposable } from "../ElgoraUI";
import { createDragGhost, DragGhost } from "./DragGhost";
import { ScrollByFn, createEdgeAutoScroll, EdgeAutoScroll } from "./EdgeAutoScroll";

export interface DragPayload {
    kind: string;
    id: string;
    label: string;
    /** CSS class(es) applied to the floating ghost, e.g. to match the dragged item's own styling. */
    ghostClassName?: string;
    sourceZoneId: string;
    sourceIndex: number;
}

export interface DropTarget {
    zoneId: string;
    index: number;
}

export interface DropSlot {
    index: number;
    rect: DOMRect;
}

export interface DropZone {
    id: string;
    kind: string;
    axis: "x" | "y";
    element: HTMLElement;
    autoScroll?: ScrollByFn;
    /** Called live, not cached - may be asked again mid-drag (e.g. after an autoscroll tick). */
    getSlots(): DropSlot[];
    /** Draws (or clears, on null) this zone's own insertion indicator. */
    onDragOver(payload: DragPayload, slot: DropSlot | null): void;
}

/** Nearest slot whose midpoint the pointer hasn't reached yet; past the last one, appends after it. Falls back to the zone's own rect when it has no items (e.g. an empty group panel). */
function nearestSlot(zone: DropZone, x: number, y: number): DropSlot {
    const slots = zone.getSlots();
    if (!slots.length)
        return { index: 0, rect: zone.element.getBoundingClientRect() };

    const pos = zone.axis === "x" ? x : y;
    for (const slot of slots) {
        const mid = zone.axis === "x"
            ? (slot.rect.left + slot.rect.right) / 2
            : (slot.rect.top + slot.rect.bottom) / 2;
        if (pos < mid) return slot;
    }
    // Past every midpoint - append after the last slot, at its trailing edge, not its own rect
    // (which would draw the indicator back over the last slot's leading edge instead).
    const last = slots[slots.length - 1];
    const rect = zone.axis === "x"
        ? new DOMRect(last.rect.right, last.rect.top, 0, last.rect.height)
        : new DOMRect(last.rect.left, last.rect.bottom, last.rect.width, 0);
    return { index: last.index + 1, rect };
}

function containsPoint(rect: DOMRect, x: number, y: number): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export interface DragDropControllerOptions {
    onDrop(payload: DragPayload, target: DropTarget): void;
}

/**
 * Mediates one family of drag interactions across any number of registered zones: normalizes
 * input via trackGesture, hit-tests zones/slots, and owns the one shared ghost plus each hovered
 * zone's autoscroll. Own one instance per independent drag surface (e.g. one per grid) - zones
 * only ever match against others registered on the same controller.
 */
export class DragDropController implements Disposable {

    private zones = new Map<string, DropZone>();
    private activeCancel?: () => void;
    private disposed = false;

    constructor(private options: DragDropControllerOptions) { }

    registerZone(zone: DropZone): () => void {
        if (this.disposed) return () => { };
        this.zones.set(zone.id, zone);
        return () => this.zones.delete(zone.id);
    }

    /** `onDragEnd` runs once the gesture is over regardless of outcome (dropped or cancelled) - the reliable place for a caller to clear its own "this item is being dragged" styling. */
    beginDrag(payload: DragPayload, startEvent: MouseEvent | TouchEvent, anchorRect: DOMRect, axis: GestureAxis = "free", onDragEnd?: () => void, onDragMove?: () => void): void {

        if (this.disposed) return;
        this.activeCancel?.();

        const zonesOfKind = [...this.zones.values()].filter(z => z.kind === payload.kind);

        let ghost: DragGhost | undefined;
        let autoScroll: EdgeAutoScroll | undefined;
        let hovered: { zone: DropZone, slot: DropSlot } | undefined;
        let lastX = 0, lastY = 0;

        const leave = () => {
            hovered?.zone.onDragOver(payload, null);
            autoScroll?.stop();
            autoScroll = undefined;
            hovered = undefined;
        };

        // Shared by pointer movement and by each autoscroll tick - content shifts under an
        // otherwise-stationary pointer during autoscroll, so the hovered slot/indicator would
        // otherwise go stale until the next real pointer move.
        const reposition = (x: number, y: number) => {

            const zone = zonesOfKind.find(z => containsPoint(z.element.getBoundingClientRect(), x, y));

            if (zone !== hovered?.zone) {
                leave();
                if (zone?.autoScroll)
                    autoScroll = createEdgeAutoScroll(zone.autoScroll, undefined, undefined, () => reposition(lastX, lastY));
            }

            if (zone) {
                const slot = nearestSlot(zone, x, y);
                zone.onDragOver(payload, slot);
                hovered = { zone, slot };

                const r = zone.element.getBoundingClientRect();
                autoScroll?.update(
                    zone.axis === "x" ? x : y,
                    zone.axis === "x" ? r.left : r.top,
                    zone.axis === "x" ? r.right : r.bottom
                );
            }
        };

        let cancelGesture: (() => void) | undefined;
        const clearActive = () => {
            if (this.activeCancel === cancelGesture)
                this.activeCancel = undefined;
        };

        cancelGesture = trackGesture(startEvent, {
            axis,
            threshold: 6,

            onMove: (dx, dy, x, y) => {

                onDragMove?.();

                if (!ghost) ghost = createDragGhost(payload.label, anchorRect, payload.ghostClassName);
                ghost.moveTo(dx, dy);

                lastX = x; lastY = y;
                reposition(x, y);
            },

            onEnd: () => {
                ghost?.remove();
                if (hovered)
                    this.options.onDrop(payload, { zoneId: hovered.zone.id, index: hovered.slot.index });
                leave();
                onDragEnd?.();
                clearActive();
            },

            onCancel: () => {
                ghost?.remove();
                leave();
                onDragEnd?.();
                clearActive();
            }
        });
        this.activeCancel = cancelGesture;
    }

    /** Cancels active drag state and releases all registered drop zones. */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.activeCancel?.();
        this.activeCancel = undefined;
        this.zones.clear();
    }
}
