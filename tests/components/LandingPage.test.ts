import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "../../docs/app/LandingPage";
import { createDocsThemeButton } from "../../docs/app/DocsThemeButton";
import { readFileSync } from "node:fs";

let page: LandingPage | undefined;
const settle = () => new Promise(done => setTimeout(done, 40));
beforeEach(() => { vi.stubGlobal("IntersectionObserver", undefined); delete document.documentElement.dataset.theme; });
afterEach(async () => {
    page?.dispose(); page = undefined; await settle();
    document.body.replaceChildren(); delete document.documentElement.dataset.theme; vi.unstubAllGlobals();
});
const demo = { id: "home-order-desk", module: "./content/home.md.ts", source: "", code: "", mode: "preview" as const };
function fixture() { page = new LandingPage([demo], document.body); page.mount(document.body); return page; }

describe("Elgora UI landing page", () => {
    it("has one main heading, real navigation destinations, one preview and no editable code", () => {
        const page = fixture();
        expect(page.dom.querySelectorAll("h1")).toHaveLength(1);
        expect(page.dom.querySelectorAll("main")).toHaveLength(1);
        expect(page.dom.querySelector("header nav")?.getAttribute("aria-label")).toBe("Main navigation");
        const topics = JSON.parse(readFileSync("docs/content/topics-manifest.json", "utf8")).topics as { path: string }[];
        const routes = new Set(topics.map(topic => topic.path));
        for (const anchor of page.dom.querySelectorAll<HTMLAnchorElement>('a[href^="?!="]'))
            expect(routes.has(anchor.getAttribute("href")!.slice(3))).toBe(true);
        for (const anchor of page.dom.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
            expect(page.dom.querySelector(anchor.getAttribute("href")!)).not.toBeNull();
        expect(page.dom.querySelectorAll("iframe")).toHaveLength(1);
        expect(page.dom.querySelector("iframe")?.title).toBe("home-order-desk live preview");
        expect(page.dom.querySelectorAll("pre")).toHaveLength(1);
        expect(page.dom.querySelector("textarea, [contenteditable=true]")).toBeNull();
        expect(page.dom.querySelectorAll(".landing-directions article")).toHaveLength(3);
    });
    it("accepts real editor input and reports local acceptance", async () => {
        const page = fixture(); await settle();
        const customer = page.dom.querySelector<HTMLInputElement>('input[aria-label="Customer"]')!;
        customer.value = "A new studio";
        customer.dispatchEvent(new Event("input", { bubbles: true }));
        customer.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await settle();
        expect(page.dom.querySelector('[role="status"]')?.textContent).toContain("Customer updated");
        const toggle = page.dom.querySelector<HTMLButtonElement>('[role="switch"]')!;
        const previous = toggle.getAttribute("aria-checked");
        toggle.click(); await settle();
        expect(toggle.getAttribute("aria-checked")).not.toBe(previous);
        expect(page.dom.querySelector('[role="status"]')?.textContent).toContain("Priority updated");
    });
    it("keeps theme controls synchronized across shells and releases examples on disposal", async () => {
        const page = fixture(); const other = createDocsThemeButton(); other.mount(document.body);
        const theme = page.dom.querySelector<HTMLButtonElement>('[aria-label="Toggle theme"]')!;
        theme.click(); await settle();
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(other.dom.textContent).toContain("Light");
        other.dom.click(); await settle();
        expect(document.documentElement.dataset.theme).toBeUndefined();
        expect(theme.textContent).toContain("Dark");
        const frame = page.dom.querySelector("iframe")!;
        page.dispose(); expect(frame.isConnected).toBe(false);
        other.dispose();
    });
});
