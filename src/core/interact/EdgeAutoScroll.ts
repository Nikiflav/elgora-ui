/** Nudges a scroll position by `delta` along whichever axis the caller owns. */
export type ScrollByFn = (delta: number) => void;

export interface EdgeAutoScroll {
    update(pointerPos: number, viewportStart: number, viewportEnd: number): void;
    stop(): void;
}

/**
 * Calls `scrollBy` on a timer while the pointer sits within `edge` px of either end of its
 * viewport. Silently keeps ticking at the scroll limit - the caller's `scrollBy` is expected to
 * clamp. `onTick` fires after every step, since content moves under an otherwise-stationary
 * pointer - callers with a hover/drop indicator tied to on-screen position need to re-derive it.
 */
export function createEdgeAutoScroll(scrollBy: ScrollByFn, edge = 40, step = 12, onTick?: () => void): EdgeAutoScroll {

    let timer = 0;
    let direction = 0;

    const tick = () => {
        scrollBy(direction);
        onTick?.();
        timer = window.setTimeout(tick, 60);
    };

    return {
        update(pointerPos, viewportStart, viewportEnd) {
            const next =
                pointerPos - viewportStart < edge ? -step :
                    viewportEnd - pointerPos < edge ? step : 0;

            if (next === direction) return;
            direction = next;
            clearTimeout(timer);
            if (direction) tick();
        },
        stop() {
            direction = 0;
            clearTimeout(timer);
        }
    };
}
