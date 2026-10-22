import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "../../src/components/scroll-reveal/ScrollReveal";
import { ElgoraUI } from "../../src/core/ElgoraUI";
import { cdiv } from "../../src/core/c";

const controllers: ScrollReveal[] = [];
let callback: IntersectionObserverCallback;
let observer: { observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };
let reduced = false;
let changes: Set<() => void>;
let tasks: Set<() => void>;
beforeEach(() => {
    reduced = false; changes = new Set(); tasks = new Set();
    observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    vi.stubGlobal("IntersectionObserver", class {
        constructor(fn: IntersectionObserverCallback) { callback = fn; }
        observe = observer.observe; unobserve = observer.unobserve; disconnect = observer.disconnect;
    });
    vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; },
        addEventListener: (_: string, listener: () => void) => changes.add(listener),
        removeEventListener: (_: string, listener: () => void) => changes.delete(listener) }));
    vi.spyOn(ElgoraUI.scheduler, "schedule").mockImplementation(task => { tasks.add(task); });
});
afterEach(() => {
    controllers.splice(0).forEach(controller => controller.dispose());
    document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
function fixture(options: ConstructorParameters<typeof ScrollReveal>[1] = {}) {
    const host = document.createElement("div");
    host.innerHTML = '<article data-elg-reveal="fade-up"><button>Action</button></article><article data-elg-reveal="fade">Second</article>';
    document.body.append(host);
    const controller = new ScrollReveal(host, options); controllers.push(controller);
    return { host, controller, first: host.children[0] as HTMLElement, second: host.children[1] as HTMLElement };
}
function intersection(element: Element, visible: boolean, ratio = visible ? 1 : 0) {
    callback([{ target: element, isIntersecting: visible, intersectionRatio: ratio } as IntersectionObserverEntry], observer as any);
}
function flush() { const pending = [...tasks]; tasks.clear(); pending.forEach(task => task()); }

describe("ScrollReveal", () => {
    it("batches visibility changes and reveals once by default", () => {
        const { first } = fixture();
        expect(first.classList.contains("elg-reveal-pending")).toBe(true);
        intersection(first, true, .05); flush();
        expect(first.classList.contains("elg-reveal-visible")).toBe(false);
        intersection(first, true); intersection(first, true);
        expect(tasks.size).toBe(1); expect(first.classList.contains("elg-reveal-pending")).toBe(true);
        flush(); expect(first.classList.contains("elg-reveal-visible")).toBe(true);
        expect(observer.unobserve).toHaveBeenCalledWith(first);
        intersection(first, false); flush(); expect(first.classList.contains("elg-reveal-pending")).toBe(false);
    });

    it("repeats only when configured and preserves component transforms", () => {
        const { first } = fixture({ once: false }); first.style.transform = "scale(1.02)";
        intersection(first, true); flush(); intersection(first, false); flush();
        expect(first.classList.contains("elg-reveal-pending")).toBe(true);
        intersection(first, true); flush();
        expect(first.classList.contains("elg-reveal-visible")).toBe(true);
        expect(first.style.transform).toBe("scale(1.02)");
    });

    it("keeps content visible without observer support", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        const { first, controller } = fixture(); controller.refresh();
        expect(first.className).toBe(""); expect(changes.size).toBe(0);
    });

    it("honors an initial reduced-motion preference and live preference changes", () => {
        reduced = true;
        const { first } = fixture();
        expect(first.classList.contains("elg-reveal-pending")).toBe(false);
        expect(observer.observe).not.toHaveBeenCalled();
        reduced = false; changes.forEach(listener => listener());
        expect(observer.observe).not.toHaveBeenCalled();
    });

    it("shows pending content immediately when reduced motion is enabled, including queued work", () => {
        const { first } = fixture(); intersection(first, false);
        reduced = true; changes.forEach(listener => listener()); flush();
        expect(first.classList.contains("elg-reveal-pending")).toBe(false);
        expect(first.classList.contains("elg-reveal-visible")).toBe(false);
        reduced = false; changes.forEach(listener => listener());
        expect(first.classList.contains("elg-reveal-pending")).toBe(false);
    });

    it("refreshes added/removed targets and bounds sibling staggering", () => {
        const { host, controller, first, second } = fixture({ stagger: 300 });
        expect(second.style.getPropertyValue("--elg-reveal-delay")).toBe("240ms");
        first.remove(); const next = document.createElement("div"); next.dataset.elgReveal = "fade"; host.append(next);
        controller.refresh(); expect(observer.unobserve).toHaveBeenCalledWith(first);
        expect(first.className).toBe(""); expect(next.classList.contains("elg-reveal-pending")).toBe(true);
        intersection(second, true); flush(); controller.refresh();
        expect(second.classList.contains("elg-reveal-pending")).toBe(false);
    });

    it("reveals a keyboard-focused target", () => {
        const { first } = fixture(); first.querySelector("button")!.focus(); flush();
        expect(first.classList.contains("elg-reveal-pending")).toBe(false);
        expect(first.classList.contains("elg-reveal-visible")).toBe(false); // No animation/delay on keyboard focus.
    });

    it("restores original owned state and ignores a queued flush after disposal", () => {
        const { first, controller } = fixture();
        controller.dispose(); first.className = "existing elg-reveal-up";
        first.style.setProperty("--elg-reveal-delay", "31ms", "important");
        const next = new ScrollReveal(first, { stagger: 60 }); controllers.push(next);
        intersection(first, true); next.dispose(); next.dispose(); flush();
        expect(first.className).toBe("existing elg-reveal-up");
        expect(first.style.getPropertyValue("--elg-reveal-delay")).toBe("31ms");
        expect(first.style.getPropertyPriority("--elg-reveal-delay")).toBe("important");
        expect(changes.size).toBe(0);
    });

    it("can be owned by a component and disposed with it", () => {
        const root = cdiv(); root.dom.dataset.elgReveal = "fade";
        const reveal = new ScrollReveal(root.dom); root.addCleanup(reveal);
        root.dispose(); expect(observer.disconnect).toHaveBeenCalled(); expect(changes.size).toBe(0);
    });

    it("rejects invalid configuration without hiding content", () => {
        const host = document.createElement("div"); host.dataset.elgReveal = "fade";
        expect(() => new ScrollReveal(host, { threshold: 2 })).toThrow("Failed to create scroll reveal.");
        expect(() => new ScrollReveal(host, { stagger: -1 })).toThrow("Failed to create scroll reveal.");
        expect(() => new ScrollReveal(host, { selector: "[" })).toThrow("Failed to create scroll reveal.");
        expect(host.className).toBe(""); expect(changes.size).toBe(0);
    });
});
