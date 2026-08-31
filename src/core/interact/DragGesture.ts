export type GestureAxis = "x" | "y" | "free";

export interface GestureHandlers {
    /** Touch only: direction that must dominate before the gesture activates, so orthogonal scrolling isn't hijacked. Defaults to "free" (no lock). */
    axis?: GestureAxis;
    /** Movement in px required before the gesture activates and onMove starts firing. 0 = activate immediately. */
    threshold?: number;
    onMove(dx: number, dy: number, x: number, y: number): void;
    onEnd(x: number, y: number): void;
    onCancel?(): void;
}

/**
 * Tracks a single drag gesture from an already-fired mousedown/touchstart event, normalizing
 * mouse and touch into one move/end/cancel stream. Deliberately avoids Pointer Events so mouse
 * and touch stay two separate, debuggable listener sets sharing this one state machine.
 */
export function trackGesture(startEvent: MouseEvent | TouchEvent, handlers: GestureHandlers): () => void {

    if (startEvent instanceof MouseEvent && startEvent.button !== 0)
        return () => { };

    let startX: number, startY: number, touchId: number | undefined;

    if ("touches" in startEvent) {
        const t = startEvent.changedTouches[0];
        startX = t.clientX; startY = t.clientY; touchId = t.identifier;
    } else {
        startX = startEvent.clientX; startY = startEvent.clientY;
    }

    const isTouch = touchId !== undefined;
    const threshold = handlers.threshold ?? 0;
    let active = threshold <= 0;
    let locked = false;
    let finished = false;
    const previousUserSelect = document.body.style.userSelect;

    const pickTouch = (e: TouchEvent) => Array.from(e.changedTouches).find(t => t.identifier === touchId);

    const move = (x: number, y: number) => {
        const dx = x - startX, dy = y - startY;

        if (!active) {
            if (Math.abs(dx) < threshold && Math.abs(dy) < threshold)
                return;

            if (isTouch && !locked) {
                locked = true;
                const axis = handlers.axis ?? "free";
                // Movement is orthogonal to the requested axis - this is a page scroll, not a drag. Let go.
                if ((axis === "x" && Math.abs(dy) > Math.abs(dx)) ||
                    (axis === "y" && Math.abs(dx) > Math.abs(dy))) {
                    finish();
                    return;
                }
            }

            active = true;
            document.body.style.userSelect = "none";
        }

        handlers.onMove(dx, dy, x, y);
    };

    const finish = (end?: { x: number, y: number }) => {
        if (finished) return;
        finished = true;
        detach();
        document.body.style.userSelect = previousUserSelect;
        if (end && active) handlers.onEnd(end.x, end.y);
        else handlers.onCancel?.();
    };

    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => finish({ x: e.clientX, y: e.clientY });

    const onTouchMove = (e: TouchEvent) => {
        const t = pickTouch(e);
        if (!t) return;
        if (active) e.preventDefault();
        move(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
        const t = pickTouch(e);
        if (t) finish({ x: t.clientX, y: t.clientY });
    };
    const onTouchCancel = (e: TouchEvent) => pickTouch(e) && finish();
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && finish();
    const onBlur = () => finish();

    const detach = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchCancel);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("blur", onBlur);
    };

    if (isTouch) {
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchCancel);
    } else {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);

    return () => finish();
}
