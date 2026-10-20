import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollbarView } from "../../src/components/scrollbar/ScrollbarView";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// jsdom cannot compute pseudo-element styles; test the actual expansion selectors instead.
const scrollbarCss = readFileSync(resolve("src/style.css"), "utf8");
const expansionSelectors = scrollbarCss.match(/([^{}]+)\{\s*border-radius: 4px;\s*transform: none;/)![1]
    .trim().split(",").map(selector => selector.trim().replace(/::before$/, ""));
function expanded(view: ScrollbarView, axis: "x" | "y" = "y") {
    const thumb = axis === "x" ? view.horizontalThumb : view.verticalThumb;
    return expansionSelectors.some(selector => thumb.matches(selector));
}

const views: ScrollbarView[] = [];
function create(hoverTarget?: HTMLElement) {
    const host = document.createElement("div"); document.body.append(host);
    host.getBoundingClientRect = () => ({ left: 100, top: 100, right: 500, bottom: 400, width: 400, height: 300 }) as DOMRect;
    const view = new ScrollbarView(host, "thin", vi.fn(), { hoverTarget }); views.push(view);
    return { host, view };
}
function move(target: HTMLElement, x: number, y: number, pointerType = "mouse") {
    const event = new MouseEvent("pointermove", { clientX: x, clientY: y, bubbles: true });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    target.dispatchEvent(event); vi.advanceTimersByTime(20);
}
function near(view: ScrollbarView) {
    return [view.horizontal.classList.contains("elg-scrollbar-near"), view.vertical.classList.contains("elg-scrollbar-near")];
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    views.splice(0).forEach(view => view.dispose()); vi.runOnlyPendingTimers();
    vi.useRealTimers(); document.body.replaceChildren(); vi.restoreAllMocks();
});

