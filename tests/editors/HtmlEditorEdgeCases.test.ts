import { afterEach, describe, expect, it } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";

describe("HtmlEditor table and Unicode edges", () => {
    let editor: HtmlEditor;
    const create = (html: string) => {
        editor = new HtmlEditor({ value: html });
        editor.mount(document.body);
        return editor.content;
    };
    const select = (a: Node, offset: number, b = a, end = offset, reverse = false) => {
        document.getSelection()!.setBaseAndExtent(reverse ? b : a, reverse ? end : offset, reverse ? a : b, reverse ? offset : end);
        document.dispatchEvent(new Event("selectionchange"));
    };
    const reversible = (type: "deleteBackward" | "deleteForward", check: () => void) => {
        const html = editor.html, selection = editor.selection;
        expect(editor.execute({ type })).toBe(true);
        check();
        const after = editor.html, caret = editor.selection;
        expect(editor.restoreSelection()).toBe(true);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(html);
        expect(editor.selection).toEqual(selection);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(editor.html).toBe(after);
        expect(editor.selection).toEqual(caret);
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    for (const type of ["deleteBackward", "deleteForward"] as const) {
        it.each([
            ["e", "\u0301"],
            ["👩", "\u200d💻"],
            ["👍", "🏽"],
            ["🇧", "🇬"]
        ])(`deletes one grapheme across formatting wrappers with ${type}: %j %j`, (first, last) => {
            const root = create(`<p>A<strong>${first}</strong><em>${last}</em>B</p>`);
            const node = root.querySelector(type === "deleteBackward" ? "em" : "strong")!.firstChild!;
            select(node, type === "deleteBackward" ? last.length : 0);
            reversible(type, () => expect(root.textContent).toBe("AB"));
        });

        it.each(["e\u0301", "👩\u200d💻", "👍🏽", "🇧🇬"])(`deletes the whole grapheme even when the caret is inside it: ${type} %j`, grapheme => {
            const root = create(`<p>A${grapheme}B</p>`);
            select(root.querySelector("p")!.firstChild!, 2);
            reversible(type, () => expect(root.textContent).toBe("AB"));
        });

        it(`keeps an image separate from the following combining mark: ${type}`, () => {
            const root = create('<p>A<img src="/image.png" alt="Keep">\u0301B</p>');
            const paragraph = root.querySelector("p")!;
            select(paragraph.lastChild!, type === "deleteBackward" ? 1 : 0);
            reversible(type, () => {
                expect(root.querySelector("img")).not.toBeNull();
                expect(root.textContent).toBe("AB");
            });
        });
    }

    it.each(["deleteBackward", "deleteForward"] as const)("deletes an adjacent image without consuming its following accent: %s", type => {
        const root = create('<p>A<img src="/image.png" alt="Remove">\u0301B</p>');
        const p = root.querySelector("p")!;
        select(type === "deleteBackward" ? p.lastChild! : p.firstChild!, type === "deleteBackward" ? 0 : 1);
        reversible(type, () => {
            expect(root.querySelector("img")).toBeNull();
            expect(root.textContent).toBe("A\u0301B");
        });
    });

    it("preserves surrogate pairs when Intl.Segmenter is unavailable", () => {
        const root = create('<p>A<strong>😀</strong>B</p>');
        select(root.querySelector("strong")!.firstChild!, 1);
        const descriptor = Object.getOwnPropertyDescriptor(Intl, "Segmenter")!;
        Object.defineProperty(Intl, "Segmenter", { ...descriptor, value: undefined });
        try { reversible("deleteForward", () => expect(root.textContent).toBe("AB")); }
        finally { Object.defineProperty(Intl, "Segmenter", descriptor); }
    });

    it.each([false, true])("deletes through an inner table into an outer cell without merging them: reverse=%s", reverse => {
        const root = create('<table id="outer"><tbody><tr><td id="shell"><p>Before</p><table id="inner"><tbody><tr><td><strong>ABC</strong></td><td>Covered</td></tr></tbody></table><p>Tail</p></td><td id="end"><em>DEF</em></td></tr></tbody></table>');
        select(root.querySelector("strong")!.firstChild!, 1, root.querySelector("em")!.firstChild!, 2, reverse);
        reversible("deleteBackward", () => {
            expect(root.querySelector("#inner")!.textContent).toBe("A");
            expect(root.querySelector("#shell")!.textContent).toBe("BeforeA");
            expect(root.querySelector("#end")!.textContent).toBe("F");
            expect(root.querySelectorAll("table")).toHaveLength(2);
        });
    });

    it.each([false, true])("retains the unselected attributes of a partially covered merged cell: reverse=%s", reverse => {
        const root = create('<table><tbody><tr><td id="merged" rowspan="2" colspan="2"><strong>ABC</strong></td><td>Covered</td></tr><tr><td id="end"><em>DEF</em></td></tr></tbody></table>');
        select(root.querySelector("strong")!.firstChild!, 1, root.querySelector("em")!.firstChild!, 2, reverse);
        reversible("deleteForward", () => {
            const merged = root.querySelector("#merged")!;
            expect(merged.getAttribute("rowspan")).toBe("2");
            expect(merged.getAttribute("colspan")).toBe("2");
            expect(merged.textContent).toBe("A");
            expect(root.querySelector("#end")!.textContent).toBe("F");
            expect(root.querySelectorAll("td")).toHaveLength(2);
        });
    });

    it("preserves an unselected empty cell and image when a neighboring cell is removed", () => {
        const root = create('<table><tbody><tr><td><strong>ABC</strong></td><td id="empty"></td><td><img src="/image.png" alt="Keep"></td></tr></tbody></table>');
        const text = root.querySelector("strong")!.firstChild!;
        select(text, 0, text, 3);
        reversible("deleteBackward", () => {
            expect(root.querySelectorAll("td")).toHaveLength(2);
            expect(root.querySelector("#empty")).not.toBeNull();
            expect(root.querySelector("img")!.getAttribute("alt")).toBe("Keep");
        });
    });
});
