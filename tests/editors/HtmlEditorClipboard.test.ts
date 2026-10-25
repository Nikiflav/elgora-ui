import { afterEach, describe, expect, it, vi } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";
import { extractHtmlEditorRange } from "../../src/components/editors/htmleditor/HtmlEditorRange";
import { HtmlEditorParser } from "../../src/components/editors/htmleditor/HtmlEditorParser";

describe("HtmlEditor model clipboard", () => {
    let editor: HtmlEditor;
    const create = (html: string, readOnly = false) => {
        editor = new HtmlEditor({ value: html, readOnly });
        editor.mount(document.body);
        return editor.content;
    };
    const select = (a: Node, from: number, b = a, to = from, reverse = false) => {
        document.getSelection()!.setBaseAndExtent(reverse ? b : a, reverse ? to : from, reverse ? a : b, reverse ? from : to);
        document.dispatchEvent(new Event("selectionchange"));
    };
    const clipboard = (type = "copy", failure?: string) => {
        const data = new Map<string, string>();
        const event = new Event(type, { bubbles: true, cancelable: true });
        const setData = vi.fn((mime: string, value: string) => {
            if (mime === failure) throw new Error("Unavailable clipboard");
            data.set(mime, value);
        });
        Object.defineProperty(event, "clipboardData", { value: { setData } });
        editor.content.dispatchEvent(event);
        return { data, event, setData };
    };
    const parsed = (data: Map<string, string>) => {
        const template = document.createElement("template");
        template.innerHTML = data.get("text/html")!;
        return template.content;
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    it.each([false, true])("copies partial table-to-list content without expanding the selection: reverse=%s", reverse => {
        const root = create('<table id="table"><tbody><tr><td><strong>ABC</strong></td><td>Middle</td></tr></tbody></table><ul><li><em>DEF</em></li><li>Keep</li></ul>');
        select(root.querySelector("strong")!.firstChild!, 1, root.querySelector("em")!.firstChild!, 2, reverse);
        const before = editor.html, selection = editor.selection;
        const { data, event } = clipboard();
        expect(event.defaultPrevented).toBe(true);
        const copy = parsed(data);
        expect(copy.querySelector("table > tbody > tr > td > strong")!.textContent).toBe("BC");
        expect(copy.querySelectorAll("td")).toHaveLength(2);
        expect(copy.querySelector("ul > li > em")!.textContent).toBe("DE");
        expect(copy.querySelectorAll("li")).toHaveLength(1);
        expect(data.get("text/plain")).toBe("BC\tMiddle\nDE");
        expect(data.get("text/html")).not.toContain("data-elg-html-editor");
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.canUndo).toBe(false);
    });

    it("cuts the same range as copy and restores the original directed selection with one undo", () => {
        const root = create('<table><tbody><tr><td>ABC</td></tr></tbody></table><ul><li>DEF</li><li>Keep</li></ul>');
        select(root.querySelector("td")!.firstChild!, 1, root.querySelector("li")!.firstChild!, 2, true);
        const before = editor.html, selection = editor.selection, copy = clipboard().data;
        const cut = clipboard("cut");
        expect(cut.data).toEqual(copy);
        expect(root.querySelector("td")!.textContent).toBe("A");
        expect(root.querySelector("li")!.textContent).toBe("F");
        const after = editor.html;
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.canUndo).toBe(false);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(editor.html).toBe(after);
    });

    it.each(["text/html", "text/plain"])("does not cut if writing %s fails", failure => {
        const root = create('<p>ABC</p>');
        select(root.firstChild!.firstChild!, 0, root.firstChild!.firstChild!, 3);
        const html = editor.html, selection = editor.selection;
        expect(clipboard("cut", failure).event.defaultPrevented).toBe(true);
        expect(editor.html).toBe(html);
        expect(editor.selection).toEqual(selection);
        expect(editor.canUndo).toBe(false);
    });

    it("allows copy but prevents cut in a readonly editor", () => {
        const root = create('<p>ABC</p>', true);
        select(root.firstChild!.firstChild!, 1, root.firstChild!.firstChild!, 3);
        expect(clipboard().data.get("text/plain")).toBe("BC");
        expect(clipboard("cut").setData).not.toHaveBeenCalled();
        expect(editor.html).toBe('<p>ABC</p>');
    });

    it("does not export a remembered selection when the live selection is outside the editor", () => {
        const root = create('<p>ABC</p>');
        select(root.firstChild!.firstChild!, 0, root.firstChild!.firstChild!, 3);
        const outside = document.createTextNode("Outside");
        document.body.append(outside);
        select(outside, 0, outside, 7);
        expect(editor.selection).toBeDefined();
        expect(clipboard().setData).not.toHaveBeenCalled();
        expect(clipboard("cut").setData).not.toHaveBeenCalled();
        expect(editor.html).toBe('<p>ABC</p>');
    });

    it("does not export a collapsed caret or change the clipboard", () => {
        const root = create('<p>ABC</p>');
        select(root.firstChild!.firstChild!, 1);
        expect(clipboard().setData).not.toHaveBeenCalled();
        expect(clipboard("cut").setData).not.toHaveBeenCalled();
        expect(editor.canUndo).toBe(false);
    });

    it("does not export stale model data during composition", () => {
        const root = create('<p>ABC</p>');
        select(root.firstChild!.firstChild!, 0, root.firstChild!.firstChild!, 2);
        root.dispatchEvent(new Event("compositionstart"));
        expect(clipboard().setData).not.toHaveBeenCalled();
        expect(clipboard("cut").setData).not.toHaveBeenCalled();
        expect(editor.html).toBe('<p>ABC</p>');
    });

    it("copies an explicitly selected empty block without its view-only filler", () => {
        const root = create('<p>A</p><p id="empty"></p><p>B</p>');
        select(root, 1, root, 2);
        const { data } = clipboard("cut");
        expect(data.get("text/html")).toBe('<p id="empty"></p>');
        expect(data.get("text/plain")).toBe("");
        expect(root.querySelector("#empty")).toBeNull();
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(root.querySelector("#empty")).not.toBeNull();
    });

    it.each([false, true])("preserves ordered list numbering in a partial fragment: reversed=%s", reversed => {
        const root = create(`<ol ${reversed ? 'reversed' : 'start="5"'}><li>A</li><li>BC</li><li>D</li></ol>`);
        const text = root.querySelectorAll("li")[1].firstChild!;
        select(text, 0, text, 1);
        const list = parsed(clipboard().data).querySelector("ol")!;
        expect(list.getAttribute("start")).toBe(reversed ? "2" : "6");
        expect(list.hasAttribute("reversed")).toBe(reversed);
        expect(list.textContent).toBe("B");
        expect(list.children).toHaveLength(1);
    });

    it("compacts partial table spans without copying unselected cells", () => {
        const root = create('<table><tbody><tr><td rowspan="2" colspan="2">ABC</td><td>Keep</td></tr><tr><td>Other</td></tr></tbody></table>');
        const text = root.querySelector("td")!.firstChild!;
        select(text, 1, text, 3);
        const copy = parsed(clipboard().data);
        expect(copy.querySelectorAll("td")).toHaveLength(1);
        expect(copy.querySelector("td")!.textContent).toBe("BC");
        expect(copy.querySelector("[rowspan], [colspan]")).toBeNull();
        expect(root.querySelector("td")!.getAttribute("rowspan")).toBe("2");
    });

    it("preserves spans when the complete table is selected", () => {
        const root = create('<table><tbody><tr><td rowspan="2">ABC</td><td>D</td></tr><tr><td>E</td></tr></tbody></table>');
        select(root, 0, root, 1);
        expect(parsed(clipboard().data).querySelector("td")!.getAttribute("rowspan")).toBe("2");
    });

    it("preserves preformatted text, hard breaks and image alt text in plain output", () => {
        const root = create('<pre>  A\n B</pre><p>C<br>D<img src="/image.png" alt="Photo"></p><ul><li>E</li><li>F</li></ul>');
        select(root, 0, root, root.childNodes.length);
        expect(clipboard().data.get("text/plain")).toBe("  A\n B\nC\nDPhoto\nE\nF");
    });

    it("preserves empty block separators in plain text", () => {
        const root = create('<p>A</p><p></p><p>B</p>');
        select(root, 0, root, 3);
        expect(clipboard().data.get("text/plain")).toBe("A\n\nB");
    });

    it("preserves complete nested table spans inside a partially selected outer table", () => {
        const root = create('<table id="outer"><tbody><tr><td>Before<table id="inner"><tbody><tr><td colspan="2">Nested</td></tr></tbody></table>After</td><td>Unselected</td></tr></tbody></table>');
        const cell = root.querySelector("td")!;
        select(cell, 1, cell, 2);
        const copy = parsed(clipboard().data);
        expect(copy.querySelector("#inner td")!.getAttribute("colspan")).toBe("2");
        expect(copy.textContent).toBe("Nested");
    });

    it("round-trips clipboard HTML through model paste and maintains fresh identities", () => {
        const root = create('<p>ABC</p><ul><li>DEF</li></ul><p id="target">Target</p>');
        select(root.querySelector("p")!.firstChild!, 1, root.querySelector("li")!.firstChild!, 2);
        const { data } = clipboard();
        const target = root.querySelector("#target")!;
        select(target.firstChild!, 6);
        const paste = new Event("paste", { bubbles: true, cancelable: true });
        Object.defineProperty(paste, "clipboardData", { value: { getData: (mime: string) => data.get(mime) ?? "" } });
        root.dispatchEvent(paste);
        expect(paste.defaultPrevented).toBe(true);
        expect(root.querySelectorAll("ul")).toHaveLength(2);
        expect(root.textContent).toBe("ABCDEFTargetBCDE");
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(root.textContent).toBe("ABCDEFTarget");
    });

    it("exports from the model rather than contaminated live DOM attributes", () => {
        const root = create('<p>ABC</p>');
        select(root.firstChild!.firstChild!, 0, root.firstChild!.firstChild!, 3);
        root.querySelector("p")!.setAttribute("data-foreign", "Not in model");
        expect(clipboard().data.get("text/html")).toBe('<p>ABC</p>');
    });

    it("does not delete again on a subsequent native deleteByCut event", () => {
        const root = create('<p>ABC</p>');
        select(root.firstChild!.firstChild!, 1, root.firstChild!.firstChild!, 2);
        clipboard("cut");
        const after = editor.html;
        const event = new InputEvent("beforeinput", { inputType: "deleteByCut", bubbles: true, cancelable: true });
        root.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(editor.html).toBe(after);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe('<p>ABC</p>');
        expect(editor.canUndo).toBe(false);
    });

    it("returns detached extracted nodes and rejects stale selection identities", () => {
        const document = new HtmlEditorParser().parse('<p>ABC</p>');
        const p = document.children[0];
        if (p.type !== "element") throw new Error("Expected paragraph");
        const text = p.children[0];
        const selection = { anchor: { nodeId: text.id, offset: 1 }, focus: { nodeId: text.id, offset: 3 } };
        const copy = extractHtmlEditorRange(document, "root", selection)!;
        expect(copy.children[0]).not.toBe(p);
        if (copy.children[0].type === "element") copy.children[0].children = [];
        expect(p.children).toHaveLength(1);
        expect(extractHtmlEditorRange(document, "root", { anchor: { nodeId: "stale", offset: 0 }, focus: selection.focus })).toBeUndefined();
    });
});
