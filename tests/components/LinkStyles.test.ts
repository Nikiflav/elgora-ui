import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const styles = readFileSync("src/style.css", "utf8");
const colors = readFileSync("src/colors.css", "utf8");

describe("standard text links", () => {
    it("uses a configurable primary foreground token at theme boundaries", () => {
        expect(colors).toMatch(/:root, \[data-theme\] \{\s*\/\*[^]*?\*\/\s*--elg-link-color: var\(--elg-primary-color\);/);
        expect(styles).toContain("color: var(--elg-link-color)");
        expect(colors).toContain("--elg-link-underline-offset: .18em");
        expect(styles).not.toMatch(/a[^\{]*:visited\s*\{/);
    });
    it("underlines only on hover/focus and preserves button/navigation styling", () => {
        expect(styles).toContain(":where(a[href]:not(.elg-btn, .elg-no-underline):is(:hover, :focus-visible))");
        expect(styles).toContain("text-decoration-line: underline;");
        expect(styles).toContain("text-underline-offset: var(--elg-link-underline-offset)");
        expect(styles).toContain(":where(a[href]:not(.elg-btn, .elg-no-underline):focus-visible)");
        expect(styles.indexOf("color: var(--elg-link-color)")).toBeLessThan(styles.indexOf(".elg-text-primary"));
        expect(styles.indexOf("color: var(--elg-link-color)")).toBeLessThan(styles.indexOf(".elg-primary {"));
    });
    it("demonstrates the real shared defaults without a demo-local stylesheet", () => {
        const demo = readFileSync("docs/content/styles/html-elements.md.buttons.ts", "utf8");
        expect(demo).not.toContain("demo-text-link");
        expect(demo).not.toContain('e("style"');
        expect(demo).toContain('"Text link →"');
    });
});
