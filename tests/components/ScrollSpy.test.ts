import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollSpy } from "../../src/components/scroll-spy/ScrollSpy";
import { ElgoraUI } from "../../src/core/ElgoraUI";

const rect = (top: number, height = 20) => ({ top, bottom: top + height, left: 0, right: 200, width: 200, height } as DOMRect);
let tasks: Set<() => void>;
let spies: ScrollSpy[];
let resizeCallback: () => void;
let disconnect: ReturnType<typeof vi.fn>;
function flush() { const pending = [...tasks]; tasks.clear(); pending.forEach(task => task()); }
function setup(windowViewport = false) {
    const viewport = document.createElement("div");
    const article = document.createElement("article");
    const navigation = document.createElement("nav");
    article.innerHTML = '<h2 id="first">First</h2><h3 id="second">Second</h3><h2 id="last">Last</h2>';
    navigation.innerHTML = '<a href="#first">First</a><a href="#second">Second</a><a href="#last">Last</a><a href="#missing">Missing</a>';
    viewport.append(article, navigation);
    document.body.append(viewport);
    const targets = [...article.querySelectorAll<HTMLElement>("[id]")];
    const links = [...navigation.querySelectorAll("a")];
    const tops = [10, 300, 600];
    targets.forEach((target, i) => {
        vi.spyOn(target, "getBoundingClientRect").mockImplementation(() => rect(tops[i]));
        vi.spyOn(target, "getClientRects").mockReturnValue([rect(tops[i])] as unknown as DOMRectList);
    });
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue(rect(0, 400));
    Object.defineProperties(viewport, { clientHeight: { value: 400 }, scrollHeight: { value: 1000 } });
    const spy = new ScrollSpy({ container: article, navigation, scrollContainer: windowViewport ? undefined : viewport });
    spies.push(spy);
    return { viewport, article, navigation, targets, links, tops, spy };
}

beforeEach(() => {
    tasks = new Set(); spies = [];
    vi.spyOn(ElgoraUI.scheduler, "schedule").mockImplementation(task => { tasks.add(task); });
    disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
        constructor(callback: () => void) { resizeCallback = callback; }
        observe = vi.fn(); disconnect = disconnect;
    });
});
afterEach(() => { spies.forEach(spy => spy.dispose()); document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("ScrollSpy", () => {
    it("marks the first section before any heading passes the activation line", () => {
        const { links } = setup(); flush();
        expect(links[0].getAttribute("aria-current")).toBe("location");
        expect(links[0].classList.contains("elg-scroll-spy-active")).toBe(true);
        expect(links[3].hasAttribute("aria-current")).toBe(false);
    });
    it("tracks scrolling and marks exactly one link without changing the URL", () => {
        const { tops, viewport, links } = setup(); flush();
        const url = location.href;
        tops[0] = -300; tops[1] = 20;
        viewport.dispatchEvent(new Event("scroll")); flush();
        expect(links[1].getAttribute("aria-current")).toBe("location");
        expect(links.filter(link => link.hasAttribute("aria-current"))).toHaveLength(1);
        expect(location.href).toBe(url);
    });
    it("activates the short last section at the viewport bottom", () => {
        const { viewport, links } = setup();
        viewport.scrollTop = 600; flush();
        expect(links[2].getAttribute("aria-current")).toBe("location");
    });
    it("uses the element's top and border when applying the offset", () => {
        const { viewport, tops, links } = setup();
        vi.mocked(viewport.getBoundingClientRect).mockReturnValue(rect(100));
        tops[1] = 120; flush();
        expect(links[1].hasAttribute("aria-current")).toBe(true);
        tops[1] = 125; window.dispatchEvent(new Event("resize")); flush();
        expect(links[0].hasAttribute("aria-current")).toBe(true);
    });
    it("supports the window viewport and content resizing", () => {
        const { tops, links } = setup(true); flush();
        tops[1] = 0; window.dispatchEvent(new Event("scroll")); flush();
        expect(links[1].hasAttribute("aria-current")).toBe(true);
        tops[2] = 20; resizeCallback(); flush();
        expect(links[2].hasAttribute("aria-current")).toBe(true);
    });
    it("ignores hidden headings, outside targets and external links", () => {
        const { targets, tops, links, navigation, spy } = setup();
        vi.mocked(targets[1].getClientRects).mockReturnValue([] as unknown as DOMRectList);
        tops[1] = -10;
        navigation.insertAdjacentHTML("beforeend", '<a href="https://example.com/#first">External</a><a href="#%zz">Invalid</a>');
        spy.refresh(); flush();
        expect(links[0].hasAttribute("aria-current")).toBe(true);
        expect(navigation.querySelectorAll('[aria-current="location"]')).toHaveLength(1);
    });
    it("refreshes changed links and handles empty content", () => {
        const { article, navigation, spy } = setup(); flush();
        navigation.innerHTML = '<a href="#last">Last only</a>';
        spy.refresh(); flush();
        expect(navigation.firstElementChild?.getAttribute("aria-current")).toBe("location");
        article.replaceChildren(); spy.refresh(); flush();
        expect(navigation.querySelector("[aria-current]")).toBeNull();
    });
    it("orders headings by content position, not navigation order", () => {
        const { navigation, links, tops, spy } = setup();
        navigation.prepend(links[2]); spy.refresh();
        tops[1] = 20; flush();
        expect(links[1].hasAttribute("aria-current")).toBe(true);
    });
    it("reveals the active link by scrolling only its navigation", () => {
        const { navigation, links } = setup();
        Object.defineProperties(navigation, { clientHeight: { value: 100 }, scrollHeight: { value: 500 } });
        vi.spyOn(navigation, "getBoundingClientRect").mockReturnValue(rect(0, 100));
        vi.spyOn(links[0], "getBoundingClientRect").mockReturnValue(rect(150));
        flush(); expect(navigation.scrollTop).toBe(70);
    });
    it("restores attributes and disconnects, including already queued work", () => {
        const { spy, viewport, links } = setup();
        spy.dispose(); spy.dispose(); flush();
        expect(links.some(link => link.hasAttribute("aria-current"))).toBe(false);
        expect(disconnect).toHaveBeenCalled();
        viewport.dispatchEvent(new Event("scroll")); window.dispatchEvent(new Event("resize"));
        spy.refresh(); expect(tasks.size).toBe(0);
    });
    it("preserves prior navigation state when disposed", () => {
        const { spy, article, navigation, links, viewport } = setup(); spy.dispose();
        links[0].setAttribute("aria-current", "page"); links[0].classList.add("custom-active");
        const custom = new ScrollSpy({ container: article, navigation, scrollContainer: viewport, activeClass: "custom-active", offset: 0 });
        spies.push(custom); flush(); custom.dispose();
        expect(links[0].getAttribute("aria-current")).toBe("page");
        expect(links[0].classList.contains("custom-active")).toBe(true);
    });
});
