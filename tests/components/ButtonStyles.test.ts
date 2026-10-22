import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { cbutton } from "../../src/core/c";

const styles = readFileSync("src/style.css", "utf8");
const colors = readFileSync("src/colors.css", "utf8");

describe("Shared button styles", () => {
    it("exposes ghost as a composable UI style with transparent resting fill and border", () => {
        const button = cbutton({ ui: ["elg", "btn", "btn-ghost"] }, "Action");
        try {
            expect(button.dom.classList.contains("elg-btn-ghost")).toBe(true);
            expect(styles).toMatch(/\.elg-btn\.elg-btn-ghost\s*\{\s*--elg-btn-neutral-bg: transparent;\s*border-color: transparent;/);
            expect(styles).toContain(".elg-btn.elg-btn-ghost:where(:not(.elg-selected))");
        } finally { button.dispose(); }
    });
    it("keeps the compact padding configurable and uses a subtle surface", () => {
        expect(colors).toContain("--elg-btn-radius: 6px");
        expect(colors).toContain("--elg-btn-padding: .15em .5em");
        expect(colors).toContain("--elg-btn-neutral-bg: color-mix(in srgb, var(--elg-text-color) 3%, transparent)");
        expect(styles).toContain("padding: var(--elg-btn-padding)");
        expect(styles).toContain("border-radius: var(--elg-btn-radius)");
    });
    it("limits neutral treatment to plain/neutral buttons and guards disabled interactions", () => {
        expect(styles).toContain(".elg-btn:where(:not(.elg-primary, .elg-accent, .elg-success, .elg-warning, .elg-danger, .elg-surface, .elg-surface-2, .elg-surface-3, .elg-selected))");
        expect(styles).toContain('.elg-btn:hover:where(:not(:disabled, [aria-disabled="true"]))');
        expect(styles).toContain('.elg-btn:active:where(:not(:disabled, [aria-disabled="true"]))');
        expect(styles).toMatch(/\.elg-btn:is\(:disabled, \[aria-disabled="true"\]\)\s*\{\s*--elg-state-s-3: 0;\s*--elg-state-l-3: 0;/);
        expect(styles).toContain(".elg-btn:focus-visible");
    });
});
