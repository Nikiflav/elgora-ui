import { afterEach, describe, expect, it } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";
import type { HtmlEditorNode } from "../../src/components/editors/htmleditor/HtmlEditorModel";

describe("HtmlEditor fragment placement", () => {
    let editor: HtmlEditor;
    const create = (html: string) => {
        editor = new HtmlEditor({ value: html });
        editor.mount(document.body);
        return editor.content;
    };
    const select = (node: Node, offset: number, end = node, endOffset = offset) => {
        document.getSelection()!.setBaseAndExtent(node, offset, end, endOffset);
        document.dispatchEvent(new Event("selectionchange"));
    };
    const paste = (html: string, check: () => void) => {
        const before = editor.html, selection = editor.selection;
        expect(editor.execute({ type: "insertHtml", html })).toBe(true);
        check();
        const after = editor.html;
        const ids: string[] = [], authored: string[] = [];
        const visit = (nodes: HtmlEditorNode[]) => nodes.forEach(node => {
            ids.push(node.id);
            if (node.type === "element") { if (node.attributes.id) authored.push(node.attributes.id); visit(node.children); }
        });
        visit(editor.document.children);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(authored).size).toBe(authored.length);
        expect(editor.restoreSelection()).toBe(true);
        editor.execute({ type: "undo" });
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        editor.execute({ type: "redo" });
        expect(editor.html).toBe(after);
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    it.each(["<strong>X</strong>", "<p><strong>X</strong></p>"])("keeps an inline fragment inside a heading: %s", html => {
        const root = create('<h2 id="title">AB</h2>');
        select(root.firstChild!.firstChild!, 1);
        paste(html, () => {
            expect(root.children).toHaveLength(1);
            expect(root.firstElementChild?.tagName).toBe("H2");
            expect(root.querySelector("#title strong")?.textContent).toBe("X");
            expect(root.textContent).toBe("AXB");
        });
    });

    it.each([0, 1, 2])("splits the paragraph around a pasted list at offset %s", offset => {
        const root = create('<p id="paragraph"><em>AB</em></p>');
        select(root.querySelector("em")!.firstChild!, offset);
        paste('<ul><li>X</li><li>Y</li></ul>', () => {
            expect(root.querySelectorAll("ul")).toHaveLength(1);
            expect(root.querySelector("p ul")).toBeNull();
            expect(root.textContent).toBe(`${"AB".slice(0, offset)}XY${"AB".slice(offset)}`);
            expect(editor.nativeSelection?.anchorOffset).toBe(0);
        });
    });

    it("preserves an authored block and its styles instead of flattening them into surrounding text", () => {
        const root = create('<p>AB</p>');
        select(root.firstChild!.firstChild!, 1);
        paste('<p class="note" style="color:red">X</p>', () => {
            expect(root.children).toHaveLength(3);
            expect(root.querySelector(".note")?.getAttribute("style")).toContain("color: red");
            expect(root.textContent).toBe("AXB");
        });
    });

    it("preserves a flex/grid shell and places a table between paragraphs inside it", () => {
        const root = create('<section style="display:grid"><div id="card"><p>AB</p></div><div>Other</div></section>');
        select(root.querySelector("#card p")!.firstChild!, 1);
        paste('<table><tbody><tr><td>X</td><td>Y</td></tr></tbody></table>', () => {
            expect([...root.querySelector("#card")!.children].map(node => node.tagName)).toEqual(["P", "TABLE", "P"]);
            expect(root.querySelector("section")!.children).toHaveLength(2);
            expect(root.querySelector("section")!.getAttribute("style")).toContain("display: grid");
        });
    });

    it.each(["td", "li", "div"])("places structural content inside an inline %s host", tag => {
        const body = `<${tag} id="host">AB</${tag}>`;
        const root = create(tag === "td" ? `<table><tbody><tr>${body}<td>Other</td></tr></tbody></table>` : tag === "li" ? `<ul>${body}<li>Other</li></ul>` : body);
        select(root.querySelector("#host")!.firstChild!, 1);
        paste('<section class="inserted"><p>X</p></section>', () => {
            const host = root.querySelector("#host")!;
            expect(host.tagName.toLowerCase()).toBe(tag);
            expect([...host.children].map(node => node.tagName)).toEqual(["P", "SECTION", "P"]);
            expect(host.textContent).toBe("AXB");
            expect(root.querySelectorAll(".inserted")).toHaveLength(1);
        });
    });

    it("keeps a pasted list nested inside the current item", () => {
        const root = create('<ul><li id="host">AB</li><li>Other</li></ul>');
        select(root.querySelector("#host")!.firstChild!, 1);
        paste('<ol start="5"><li>X</li></ol>', () => {
            expect(root.querySelector("#host ol")?.getAttribute("start")).toBe("5");
            expect(root.firstElementChild!.children).toHaveLength(2);
            expect(root.querySelector("#host")?.textContent).toBe("AXB");
        });
    });

    it.each([false, true])("replaces a selected range across compatible paragraphs: backwards=%s", backwards => {
        const root = create('<p>ABC</p><p>DEF</p>');
        const a = root.firstChild!.firstChild!, b = root.lastChild!.firstChild!;
        if (backwards) select(b, 2, a, 1); else select(a, 1, b, 2);
        paste('<ul><li>X</li></ul>', () => {
            expect([...root.children].map(node => node.tagName)).toEqual(["P", "UL", "P"]);
            expect(root.textContent).toBe("AXF");
        });
    });

    it("fits orphan list items and table cells at flow positions without losing their grouping", () => {
        const root = create('<p>AB</p>');
        select(root.firstChild!.firstChild!, 1);
        paste('<li>X</li><li>Y</li>', () => {
            expect(root.querySelectorAll("ul")).toHaveLength(1);
            expect(root.querySelectorAll("ul > li")).toHaveLength(2);
        });
        editor.execute({ type: "undo" });
        select(root.firstChild!.firstChild!, 1);
        paste('<td>X</td><th>Y</th>', () => {
            expect(root.querySelectorAll("table")).toHaveLength(1);
            expect(root.querySelectorAll("tr")).toHaveLength(1);
            expect(root.querySelectorAll("tr > *")).toHaveLength(2);
        });
    });

    it("inserts cells at a row boundary but rejects paragraphs there", () => {
        const root = create('<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>');
        const row = root.querySelector("tr")!;
        select(row, 1);
        paste('<td>X</td><td>Y</td>', () => expect(root.querySelector("tr")!.children).toHaveLength(4));
        const before = editor.html;
        // Insertion now leaves a usable text caret in Y. Explicitly return to
        // the structural row gap to test its child compatibility rule.
        select(root.querySelector("tr")!, 3);
        expect(editor.execute({ type: "insertHtml", html: '<p>Invalid here</p>' })).toBe(false);
        expect(editor.html).toBe(before);
    });

    it("inserts one rich-text item at an explicit list gap", () => {
        const root = create('<ul><li>A</li><li>B</li></ul>');
        select(root.firstChild!, 1);
        paste('<strong>X</strong> and <em>Y</em>', () => {
            const items = root.querySelectorAll("li");
            expect(items).toHaveLength(3);
            expect(items[1].innerHTML).toBe('<strong>X</strong> and <em>Y</em>');
        });
    });

    it("retains a pasted list's own presentation at an explicit list gap", () => {
        const root = create('<ul><li>A</li><li>B</li></ul>');
        select(root.firstChild!, 1);
        paste('<ul class="special"><li>X</li></ul>', () => {
            expect(root.firstElementChild!.children).toHaveLength(3);
            expect(root.querySelector("li > ul.special")?.textContent).toBe("X");
        });
    });

    it("splits nested inline wrappers around a structural fragment without duplicate authored IDs", () => {
        const root = create('<p><a id="link" href="/page"><strong id="bold">AB</strong></a></p>');
        select(root.querySelector("strong")!.firstChild!, 1);
        paste('<hr>', () => {
            expect([...root.children].map(node => node.tagName)).toEqual(["P", "HR", "P"]);
            expect(root.querySelectorAll('a[href="/page"]')).toHaveLength(2);
            expect(root.querySelectorAll("#link")).toHaveLength(1);
            expect(root.querySelectorAll("#bold")).toHaveLength(1);
        });
    });

    it("does not fall back to native editing for malformed inline/block nesting", () => {
        const root = create('<p>AB</p>');
        select(root.firstChild!.firstChild!, 1);
        const before = editor.html;
        expect(editor.execute({ type: "insertHtml", html: '<span><div>Invalid</div></span>' })).toBe(false);
        expect(editor.html).toBe(before);
        expect(editor.canUndo).toBe(false);
    });

    it("preserves distinct authored IDs and rewrites fragment-local references on collision", () => {
        const root = create('<p id="note">AB</p>');
        select(root.firstChild!.firstChild!, 1);
        paste('<section id="note"><p aria-labelledby="label"><strong id="label">X</strong><a href="#note">Jump</a></p></section>', () => {
            expect(root.querySelector("section")?.id).toBe("note-2");
            expect(root.querySelector("section a")?.getAttribute("href")).toBe("#note-2");
            expect(root.querySelectorAll("#note")).toHaveLength(1);
        });
    });

    it("keeps the caret after an inserted block so subsequent typing does not enter it", () => {
        const root = create('<p>A</p>');
        select(root.firstChild!.firstChild!, 1);
        paste('<table><tbody><tr><td>X</td></tr></tbody></table>', () => expect(editor.nativeSelection?.anchorNode).toBe(root.lastChild));
        expect(editor.execute({ type: "insertText", text: "After" })).toBe(true);
        expect(root.querySelector("td")?.textContent).toBe("X");
        expect(root.lastElementChild?.textContent).toBe("After");
    });

    it("does not erase a selection when sanitized HTML and its text fallback are empty", () => {
        const root = create('<p>Keep</p>');
        select(root.firstChild!.firstChild!, 0, root.firstChild!.firstChild!, 4);
        const event = new Event("paste", { cancelable: true });
        Object.defineProperty(event, "clipboardData", { value: { getData: (type: string) => type === "text/html" ? '<script>bad()</script>' : '' } });
        root.dispatchEvent(event);
        expect(root.textContent).toBe("Keep");
        expect(editor.canUndo).toBe(false);
    });

    it("replaces a partial cross-cell range at its surviving start position", () => {
        const root = create('<table><tbody><tr><td>AB</td><td>CD</td></tr></tbody></table>');
        const cells = root.querySelectorAll("td");
        select(cells[0].firstChild!, 1, cells[1].firstChild!, 1);
        paste('<p>X</p>', () => expect([...root.querySelectorAll("td")].map(cell => cell.textContent)).toEqual(["AX", "D"]));
    });
});
