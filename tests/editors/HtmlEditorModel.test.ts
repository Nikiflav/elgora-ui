import { afterEach, describe, expect, it } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";
import type { HtmlEditorDocument, HtmlEditorElement, HtmlEditorStyle } from "../../src/components/editors/htmleditor/HtmlEditorModel";
import { normalizeHtmlEditorState } from "../../src/components/editors/htmleditor/HtmlEditorNormalize";
import type { HtmlEditorState } from "../../src/components/editors/htmleditor/HtmlEditorCommands";
import { getHtmlEditorStyle, removeHtmlEditorStyle, setHtmlEditorStyle } from "../../src/components/editors/htmleditor/HtmlEditorStyles";

describe("HtmlEditor authored HTML model", () => {
    let editor: HtmlEditor;
    const create = (html: string) => editor = new HtmlEditor({ value: html });
    const root = () => editor.document.children[0] as HtmlEditorElement;
    afterEach(() => editor?.dispose());

    it("represents elements and text without duplicated presentation or attribute fields", () => {
        create('<div id="section" class="card card featured" style="display:grid;position:relative" title="Title">Hello</div>');
        expect(Object.keys(root()).sort()).toEqual(["id", "type", "tag", "classes", "styles", "attributes", "children"].sort());
        expect(root().classes).toEqual(["card", "featured"]);
        expect(root().attributes).toEqual({ id: "section", title: "Title" });
        expect(root().id).not.toBe("section");
        expect(root().children[0]).toEqual({ id: expect.any(String), type: "text", text: "Hello" });
        expect(root().styles).toEqual([{ name: "display", value: "grid" }, { name: "position", value: "relative" }]);
    });

    it("removes empty text leaves, merges adjacent text and remaps their selection positions", () => {
        const document: HtmlEditorDocument = { type: "document", children: [{ id: "p", type: "element", tag: "p",
            classes: [], attributes: {}, styles: [], children: [
                { id: "a", type: "text", text: "A" }, { id: "empty", type: "text", text: "" }, { id: "b", type: "text", text: "B" }
            ] }] };
        const state: HtmlEditorState = { document, selection: {
            anchor: { nodeId: "empty", offset: 0 }, focus: { nodeId: "b", offset: 1 }
        } };
        normalizeHtmlEditorState(state, "root", () => "generated");
        const paragraph = state.document.children[0] as HtmlEditorElement;
        expect(paragraph.children).toEqual([{ id: "a", type: "text", text: "AB" }]);
        expect(state.selection).toEqual({ anchor: { nodeId: "p", offset: 1 }, focus: { nodeId: "a", offset: 2 } });
    });

    it("removes indentation text between structural children but keeps inline whitespace", () => {
        const document: HtmlEditorDocument = { type: "document", children: [{ id: "section", type: "element", tag: "section",
            classes: [], attributes: {}, styles: [], children: [
                { id: "leading", type: "text", text: "\n  " },
                { id: "first", type: "element", tag: "p", classes: [], attributes: {}, styles: [], children: [{ id: "first-text", type: "text", text: "First" }] },
                { id: "between", type: "text", text: "\n  " },
                { id: "second", type: "element", tag: "p", classes: [], attributes: {}, styles: [], children: [{ id: "second-text", type: "text", text: "Second" }] },
                { id: "trailing", type: "text", text: "\n" }
            ] }] };
        const state: HtmlEditorState = { document };
        normalizeHtmlEditorState(state, "root", () => "generated");
        const section = state.document.children[0] as HtmlEditorElement;
        expect(section.children.map(node => node.type === "element" ? node.tag : node.text)).toEqual(["p", "p"]);
    });

    it("merges adjacent inline elements only when their authored presentation is identical", () => {
        create('<p><strong>A</strong><strong>B</strong><em>C</em><em>D</em><strong class="same">E</strong><strong class="same">F</strong><strong class="different">G</strong><span data-kind="same">H</span><span data-kind="same">I</span><span data-kind="other">J</span></p>');
        expect((root().children as HtmlEditorElement[]).map(node => `${node.tag}:${node.children.map(child => child.type === "text" ? child.text : child.tag).join("")}`)).toEqual([
            "strong:AB", "em:CD", "strong:EF", "strong:G", "span:HI", "span:J"
        ]);
        expect(root().children).toHaveLength(6);
    });

    it("does not merge active and disabled declarations, but merges identical disabled declarations", () => {
        create('<p><span style="color: red">A</span><span style="/* color: red; */">B</span><span style="/* color: red; */">C</span><span style="/* color: red !important; */">D</span></p>');
        const spans = root().children as HtmlEditorElement[];
        expect(spans).toHaveLength(3);
        expect(spans.map(span => span.children.map(child => child.type === "text" ? child.text : "").join(""))).toEqual(["A", "BC", "D"]);
        expect(spans[1].styles).toEqual([{ name: "color", value: "red", disabled: true }]);
    });

    it("merges only identical authored CSS comments and preserves their distinction from declarations", () => {
        const span = (id: string, style: HtmlEditorStyle): HtmlEditorElement => ({ id, type: "element", tag: "span", classes: [], attributes: {}, styles: [style],
            children: [{ id: `${id}-text`, type: "text", text: id }] });
        const document: HtmlEditorDocument = { type: "document", children: [{ id: "p", type: "element", tag: "p", classes: [], attributes: {}, styles: [], children: [
            span("a", { name: "", value: " note ", comment: true }), span("b", { name: "", value: " note ", comment: true }),
            span("c", { name: "", value: " note " }), span("d", { name: "", value: " other ", comment: true })
        ] }] };
        normalizeHtmlEditorState({ document }, "root", () => "generated");
        const children = (document.children[0] as HtmlEditorElement).children as HtmlEditorElement[];
        expect(children).toHaveLength(3);
        expect(children[0].children[0]).toMatchObject({ type: "text", text: "ab" });
        expect(children[1].styles[0].comment).toBeUndefined();
        expect(children[2].styles[0]).toMatchObject({ comment: true, value: " other " });
    });

    it("remaps a selection from a merged inline element and its text leaf", () => {
        const document: HtmlEditorDocument = { type: "document", children: [{ id: "p", type: "element", tag: "p",
            classes: [], attributes: {}, styles: [], children: [
                { id: "first", type: "element", tag: "strong", classes: [], attributes: {}, styles: [], children: [{ id: "first-text", type: "text", text: "A" }] },
                { id: "second", type: "element", tag: "strong", classes: [], attributes: {}, styles: [], children: [{ id: "second-text", type: "text", text: "B" }] }
            ] }] };
        const state: HtmlEditorState = { document, selection: {
            anchor: { nodeId: "second-text", offset: 1 }, focus: { nodeId: "second", offset: 1 }
        } };
        normalizeHtmlEditorState(state, "root", () => "generated");
        expect((state.document.children[0] as HtmlEditorElement).children).toEqual([{
            id: "first", type: "element", tag: "strong", classes: [], attributes: {}, styles: [], children: [{ id: "first-text", type: "text", text: "AB" }]
        }]);
        expect(state.selection).toEqual({ anchor: { nodeId: "first-text", offset: 2 }, focus: { nodeId: "first", offset: 2 } });
    });

    it("unwraps nested plain spans and preserves directed selection across merged text", () => {
        const document: HtmlEditorDocument = { type: "document", children: [{ id: "p", type: "element", tag: "p", classes: [], attributes: {}, styles: [], children: [
            { id: "before", type: "text", text: "A" },
            { id: "outer", type: "element", tag: "span", classes: [], attributes: {}, styles: [], children: [
                { id: "inner", type: "element", tag: "span", classes: [], attributes: {}, styles: [], children: [
                    { id: "inside", type: "text", text: "BC" }
                ] }
            ] },
            { id: "after", type: "text", text: "D" }
        ] }] };
        const state: HtmlEditorState = { document, selection: { anchor: { nodeId: "inside", offset: 1 }, focus: { nodeId: "outer", offset: 0 } } };
        normalizeHtmlEditorState(state, "root", () => "generated");
        expect((document.children[0] as HtmlEditorElement).children).toEqual([{ id: "before", type: "text", text: "ABCD" }]);
        expect(state.selection).toEqual({ anchor: { nodeId: "before", offset: 2 }, focus: { nodeId: "before", offset: 1 } });
    });

    it("retains spans with attributes, classes, active or disabled styles, and CSS comments", () => {
        create('<p><span title="x">A</span><span class="x">B</span><span style="color: red">C</span><span style="/* color: red; */">D</span><span style="/* note */">E</span><span>F</span></p>');
        const children = root().children;
        expect(children).toHaveLength(6);
        expect(children.slice(0, 5).every(node => node.type === "element" && node.tag === "span")).toBe(true);
        expect(children[5]).toMatchObject({ type: "text", text: "F" });
    });

    it("keeps removed span boundaries inside adjacent inline elements that merge", () => {
        const strong = (id: string, value: string): HtmlEditorElement => ({ id, type: "element", tag: "strong", classes: [], attributes: {}, styles: [],
            children: [{ id: `${id}-text`, type: "text", text: value }] });
        const document: HtmlEditorDocument = { type: "document", children: [{ id: "p", type: "element", tag: "p", classes: [], attributes: {}, styles: [], children: [
            strong("a", "A"), { id: "wrapper", type: "element", tag: "span", classes: [], attributes: {}, styles: [], children: [strong("b", "B")] }, strong("c", "C")
        ] }] };
        const state: HtmlEditorState = { document, selection: { anchor: { nodeId: "wrapper", offset: 0 }, focus: { nodeId: "wrapper", offset: 1 } } };
        normalizeHtmlEditorState(state, "root", () => "generated");
        expect((document.children[0] as HtmlEditorElement).children).toHaveLength(1);
        expect(state.selection).toEqual({ anchor: { nodeId: "a-text", offset: 1 }, focus: { nodeId: "a-text", offset: 2 } });
    });

    it("retains shorthand order, duplicate declarations and priorities through HTML round trips", () => {
        create('<div style="margin-left:20px; margin:0; color:red!important; color:blue">Text</div>');
        const styles = root().styles;
        expect(styles).toEqual([
            { name: "margin-left", value: "20px" }, { name: "margin", value: "0" },
            { name: "color", value: "red", important: true }, { name: "color", value: "blue" }
        ]);
        const element = editor.content.firstElementChild as HTMLElement;
        expect(element.style.marginLeft).toBe("0px");
        expect(element.getAttribute("style")).toContain("color: red !important; color: blue;");
        expect(getHtmlEditorStyle(styles, "color")).toEqual({ name: "color", value: "red", important: true });
        const html = editor.html;
        editor.setHtml(html);
        expect(root().styles).toEqual(styles);
        expect(root().attributes).not.toHaveProperty("style");
        expect(root().attributes).not.toHaveProperty("class");
    });

    it("preserves custom-property case, quoted values and disabled declarations", () => {
        create(`<div style="--Gap: 8px; --gap: 4px; --label: 'a;b:c'; /* color:red; */ COLOR: blue !important">Text</div>`);
        expect(root().styles).toEqual([
            { name: "--Gap", value: "8px" }, { name: "--gap", value: "4px" },
            { name: "--label", value: "'a;b:c'" }, { name: "color", value: "red", disabled: true }, { name: "color", value: "blue", important: true }
        ]);
        editor.setHtml(editor.html);
        expect(getHtmlEditorStyle(root().styles, "--Gap")?.value).toBe("8px");
        expect(getHtmlEditorStyle(root().styles, "--gap")?.value).toBe("4px");
    });

    it("round trips disabled attributes and strictly recognized commented styles in order", () => {
        create('<p data-elg-disabled-title="hello" style="color: red; /* font-size: 18px !important; */ /* note */ /* width: 1px; height: 2px; */ color: blue">Text</p>');
        expect(root().attributes["data-elg-disabled-title"]).toBe("hello");
        expect(root().styles).toEqual([
            { name: "color", value: "red" }, { name: "font-size", value: "18px", important: true, disabled: true },
            { name: "", value: " note ", comment: true }, { name: "", value: " width: 1px; height: 2px; ", comment: true },
            { name: "color", value: "blue" }
        ]);
        const before = structuredClone(root().styles);
        editor.setHtml(editor.html);
        expect(root().styles).toEqual(before);
        expect(root().attributes["data-elg-disabled-title"]).toBe("hello");
        expect(getHtmlEditorStyle(root().styles, "font-size")).toBeUndefined();
    });

    it("keeps disabled declarations when active values are changed or cleared", () => {
        const styles: HtmlEditorStyle[] = [{ name: "color", value: "red", disabled: true }, { name: "color", value: "blue" }];
        expect(setHtmlEditorStyle(styles, "color", "green")).toEqual([styles[0], { name: "color", value: "green" }]);
        expect(removeHtmlEditorStyle(styles, "color")).toEqual([styles[0]]);
    });

    it("preserves safe fallback values and custom-property blocks independently of browser CSS support", () => {
        create('<div style="display:-future-layout;display:grid;--config:{a:b;c:d}" class="card card one\u00a0token">Text</div>');
        expect(root().styles).toEqual([
            { name: "display", value: "-future-layout" }, { name: "display", value: "grid" },
            { name: "--config", value: "{a:b;c:d}" }
        ]);
        expect(root().classes).toEqual(["card", "one\u00a0token"]);
        editor.setHtml(editor.html);
        expect(root().styles[0].value).toBe("-future-layout");
        expect(root().styles[2].value).toBe("{a:b;c:d}");
    });

    it("keeps media and cell attributes as HTML strings and never invents controls or alt", () => {
        create('<div><img src="photo.jpg" width="640"><video poster="cover.jpg"><source src="movie.mp4" type="video/mp4"></video><table><tbody><tr><td rowspan="2" colspan="3">A</td></tr></tbody></table></div>');
        const [image, video, table] = root().children as HtmlEditorElement[];
        expect(image.attributes).toEqual({ src: "photo.jpg", width: "640" });
        expect(video.attributes).toEqual({ poster: "cover.jpg" });
        expect((video.children[0] as HtmlEditorElement).attributes.src).toBe("movie.mp4");
        const cell = ((table.children[0] as HtmlEditorElement).children[0] as HtmlEditorElement).children[0] as HtmlEditorElement;
        expect(cell.attributes).toEqual({ rowspan: "2", colspan: "3" });
        expect(editor.content.querySelector("video")?.hasAttribute("controls")).toBe(false);
        expect(editor.content.querySelector("img")?.hasAttribute("alt")).toBe(false);
        expect(editor.content.querySelector("td")?.rowSpan).toBe(2);
    });

    it("preserves boolean attribute presence and absence through rendering and reimport", () => {
        create('<div><video controls="controls" muted loop src="movie.mp4"></video><details open><summary>Title</summary></details></div>');
        const video = root().children[0] as HtmlEditorElement;
        expect(video.attributes).toEqual({ controls: "", muted: "", loop: "", src: "movie.mp4" });
        expect(editor.content.querySelector("video")?.controls).toBe(true);
        expect(editor.content.querySelector("video")?.defaultMuted).toBe(true);
        expect(editor.content.querySelector("details")?.open).toBe(true);
        const html = editor.html;
        editor.setHtml(html);
        expect((root().children[0] as HtmlEditorElement).attributes).toEqual(video.attributes);
        editor.setHtml('<video src="movie.mp4"></video>');
        expect(editor.content.querySelector("video")?.hasAttribute("controls")).toBe(false);
    });

    it("continues filtering unsafe CSS and attributes while keeping supported inline declarations", () => {
        create('<p onclick="bad()" style="color:red; background-image:url(https://example.test/a); --bad:url(https://example.test/b)"><a href="javascript:bad()">Safe</a></p>');
        expect(root().styles).toEqual([{ name: "color", value: "red" }]);
        expect(editor.html).not.toMatch(/onclick|javascript|url\(/);
    });

    it("uses structural editing rules independently of authored display", () => {
        create('<div style="display:inline"><p>Text</p></div>');
        expect(root().tag).toBe("div");
        expect(root().children).toHaveLength(1);
        expect((root().children[0] as HtmlEditorElement).tag).toBe("p");
        expect(root().styles).toEqual([{ name: "display", value: "inline" }]);
    });

    it("retains authored declarations when native text input updates the model and undo restores it", () => {
        create('<p class="card" style="color:red!important;color:blue">Old</p>');
        const before = root();
        editor.content.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText" }));
        editor.content.firstChild!.firstChild!.textContent = "New";
        editor.content.dispatchEvent(new Event("input"));
        expect(root().styles).toEqual(before.styles);
        expect(root().classes).toEqual(before.classes);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.content.textContent).toBe("Old");
        expect(root().styles).toEqual(before.styles);
    });
});

