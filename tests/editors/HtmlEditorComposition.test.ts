import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlEditor, type HtmlEditorOptions } from "../../src/components/editors/htmleditor/HtmlEditor";
import { HtmlEditorSurface } from "../../src/components/editors/htmleditor/HtmlEditorSurface";
import { ValueEditor } from "../../src/components/editors/ValueEditor";
import { Component } from "../../src/core/Component";
import { Localization } from "../../src/localization/Localization";
import { bgMessages } from "../../src/locales/bg";
import { deMessages } from "../../src/locales/de";

const owned: Component[] = [];
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const create = (options: Partial<HtmlEditorOptions> = {}) => {
    const editor = new HtmlEditor({ value: "<p>Hello</p><p>Next</p>", toolbar: true, inspector: true, ...options });
    owned.push(editor); editor.mount(document.body); return editor;
};
const select = (editor: HtmlEditor, text = editor.content.querySelector("p")!.firstChild!, start = 0, end = start) => {
    editor.content.focus();
    document.getSelection()!.setBaseAndExtent(text, start, text, end);
    document.dispatchEvent(new Event("selectionchange"));
};
const command = (editor: HtmlEditor, label: string) => {
    const id = label.toLowerCase();
    return editor.toolbar!.dom.querySelector<HTMLButtonElement>(`[data-field="${id}"] button`)
        ?? [...editor.toolbar!.dom.querySelectorAll<HTMLButtonElement>("button")].find(button =>
            button.getAttribute("aria-label") === label || button.textContent === label)!;
};

beforeEach(() => {
    const matches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function(this: HTMLElement, selector) {
        return selector === ":popover-open" ? this.hasAttribute("data-test-open") : matches.call(this, selector);
    });
    Object.defineProperty(HTMLElement.prototype, "showPopover", { configurable: true, value: function(this: HTMLElement) {
        this.setAttribute("data-test-open", ""); this.dispatchEvent(new Event("toggle"));
    } });
    Object.defineProperty(HTMLElement.prototype, "hidePopover", { configurable: true, value: function(this: HTMLElement) {
        this.removeAttribute("data-test-open"); this.dispatchEvent(new Event("toggle"));
    } });
});
afterEach(async () => {
    owned.splice(0).forEach(component => component.dispose());
    await frame(); document.getSelection()?.removeAllRanges(); document.body.replaceChildren();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as any).showPopover;
    delete (HTMLElement.prototype as any).hidePopover;
});

