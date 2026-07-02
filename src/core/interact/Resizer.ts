import { trackGesture } from "./DragGesture";

export interface ResizeOptions {
    axis: "x" | "y";
    getSize(): number;
    setSize(size: number): void;
    min?: number;
    max?: number;
    onEnd?(size: number): void;
}

/**
 * Wires a resize handle to stretch one dimension of an element via mouse/touch, sharing the same
 * gesture normalization as drag-reorder. Unlike reorder, resize has no zones/slots/ghost - it's a
 * plain 1D stretch, so it talks to trackGesture directly. Returns a teardown function.
 */
export function createResizer(handle: HTMLElement, opts: ResizeOptions): () => void {

    const clamp = (v: number) => Math.min(opts.max ?? Infinity, Math.max(opts.min ?? -Infinity, v));

    const onDown = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startSize = opts.getSize();

        trackGesture(e, {
            axis: opts.axis,
            onMove: (dx, dy) => opts.setSize(clamp(startSize + (opts.axis === "x" ? dx : dy))),
            onEnd: () => opts.onEnd?.(opts.getSize()),
            onCancel: () => opts.setSize(startSize)
        });
    };

    handle.addEventListener("mousedown", onDown);
    handle.addEventListener("touchstart", onDown, { passive: false });

    return () => {
        handle.removeEventListener("mousedown", onDown);
        handle.removeEventListener("touchstart", onDown);
    };
}