describe("HtmlEditor style declaration helpers", () => {
    it("replaces exact-name declarations immutably and appends after existing shorthands", () => {
        const styles: HtmlEditorStyle[] = [{ name: "margin-left", value: "8px" }, { name: "margin", value: "0" }];
        const result = setHtmlEditorStyle(styles, "MARGIN-LEFT", "16px", true);
        expect(styles).toEqual([{ name: "margin-left", value: "8px" }, { name: "margin", value: "0" }]);
        expect(result).toEqual([styles[1], { name: "margin-left", value: "16px", important: true }]);
        expect(result[0]).toBe(styles[1]);
        expect(setHtmlEditorStyle(result, "margin-left", "16px", true)).toBe(result);
    });

    it("removes every matching declaration while retaining unrelated declarations and custom-property case", () => {
        const styles: HtmlEditorStyle[] = [{ name: "color", value: "red" }, { name: "--X", value: "1" }, { name: "color", value: "blue" }, { name: "--x", value: "2" }];
        expect(removeHtmlEditorStyle(styles, "COLOR")).toEqual([styles[1], styles[3]]);
        expect(removeHtmlEditorStyle(styles, "--X")).toEqual([styles[0], styles[2], styles[3]]);
        expect(removeHtmlEditorStyle(styles, "gap")).toBe(styles);
        expect(setHtmlEditorStyle(styles, "color", "")).toEqual([styles[1], styles[3]]);
    });
});
