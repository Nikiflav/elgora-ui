import { afterEach, describe, expect, it } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";
import type { HtmlEditorNode } from "../../src/components/editors/htmleditor/HtmlEditorModel";

describe("HtmlEditor recursive structural ranges", () => {
    let editor: HtmlEditor;
    const create = (html: string) => {
        editor = new HtmlEditor({ value: html });
        editor.mount(document.body);
        return editor.content;
    };
    const select = (a: Node, from: number, b: Node, to: number, reverse = false) => {
        document.getSelection()!.setBaseAndExtent(reverse ? b : a, reverse ? to : from, reverse ? a : b, reverse ? from : to);
        document.dispatchEvent(new Event("selectionchange"));
    };
    const reversible = (command: Parameters<HtmlEditor["execute"]>[0], check: () => void) => {
        const html = editor.html, selection = editor.selection;
        expect(editor.execute(command)).toBe(true);
        check();
        const after = editor.html, caret = editor.selection;
        const ids: string[] = [];
        const visit = (nodes: HtmlEditorNode[]) => nodes.forEach(node => { ids.push(node.id); if (node.type === "element") visit(node.children); });
        visit(editor.document.children);
        expect(new Set(ids).size).toBe(ids.length);
        expect(editor.restoreSelection()).toBe(true);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(html);
        expect(editor.selection).toEqual(selection);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(editor.html).toBe(after);
        expect(editor.selection).toEqual(caret);
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    it.each([false, true])("cleans table shells emptied by deleting cells despite source indentation: reverse=%s", reverse => {
        const root = create('<p>Before</p><table>\n<tbody>\n<tr>\n<td>ABC</td>\n</tr>\n</tbody>\n</table><p>After</p>');
        const cell = root.querySelector("td")!.firstChild!;
        select(cell, 0, cell, 3, reverse);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("table")).toBeNull();
            expect(root.textContent).toBe("BeforeAfter");
        });
        expect(editor.execute({ type: "insertText", text: "X" })).toBe(true);
        expect(root.textContent).toBe("BeforeXAfter");
    });

    it("removes an emptied row but retains other cells and an authored empty row", () => {
        const root = create('<table><tbody><tr id="remove">\n<td>ABC</td>\n</tr><tr id="empty"></tr><tr><td>Keep</td></tr></tbody></table>');
        const cell = root.querySelector("td")!.firstChild!;
        select(cell, 0, cell, 3);
        reversible({ type: "deleteForward" }, () => {
            expect(root.querySelector("#remove")).toBeNull();
            expect(root.querySelector("#empty")).not.toBeNull();
            expect(root.querySelector("td")!.textContent).toBe("Keep");
        });
    });

    it("does not discard an unselected caption while cleaning the table body", () => {
        const root = create('<table><caption>Keep caption</caption><tbody>\n<tr>\n<td>ABC</td>\n</tr>\n</tbody></table>');
        const cell = root.querySelector("td")!.firstChild!;
        select(cell, 0, cell, 3);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("tbody")).toBeNull();
            expect(root.querySelector("caption")!.textContent).toBe("Keep caption");
        });
    });

    it.each([false, true])("replaces from a table into a list while retaining both partial shells: reverse=%s", reverse => {
        const root = create('<p>Before</p><table id="table"><tbody><tr><td id="cell"><strong>ABC</strong></td><td>Covered</td></tr></tbody></table><section>Covered layout</section><ul id="list"><li>Covered item</li><li id="item"><em>DEF</em><p>Tail</p></li><li>Last</li></ul><p>After</p>');
        select(root.querySelector("strong")!.firstChild!, 1, root.querySelector("em")!.firstChild!, 2, reverse);
        reversible({ type: "insertText", text: "X" }, () => {
            expect(root.querySelector("#table")).not.toBeNull();
            expect(root.querySelectorAll("td")).toHaveLength(1);
            expect(root.querySelector("#cell")!.textContent).toBe("AX");
            expect(root.querySelector("#cell strong")!.textContent).toBe("AX");
            expect(root.querySelector("section")).toBeNull();
            expect(root.querySelector("#list")).not.toBeNull();
            expect(root.querySelector("#item")!.textContent).toBe("FTail");
            expect(root.querySelector("#item em")!.textContent).toBe("F");
            expect(root.querySelectorAll("li")).toHaveLength(2);
            expect(root.textContent).toBe("BeforeAXFTailLastAfter");
            expect(editor.nativeSelection?.anchorNode?.textContent).toBe("AX");
            expect(editor.nativeSelection?.anchorOffset).toBe(2);
        });
    });

    it.each(["deleteBackward", "deleteForward"] as const)("deletes cross-container fragments without merging partial shells: %s", type => {
        const root = create('<section id="a"><p>ABC</p></section><div id="b"><p>DEF</p></div>');
        select(root.querySelector("#a p")!.firstChild!, 1, root.querySelector("#b p")!.firstChild!, 2);
        reversible({ type }, () => expect(editor.html).toBe('<section id="a"><p>A</p></section><div id="b"><p>F</p></div>'));
    });

    it("removes a fully covered child but not its partially covered parent", () => {
        const root = create('<ul id="list"><li id="first"><p>ABC</p><p>DEF</p></li><li>Last</li></ul>');
        const p = root.querySelector("p")!;
        select(p.firstChild!, 0, p.firstChild!, 3);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#first")!.innerHTML).toBe('<p>DEF</p>');
            expect(root.querySelector("#list")).not.toBeNull();
        });
    });

    it("removes the highest fully covered ancestor while preserving outside siblings", () => {
        const root = create('<p>Before</p><section id="all"><ul><li><p>ABC</p><p>DEF</p></li></ul></section><p>After</p>');
        const ps = root.querySelectorAll("li p");
        select(ps[0].firstChild!, 0, ps[1].firstChild!, 3);
        reversible({ type: "insertText", text: "X" }, () => {
            expect(root.querySelector("#all")).toBeNull();
            expect([...root.children].map(node => node.textContent)).toEqual(["Before", "X", "After"]);
        });
    });

    it("does not treat an unselected image as selected text", () => {
        const root = create('<section id="shell"><p>ABC</p><img src="/image.png" alt="Keep"></section>');
        const text = root.querySelector("p")!.firstChild!;
        select(text, 0, text, 3);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#shell")).not.toBeNull();
            expect(root.querySelector("p")).toBeNull();
            expect(root.querySelector("img")!.getAttribute("alt")).toBe("Keep");
        });
    });

    it.each(['<p id="empty"></p>', '<p id="empty"><span></span></p>'])("preserves unselected empty structure: %s", empty => {
        const root = create(`<section id="shell"><p>ABC</p>${empty}</section>`);
        const text = root.querySelector("p")!.firstChild!;
        select(text, 0, text, 3);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#shell")).not.toBeNull();
            expect(root.querySelector("#empty")).not.toBeNull();
            expect(root.querySelectorAll("p")).toHaveLength(1);
        });
    });

    it("deletes an explicitly selected empty inline child despite equal text offsets", () => {
        const root = create('<p>A<span id="empty"></span>B</p>');
        const p = root.querySelector("p")!;
        select(p, 1, p, 2);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#empty")).toBeNull();
            expect(root.textContent).toBe("AB");
        });
    });

    it("removes explicitly selected empty children and their fully selected parent", () => {
        const root = create('<section><p></p><p></p></section><p>Keep</p>');
        select(root.querySelector("section")!, 0, root.querySelector("section")!, 2);
        reversible({ type: "deleteForward" }, () => expect(editor.html).toBe('<p>Keep</p>'));
    });

    it("inserts after the table when the starting cell was removed and a text insertion is not legal at its row gap", () => {
        const root = create('<table><tbody><tr><td>ABC</td><td>DEF</td></tr></tbody></table><p>After</p>');
        const cells = root.querySelectorAll("td");
        select(cells[0].firstChild!, 0, cells[1].firstChild!, 2);
        reversible({ type: "insertText", text: "X" }, () => {
            expect(root.querySelectorAll("td")).toHaveLength(1);
            expect(root.querySelector("td")!.textContent).toBe("F");
            expect([...root.children].map(node => node.textContent)).toEqual(["F", "X", "After"]);
        });
    });

    it("uses a legal cell fragment at the exact surviving row gap", () => {
        const root = create('<table><tbody><tr><td>ABC</td><td>DEF</td></tr></tbody></table>');
        const cells = root.querySelectorAll("td");
        select(cells[0].firstChild!, 0, cells[1].firstChild!, 2);
        reversible({ type: "insertHtml", html: '<td>X</td>' }, () => {
            expect([...root.querySelectorAll("td")].map(cell => cell.textContent)).toEqual(["X", "F"]);
            expect(root.querySelectorAll("table")).toHaveLength(1);
        });
    });

    it("keeps the caret usable for typing after deleting a range whose starting cell disappears", () => {
        const root = create('<table><tbody><tr><td>ABC</td><td>DEF</td></tr></tbody></table><p>After</p>');
        const cells = root.querySelectorAll("td");
        select(cells[0].firstChild!, 0, cells[1].firstChild!, 2);
        reversible({ type: "deleteBackward" }, () => expect(root.querySelector("td")!.textContent).toBe("F"));
        expect(editor.execute({ type: "insertText", text: "X" })).toBe(true);
        expect([...root.children].map(node => node.textContent)).toEqual(["F", "X", "After"]);
    });

    it("inserts structural HTML in a surviving start cell without merging the end item", () => {
        const root = create('<table><tbody><tr><td>ABC</td></tr></tbody></table><ul><li>DEF</li></ul>');
        select(root.querySelector("td")!.firstChild!, 1, root.querySelector("li")!.firstChild!, 2);
        reversible({ type: "insertHtml", html: '<h2>X</h2><p>Y</p>' }, () => {
            expect(root.querySelector("td")!.textContent).toBe("AXY");
            expect(root.querySelector("td h2")!.textContent).toBe("X");
            expect(root.querySelector("li")!.textContent).toBe("F");
        });
    });

    it.each(['', '<script>bad()</script>', '<span><div>Unsupported nesting</div></span>'])("rejects an invalid replacement atomically: %s", html => {
        const root = create('<table><tbody><tr><td>ABC</td></tr></tbody></table><ul><li>DEF</li></ul>');
        select(root.querySelector("td")!.firstChild!, 1, root.querySelector("li")!.firstChild!, 2);
        const before = editor.html, selection = editor.selection;
        expect(editor.execute({ type: "insertHtml", html })).toBe(false);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.canUndo).toBe(false);
    });

    it("treats empty text replacement as deletion without inserting a spare paragraph", () => {
        const root = create('<p>Before</p><section><p>Selected</p></section><p>After</p>');
        const text = root.querySelector("section p")!.firstChild!;
        select(text, 0, text, 8);
        reversible({ type: "insertText", text: "" }, () => expect(editor.html).toBe('<p>Before</p><p>After</p>'));
    });

    it("blocks native cut deletion without a preceding successful clipboard export", () => {
        const root = create('<p>Before</p><section><p>Selected</p></section><p>After</p>');
        const text = root.querySelector("section p")!.firstChild!;
        select(text, 0, text, 8);
        const before = editor.html, selection = editor.selection;
        const event = new InputEvent("beforeinput", { inputType: "deleteByCut", bubbles: true, cancelable: true });
        root.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.canUndo).toBe(false);
    });
});
