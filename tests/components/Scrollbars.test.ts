import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Scrollbars, type ScrollbarsHandle, type ScrollbarsInstallation } from "../../src/components/scrollbar/Scrollbars";
import { ScrollEngine } from "../../src/components/scrollbar/scroll-engine";

const disposables: { dispose(): void }[] = [];
const resizeCallbacks: ResizeObserverCallback[] = [];
const overlays = () => [...document.querySelectorAll<HTMLElement>("[data-elg-scrollbars-overlay]")];
const frame = () => new Promise(resolve => setTimeout(resolve, 35));
function geometry(element: HTMLElement, width = 200, height = 100, scrollWidth = 600, scrollHeight = 500) {
    Object.defineProperties(element, {
        clientWidth: { configurable: true, value: width }, clientHeight: { configurable: true, value: height },
        scrollWidth: { configurable: true, value: scrollWidth }, scrollHeight: { configurable: true, value: scrollHeight },
        getClientRects: { configurable: true, value: () => [element.getBoundingClientRect()] },
        getBoundingClientRect: { configurable: true, value: () => ({ left: 20, top: 30, right: 20 + width, bottom: 30 + height, width, height }) }
    });
}
function panel() {
    const element = document.createElement("div");
    // Explicit axes avoid jsdom's incomplete computed-style expansion of the overflow shorthand.
    Object.assign(element.style, { overflow: "auto", overflowX: "auto", overflowY: "auto" });
    element.append(document.createElement("div")); document.body.append(element); geometry(element);
    return element;
}
function attach(element: HTMLElement | Window): ScrollbarsHandle {
    const handle = Scrollbars.attach(element); disposables.push(handle); return handle;
}
function install(target: HTMLElement | Window = window, options: { scrollbarMode?: "auto" | "thin" | "always", scrollbarHoverDistance?: number } = {}): ScrollbarsInstallation {
    const installation = Scrollbars.install(target, options); disposables.push(installation); return installation;
}
beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class {
        constructor(callback: ResizeObserverCallback) { resizeCallbacks.push(callback); }
        observe() {} unobserve() {} disconnect() {}
    });
    Object.defineProperty(document, "scrollingElement", { configurable: true, value: document.documentElement });
    geometry(document.documentElement, 1024, 768, 1024, 768);
});
afterEach(async () => {
    disposables.splice(0).reverse().forEach(handle => handle.dispose());
    resizeCallbacks.length = 0;
    document.body.replaceChildren(); await frame();
    vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("Scrollbars native attachment", () => {
    it("preserves native content and overflow, attaches once and restores its class on dispose", () => {
        const element = panel(), child = element.firstElementChild;
        element.style.position = "relative";
        const style = element.getAttribute("style");
        const handle = attach(element);
        expect(element.firstElementChild).toBe(child);
        expect(element.getAttribute("style")).toBe(style);
        expect(element.classList.contains("elg-scrollable")).toBe(true);
        expect(overlays()).toHaveLength(1);
        expect(overlays()[0].parentElement).toBe(document.body);
        expect(Scrollbars.attach(element, { scrollbarMode: "always" })).toBe(handle);
        Scrollbars.attach(element, { scrollbarHoverDistance: 25 });
        expect(handle.scrollbarHoverDistance).toBe(25);
        expect(overlays()[0].getAttribute("data-scrollbar-mode")).toBe("always");
        handle.dispose(); handle.dispose();
        expect(overlays()).toHaveLength(0);
        expect(element.classList.contains("elg-scrollable")).toBe(false);
    });
    it("preserves an existing native-scrollbar hiding class", () => {
        const element = panel(); element.classList.add("elg-scrollable");
        attach(element).dispose(); expect(element.classList.contains("elg-scrollable")).toBe(true);
    });
    it("updates thumb positions from native scroll events and only shows overflowing axes", async () => {
        const element = panel(); attach(element);
        const overlay = overlays()[0];
        const thumb = overlay.querySelector<HTMLElement>(".elg-scrollbar-y .elg-scrollbar-thumb")!;
        const original = thumb.style.transform;
        element.scrollTop = 200; element.dispatchEvent(new Event("scroll")); await frame();
        expect(thumb.style.transform).not.toBe(original);
        expect(overlay.classList.contains("elg-scrolling")).toBe(true);
        geometry(element, 200, 100, 200, 500); resizeCallbacks.forEach(callback => callback([], {} as ResizeObserver)); await frame();
        expect(overlay.querySelector<HTMLElement>(".elg-scrollbar-x")!.style.display).toBe("none");
        expect(overlay.querySelector<HTMLElement>(".elg-scrollbar-y")!.style.display).toBe("block");
    });
    it("does not intercept native keyboard or wheel input over content", () => {
        const element = panel(); attach(element);
        const key = new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true });
        const wheel = new WheelEvent("wheel", { deltaY: 50, cancelable: true });
        element.dispatchEvent(key); element.dispatchEvent(wheel);
        expect(key.defaultPrevented).toBe(false); expect(wheel.defaultPrevented).toBe(false);
    });
    it("track clicks use the shared interaction to change the real scroll position", () => {
        const element = panel(); attach(element);
        const track = overlays()[0].querySelector<HTMLElement>(".elg-scrollbar-y")!;
        const thumb = track.firstElementChild!;
        geometry(track, 12, 100); Object.defineProperty(thumb, "clientHeight", { value: 20 });
        track.dispatchEvent(new MouseEvent("pointerdown", { clientY: 80, button: 0, bubbles: true, cancelable: true }));
        expect(element.scrollTop).toBe(200);
    });
    it("refreshes after content mutations and ignores removed targets", async () => {
        const element = panel(); const handle = attach(element);
        geometry(element, 200, 100, 200, 100); element.append(document.createElement("p")); await frame();
        expect(overlays()[0].querySelector<HTMLElement>(".elg-scrollbar-y")!.style.display).toBe("none");
        element.remove(); handle.refresh(); expect(overlays()[0].style.display).toBe("none");
        handle.dispose(); element.append(document.createElement("p")); await frame(); expect(overlays()).toHaveLength(0);
    });
    it("supports Window by adapting its document scrolling element", () => {
        geometry(document.documentElement, 1024, 768, 1024, 2000);
        const handle = attach(window);
        expect(handle.element).toBe(document.documentElement);
        expect(overlays()[0].style.top).toBe("0px");
        expect(overlays()[0].style.left).toBe("0px");
        expect(overlays()[0].querySelector<HTMLElement>(".elg-scrollbar-y")!.style.display).toBe("block");
    });
    it("rejects a virtual ScrollEngine viewport instead of adding another set of controls", () => {
        const element = panel(); const engine = new ScrollEngine(element); disposables.push(engine);
        expect(() => Scrollbars.attach(element)).toThrow("already belongs");
        expect(overlays()).toHaveLength(0);
    });
});

