import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import demo from "../../docs/content/getting-started/quick-start.md.ts";
import type { Component } from "../../src/core/Component";

let app: Component | undefined;
const settle = () => new Promise(resolve => setTimeout(resolve, 40));
afterEach(() => { app?.dispose(); app = undefined; document.body.replaceChildren(); });

describe("Quick start panel", () => {
    it("updates the label without replacing DOM and disposes the owned subtree", async () => {
        app = demo(); await settle();
        const button = app.dom.querySelector("button")!;
        const heading = app.dom.querySelector("h2")!;
        expect(app.mounted).toBe(true);
        expect(button.textContent).toBe("Clicked 0 times");
        button.click(); button.click(); await settle();
        expect(button.textContent).toBe("Clicked 2 times");
        expect(app.dom.querySelector("button")).toBe(button);
        expect(app.dom.querySelector("h2")).toBe(heading);
        app.dispose();
        expect(button.isConnected).toBe(false);
        expect(app.disposed.Value).toBe(true);
    });

    it("keeps the complete copyable example synchronized with the demo", () => {
        const markdown = readFileSync("docs/content/getting-started/quick-start.md", "utf8");
        const source = readFileSync("docs/content/getting-started/quick-start.md.ts", "utf8");
        const published = markdown.match(/~~~js\s*\n(import[\s\S]*?)~~~/)![1].trim();
        const body = source.slice(source.indexOf("    const app"), source.lastIndexOf("    return app;")).trim();
        const normalize = (code: string) => code.split("\n").map(line => line.trim()).filter(Boolean).join("\n");
        expect(normalize(published.replace(/^import[^\n]+\n/, ""))).toBe(normalize(body));
        expect(markdown).not.toContain("new DataGrid");
    });
});
