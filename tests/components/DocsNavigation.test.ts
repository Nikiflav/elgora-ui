import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDocsHeader } from "../../docs/app/DocsNavigation";

let media: EventTarget & { matches: boolean };
let header: ReturnType<typeof createDocsHeader> | undefined;
const storageKey = "elg-docs-sidebar-collapsed";

beforeEach(() => {
    localStorage.removeItem(storageKey);
    delete document.documentElement.dataset.theme;
    media = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal("matchMedia", () => media);
});
afterEach(() => {
    header?.dispose(); header = undefined;
    document.body.replaceChildren();
    localStorage.removeItem(storageKey);
    vi.restoreAllMocks(); vi.unstubAllGlobals();
});
function fixture() {
    const sidebar = document.createElement("nav");
    sidebar.id = "docs-sidebar";
    sidebar.innerHTML = '<input type="search"><a href="#topic">Topic</a>';
    document.body.append(sidebar);
    header = createDocsHeader(sidebar);
    header.mount(document.body);
    return {
        sidebar,
        toggle: header.dom.querySelector<HTMLButtonElement>(".docs-nav-toggle")!,
        collapse: sidebar.querySelector<HTMLButtonElement>(".docs-sidebar-collapse")!
    };
}
describe("Documentation navigation", () => {
    it("collapses on desktop, persists the choice and restores focus to the visible toggle", () => {
        const { sidebar, toggle, collapse } = fixture();
        expect(collapse.classList.contains("elg-btn-ghost")).toBe(true);
        expect(toggle.getAttribute("aria-expanded")).toBe("true");
        collapse.click();
        expect(sidebar.hasAttribute("data-collapsed")).toBe(true);
        expect(localStorage.getItem(storageKey)).toBe("true");
        expect(document.activeElement).toBe(toggle);
        expect(toggle.getAttribute("aria-expanded")).toBe("false");
        toggle.click();
        expect(sidebar.hasAttribute("data-collapsed")).toBe(false);
        expect(document.activeElement).toBe(collapse);
    });
    it("restores a saved desktop preference without losing search or navigation DOM", () => {
        localStorage.setItem(storageKey, "true");
        const { sidebar, toggle } = fixture();
        const search = sidebar.querySelector("input");
        expect(sidebar.hasAttribute("data-collapsed")).toBe(true);
        toggle.click();
        expect(sidebar.querySelector("input")).toBe(search);
        expect(sidebar.querySelector(".docs-brand img")?.getAttribute("alt")).toBe("");
    });
    it("keeps mobile opening separate and closes on Escape, links and breakpoint changes", () => {
        localStorage.setItem(storageKey, "true");
        media.matches = true;
        const { sidebar, toggle } = fixture();
        toggle.click();
        expect(sidebar.hasAttribute("data-open")).toBe(true);
        sidebar.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        expect(sidebar.hasAttribute("data-open")).toBe(false);
        toggle.click(); sidebar.querySelector("a[href='#topic']")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(sidebar.hasAttribute("data-open")).toBe(false);
        toggle.click(); media.matches = false; media.dispatchEvent(new Event("change"));
        expect(sidebar.hasAttribute("data-open")).toBe(false);
        expect(sidebar.hasAttribute("data-collapsed")).toBe(true);
        expect(localStorage.getItem(storageKey)).toBe("true");
    });
    it("cleans up subscriptions and tolerates unavailable storage", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
        const { sidebar, toggle, collapse } = fixture();
        collapse.click();
        expect(sidebar.hasAttribute("data-collapsed")).toBe(true);
        header!.dispose();
        toggle.click(); media.matches = true; media.dispatchEvent(new Event("change"));
        expect(sidebar.hasAttribute("data-collapsed")).toBe(true);
        expect(sidebar.querySelector(".docs-sidebar-brand")).toBeNull();
        expect(sidebar.querySelector(".docs-sidebar-footer")).toBeNull();
    });
    it("owns a theme control in a non-scrolling sidebar footer, not in the header", () => {
        const { sidebar } = fixture();
        expect(header!.dom.querySelector('[aria-label="Toggle theme"]')).toBeNull();
        const footer = sidebar.querySelector(".docs-sidebar-footer")!;
        expect(footer.parentElement).toBe(sidebar);
        const themeButton = footer.querySelector<HTMLButtonElement>('[aria-label="Toggle theme"]')!;
        themeButton.click();
        expect(document.documentElement.dataset.theme).toBe("dark");
        themeButton.click();
        expect(document.documentElement.dataset.theme).toBeUndefined();
    });
});
