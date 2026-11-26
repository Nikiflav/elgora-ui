import { describe, expect, it } from "vitest";
import type { HtmlEditorElement } from "../../src/components/editors/htmleditor/HtmlEditorModel";
import { applyHtmlEditorPropertyToSubtree, createHtmlEditorClassProvider, createHtmlEditorInlineStyleProvider, createHtmlEditorFreeStyleProvider, createHtmlEditorPaletteProvider } from "../../src/components/editors/htmleditor/HtmlEditorPropertyProvider";
import { htmlEditorDefaultPalette } from "../../src/components/editors/htmleditor/HtmlEditorDefaultPalette";

describe("HTML editor property providers", () => {
    it("provides eight Bootstrap hue scales and a neutral row", () => {
        const palette = htmlEditorDefaultPalette();
        expect(palette).toHaveLength(48);
        expect(new Set(palette.map(item => item.id)).size).toBe(48);
        expect(palette.find(item => item.id === "blue-100")?.color).toBe("#cfe2ff");
        expect(palette.find(item => item.id === "blue")?.color).toBe("#0d6efd");
        expect(palette.find(item => item.id === "blue-900")?.color).toBe("#031633");
        expect(palette.slice(-8).map(item => item.id)).toEqual(["white", "gray-100", "gray-300", "gray-500", "gray-600", "gray-700", "gray-900", "black"]);
    });
    it("validates numeric lengths and preserves unrelated styles", () => {
        const provider = createHtmlEditorFreeStyleProvider("custom", "Custom", "font-size", { type: "length", units: ["px", "rem", "%"], min: 0.1, max: 200 });
        expect(provider.accepts("1.25rem")).toBe(true);
        expect(provider.accepts("80%")).toBe(true);
        expect(provider.accepts("-1px")).toBe(false);
        expect(provider.accepts("12vh")).toBe(false);
        expect(provider.accepts("calc(2px + 1px)")).toBe(false);
        const element: HtmlEditorElement = { id: "p", type: "element", tag: "p", attributes: {}, classes: [], children: [], styles: [{ name: "color", value: "red" }] };
        provider.apply(element, "1.25rem");
        expect(provider.read(element)).toBe("1.25rem");
        provider.clear(element);
        expect(element.styles).toEqual([{ name: "color", value: "red" }]);
    });

    it("maps palette choices to inline values and rejects unsupported color declarations", () => {
        const options = [{ id: "blue", text: "Blue", color: "#0000ff" }];
        const palette = createHtmlEditorPaletteProvider("palette", "Palette", "color", options, { blue: "#0000ff" });
        const custom = createHtmlEditorFreeStyleProvider("custom", "Custom", "color", { type: "color" });
        const element: HtmlEditorElement = { id: "p", type: "element", tag: "p", attributes: {}, classes: [], children: [], styles: [] };
        expect(palette.control.type).toBe("palette");
        palette.apply(element, "blue");
        expect(palette.read(element)).toBe("blue");
        expect(custom.accepts("#ff00aa")).toBe(true);
        expect(custom.accepts("red; font-size: 100px")).toBe(false);
    });
    it("replaces recognized descendant settings without touching unrelated or disabled values", () => {
        const child: HtmlEditorElement = { id: "c", type: "element", tag: "span", attributes: {}, classes: ["red", "other"],
            styles: [{ name: "color", value: "red" }, { name: "color", value: "pink", disabled: true }], children: [] };
        const root: HtmlEditorElement = { id: "r", type: "element", tag: "p", attributes: {}, classes: [], styles: [], children: [child] };
        const options = [{ id: "blue", text: "Blue" }, { id: "red", text: "Red" }];
        const inline = createHtmlEditorInlineStyleProvider("style", "Style", "color", options, { blue: "blue", red: "red" });
        const classes = createHtmlEditorClassProvider("classes", "Classes", options, { blue: "blue", red: "red" });
        expect(applyHtmlEditorPropertyToSubtree([root], [inline, classes], classes, "blue")).toBe(true);
        expect(root.classes).toEqual(["blue"]);
        expect(child.classes).toEqual(["other"]);
        expect(child.styles).toEqual([{ name: "color", value: "pink", disabled: true }]);
        expect(applyHtmlEditorPropertyToSubtree([root], [inline, classes], inline, "unknown")).toBe(false);
        expect(root.classes).toEqual(["blue"]);
    });
});