describe("Scrollbars automatic installation", () => {
    it("discovers existing and new native containers while skipping ScrollEngine subtrees", async () => {
        const element = panel(), virtual = panel();
        const engine = new ScrollEngine(virtual); disposables.push(engine);
        const installation = install();
        expect(overlays()).toHaveLength(2); // Document plus one native panel.
        const later = panel(); await frame(); expect(overlays()).toHaveLength(3);
        later.remove(); await frame(); expect(overlays()).toHaveLength(2);
        Object.assign(element.style, { overflow: "visible", overflowX: "visible", overflowY: "visible" });
        await frame(); expect(overlays()).toHaveLength(1);
        expect(Scrollbars.install(window)).toBe(installation);
    });
    it("updates owned modes and preserves an explicit attachment when disposed", () => {
        const manual = panel(), automatic = panel();
        const handle = attach(manual); handle.scrollbarMode = "auto";
        const installation = install(); installation.scrollbarMode = "always";
        installation.scrollbarHoverDistance = 25;
        expect(handle.scrollbarMode).toBe("auto");
        expect(handle.scrollbarHoverDistance).toBe(50);
        expect(automatic.classList.contains("elg-scrollable")).toBe(true);
        installation.dispose();
        expect(overlays()).toHaveLength(1);
        expect(manual.classList.contains("elg-scrollable")).toBe(true);
        expect(automatic.classList.contains("elg-scrollable")).toBe(false);
    });
});