describe("HtmlEditor composition", () => {
    it("selects the whole caret element from the selector circle without opening the tree, then unbolds it", async () => {
        const editor = create({ value: "<p>Before <strong>Bold text</strong> after</p>" });
        select(editor, editor.content.querySelector("strong")!.firstChild!, 3);
        const inspector = editor.inspector!.dom;
        expect(inspector.querySelector(".elg-html-editor-breadcrumb")).toBeNull();
        const row = inspector.querySelector<HTMLElement>(".elg-html-editor-selector-row")!;
        expect(row.querySelector("code")!.textContent).toBe("<strong>");
        const circle = row.querySelector<HTMLButtonElement>(".elg-html-editor-node-coverage")!;
        expect(circle.hidden).toBe(false);
        circle.click();
        expect(editor.surface.getSelectionCoverage().get(editor.document.children[0].type === "element"
            ? editor.document.children[0].children[1].id : "")).toBe("full");
        expect(row.dataset.htmlEditorCoverage).toBe("full");
        expect(document.querySelector(".elg-html-editor-elements-popup")).toBeNull();
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect(editor.html).toBe("<p>Before Bold text after</p>");
        inspector.querySelector<HTMLButtonElement>(".elg-html-editor-node-selector")!.click();
        await frame();
        expect(document.querySelector(".elg-html-editor-elements-popup")).not.toBeNull();
    });
    it("hides the selector circle for a Mixed range", () => {
        const editor = create();
        const paragraphs = editor.content.querySelectorAll("p");
        document.getSelection()!.setBaseAndExtent(paragraphs[0].firstChild!, 1, paragraphs[1].firstChild!, 2);
        document.dispatchEvent(new Event("selectionchange"));
        expect(editor.inspector!.dom.querySelector<HTMLButtonElement>(".elg-html-editor-selector-row > .elg-html-editor-node-coverage")!.hidden).toBe(true);
    });
    it("keeps the inspection overlay visible when a menu button preserves surface focus", async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 30));
        const editor = create();
        select(editor, editor.content.querySelector("p")!.firstChild!, 2);
        const saved = editor.selection;
        const button = editor.inspector!.dom.querySelector<HTMLButtonElement>('[data-field="block.heading"] button')!;
        button.click();
        await frame();
        expect(editor.dom.querySelector('[data-inspection-target="true"]')).not.toBeNull();
        expect(editor.selection).toEqual(saved);
        const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
        menu.querySelector<HTMLElement>('button')!.focus();
        await frame();
        expect(editor.dom.querySelector('[data-inspection-target="true"]')).not.toBeNull();
        editor.content.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await frame();
        expect(editor.dom.querySelector('[data-inspection-target="true"]')).toBeNull();
    });
    it("reads caret styles and changes only subsequent typing, resetting overrides on caret movement", () => {
        const editor = create({ value: '<p><span style="font-size: 150%; color: red">Hello</span> plain</p>' });
        select(editor, editor.content.querySelector("span")!.firstChild!, 2);
        expect(editor.surface.getTextStyleValues("font-size")).toEqual(["150%"]);
        expect(editor.surface.getTextStyleValues("color")).toEqual(["red"]);
        const before = editor.html;
        expect(editor.execute({ type: "textStyle", property: "font-size", value: "200%" })).toBe(true);
        expect(editor.html).toBe(before);
        expect(editor.canUndo).toBe(false);
        expect(editor.surface.getTextStyleValues("font-size")).toEqual(["200%"]);
        expect(editor.execute({ type: "insertText", text: "X" })).toBe(true);
        const inserted = [...editor.content.querySelectorAll("span")].find(span => span.textContent === "X")!;
        expect(inserted.style.fontSize).toBe("200%");
        expect(editor.content.textContent).toBe("HeXllo plain");
        select(editor, editor.content.querySelector("p")!.lastChild!, 2);
        expect(editor.surface.getTextStyleValues("font-size")).toEqual([undefined]);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(before);
    });
    it("styles selected text across paragraphs without styling the blocks", () => {
        const editor = create({ value: "<p>First word</p><p>Second word</p>" });
        const paragraphs = editor.content.querySelectorAll("p");
        document.getSelection()!.setBaseAndExtent(paragraphs[0].firstChild!, 6, paragraphs[1].firstChild!, 6);
        document.dispatchEvent(new Event("selectionchange"));
        const before = editor.html;
        expect(editor.execute({ type: "textStyle", property: "color", value: "red" })).toBe(true);
        expect(editor.content.querySelectorAll("p[style]")).toHaveLength(0);
        expect([...editor.content.querySelectorAll("span")].map(span => span.textContent)).toEqual(["word", "Second"]);
        expect(editor.surface.getTextStyleValues("color")).toEqual(["red", "red"]);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(before);
    });
    it("opens a Basic choice menu in one click and applies its choice with undo", async () => {
        const editor = create();
        select(editor);
        editor.inspector!.dom.querySelector<HTMLButtonElement>('[data-field="block.heading"] button')!.click();
        await frame();
        const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
        expect(menu).not.toBeNull();
        const heading = [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')]
            .find(item => item.textContent?.includes("Heading 2"))!;
        expect(heading).toBeDefined();
        heading.click();
        await frame();
        expect(editor.html).toContain("<h2>Hello</h2>");
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toContain("<p>Hello</p>");
    });
    it("outlines the caret property target while inspector controls have focus without extending selection", async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 30));
        const editor = create();
        select(editor, editor.content.querySelector("p")!.firstChild!, 2);
        const saved = editor.selection;
        const field = editor.inspector!.dom.querySelector<HTMLElement>('[data-field="block.heading"] button')!;
        field.focus();
        await frame();
        const outline = '.elg-html-editor-container-selection-rect[data-html-editor-node-id="' + editor.document.children[0].id + '"]';
        expect(editor.dom.querySelector(outline)).not.toBeNull();
        expect(editor.selection).toEqual(saved);
        editor.content.focus();
        editor.content.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await frame();
        expect(editor.dom.querySelector(outline)).toBeNull();
        expect(editor.selection).toEqual(saved);
    });
    it("updates common element fields from surface selection and keeps text commands during tree inspection", async () => {
        const editor = create();
        select(editor);
        expect(editor.inspector!.dom.querySelector('[data-field="block.heading"]')).not.toBeNull();
        expect(editor.inspector!.dom.querySelector('[data-field="bold"]')).not.toBeNull();
        expect(editor.inspector!.dom.querySelector('[data-field="underline"]')).not.toBeNull();
        expect(editor.inspector!.dom.querySelector('[data-field="strikethrough"]')).not.toBeNull();
        expect(editor.toolbar!.dom.querySelector('[data-field="underline"]')).toBeNull();
        expect(editor.toolbar!.dom.querySelector('[data-field="strikethrough"]')).toBeNull();
        const paragraphs = editor.content.querySelectorAll("p");
        document.getSelection()!.setBaseAndExtent(paragraphs[0].firstChild!, 1, paragraphs[1].firstChild!, 2);
        document.dispatchEvent(new Event("selectionchange"));
        expect(editor.inspector!.dom.querySelector('[data-field="block.align"]')).not.toBeNull();
        expect([...editor.inspector!.dom.querySelectorAll<HTMLElement>("details[data-group]")]
            .map(section => section.dataset.group)).toEqual(["format", "appearance", "paragraph"]);
        editor.surface.setSelectedNodes([editor.surface.document.children[1].id]);
        expect(editor.inspector!.dom.querySelector('[data-field="bold"]')).not.toBeNull();
        select(editor, paragraphs[0].firstChild!, 1);
        expect(editor.inspector!.dom.querySelector('[data-field="block.heading"]')).not.toBeNull();
        await frame();
    });

    it.each([false, true])("shows Mixed and shared full/partial coverage across table and list: backwards=%s", async backwards => {
        const editor = create({ value: "<table><tbody><tr><td>ABC</td></tr></tbody></table><p>Whole</p><ul><li>DEF</li></ul>" });
        const start = editor.content.querySelector("td")!.firstChild!, end = editor.content.querySelector("li")!.firstChild!;
        document.getSelection()!.setBaseAndExtent(backwards ? end : start, backwards ? 2 : 1, backwards ? start : end, backwards ? 1 : 2);
        document.dispatchEvent(new Event("selectionchange"));
        const saved = editor.selection, html = editor.html;
        expect(editor.inspector!.dom.querySelector<HTMLButtonElement>(".elg-html-editor-node-selector")!.textContent).toBe("Mixed");
        const coverage = editor.surface.getSelectionCoverage();
        const nodes = editor.document.children;
        expect(coverage.get(nodes[0].id)).toBe("partial");
        expect(coverage.get(nodes[1].id)).toBe("full");
        expect(coverage.get(nodes[2].id)).toBe("partial");
        await editor.inspector!.openElements(); await frame();
        const popup = document.querySelector<HTMLElement>(".elg-html-editor-elements-popup")!;
        const node = (id: string) => popup.querySelector<HTMLElement>(`[data-html-editor-node-id="${id}"]`)!;
        expect(node(nodes[0].id).dataset.htmlEditorCoverage).toBe("partial");
        expect(node(nodes[1].id).dataset.htmlEditorCoverage).toBe("full");
        expect(node(nodes[2].id).dataset.htmlEditorCoverage).toBe("partial");
        const partialIndicator = node(nodes[0].id).querySelector<HTMLElement>(".elg-html-editor-node-coverage")!;
        const fullIndicator = node(nodes[1].id).querySelector<HTMLElement>(".elg-html-editor-node-coverage")!;
        expect(partialIndicator.title).toBe("Partially selected — click to select the entire element");
        expect(fullIndicator.title).toBe("Fully selected");
        expect(partialIndicator.tagName).toBe("BUTTON");
        expect(partialIndicator.getAttribute("aria-disabled")).toBe("false");
        expect(popup.querySelector('[role="checkbox"]')).toBeNull();
        expect(node(nodes[1].id).closest('[role="treeitem"]')!.getAttribute("aria-label")).toContain("Fully selected");
        expect(node(nodes[0].id).closest('[role="treeitem"]')!.getAttribute("aria-label")).toContain("Partially selected");
        expect(node(nodes[1].id).querySelector(".elg-html-editor-node-tag")!.textContent).toBe("<p>");
        expect(editor.selection).toEqual(saved); expect(editor.html).toBe(html);
        expect(editor.canUndo).toBe(false); expect(editor.modified).toBe(false);
    });

    it("does not treat enclosing shells as Mixed and updates an open tree without reloading", async () => {
        const editor = create({ value: "<div><p>ABC<strong>DEF</strong>GHI</p></div>" });
        const text = editor.content.querySelector("p")!.firstChild!;
        select(editor, text, 1, 2);
        const selector = editor.inspector!.dom.querySelector<HTMLButtonElement>(".elg-html-editor-node-selector")!;
        expect(selector.textContent).toContain("<p>"); expect(selector.textContent).not.toBe("Mixed");
        await editor.inspector!.openElements(); await frame();
        const popup = document.querySelector<HTMLElement>(".elg-html-editor-elements-popup")!;
        const strong = editor.content.querySelector("strong")!.firstChild!;
        const strongId = editor.document.children[0].children[0].children[1].id;
        const indicator = () => popup.querySelector<HTMLElement>(`[data-html-editor-node-id="${strongId}"] .elg-html-editor-node-coverage`)!;
        expect(indicator().title).toBe("Not selected — click to select element");
        document.getSelection()!.setBaseAndExtent(text, 1, strong, 3);
        document.dispatchEvent(new Event("selectionchange"));
        expect(selector.textContent).toBe("Mixed");
        expect(popup.matches(":popover-open")).toBe(true);
        expect(popup.querySelector<HTMLElement>(`[data-html-editor-node-id="${strongId}"]`)!.dataset.htmlEditorCoverage).toBe("full");
        expect(indicator().title).toBe("Fully selected");
        select(editor, strong, 1);
        expect(selector.textContent).toContain("<strong>");
        expect(popup.querySelector('[data-html-editor-coverage="full"]')).toBeNull();
        expect(popup.querySelector('[data-html-editor-coverage="partial"]')).toBeNull();
        expect(indicator().title).toBe("Not selected — click to select element");
    });

    it("renders a separate keyboard-focus icon that follows tree navigation without editing the document", async () => {
        const editor = create({ value: "<section><p>Hello</p><p>Next</p></section>" });
        select(editor, undefined, 1, 3);
        const saved = editor.selection;
        await editor.inspector!.openElements(); await frame();
        const popup = document.querySelector<HTMLElement>(".elg-html-editor-elements-popup")!;
        const tree = popup.querySelector<HTMLElement>('[role="tree"]')!;
        const focused = () => popup.querySelector<HTMLElement>(".elg-tree-focused")!;
        const before = focused().id;
        const icon = focused().querySelector<HTMLElement>(".elg-html-editor-keyboard-focus")!;
 expect(icon.classList.contains("ri-input-cursor-move")).toBe(true);
        expect(icon.title).toBe("Keyboard focus");
        expect(icon.getAttribute("aria-hidden")).toBe("true");
        tree.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        await frame();
        expect(focused().id).not.toBe(before);
        expect(focused().querySelector(".elg-html-editor-keyboard-focus")).not.toBeNull();
        expect(tree.getAttribute("aria-activedescendant")).toBe(focused().id);
        expect(editor.selection).toEqual(saved); expect(editor.modified).toBe(false); expect(editor.canUndo).toBe(false);
        expect(editor.inspector!.dom.querySelector(".elg-html-editor-node-selector .elg-html-editor-node-coverage")).toBeNull();
    });

    it("covers empty elements and atoms only when their model interval is actually selected", () => {
        const editor = create({ value: '<p>A<img src="image.png" alt="Image">B</p><div></div><p>End</p>' });
        const nodes = editor.document.children;
        const imageId = nodes[0].children[1].id;
        select(editor, editor.content.querySelector("p")!.firstChild!, 0, 1);
        expect(editor.surface.getSelectionCoverage().has(imageId)).toBe(false);
        document.getSelection()!.setBaseAndExtent(editor.content, 0, editor.content, 2);
        document.dispatchEvent(new Event("selectionchange"));
        const coverage = editor.surface.getSelectionCoverage();
        expect(coverage.get(imageId)).toBe("full");
        expect(coverage.get(nodes[1].id)).toBe("full");
        expect(coverage.has(nodes[2].id)).toBe(false);
        select(editor, editor.content.querySelector("p")!.firstChild!, 0);
        expect(editor.surface.getSelectionCoverage().size).toBe(0);
        editor.setHtml("<p>Replacement</p>");
        expect(editor.inspector!.dom.querySelector<HTMLButtonElement>(".elg-html-editor-node-selector")!.textContent).toBe("Choose an element…");
        expect(editor.surface.getSelectionCoverage().size).toBe(0);
    });

    it("selects an image as an atomic node when it is clicked", () => {
        const editor = create({ value: '<p>Before<img src="image.png" alt="Image">After</p>' });
        const image = editor.content.querySelector("img")!;
        const imageId = editor.document.children[0].children[1].id;
        image.click();
        expect(editor.surface.getSelectionCoverage().get(imageId)).toBe("full");
        expect(editor.inspector!.dom.querySelector(".elg-html-editor-node-selector")!.textContent).toContain("<img>");
        expect(editor.modified).toBe(false);
        expect(editor.canUndo).toBe(false);
    });

    it("renders selection rectangles in a non-interactive overlay", async () => {
        const editor = create({ value: "<p>Hello world</p>" });
        const flowNode = editor.content.querySelector("p")!;
        vi.spyOn(editor.surface, "selectionFlowRects").mockReturnValue([
            { rect: new DOMRect(0, 0, 10, 10), flowNode },
            { rect: new DOMRect(10, -2, 5, 14), flowNode },
            { rect: new DOMRect(0, 12, 12, 10), flowNode }
        ]);
        const text = editor.content.querySelector("p")!.firstChild!;
        select(editor, text, 0, 5);
        editor.content.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await frame();
        const overlay = editor.dom.querySelector<HTMLElement>(".elg-html-editor-selection-overlay")!;
        expect(overlay.hidden).toBe(true);
        expect(overlay.style.pointerEvents).toBe("");
        expect(overlay.querySelectorAll(".elg-html-editor-selection-rect")).toHaveLength(0);
        editor.content.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        await frame();
        expect(overlay.hidden).toBe(false);
        expect(overlay.querySelectorAll(".elg-html-editor-selection-rect")).toHaveLength(2);
    });

    it.each([false, true])("orders the visual Range without changing selection direction: backwards=%s", backwards => {
        const editor = create({ value: "<p>Hello world</p>" });
        const text = editor.content.querySelector("p")!.firstChild!;
        let visualRange: Range | undefined;
        const rangePrototype = Range.prototype as Range & { getClientRects?: () => DOMRectList };
        const originalGetClientRects = rangePrototype.getClientRects;
        Object.defineProperty(rangePrototype, "getClientRects", { configurable: true, value: function(this: Range) {
            visualRange = this;
            return [new DOMRect(0, 0, 10, 10)];
        } });
        try {
            select(editor, text, backwards ? 8 : 2, backwards ? 2 : 8);
            editor.surface.selectionClientRects();
            expect(editor.selection!.anchor.offset).toBe(backwards ? 8 : 2);
            expect(editor.selection!.focus.offset).toBe(backwards ? 2 : 8);
            expect(visualRange!.startOffset).toBe(2);
            expect(visualRange!.endOffset).toBe(8);
        } finally {
            if (originalGetClientRects) Object.defineProperty(rangePrototype, "getClientRects", { configurable: true, value: originalGetClientRects });
            else delete rangePrototype.getClientRects;
        }
    });

    it("keeps text-flow selection and structural node outlines independent", async () => {
        const editor = create({ value: "<section><p>Hello world</p></section>" });
        const sectionId = editor.document.children[0].id;
        vi.spyOn(editor.surface, "selectionFlowRects").mockReturnValue([
            { rect: new DOMRect(0, 0, 10, 10), flowNode: editor.content.querySelector("p")! }
        ]);
        vi.spyOn(editor.surface, "selectionContainerClientRects").mockReturnValue([
            { nodeId: sectionId, rect: new DOMRect(0, 0, 40, 30), kind: "selected" }
        ]);
        const text = editor.content.querySelector("p")!.firstChild!;
        select(editor, text, 0, 5);
        editor.surface.setSelectedNodes([sectionId]);
        editor.content.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        await frame();
        const overlay = editor.dom.querySelector<HTMLElement>(".elg-html-editor-selection-overlay")!;
        expect(overlay.querySelectorAll(".elg-html-editor-text-selection-layer .elg-html-editor-selection-rect")).toHaveLength(1);
        expect(overlay.querySelectorAll(".elg-html-editor-container-selection-layer .elg-html-editor-container-selection-rect")).toHaveLength(1);
        expect(overlay.querySelector(".elg-html-editor-container-selection-rect")?.getAttribute("data-html-editor-node-id")).toBe(sectionId);
    });

    it("previews only the targets of the focused command", async () => {
        const editor = create({ value: "<p>Hello world</p>" });
        const paragraphId = editor.document.children[0].id;
        const paragraph = editor.content.querySelector("p")!;
        vi.spyOn(editor.surface, "selectionFlowRects").mockReturnValue([
            { rect: new DOMRect(0, 0, 24, 12), flowNode: paragraph }
        ]);
        vi.spyOn(editor.surface, "selectionContainerClientRects").mockReturnValue([
            { nodeId: paragraphId, rect: new DOMRect(0, 0, 100, 24), kind: "selected" }
        ]);
        vi.spyOn(editor.surface, "selectedNodeClientRects").mockReturnValue([
            { nodeId: paragraphId, rect: new DOMRect(0, 0, 100, 24) }
        ]);
        select(editor, paragraph.firstChild!, 0, 5);
        const overlay = editor.dom.querySelector<HTMLElement>(".elg-html-editor-selection-overlay")!;
        const focusCommand = async (id: string) => {
            editor.inspector!.dom.querySelector<HTMLButtonElement>(`[data-field="${id}"] button`)!.focus();
            await frame();
        };

        await focusCommand("bold");
        expect(overlay.querySelectorAll(".elg-html-editor-text-selection-layer .elg-html-editor-selection-rect")).toHaveLength(1);
        expect(overlay.querySelectorAll(".elg-html-editor-container-selection-layer .elg-html-editor-container-selection-rect")).toHaveLength(0);

        await focusCommand("block.heading");
        expect(overlay.querySelectorAll(".elg-html-editor-text-selection-layer .elg-html-editor-selection-rect")).toHaveLength(0);
        expect(overlay.querySelectorAll(".elg-html-editor-container-selection-layer .elg-html-editor-container-selection-rect")).toHaveLength(1);
        expect(overlay.querySelector(".elg-html-editor-container-selection-rect")?.dataset.htmlEditorNodeId).toBe(paragraphId);
    });

    it("does not activate the inspection preview over an empty command-surface area", async () => {
        const editor = create({ value: "<section><p>Hello world</p></section>" });
        const sectionId = editor.document.children[0].id;
        vi.spyOn(editor.surface, "selectionContainerClientRects").mockReturnValue([
            { nodeId: sectionId, rect: new DOMRect(0, 0, 100, 24), kind: "selected" }
        ]);
        select(editor, editor.content.querySelector("p")!.firstChild!, 0, 5);
        editor.content.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        await frame();
        editor.toolbar!.dom.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
        await frame();
        const overlay = editor.dom.querySelector<HTMLElement>(".elg-html-editor-selection-overlay")!;
        expect(overlay.querySelector('[data-inspection-target="true"]')).toBeNull();
    });

    it("outlines direct grid items as separate grid cells", () => {
        const editor = create({ value: '<div style="display:grid"><div>Grid A</div><div>Grid B</div><div>Grid C</div></div>' });
        const grid = editor.content.firstElementChild!;
        const cells = [...grid.children];
        const originalGetComputedStyle = window.getComputedStyle.bind(window);
        vi.spyOn(window, "getComputedStyle").mockImplementation(element => {
            const style = originalGetComputedStyle(element);
            Object.defineProperty(style, "display", { configurable: true, value: element === grid ? "grid" : "block" });
            return style;
        });
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 40, 20));
        select(editor, cells[1].firstChild!, 0, 5);

        expect(editor.surface.selectionContainerClientRects().filter(rect => rect.kind === "grid-cell")).toHaveLength(3);
        expect(editor.surface.selectionContainerClientRects().find(rect => rect.kind === "grid-cell")?.nodeId)
            .toBe(editor.surface.domMap.position(cells[0], 0)?.nodeId);
    });

    it("preserves the compact ValueEditor API with exactly one surface", () => {
        const editor = new HtmlEditor({ value: "<p>Compact</p>" });
        owned.push(editor); editor.mount(document.body);
        expect(editor).toBeInstanceOf(ValueEditor);
        expect(editor.surface).toBeInstanceOf(HtmlEditorSurface);
        expect(editor.content).toBe(editor.surface.dom);
        expect(editor.selectionChanged).toBe(editor.surface.selectionChanged);
        expect(editor.dom.querySelectorAll('[role="textbox"]')).toHaveLength(1);
        expect(editor.toolbar).toBeUndefined(); expect(editor.inspector).toBeUndefined();
        expect(editor.dom.hasAttribute("toolbar")).toBe(false);
        expect(editor.dom.hasAttribute("inspector")).toBe(false);
    });

    it("shows a localized toast when a command cannot be executed", () => {
        const editor = create();
        expect(editor.commandRegistry.execute("bold")).toBe(false);
        const toast = editor.dom.querySelector<HTMLElement>(".elg-html-editor-command-toast")!;
        expect(toast.textContent).toBe("This command cannot be executed in the current context.");
        expect(toast.dataset.visible).toBe("true");
        expect(toast.getAttribute("aria-live")).toBe("polite");
    });

    it("uses a standalone Component surface without an acceptance lifecycle", () => {
        const surface = new HtmlEditorSurface({ html: "<p>Hello</p>", label: "Body" });
        owned.push(surface); surface.mount(document.body);
        expect(surface).toBeInstanceOf(Component); expect(surface).not.toBeInstanceOf(ValueEditor);
        expect("commit" in surface).toBe(false); expect("cancel" in surface).toBe(false);
        const input = vi.fn(), change = vi.fn();
        surface.input.subscribe(input); surface.documentChanged.subscribe(change);
        surface.setHtml("<p>New</p>");
        expect(input).not.toHaveBeenCalled(); expect(change).toHaveBeenCalledOnce();
        const text = surface.document.children[0];
        expect(surface.restoreSelection({ anchor: { nodeId: text.id, offset: 0 }, focus: { nodeId: text.id, offset: 0 } })).toBe(true);
        expect(surface.execute({ type: "insertText", text: "A" })).toBe(true);
        expect(surface.canUndo).toBe(true); expect(input).toHaveBeenCalledOnce();
        surface.setHtml("<p>Replacement</p>"); expect(surface.canUndo).toBe(false);
    });

    it.each([[false, true], [true, false], [true, true]])("owns requested tools toolbar=%s inspector=%s", (toolbar, inspector) => {
        const editor = create({ toolbar, inspector });
        expect(!!editor.toolbar).toBe(toolbar); expect(!!editor.inspector).toBe(inspector);
        if (toolbar) expect(editor.dom.contains(editor.toolbar!.dom)).toBe(true);
        if (inspector) expect(editor.inspector!.dom.parentElement).toBe(editor.surface.dom.parentElement?.parentElement);
        const children = [editor.surface, editor.toolbar, editor.inspector].filter(Boolean) as Component[];
        editor.dispose(); expect(children.every(component => component.disposed.Value)).toBe(true);
    });

    it("runs toolbar commands through the same history and commit/cancel baseline", async () => {
        const onCommit = vi.fn(); const editor = create({ onCommit });
        select(editor, undefined, 0, 5);
        expect(command(editor, "Bold").disabled).toBe(false);
        command(editor, "Bold").click();
        expect(editor.html).toContain("<strong>Hello</strong>");
        expect(editor.modified).toBe(true); expect(editor.canUndo).toBe(editor.surface.canUndo);
        command(editor, "Undo").click(); expect(editor.modified).toBe(false);
        command(editor, "Redo").click(); expect(editor.modified).toBe(true);
        expect(await editor.commit()).toBe(true); expect(onCommit).toHaveBeenCalledOnce();
        expect(onCommit.mock.calls[0][1]).toBe(editor);
        expect(editor.canUndo).toBe(false); expect(editor.modified).toBe(false);
        select(editor); editor.execute({ type: "insertText", text: "Changed" });
        expect(editor.cancel()).toBe(true); expect(editor.html).not.toContain("Changed");
        expect(editor.html).toContain("<strong>Hello</strong>");
    });

    it("runs Bold and Italic from a node action menu against the remembered text selection", async () => {
        const editor = create();
        select(editor, undefined, 0, 5);
        await editor.inspector!.openElements(); await frame();
        const popup = document.querySelector<HTMLElement>(".elg-html-editor-elements-popup")!;
        popup.querySelector<HTMLButtonElement>(".elg-html-editor-node-action")!.click();
        const menu = popup.querySelector<HTMLElement>(".elg-html-editor-command-menu")!;
        const item = (label: string) => [...menu.querySelectorAll<HTMLButtonElement>("button")]
            .find(button => button.textContent === label)!;
        item("Bold").click();
        expect(editor.html).toContain("<strong>Hello</strong>");
        const formattedText = editor.content.querySelector("p strong")!.firstChild!;
        select(editor, formattedText, 0, 5);
        popup.querySelector<HTMLButtonElement>(".elg-html-editor-node-action")!.click();
        item("Italic").click();
        expect(editor.html).toContain("<em><strong>Hello</strong></em>");
    });

    it("reports formatting state for full and mixed selections", () => {
        const editor = create({ value: "<p><strong>Bold</strong></p><p>Plain</p>" });
        const formatted = editor.content.querySelector("strong")!.firstChild!;
        select(editor, formatted, 0, 4);
        const currentBold = command(editor, "Bold");
        const currentItalic = command(editor, "Italic");
        expect(currentBold.getAttribute("aria-pressed")).toBe("true");
        expect(currentItalic.getAttribute("aria-pressed")).toBe("false");
        const plain = editor.content.querySelectorAll("p")[1].firstChild!;
        document.getSelection()!.setBaseAndExtent(formatted, 1, plain, 2);
        document.dispatchEvent(new Event("selectionchange"));
        expect(command(editor, "Bold").getAttribute("aria-pressed")).toBe("mixed");
        const mixedInspectorButton = editor.inspector!.dom.querySelector<HTMLButtonElement>('[data-field="bold"] button')!;
        expect(mixedInspectorButton.getAttribute("aria-pressed")).toBe("mixed");
    });

    it("refreshes toolbar formatting state when selection moves within the same element", () => {
        const editor = create({ value: "<p><strong>Bold</strong> plain</p>" });
        const strongText = editor.content.querySelector("strong")!.firstChild!;
        const paragraphText = editor.content.querySelector("p")!.lastChild!;
        select(editor, strongText, 0, 4);
        expect(command(editor, "Bold").getAttribute("aria-pressed")).toBe("true");
        select(editor, paragraphText, 1, 5);
        expect(command(editor, "Bold").getAttribute("aria-pressed")).toBe("false");
    });

    it("uses compact icon presentations in the toolbar while keeping inspector values", () => {
        const editor = create();
        select(editor);
        const toolbarColor = editor.toolbar!.dom.querySelector<HTMLButtonElement>('[data-field="text.color"] button')!;
        const toolbarSize = editor.toolbar!.dom.querySelector<HTMLButtonElement>('[data-field="text.size"] button')!;
        const toolbarBackground = editor.toolbar!.dom.querySelector<HTMLButtonElement>('[data-field="element.backgroundColor"] button')!;
        expect(toolbarColor.title).toBe("Text color");
        expect(toolbarSize.title).toBe("Text size");
        expect(toolbarBackground.title).toBe("Background");
        expect(toolbarColor.textContent).toBe("");
        expect(toolbarSize.textContent).toBe("");
        expect(toolbarBackground.textContent).toBe("");
        expect(toolbarBackground.querySelector("i")?.className).toContain("ri-paint-fill");
        expect(editor.inspector!.dom.querySelector<HTMLButtonElement>('[data-field="text.color"] button')!.textContent).toContain("—");
        expect(editor.inspector!.dom.querySelector<HTMLButtonElement>('[data-field="text.size"] button')!.textContent).toContain("—");
    });

    it("reports formatting state across independent container parents", () => {
        const editor = create({ value: "<div><div><strong>Grid A</strong></div><div>Grid B</div><div><strong>Grid C</strong></div></div>" });
        const cells = [...editor.content.firstElementChild!.children];
        const first = cells[0].querySelector("strong")!.firstChild!;
        const last = cells[2].querySelector("strong")!.firstChild!;
        document.getSelection()!.setBaseAndExtent(first, 0, last, 6);
        document.dispatchEvent(new Event("selectionchange"));
        expect(command(editor, "Bold").getAttribute("aria-pressed")).toBe("mixed");
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect([...editor.content.querySelectorAll("strong")].map(node => node.textContent)).toEqual(["Grid A", "Grid B", "Grid C"]);
    });

    it("keeps tools unavailable while readonly, busy or composing, and recovers afterwards", async () => {
        const readonly = create({ readOnly: true }); select(readonly);
        expect([...readonly.toolbar!.dom.querySelectorAll<HTMLButtonElement>("button")].every(button => button.disabled)).toBe(true);
        let release!: () => void;
        const external = new Promise<void>(resolve => { release = resolve; });
        const editor = create({ onCommit: () => external });
        select(editor); editor.execute({ type: "insertText", text: "A" });
        const pending = editor.commit(); await Promise.resolve(); await Promise.resolve();
        expect(editor.busy).toBe(true); expect(command(editor, "Bold").disabled).toBe(true);
        expect(editor.inspector!.dom.querySelector<HTMLButtonElement>(".elg-html-editor-node-selector")!.disabled).toBe(true);
        release(); await pending;
        expect(editor.surface.editable).toBe(true);
        select(editor);
        editor.content.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
        expect(command(editor, "Bold").disabled).toBe(true);
        expect(editor.cancel()).toBe(false);
        editor.content.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(editor.surface.settled).toBe(true); expect(command(editor, "Bold").disabled).toBe(false);
    });

    it("navigates toolbar and inspector tabs using the keyboard", () => {
        const editor = create(); select(editor);
        const bold = command(editor, "Bold"), italic = command(editor, "Italic");
        bold.focus(); bold.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        expect(document.activeElement).toBe(italic);
        const tabs = editor.inspector!.dom.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        tabs[0].focus(); tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        expect(document.activeElement).toBe(tabs[1]); expect(tabs[1].getAttribute("aria-selected")).toBe("true");
        expect(editor.inspector!.dom.querySelectorAll<HTMLElement>('[role="tabpanel"]')[0].hidden).toBe(true);
        expect(editor.modified).toBe(false); expect(editor.canUndo).toBe(false);
    });

    it("renders toolbar controls through the shared inspector fields and toggles properties", () => {
        const editor = create();
        expect(editor.toolbar!.dom.querySelector('[data-field="bold"]')).not.toBeNull();
        expect(editor.toolbar!.dom.querySelector('[data-field="block.heading"]')).not.toBeNull();
        const properties = editor.toolbar!.dom.querySelector<HTMLButtonElement>(".elg-html-editor-toolbar-properties")!;
        expect(properties.getAttribute("aria-pressed")).toBe("true");
        properties.click();
        expect(editor.inspector!.dom.hidden).toBe(true);
        expect(properties.getAttribute("aria-pressed")).toBe("false");
        properties.click();
        expect(editor.inspector!.dom.hidden).toBe(false);
    });

    it("previews tree targets without replacing the caret or creating history", async () => {
        const editor = create(); const input = vi.fn(); editor.input.subscribe(input);
        select(editor, undefined, 1, 3); const saved = editor.selection;
        const selector = editor.inspector!.dom.querySelector<HTMLButtonElement>(".elg-html-editor-node-selector")!;
        expect(selector.textContent).toContain("Hello");
        expect(selector.classList.contains("elg-btn-ghost")).toBe(true);
        expect(selector.classList.contains("elg-html-editor-node-selector")).toBe(true);
        expect(selector.querySelector(".elg-html-editor-node-tag")!.textContent).toBe("<p>");
        expect(selector.querySelector(".elg-html-editor-node-description")!.textContent).toBe("Hello");
        await editor.inspector!.openElements(); await frame();
        const popup = document.querySelector<HTMLElement>('[popover]')!;
        const next = [...popup.querySelectorAll<HTMLElement>('[role="treeitem"]')].find(item => item.getAttribute("aria-label") === "p Next")!;
        next.click();
        expect(selector.textContent).toContain("Next");
        expect(selector.querySelector(".elg-html-editor-node-tag")!.textContent).toBe("<p>");
        expect(selector.querySelector(".elg-html-editor-node-description")!.textContent).toBe("Next");
        expect(editor.selection).not.toEqual(saved); expect(document.activeElement).toBe(selector);
        expect(editor.modified).toBe(false); expect(input).not.toHaveBeenCalled(); expect(editor.canUndo).toBe(false);
        editor.setHtml("<h2>New scope</h2>");
        expect(selector.textContent).toBe("Choose an element…");
        expect(popup.matches(":popover-open")).toBe(false);
    });

    it("dims element descriptions that are composed from child elements", async () => {
        const editor = create({ value: "<div><p>Nested text</p></div><p>Direct text</p>" });
        await editor.inspector!.openElements(); await frame();
        const popup = document.querySelector<HTMLElement>("[popover]")!;
        const rows = [...popup.querySelectorAll<HTMLElement>("[role=treeitem]")];
        const nested = rows.find(row => row.getAttribute("aria-label")?.startsWith("div "))!;
        const direct = rows.find(row => row.getAttribute("aria-label")?.startsWith("p Direct text"))!;
        expect(nested.querySelector(".elg-html-editor-node-description")?.classList.contains("elg-html-editor-node-description-derived")).toBe(true);
        expect(direct.querySelector(".elg-html-editor-node-description")?.classList.contains("elg-html-editor-node-description-derived")).toBe(false);
    });

    it("does not clone the document on caret movement and cleans open popups on unmount/dispose", async () => {
        const editor = create(); const snapshot = vi.spyOn(editor.surface, "document", "get");
        select(editor, undefined, 1); select(editor, undefined, 2);
        expect(snapshot).not.toHaveBeenCalled();
        await editor.inspector!.openElements();
        const popup = document.querySelector<HTMLElement>('[popover]')!;
        editor.unmount(); expect(popup.matches(":popover-open")).toBe(false);
        editor.mount(document.body); await editor.inspector!.openElements();
        expect(popup.matches(":popover-open")).toBe(true);
        editor.dispose(); expect(document.querySelector('[popover]')).toBeNull();
        expect(editor.surface.disposed.Value).toBe(true);
    });

    it.each([["bg-BG", bgMessages, "Удебелен", "Свойства"], ["de-DE", deMessages, "Fett", "Eigenschaften"]] as const)("localizes the owned tools in %s", (locale, dictionary, bold, properties) => {
        const localization = new Localization({ locale }); localization.addMessages(locale, dictionary);
        const editor = create({ localization });
        expect(command(editor, bold)).toBeDefined();
        expect(editor.inspector!.dom.querySelector('[role="tab"]')!.textContent).toBe(properties);
        localization.addMessages(locale, { "htmlEditorToolbar.bold": "Custom bold" });
        expect(command(editor, "Custom bold")).toBeDefined();
    });
});
