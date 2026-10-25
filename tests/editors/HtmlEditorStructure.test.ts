import { afterEach, describe, expect, it } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";
import type { HtmlEditorNode } from "../../src/components/editors/htmleditor/HtmlEditorModel";
import { applyHtmlEditorCommand } from "../../src/components/editors/htmleditor/HtmlEditorCommands";

describe("HtmlEditor structural boundaries", () => {
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
    const reversible = (command: Parameters<HtmlEditor["execute"]>[0], check: () => void) => {
        const before = editor.html, saved = editor.selection;
        expect(editor.execute(command)).toBe(true);
        check();
        const after = editor.html;
        const ids: string[] = [];
        const visit = (nodes: HtmlEditorNode[]) => nodes.forEach(node => { ids.push(node.id); if (node.type === "element") visit(node.children); });
        visit(editor.document.children);
        expect(new Set(ids).size).toBe(ids.length);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(saved);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(editor.html).toBe(after);
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    it.each(["ul", "ol"])("exits the first nonempty %s item without losing formatting or following items", tag => {
        const root = create(`<${tag} start="5">\n<li id="first" class="note"><strong>ABC</strong></li>\n<li>Next</li>\n</${tag}>`);
        select(root.querySelector("strong")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.firstElementChild!.tagName).toBe("P");
            expect(root.querySelector("#first")!.className).toBe("note");
            expect(root.querySelector("#first strong")!.textContent).toBe("ABC");
            expect(root.querySelectorAll("li")).toHaveLength(1);
            if (tag === "ol") expect(root.querySelector("ol")!.getAttribute("start")).toBe("6");
            expect(editor.nativeSelection?.anchorOffset).toBe(0);
        });
    });

    it("preserves a structured first item when exiting its list", () => {
        const root = create('<ul><li id="item"><h2>A</h2><p>B</p><ul><li>Nested</li></ul></li><li>Following</li></ul>');
        select(root.querySelector("h2")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#item")!.tagName).toBe("DIV");
            expect(root.querySelector("#item")!.textContent).toBe("ABNested");
            expect(root.lastElementChild!.textContent).toBe("Following");
        });
    });

    it("lifts a nonempty first nested item and preserves the parent's following content", () => {
        const root = create('<ol><li id="parent"><p>Parent</p><ul><li id="lift"><p><em>Child</em></p><p>More</p></li><li>Following</li></ul><p>Tail</p></li><li>Last</li></ol>');
        select(root.querySelector("em")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#parent")!.textContent).toBe("Parent");
            expect(root.querySelector("#lift")!.parentElement!.tagName).toBe("OL");
            expect(root.querySelector("#lift")!.textContent).toBe("ChildMoreFollowingTail");
            expect(root.querySelectorAll("ol > li")).toHaveLength(3);
        });
    });

    it("does not exit a list from a later paragraph or a protected container", () => {
        const root = create('<ul><li><p>A</p><p id="second">B</p></li></ul>');
        select(root.querySelector("#second")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("li")!.innerHTML).toBe("<p>AB</p>");
        });
        editor.setHtml('<ul><li><section><p>A</p></section></li></ul>');
        select(root.querySelector("p")!.firstChild!, 0);
        expect(editor.execute({ type: "deleteBackward" })).toBe(false);
    });

    it("counts items rather than source whitespace when preserving reversed numbering", () => {
        const root = create('<ol reversed>\n<li><strong>A</strong></li>\n<li>B</li>\n<li>C</li>\n</ol>');
        select(root.querySelector("strong")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("ol")!.getAttribute("start")).toBe("2");
            expect(root.querySelectorAll("ol > li")).toHaveLength(2);
        });
    });

    it.each(["flex", "grid"])("protects an empty %s item while allowing paragraph joins inside it", display => {
        const root = create(`<section style="display:${display}"><div id="left"><p>Left</p></div><div id="right"><p></p></div></section>`);
        const empty = root.querySelector("#right > p")!;
        select(empty, 0);
        const before = editor.html, selection = editor.selection;
        for (const type of ["deleteBackward", "deleteForward"] as const) {
            expect(editor.execute({ type })).toBe(false);
            expect(editor.html).toBe(before);
            expect(editor.selection).toEqual(selection);
            expect(editor.canUndo).toBe(false);
        }
        editor.setHtml(`<section style="display:${display}"><div><p>Left</p></div><div id="right"><p>Inside</p><p></p></div></section>`);
        select(root.querySelector("#right")!.lastElementChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelectorAll("section > div")).toHaveLength(2);
            expect(root.querySelectorAll("#right > p")).toHaveLength(1);
            expect(root.querySelector("#right")!.textContent).toBe("Inside");
        });
    });

    it.each(["deleteBackward", "deleteForward"] as const)("joins paragraphs across source whitespace using %s", type => {
        const root = create('<div><p>A</p>\n  <p>B</p></div>');
        const paragraphs = root.querySelectorAll("p");
        select(paragraphs[type === "deleteBackward" ? 1 : 0].firstChild!, type === "deleteBackward" ? 0 : 1);
        reversible({ type }, () => {
            expect(root.querySelectorAll("p")).toHaveLength(1);
            expect(root.querySelector("p")!.textContent).toBe("AB");
        });
    });

    it.each(["pre", "figcaption", "summary"])("keeps %s boundaries protected in both directions", tag => {
        const root = create(`<div><p>A</p><${tag}>B</${tag}><p>C</p></div>`);
        const cases = [
            { node: root.querySelector(tag)!.firstChild!, offset: 0, type: "deleteBackward" },
            { node: root.querySelector(tag)!.firstChild!, offset: 1, type: "deleteForward" },
            { node: root.querySelector("p")!.firstChild!, offset: 1, type: "deleteForward" },
            { node: root.querySelector("p:last-child")!.firstChild!, offset: 0, type: "deleteBackward" }
        ] as const;
        const before = editor.html;
        for (const { node, offset, type } of cases) {
            select(node, offset);
            expect(editor.execute({ type })).toBe(false);
            expect(editor.html).toBe(before);
            expect(editor.canUndo).toBe(false);
        }
    });

    it("does not skip an authored nonbreaking space between blocks", () => {
        const root = create('<div><p>A</p>&nbsp;<p>B</p></div>');
        select(root.querySelector("p:last-child")!.firstChild!, 0);
        const before = editor.html;
        expect(editor.execute({ type: "deleteBackward" })).toBe(false);
        expect(editor.html).toBe(before);
    });

    it("keeps an empty table cell while deleting an internal empty paragraph", () => {
        const root = create('<table><tbody><tr><td>A</td><td id="cell"><p>B</p><p></p></td></tr></tbody></table>');
        select(root.querySelector("#cell")!.lastElementChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelectorAll("td")).toHaveLength(2);
            expect(root.querySelector("#cell")!.innerHTML).toBe("<p>B</p>");
        });
    });

    it.each(["deleteBackward", "deleteForward"] as const)("joins pasted heading content across list items with %s", type => {
        const root = create('<ul><li id="left">Keep the message focused</li><li id="paste"></li><li>Give each section a purpose</li></ul>');
        select(root.querySelector("#paste")!, 0);
        expect(editor.execute({ type: "insertHtml", html: '<h2 id="title">Edit and accept content</h2><p>Description</p><ul><li>Nested</li></ul>' })).toBe(true);
        const pasted = editor.html;
        const target = type === "deleteBackward" ? root.querySelector("h2")! : root.querySelector("#left")!;
        select(target.firstChild!, type === "deleteBackward" ? 0 : target.textContent!.length);
        reversible({ type }, () => {
            expect(root.querySelectorAll("ul > li#paste")).toHaveLength(0);
            expect(root.querySelector("#left")!.textContent).toBe("Keep the message focusedEdit and accept contentDescriptionNested");
            expect(root.querySelector("#left > p")!.textContent).toBe("Description");
            expect(root.querySelector("#left > ul > li")!.textContent).toBe("Nested");
            expect(editor.nativeSelection?.anchorOffset).toBe("Keep the message focused".length);
            expect(root.querySelector("ul")!.lastElementChild!.textContent).toBe("Give each section a purpose");
        });
        editor.execute({ type: "undo" });
        expect(editor.html).toBe(pasted);
        editor.execute({ type: "undo" });
        expect(root.querySelector("h2")).toBeNull();
        editor.execute({ type: "redo" });
        expect(editor.html).toBe(pasted);
    });

    it.each(["deleteBackward", "deleteForward"] as const)("joins every inline/structured item combination with %s", type => {
        for (const left of ['<strong>A</strong>', '<p><strong>A</strong></p>', '<p>Before</p><h2><strong>A</strong></h2>']) {
            for (const right of ['<em>B</em>', '<h2><em>B</em></h2>', '<h2><em>B</em></h2><p>After</p>']) {
                const root = create(`<ol><li id="a">${left}</li><li id="b">${right}</li></ol>`);
                const text = root.querySelector(type === "deleteBackward" ? "em" : "strong")!.firstChild!;
                select(text, type === "deleteBackward" ? 0 : 1);
                reversible({ type }, () => {
                    expect(root.querySelectorAll("ol > li")).toHaveLength(1);
                    expect(root.querySelector("strong")?.textContent).toBe("A");
                    expect(root.querySelector("em")?.textContent).toBe("B");
                    expect(root.textContent).toBe(`${left.includes("Before") ? "Before" : ""}AB${right.includes("After") ? "After" : ""}`);
                    expect(editor.nativeSelection?.anchorNode?.textContent).toBe("A");
                    expect(editor.nativeSelection?.anchorOffset).toBe(1);
                });
                editor.dispose();
                document.body.replaceChildren();
            }
        }
    });

    it.each(["deleteBackward", "deleteForward"] as const)("resolves mixed inline item edges with %s", type => {
        const root = create('<ul><li id="a"><p>Before</p><strong>A</strong></li><li id="b"><em>B</em><p>After</p></li></ul>');
        select(root.querySelector(type === "deleteBackward" ? "em" : "strong")!.firstChild!, type === "deleteBackward" ? 0 : 1);
        reversible({ type }, () => {
            expect(root.querySelectorAll("ul > li")).toHaveLength(1);
            expect(root.textContent).toBe("BeforeABAfter");
            expect(root.querySelector("strong")?.parentElement).toBe(root.querySelector("em")?.parentElement);
        });
    });

    it("keeps internal paragraph joins local instead of merging whole list items", () => {
        const root = create('<ul><li>A</li><li id="item"><p>B</p><h2>C</h2><p>D</p></li></ul>');
        select(root.querySelector("h2")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelectorAll("ul > li")).toHaveLength(2);
            expect(root.querySelector("#item")!.innerHTML).toBe('<p>BC</p><p>D</p>');
        });
    });

    it("uses the actual trailing empty paragraph as a list edge", () => {
        const root = create('<ul><li><p>A</p><p></p></li></ul><p>B</p>');
        select(root.lastChild!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelectorAll("li > p")).toHaveLength(2);
            expect(root.querySelector("li")!.lastElementChild!.textContent).toBe("B");
            expect(root.textContent).toBe("AB");
        });
    });

    it.each(['<section><p>A</p></section>', '<table><tbody><tr><td>A</td></tr></tbody></table>', '<ul><li>A</li></ul>'])("does not cross protected item edges: %s", protectedHtml => {
        const root = create(`<ul><li>${protectedHtml}</li><li><h2>B</h2></li></ul>`);
        select(root.querySelector("h2")!.firstChild!, 0);
        const before = editor.html;
        expect(editor.execute({ type: "deleteBackward" })).toBe(false);
        expect(editor.html).toBe(before);
        expect(editor.canUndo).toBe(false);
    });

    it.each(['<section><p>A</p></section>', '<table><tbody><tr><td>A</td></tr></tbody></table>'])("does not merge an external paragraph into a protected list descendant: %s", protectedHtml => {
        const root = create(`<ul><li>${protectedHtml}</li></ul><p>B</p>`);
        select(root.lastChild!.firstChild!, 0);
        const before = editor.html;
        expect(editor.execute({ type: "deleteBackward" })).toBe(false);
        expect(editor.html).toBe(before);
    });

    it.each(["deleteBackward", "deleteForward"] as const)("does not fall back to merging a structured item across a protected edge with %s", type => {
        const protectedHtml = '<section><p>Protected</p></section>';
        const root = create(type === "deleteBackward" ? `<ul><li>${protectedHtml}</li><li id="plain">B</li></ul>`
            : `<ul><li id="plain">B</li><li>${protectedHtml}</li></ul>`);
        select(root.querySelector("#plain")!.firstChild!, type === "deleteBackward" ? 0 : 1);
        const before = editor.html;
        expect(editor.execute({ type })).toBe(false);
        expect(editor.html).toBe(before);
        expect(editor.canUndo).toBe(false);
    });

    it.each(["div", "section", "blockquote", "figure", "td", "th"])("splits inline content inside %s without splitting its structural shell", tag => {
        const html = ["td", "th"].includes(tag) ? `<table><tbody><tr><${tag} id="shell">AB</${tag}></tr></tbody></table>` : `<${tag} id="shell" style="display:grid">AB</${tag}>`;
        const root = create(html), shell = root.querySelector("#shell")!;
        select(shell.firstChild!, 1);
        reversible({ type: "insertParagraph" }, () => {
            const result = root.querySelector("#shell")!;
            expect(root.querySelectorAll("#shell")).toHaveLength(1);
            expect([...result.children].map(node => node.tagName)).toEqual(["P", "P"]);
            expect([...result.children].map(node => node.textContent)).toEqual(["A", "B"]);
            expect(editor.nativeSelection?.anchorOffset).toBe(0);
        });
    });

    it.each(["p", "h2", "dt", "dd", "figcaption", "summary"])("splits the %s text block according to its behavior", tag => {
        const root = create(`<${tag} id="first"><strong>AB</strong></${tag}>`);
        select(root.querySelector("strong")!.firstChild!, 1);
        reversible({ type: "insertParagraph" }, () => {
            expect(root.children).toHaveLength(2);
            expect(root.children[1].tagName.toLowerCase()).toBe(tag === "h2" ? "p" : tag);
            expect(root.textContent).toBe("AB");
            expect(root.querySelectorAll("#first")).toHaveLength(1);
        });
    });

    it.each(["img", "video", "hr"])("deletes atomic %s at root gaps from either direction", tag => {
        const root = create(`<p>A</p><${tag}></${tag}><p>B</p>`);
        const atom = root.querySelector(tag)!, parent = atom.parentNode!;
        select(parent, [...parent.childNodes].indexOf(atom) + 1);
        reversible({ type: "deleteBackward" }, () => { expect(root.querySelector(tag)).toBeNull(); expect(root.textContent).toBe("AB"); });
        editor.execute({ type: "undo" });
        const restored = root.querySelector(tag)!, restoredParent = restored.parentNode!;
        select(restoredParent, [...restoredParent.childNodes].indexOf(restored));
        reversible({ type: "deleteForward" }, () => expect(root.querySelector(tag)).toBeNull());
    });

    it.each(["deleteBackward", "deleteForward"] as const)("joins text blocks from equivalent root gaps with %s", type => {
        const root = create('<p>A</p><h2>B</h2>');
        select(root, 1);
        reversible({ type }, () => { expect(root.children).toHaveLength(1); expect(root.textContent).toBe("AB"); expect(editor.nativeSelection?.anchorOffset).toBe(1); });
    });

    it("handles logically collapsed ranges expressed with different inline endpoints", () => {
        const root = create('<p><strong>A</strong><em>B</em></p>');
        select(root.querySelector("strong")!.firstChild!, 1, root.querySelector("em")!.firstChild!, 0);
        reversible({ type: "insertText", text: "X" }, () => expect(root.textContent).toBe("AXB"));
    });

    it.each([false, true])("replaces cross-block ranges in either direction: backwards=%s", backwards => {
        const root = create('<section><p><strong>ABC</strong></p><h2>DEF</h2><p>GHI</p></section>');
        const a = root.querySelector("strong")!.firstChild!, b = root.querySelectorAll("p")[1].firstChild!;
        if (backwards) select(b, 2, a, 1); else select(a, 1, b, 2);
        reversible({ type: "insertText", text: "X" }, () => {
            expect(root.querySelector("section")!.children).toHaveLength(2);
            expect([...root.querySelector("section")!.children].map(node => node.textContent)).toEqual(["AX", "I"]);
            expect(root.textContent).toBe("AXI");
        });
    });

    it.each(["td", "th"])("accepts HTML paste inside a %s without replacing the cell", tag => {
        const root = create(`<table><tbody><tr><${tag} id="cell">AB</${tag}><td>Other</td></tr></tbody></table>`);
        select(root.querySelector("#cell")!.firstChild!, 1);
        reversible({ type: "insertHtml", html: '<p><strong>X</strong></p><p>Y</p>' }, () => {
            expect(root.querySelectorAll("tr > *")).toHaveLength(2);
            expect(root.querySelector("#cell")!.textContent).toBe("AXYB");
            expect(root.querySelector("#cell strong")!.textContent).toBe("X");
        });
    });

    it.each(['<div style="display:flex"><p>Layout</p></div>', '<table><tbody><tr><td>Cell</td></tr></tbody></table>', '<ul><li>Item</li></ul>'])("removes fully covered intermediate structure while preserving partial endpoints: %s", middle => {
        const root = create(`<p>ABC</p>${middle}<p>DEF</p>`);
        select(root.firstChild!.firstChild!, 1, root.lastChild!.firstChild!, 2);
        reversible({ type: "insertText", text: "X" }, () => expect(editor.html).toBe('<p>AX</p><p>F</p>'));
    });

    it("deletes partial content across cells without merging their shells", () => {
        const root = create('<table><tbody><tr><td>ABC</td><td>DEF</td></tr></tbody></table>');
        const cells = root.querySelectorAll("td");
        select(cells[0].firstChild!, 1, cells[1].firstChild!, 2);
        reversible({ type: "deleteBackward" }, () => expect([...root.querySelectorAll("td")].map(cell => cell.textContent)).toEqual(["A", "F"]));
        editor.execute({ type: "undo" });
        const restored = root.querySelectorAll("td");
        select(restored[0].firstChild!, 1, restored[0].firstChild!, 2);
        reversible({ type: "insertText", text: "X" }, () => expect(root.querySelector("td")!.textContent).toBe("AXC"));
    });

    it("does not merge adjacent layout containers or cells", () => {
        const root = create('<div>A</div><section>B</section>');
        select(root.lastChild!.firstChild!, 0);
        expect(editor.execute({ type: "deleteBackward" })).toBe(false);
        expect(root.children).toHaveLength(2);
    });

    it("joins a paragraph before a list on Delete with its caret at the join", () => {
        const root = create('<p>Before</p><ul><li>Item</li><li>Next</li></ul>');
        select(root.firstChild!.firstChild!, 6);
        reversible({ type: "deleteForward" }, () => {
            expect(root.querySelector("li")!.textContent).toBe("BeforeItem");
            expect(editor.nativeSelection?.anchorNode?.textContent).toBe("Before");
            expect(editor.nativeSelection?.anchorOffset).toBe(6);
        });
    });

    it.each(["div", "td", "li"])("edits mixed inline/block content in %s while preserving the outer structure", tag => {
        const content = `<${tag} id="shell">AB<p>Middle</p>CD</${tag}>`;
        const html = tag === "td" ? `<table><tbody><tr>${content}</tr></tbody></table>` : tag === "li" ? `<ul>${content}</ul>` : content;
        const root = create(html), shell = root.querySelector("#shell")!;
        select(shell.firstChild!, 1);
        reversible({ type: "deleteForward" }, () => {
            expect(root.querySelector("#shell")!.textContent).toBe("AMiddleCD");
            expect(root.querySelector("#shell")!.children[0].tagName).toBe("P");
        });
    });

    it("splits a paragraph inside a structured list item and transfers following content to the next item", () => {
        const root = create('<ul><li id="owner"><p id="text">AB</p><ul><li>Nested</li></ul><p>Tail</p></li><li>Next</li></ul>');
        select(root.querySelector("#text")!.firstChild!, 1);
        reversible({ type: "insertParagraph" }, () => {
            const items = root.firstElementChild!.children;
            expect(items).toHaveLength(3);
            expect(items[0].textContent).toBe("A");
            expect(items[1].textContent).toBe("BNestedTail");
            expect(items[2].textContent).toBe("Next");
            expect(root.querySelectorAll("#owner")).toHaveLength(1);
            expect(root.querySelectorAll("#text")).toHaveLength(1);
        });
    });

    it.each(["div", "td"])("formats text directly in %s without removing the shell", tag => {
        const html = tag === "td" ? '<table><tbody><tr><td id="shell">AB</td></tr></tbody></table>' : '<div id="shell">AB</div>';
        const root = create(html), shell = root.querySelector("#shell")!;
        select(shell.firstChild!, 0, shell.firstChild!, 2);
        reversible({ type: "bold" }, () => expect(root.querySelector("#shell strong")?.textContent).toBe("AB"));
    });

    it.each(["div", "td"])("uses a view-only filler in an empty %s", tag => {
        const root = create(tag === "td" ? '<table><tbody><tr><td></td></tr></tbody></table>' : '<div></div>');
        expect(root.querySelector(`${tag} > br[data-elg-html-editor-placeholder]`)).not.toBeNull();
        expect(editor.html).not.toContain("placeholder");
        select(root.querySelector(tag)!, 0);
        reversible({ type: "insertText", text: "A" }, () => expect(root.querySelector(tag)?.textContent).toBe("A"));
    });

    it("maps both parent-boundary endpoints when materializing an inline run", () => {
        const root = create('<div>A<strong>B</strong><p>Block</p></div>');
        const shell = root.firstChild!;
        select(shell, 0, shell, 2);
        reversible({ type: "insertText", text: "X" }, () => expect(root.textContent).toBe("XBlock"));
    });

    it("does not change model state for stale identities, invalid offsets or rejected ranges", () => {
        create('<p>AB</p>');
        const model = editor.document, textId = model.children[0].children[0].id;
        for (const point of [{ nodeId: "stale", offset: 0 }, { nodeId: textId, offset: -1 }, { nodeId: textId, offset: 9 }, { nodeId: textId, offset: 0.5 }]) {
            expect(applyHtmlEditorCommand({ document: model, selection: { anchor: point, focus: point } }, "root", { type: "insertText", text: "X" }, () => "new")).toBeUndefined();
        }
        expect(editor.document).toEqual(model);
    });

    it("supports a hard break at a root gap", () => {
        const root = create('<p>A</p><p>B</p>');
        select(root, 1);
        reversible({ type: "insertLineBreak" }, () => {
            expect(root.children).toHaveLength(3);
            expect(root.children[1].querySelector("br")).not.toBeNull();
        });
    });

    it.each([false, true])("replaces whole root blocks selected through text endpoints: backwards=%s", backwards => {
        const root = create('<p>First</p><ul><li>Last</li></ul>');
        const a = root.firstChild!.firstChild!, b = root.querySelector("li")!.firstChild!;
        if (backwards) select(b, 4, a, 0); else select(a, 0, b, 4);
        reversible({ type: "insertText", text: "New" }, () => {
            expect(root.children).toHaveLength(1);
            expect(root.firstElementChild?.tagName).toBe("P");
            expect(root.textContent).toBe("New");
        });
    });

    it("removes a table when all of its content is selected", () => {
        const root = create('<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>');
        const cells = root.querySelectorAll("td");
        select(cells[0].firstChild!, 0, cells[1].firstChild!, 1);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("table")).toBeNull();
            expect(editor.html).toBe("<p></p>");
        });
    });

    it("retains an authored structural wrapper during normalization", () => {
        const root = create('<h2><div id="layout" style="display:grid"><p>Title</p></div></h2>');
        expect(root.querySelector("#layout")?.getAttribute("style")).toContain("display: grid");
        expect(root.querySelector("#layout p")?.textContent).toBe("Title");
        editor.setHtml(editor.html);
        expect(root.querySelector("#layout p")?.textContent).toBe("Title");
    });

});