describe("Scrollbars scoped ownership", () => {
    function scope(parent: HTMLElement = document.body) {
        const root = document.createElement("section"); parent.append(root); return root;
    }
    const panelOverlay = () => overlays().find(overlay => overlay.style.left === "20px")!;

    it("installs on the scope itself and its descendants, leaving outside elements alone", () => {
        const root = panel(), inner = panel(), outside = panel(); root.append(inner);
        const installation = install(root, { scrollbarMode: "always" });
        expect(overlays()).toHaveLength(2);
        expect(root.classList.contains("elg-scrollable")).toBe(true);
        expect(inner.classList.contains("elg-scrollable")).toBe(true);
        expect(outside.classList.contains("elg-scrollable")).toBe(false);
        expect(Scrollbars.install(root)).toBe(installation);
        expect(Scrollbars.install(root, { scrollbarMode: "auto" })).toBe(installation);
        expect(overlays().every(overlay => overlay.getAttribute("data-scrollbar-mode") === "auto")).toBe(true);
    });

    it.each(["global first", "local first"])("closest scope wins independently of creation order: %s", order => {
        const root = scope(), element = panel(); root.append(element); element.scrollTop = 120;
        let global: ScrollbarsInstallation, local: ScrollbarsInstallation;
        if (order === "global first") {
            global = install(window, { scrollbarMode: "auto" });
            local = install(root, { scrollbarMode: "always", scrollbarHoverDistance: 25 });
        } else {
            local = install(root, { scrollbarMode: "always", scrollbarHoverDistance: 25 });
            global = install(window, { scrollbarMode: "auto" });
        }
        const overlay = panelOverlay();
        expect(overlays()).toHaveLength(2);
        expect(overlay.getAttribute("data-scrollbar-mode")).toBe("always");
        global.scrollbarMode = "thin";
        expect(overlay.getAttribute("data-scrollbar-mode")).toBe("always");
        local.dispose();
        expect(panelOverlay()).toBe(overlay);
        expect(overlay.getAttribute("data-scrollbar-mode")).toBe("thin");
        expect(element.scrollTop).toBe(120);
        expect(overlays()).toHaveLength(2);
        global.dispose(); expect(overlays()).toHaveLength(0);
    });

    it("disposing an outer scope leaves the deeper scope intact", () => {
        const outer = scope(), inner = scope(outer), element = panel(); inner.append(element);
        const global = install(window, { scrollbarMode: "thin" });
        const parent = install(outer, { scrollbarMode: "auto" });
        const child = install(inner, { scrollbarMode: "always" });
        const overlay = panelOverlay();
        parent.dispose();
        expect(panelOverlay()).toBe(overlay);
        expect(overlay.getAttribute("data-scrollbar-mode")).toBe("always");
        child.dispose();
        expect(panelOverlay()).toBe(overlay);
        expect(overlay.getAttribute("data-scrollbar-mode")).toBe("thin");
        global.dispose(); expect(overlays()).toHaveLength(0);
    });

    it("promotes an automatic handle to explicit ownership without recreating controls", () => {
        const root = scope(), element = panel(); root.append(element);
        const global = install(window, { scrollbarMode: "auto" });
        const local = install(root, { scrollbarMode: "always", scrollbarHoverDistance: 25 });
        const overlay = panelOverlay();
        const handle = attach(element);
        expect(handle.scrollbarMode).toBe("always");
        expect(handle.scrollbarHoverDistance).toBe(25);
        global.scrollbarMode = "thin"; local.scrollbarMode = "auto"; local.scrollbarHoverDistance = 100;
        expect(handle.scrollbarMode).toBe("always");
        expect(handle.scrollbarHoverDistance).toBe(25);
        local.dispose(); global.dispose();
        expect(overlays()).toHaveLength(1); expect(panelOverlay()).toBe(overlay);
        expect(element.classList.contains("elg-scrollable")).toBe(true);
        handle.dispose(); expect(overlays()).toHaveLength(0);
    });

    it("discovers later descendants and releases removed elements inside a local scope", async () => {
        const root = scope(); install(root, { scrollbarMode: "always" });
        expect(overlays()).toHaveLength(0);
        const later = panel(); root.append(later); await frame();
        expect(overlays()).toHaveLength(1);
        expect(panelOverlay().getAttribute("data-scrollbar-mode")).toBe("always");
        later.remove(); await frame();
        expect(overlays()).toHaveLength(0);
        expect(later.classList.contains("elg-scrollable")).toBe(false);
    });

    it("transfers a reparented viewport to its new closest scope", async () => {
        const left = scope(), right = scope(), element = panel(); left.append(element);
        install(left, { scrollbarMode: "auto" }); install(right, { scrollbarMode: "always" });
        const overlay = panelOverlay(); element.scrollTop = 75;
        right.append(element); await frame();
        expect(panelOverlay()).toBe(overlay);
        expect(overlay.getAttribute("data-scrollbar-mode")).toBe("always");
        expect(element.scrollTop).toBe(75);
    });

    it("handles removal and reinsertion of the installation root", async () => {
        const root = scope(), element = panel(); root.append(element);
        install(root, { scrollbarMode: "always" }); expect(overlays()).toHaveLength(1);
        root.remove(); await frame(); expect(overlays()).toHaveLength(0);
        document.body.append(root); await frame();
        expect(overlays()).toHaveLength(1);
        expect(panelOverlay().getAttribute("data-scrollbar-mode")).toBe("always");
    });

    it("resumes automatic ownership after an explicit handle is disposed", async () => {
        const root = scope(), element = panel(); root.append(element);
        install(root, { scrollbarMode: "always" });
        const handle = attach(element); handle.scrollbarMode = "auto";
        handle.dispose(); await frame();
        expect(overlays()).toHaveLength(1);
        expect(panelOverlay().getAttribute("data-scrollbar-mode")).toBe("always");
    });
});
