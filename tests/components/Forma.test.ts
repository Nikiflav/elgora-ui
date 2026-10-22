import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountForma } from "../../docs/examples/forma";
import type { Component } from "../../src/core/Component";

let page: Component | undefined;
const settle = () => new Promise(done => setTimeout(done, 40));
beforeEach(() => { vi.stubGlobal("IntersectionObserver", undefined); });
afterEach(async () => { page?.dispose(); page = undefined; await settle(); document.body.replaceChildren(); vi.unstubAllGlobals(); });

describe("Forma website demo", () => {
    it("uses native disclosure state and decorative rotating icons for the FAQ", () => {
        page = mountForma(document.body);
        const questions = page.dom.querySelectorAll<HTMLDetailsElement>(".forma-faq details");
        expect(questions).toHaveLength(3);
        for (const details of questions) {
            const summary = details.querySelector("summary")!;
            const icon = summary.querySelector(".elg-rotate-on-open")!;
            expect(icon.getAttribute("aria-hidden")).toBe("true");
            expect(details.open).toBe(false);
            summary.click(); expect(details.open).toBe(true);
            summary.click(); expect(details.open).toBe(false);
            expect(summary.querySelector(".elg-rotate-on-open")).toBe(icon);
        }
    });

    it("uses observable state and keeps keyed task elements when switching layouts", async () => {
        page = mountForma(document.body); await settle();
        const task = page.dom.querySelector<HTMLButtonElement>(".forma-task")!;
        expect(task.getAttribute("aria-pressed")).toBe("false");
        task.click(); await settle(); expect(task.getAttribute("aria-pressed")).toBe("true");
        const view = Array.from(page.dom.querySelectorAll<HTMLButtonElement>(".forma-view-controls button"));
        view[1].click(); await settle();
        expect(page.dom.querySelector(".forma-board")!.classList.contains("is-list")).toBe(true);
        expect(view[1].getAttribute("aria-pressed")).toBe("true");
        expect(page.dom.querySelector(".forma-task")).toBe(task);
        view[0].click(); await settle(); expect(task.getAttribute("aria-pressed")).toBe("true");
    });

    it("has unique section targets, one h1, and restores a theme changed by the demo", async () => {
        const previous = document.documentElement.getAttribute("data-theme");
        page = mountForma(document.body); await settle();
        expect(page.dom.querySelectorAll("h1")).toHaveLength(1);
        for (const anchor of page.dom.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
            expect(page.dom.querySelectorAll(anchor.getAttribute("href")!)).toHaveLength(1);
        page.dom.querySelector<HTMLButtonElement>(".forma-theme")!.click();
        expect(document.documentElement.dataset.theme).toBe(previous === "dark" ? "light" : "dark");
        page.dispose(); expect(document.documentElement.getAttribute("data-theme")).toBe(previous);
    });
});
