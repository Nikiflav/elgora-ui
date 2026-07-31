import { e } from "../e";
import { DragPayload, DropSlot, DropZone } from "./DragDropController";
import { ScrollByFn } from "./EdgeAutoScroll";

export interface ListDropZoneOptions {
    id: string;
    kind: string;
    /** Hit-test region and indicator span - can be taller/wider than the items themselves (e.g. the whole scrollable table, so dragging over the body still counts as hovering the header row). */
    element: HTMLElement;
    /** Where to look for items; defaults to `element` when the hit-test region and the item container differ. */
    itemsElement?: HTMLElement;
    axis: "x" | "y";
    /** Selector (relative to `itemsElement`) matching the draggable/droppable items, in order. */
    itemSelector: string;
    scrollBy?: ScrollByFn;
}

/**
 * DropZone for a flat, single-row/column DOM list along one axis - a header row, a chip panel, a
 * future vertical reorderable list, etc. Slots are measured live from the DOM on every call
 * instead of cached, so it stays correct through autoscroll and content changes mid-drag.
 */
export function createListDropZone(opts: ListDropZoneOptions): DropZone {

    let indicator: HTMLElement | undefined;

    const showIndicator = (slot: DropSlot | null) => {
        if (!slot) {
            indicator?.remove();
            indicator = undefined;
            return;
        }

        if (!indicator) {
            indicator = e("div", {
                style: {
                    position: "fixed",
                    zIndex: "9999",
                    pointerEvents: "none",
                    backgroundColor: "orangered"
                }
            });
            document.body.appendChild(indicator);
        }

        // Span the zone's full cross-axis extent, not just the matched item's own size, so the
        // indicator reads as "dropping here affects the whole zone" (e.g. the whole grid height).
        const zoneRect = opts.element.getBoundingClientRect();

        if (opts.axis === "x") {
            indicator.style.left = slot.rect.left + "px";
            indicator.style.top = zoneRect.top + "px";
            indicator.style.width = "2px";
            indicator.style.height = zoneRect.height + "px";
        } else {
            indicator.style.top = slot.rect.top + "px";
            indicator.style.left = zoneRect.left + "px";
            indicator.style.width = zoneRect.width + "px";
            indicator.style.height = "2px";
        }
    };

    return {
        id: opts.id,
        kind: opts.kind,
        axis: opts.axis,
        element: opts.element,
        autoScroll: opts.scrollBy,

        getSlots(): DropSlot[] {
            return Array.from((opts.itemsElement ?? opts.element).querySelectorAll<HTMLElement>(opts.itemSelector))
                .map((el, index) => ({ index, rect: el.getBoundingClientRect() }));
        },

        onDragOver(payload, slot) {
            // Inserting immediately before or after an item in its source list leaves its
            // position unchanged after the source item is removed, so no insertion marker is
            // needed even though the target remains valid for a drop.
            const isNoOpInsertion = slot
                && payload.sourceZoneId === opts.id
                && (slot.index === payload.sourceIndex || slot.index === payload.sourceIndex + 1);
            showIndicator(isNoOpInsertion ? null : slot);
        }
    };
}