describe("ScrollbarView mouse proximity", () => {
    it("does not expand the vertical scrollbar while hovering the excluded header area", () => {
        const { host, view } = create(); view.vertical.style.top = "80px";
        move(host, 480, 150); expect(near(view)).toEqual([false, false]);
        move(host, 480, 180); expect(near(view)).toEqual([false, true]);
        view.vertical.style.top = "0px";
        view.refreshHover(); vi.advanceTimersByTime(20);
        expect(near(view)).toEqual([false, true]);
    });
    it("keeps thin thumbs narrow during scroll and touch activity but expands during drag", () => {
        const { host, view } = create(); host.classList.add("elg-scroll-container");
        host.setPointerCapture = vi.fn(); host.releasePointerCapture = vi.fn();
        view.flash(); view.active = true;
        expect(expanded(view)).toBe(false);
        move(host, 480, 250); expect(expanded(view)).toBe(true);
        move(host, 300, 250); expect(expanded(view)).toBe(false);
        view.verticalThumb.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
        expect(view.vertical.classList.contains("elg-scrollbar-dragging")).toBe(true);
        expect(expanded(view)).toBe(true);
        window.dispatchEvent(new MouseEvent("pointerup"));
        expect(expanded(view)).toBe(false);
        expect(host.classList.contains("elg-scrolling")).toBe(true);
        view.active = false; vi.advanceTimersByTime(600);
        expect(host.classList.contains("elg-scrolling")).toBe(false);
    });
    it.each(["x", "y"] as const)("expands only the dragged %s axis while preserving independent hover", axis => {
        const { host, view } = create(); host.classList.add("elg-scroll-container");
        host.setPointerCapture = vi.fn(); host.releasePointerCapture = vi.fn();
        const other = axis === "x" ? "y" : "x";
        const thumb = axis === "x" ? view.horizontalThumb : view.verticalThumb;
        thumb.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
        view.flash();
        expect(expanded(view, axis)).toBe(true);
        expect(expanded(view, other)).toBe(false);
        move(host, other === "x" ? 300 : 480, other === "x" ? 380 : 250);
        expect(expanded(view, other)).toBe(true);
        move(host, 300, 250);
        expect(expanded(view, axis)).toBe(true);
        expect(expanded(view, other)).toBe(false);
        window.dispatchEvent(new MouseEvent("pointercancel"));
        expect(expanded(view, axis)).toBe(false);
        thumb.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
        view.dispose();
        expect(view.horizontal.classList.contains("elg-scrollbar-dragging")).toBe(false);
        expect(view.vertical.classList.contains("elg-scrollbar-dragging")).toBe(false);
    });
    it("still reveals auto scrollbars on scroll and clears activity after the idle delay", () => {
        const { host, view } = create(); view.mode = "auto";
        view.flash(); expect(host.classList.contains("elg-scrolling")).toBe(true);
        vi.advanceTimersByTime(599); expect(host.classList.contains("elg-scrolling")).toBe(true);
        vi.advanceTimersByTime(1); expect(host.classList.contains("elg-scrolling")).toBe(false);
        view.active = true; expect(host.classList.contains("elg-scrolling")).toBe(true);
        view.active = false; expect(host.classList.contains("elg-scrolling")).toBe(false);
    });
    it("expands axes independently within 50px, including both at the corner", () => {
        const { host, view } = create(); expect(view.hoverDistance).toBe(50);
        move(host, 300, 250); expect(near(view)).toEqual([false, false]);
        move(host, 450, 250); expect(near(view)).toEqual([false, true]);
        move(host, 449, 250); expect(near(view)).toEqual([false, false]);
        move(host, 300, 350); expect(near(view)).toEqual([true, false]);
        move(host, 480, 380); expect(near(view)).toEqual([true, true]);
        move(host, 501, 380); expect(near(view)).toEqual([false, false]);
    });
    it("rechecks a stationary pointer when distance or viewport geometry changes", () => {
        const { host, view } = create(); move(host, 460, 250);
        view.hoverDistance = 25; vi.advanceTimersByTime(20); expect(near(view)).toEqual([false, false]);
        view.hoverDistance = 50; vi.advanceTimersByTime(20); expect(near(view)).toEqual([false, true]);
        host.getBoundingClientRect = () => ({ left: 200, top: 100, right: 600, bottom: 400, width: 400, height: 300 }) as DOMRect;
        view.refreshHover(); vi.advanceTimersByTime(20); expect(near(view)).toEqual([false, false]);
    });
    it("clears proximity on leave and ignores touch hover", () => {
        const { host, view } = create(); move(host, 480, 380);
        host.dispatchEvent(new MouseEvent("pointerleave")); vi.advanceTimersByTime(20);
        expect(near(view)).toEqual([false, false]);
        move(host, 480, 380, "touch"); expect(near(view)).toEqual([false, false]);
    });
    it("uses the source element for native overlay hover, including moves onto the overlay itself", () => {
        const source = document.createElement("div"); document.body.append(source);
        const { host, view } = create(source);
        move(source, 480, 250); expect(near(view)).toEqual([false, true]);
        source.dispatchEvent(new MouseEvent("pointerleave", { relatedTarget: host })); vi.advanceTimersByTime(20);
        expect(near(view)).toEqual([false, true]);
        move(host, 300, 380); expect(near(view)).toEqual([true, false]);
    });
    it("does not expand axes without overflow and preserves scroll activity separately from hover", () => {
        const { host, view } = create(); view.vertical.style.display = "none";
        move(host, 480, 380); expect(near(view)).toEqual([true, false]);
        view.flash(); move(host, 300, 250);
        expect(near(view)).toEqual([false, false]); expect(host.classList.contains("elg-scrolling")).toBe(true);
        vi.advanceTimersByTime(600); expect(host.classList.contains("elg-scrolling")).toBe(false);
    });
    it("coalesces movement and ignores queued work after disposal", () => {
        const { host, view } = create(); const rect = vi.spyOn(host, "getBoundingClientRect");
        host.dispatchEvent(new MouseEvent("pointermove", { clientX: 480, clientY: 380 }));
        host.dispatchEvent(new MouseEvent("pointermove", { clientX: 300, clientY: 250 }));
        vi.advanceTimersByTime(20); expect(rect).toHaveBeenCalledTimes(1); expect(near(view)).toEqual([false, false]);
        host.dispatchEvent(new MouseEvent("pointermove", { clientX: 480, clientY: 380 }));
        view.dispose(); vi.advanceTimersByTime(20); expect(rect).toHaveBeenCalledTimes(1);
    });
    it.each([-1, NaN, Infinity])("rejects invalid hover distance %s", distance => {
        const { view } = create();
        expect(() => { view.hoverDistance = distance; }).toThrow("scrollbarHoverDistance");
        expect(view.hoverDistance).toBe(50);
    });
});
