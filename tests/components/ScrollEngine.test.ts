import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollEngine, type ScrollbarMode } from "../../src/components/scrollbar/scroll-engine";

const engines: ScrollEngine[] = [];
function create(mode?: ScrollbarMode) {
    const viewport = document.createElement("div");
    Object.defineProperties(viewport, { clientWidth: { value: 200 }, clientHeight: { value: 100 } });
    document.body.append(viewport);
    const engine = new ScrollEngine(viewport, { scrollbarMode: mode });
    engines.push(engine);
    return engine;
}
beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});

function wheel(engine: ScrollEngine, options: WheelEventInit): WheelEvent {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...options });
    engine.dom.dispatchEvent(event);
    return event;
}

describe("ScrollEngine wheel chaining", () => {
    it.each([
        [200, 100, 0, 0, 0, 30], // No overflow.
        [1000, 100, 0, 0, 0, 30], // Only the other axis overflows.
        [200, 800, 0, 0, 0, -30], // Top edge, moving up.
        [200, 800, 0, 700, 0, 30], // Bottom edge, moving down.
        [1000, 100, 0, 0, -30, 0], // Left edge, moving left.
        [1000, 100, 800, 0, 30, 0], // Right edge, moving right.
        [1000, 800, 0, 0, 0, 0] // Empty gesture.
    ])("leaves an unmovable gesture uncancelled (%s, %s, %s, %s, %s, %s)", (width, height, left, top, deltaX, deltaY) => {
        const engine = create(); engine.updateDimensions(width, height); engine.scrollTo(left, top);
        const parent = vi.fn();
        document.body.addEventListener("wheel", parent, { once: true });
        const event = wheel(engine, { deltaX, deltaY });
        expect(event.defaultPrevented).toBe(false);
        expect(parent).toHaveBeenCalledWith(event);
        expect([engine.scrollLeft, engine.scrollTop]).toEqual([left, top]);
    });
    it("consumes scrolling inside the viewport and allows reversal at either edge", () => {
        const engine = create(); engine.updateDimensions(200, 800);
        expect(wheel(engine, { deltaY: 30 }).defaultPrevented).toBe(true);
        expect(engine.scrollTop).toBe(30);
        engine.scrollTo(0, 700);
        expect(wheel(engine, { deltaY: -30 }).defaultPrevented).toBe(true);
        expect(engine.scrollTop).toBe(670);
    });
    it("clamps the gesture reaching an edge and releases the following gesture", () => {
        const engine = create(); engine.updateDimensions(200, 800); engine.scrollTo(0, 690);
        expect(wheel(engine, { deltaY: 50 }).defaultPrevented).toBe(true);
        expect(engine.scrollTop).toBe(700);
        expect(wheel(engine, { deltaY: 50 }).defaultPrevented).toBe(false);
    });
    it("consumes a diagonal gesture if either axis can still move", () => {
        const engine = create(); engine.updateDimensions(1000, 800); engine.scrollTo(0, 700);
        expect(wheel(engine, { deltaX: 20, deltaY: 30 }).defaultPrevented).toBe(true);
        expect([engine.scrollLeft, engine.scrollTop]).toEqual([20, 700]);
    });
    it("routes Shift+wheel horizontally, releasing it at the horizontal edge", () => {
        const engine = create(); engine.updateDimensions(1000, 800);
        expect(wheel(engine, { deltaY: 30, shiftKey: true }).defaultPrevented).toBe(true);
        expect([engine.scrollLeft, engine.scrollTop]).toEqual([30, 0]);
        engine.scrollTo(800, 0);
        expect(wheel(engine, { deltaY: 30, shiftKey: true }).defaultPrevented).toBe(false);
        expect(wheel(engine, { deltaX: -20, deltaY: 0, shiftKey: true }).defaultPrevented).toBe(true);
        expect(engine.scrollLeft).toBe(780);
    });
    it.each([[1, 32], [2, 200]])("preserves delta mode %s normalization", (deltaMode, expected) => {
        const engine = create(); engine.updateDimensions(1000, 800);
        expect(wheel(engine, { deltaY: 2, deltaMode }).defaultPrevented).toBe(true);
        expect(engine.scrollTop).toBe(expected);
    });
    it("lets a parent engine handle only gestures not consumed by the child", () => {
        const parent = create(); parent.updateDimensions(200, 800);
        const child = create(); child.updateDimensions(200, 800); parent.dom.append(child.dom);
        expect(wheel(child, { deltaY: 30 }).defaultPrevented).toBe(true);
        expect([child.scrollTop, parent.scrollTop]).toEqual([30, 0]);
        child.scrollTo(0, 700);
        expect(wheel(child, { deltaY: 30 }).defaultPrevented).toBe(true);
        expect([child.scrollTop, parent.scrollTop]).toEqual([700, 30]);
    });
    it("does not scroll when a descendant has already prevented the event", () => {
        const engine = create(); engine.updateDimensions(200, 800);
        const child = document.createElement("div"); engine.dom.append(child);
        child.addEventListener("wheel", event => event.preventDefault());
        child.dispatchEvent(new WheelEvent("wheel", { deltaY: 30, bubbles: true, cancelable: true }));
        expect(engine.scrollTop).toBe(0);
    });
});
afterEach(() => {
    engines.splice(0).forEach(engine => engine.dispose());
    document.body.replaceChildren(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("ScrollEngine scrollbar behavior", () => {
    it("defaults to thin and can change presentation without moving or notifying scroll", () => {
        const engine = create(); engine.updateDimensions(1000, 800); engine.scrollTo(50, 60);
        const onScroll = vi.fn(); engine.onScroll(onScroll);
        expect(engine.scrollbarMode).toBe("thin");
        expect(engine.dom.getAttribute("data-scrollbar-mode")).toBe("thin");
        for (const mode of ["auto", "always", "thin"] as const) {
            engine.scrollbarMode = mode;
            expect(engine.dom.getAttribute("data-scrollbar-mode")).toBe(mode);
            expect([engine.scrollLeft, engine.scrollTop]).toEqual([50, 60]);
        }
        expect(onScroll).not.toHaveBeenCalled();
    });
    it.each(["thin", "auto", "always"] as const)("%s shows only axes with overflow", mode => {
        const engine = create(mode);
        const horizontal = engine.dom.querySelector<HTMLElement>(".elg-scrollbar-x")!;
        const vertical = engine.dom.querySelector<HTMLElement>(".elg-scrollbar-y")!;
        engine.updateDimensions(200, 100);
        expect([horizontal.style.display, vertical.style.display]).toEqual(["none", "none"]);
        engine.updateDimensions(200, 800);
        expect([horizontal.style.display, vertical.style.display]).toEqual(["none", "block"]);
        engine.updateDimensions(1000, 100);
        expect([horizontal.style.display, vertical.style.display]).toEqual(["block", "none"]);
        engine.updateDimensions(1000, 800);
        expect(engine.dom.classList.contains("elg-scrollbar-both")).toBe(true);
    });
    it("expands during wheel and keyboard scrolling, then returns to idle", () => {
        const engine = create(); engine.updateDimensions(1000, 800);
        engine.dom.dispatchEvent(new WheelEvent("wheel", { deltaY: 30, cancelable: true }));
        expect(engine.scrollTop).toBe(30);
        expect(engine.dom.classList.contains("elg-scrolling")).toBe(true);
        vi.advanceTimersByTime(500);
        engine.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true }));
        expect(engine.scrollTop).toBe(70);
        vi.advanceTimersByTime(500);
        expect(engine.dom.classList.contains("elg-scrolling")).toBe(true);
        vi.advanceTimersByTime(100);
        expect(engine.dom.classList.contains("elg-scrolling")).toBe(false);
    });
    it("keeps expanded while dragging beyond the scroll idle timeout and handles pointer cancellation", () => {
        const engine = create(); engine.updateDimensions(1000, 800);
        engine.dom.setPointerCapture = vi.fn(); engine.dom.releasePointerCapture = vi.fn();
        const thumb = engine.dom.querySelector(".elg-scrollbar-y .elg-scrollbar-thumb")!;
        thumb.dispatchEvent(new MouseEvent("pointerdown", { button: 0, bubbles: true, cancelable: true }));
        engine.scrollTo(0, 50); vi.advanceTimersByTime(700);
        expect(engine.dom.classList.contains("elg-scrolling")).toBe(true);
        window.dispatchEvent(new MouseEvent("pointercancel"));
        expect(engine.dom.classList.contains("elg-scrolling")).toBe(false);
    });
    it("removes idle work, state and scrollbar elements on dispose", () => {
        const engine = create(); engine.updateDimensions(1000, 800); engine.scrollTo(20, 30);
        engine.dispose();
        expect(vi.getTimerCount()).toBe(0);
        expect(engine.dom.querySelector(".elg-scrollbar")).toBeNull();
        expect(engine.dom.hasAttribute("data-scrollbar-mode")).toBe(false);
        expect(engine.dom.classList.contains("elg-scrolling")).toBe(false);
        engine.scrollbarMode = "always";
        expect(engine.dom.hasAttribute("data-scrollbar-mode")).toBe(false);
    });
});
