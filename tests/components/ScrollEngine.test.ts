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
