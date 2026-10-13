import { afterEach, describe, expect, it, vi } from "vitest";
import { ResizeHandle } from "../../src/components/resize/ResizeHandle";

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
function pointer(target: HTMLElement, type: string, x: number, y: number, id = 1, button = 0): void {
    const event = new MouseEvent(type, { clientX: x, clientY: y, button, cancelable: true, bubbles: true });
    Object.defineProperty(event, "pointerId", { value: id });
    target.dispatchEvent(event);
}
function setup(onResize = vi.fn()) {
    const target = document.createElement("div");
    document.body.append(target);
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ left: 100, top: 100, width: 300, height: 200 } as DOMRect);
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(800);
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(600);
    const grip = new ResizeHandle({ target, minWidth: 200, minHeight: 150, onResize });
    const capture = vi.fn();
    const release = vi.fn();
    grip.dom.setPointerCapture = capture;
    grip.dom.hasPointerCapture = () => true;
    grip.dom.releasePointerCapture = release;
    return { target, grip, capture, release, onResize };
}
describe("ResizeHandle", () => {
    it("captures a pointer and applies border-box dimensions", () => {
        const { target, grip, capture, release, onResize } = setup();
        pointer(grip.dom, "pointerdown", 400, 300);
        expect(capture).toHaveBeenCalledWith(1);
        pointer(grip.dom, "pointermove", 450, 350);
        expect(target.style.width).toBe("350px");
        expect(target.style.height).toBe("250px");
        expect(onResize).toHaveBeenCalledWith({ width: 350, height: 250 });
        pointer(grip.dom, "pointerup", 450, 350);
        expect(release).toHaveBeenCalledWith(1);
        expect(target.querySelector(".elg-resize-cursor")).toBeNull();
        grip.dispose();
    });
    it("clamps to minima and available viewport space", () => {
        const { target, grip } = setup();
        pointer(grip.dom, "pointerdown", 400, 300);
        pointer(grip.dom, "pointermove", -400, -300);
        expect(target.style.width).toBe("200px");
        expect(target.style.height).toBe("150px");
        pointer(grip.dom, "pointermove", 4000, 3000);
        expect(target.style.width).toBe("696px");
        expect(target.style.height).toBe("496px");
        grip.dispose();
    });
    it("ignores other buttons/pointers and releases a cancelled gesture", () => {
        const { target, grip, capture } = setup();
        pointer(grip.dom, "pointerdown", 400, 300, 1, 2);
        expect(capture).not.toHaveBeenCalled();
        pointer(grip.dom, "pointerdown", 400, 300);
        pointer(grip.dom, "pointermove", 450, 350, 2);
        expect(target.style.width).toBe("");
        pointer(grip.dom, "pointercancel", 400, 300);
        pointer(grip.dom, "pointermove", 450, 350);
        expect(target.style.width).toBe("");
        grip.dispose();
    });
    it("cleans up capture and listeners when disposed during resizing", () => {
        const { target, grip, release } = setup();
        pointer(grip.dom, "pointerdown", 400, 300);
        grip.dispose();
        expect(release).toHaveBeenCalledWith(1);
        expect(target.children.length).toBe(0);
        pointer(grip.dom, "pointermove", 450, 350);
        expect(target.style.width).toBe("");
    });
});
