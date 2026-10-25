import { afterEach, describe, expect, it } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";

describe("HtmlEditor replacement transactions", () => {
    let editor: HtmlEditor;
    const create = (html: string) => {
        editor = new HtmlEditor({ value: html });
        editor.mount(document.body);
        return editor.content;
    };
    const select = (a: Node, from: number, b: Node, to: number, reverse: boolean) => {
        document.getSelection()!.setBaseAndExtent(reverse ? b : a, reverse ? to : from, reverse ? a : b, reverse ? from : to);
        document.dispatchEvent(new Event("selectionchange"));
    };
    const reversible = (command: Parameters<HtmlEditor["execute"]>[0], check: () => void) => {
        const before = editor.html, selection = editor.selection;
        expect(editor.execute(command)).toBe(true);
        check();
        const after = editor.html, caret = editor.selection;
        expect(caret).toBeDefined();
        expect(caret!.anchor).toEqual(caret!.focus);
        expect(editor.restoreSelection()).toBe(true);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.canUndo).toBe(false);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(editor.html).toBe(after);
        expect(editor.selection).toEqual(caret);
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    const operations = [
        { type: "insertText", text: "X" },
        { type: "insertParagraph" },
        { type: "insertLineBreak" },
        { type: "insertHtml", html: "<h3>X</h3><p>Y</p>" }
    ] as const;
    const shells = [
        '<section id="start"><p><strong>ABC</strong></p></section>',
        '<ul id="start"><li><strong>ABC</strong></li><li>Covered</li></ul>',
        '<table id="start"><tbody><tr><td><strong>ABC</strong></td><td>Covered</td></tr></tbody></table>'
    ];
    for (const [index, shell] of shells.entries()) {
        for (const command of operations) {
            it.each([false, true])(`keeps partial shell ${index} for ${command.type}: reverse=%s`, reverse => {
                const root = create(`${shell}<section>Covered middle</section><div id="end"><p><em>DEF</em></p></div>`);
                select(root.querySelector("strong")!.firstChild!, 1, root.querySelector("em")!.firstChild!, 2, reverse);
                reversible(command, () => {
                    expect(root.querySelector("#start")).not.toBeNull();
                    expect(root.querySelector("#end")!.innerHTML).toBe("<p><em>F</em></p>");
                    const expected = command.type === "insertText" ? "AX" : command.type === "insertHtml" ? "AXY" : "A";
                    expect(root.querySelector("#start")!.textContent).toBe(expected);
                    expect(root.querySelector("#start strong")!.textContent).toBe(command.type === "insertText" ? "AX" : "A");
                    expect(root.textContent).toBe(`${expected}F`);
                });
                expect(editor.execute({ type: "insertText", text: "Z" })).toBe(true);
                expect(root.querySelector("#start")!.textContent).toContain("Z");
                expect(root.querySelector("#end")!.textContent).toBe("F");
            });
        }
    }

    for (const command of operations) {
        it.each([false, true])(`replaces a removed table at its former root gap with ${command.type}: reverse=%s`, reverse => {
            const root = create('<p>Before</p><table>\n<tbody>\n<tr>\n<td>ABC</td>\n</tr>\n</tbody>\n</table><section id="end"><p>DEF</p></section>');
            select(root.querySelector("td")!.firstChild!, 0, root.querySelector("#end p")!.firstChild!, 2, reverse);
            reversible(command, () => {
                expect(root.querySelector("table")).toBeNull();
                expect(root.firstElementChild!.textContent).toBe("Before");
                expect(root.querySelector("#end")!.textContent).toBe("F");
            });
            expect(editor.execute({ type: "insertText", text: "Z" })).toBe(true);
            expect(root.querySelector("#end")!.textContent).toBe("F");
            expect(root.textContent).toContain("Z");
        });
    }

    it.each([[false, ""], [true, ""], [false, "\n"], [true, "\n"]] as const)("fits a cell fragment after the starting row disappears: reverse=%s whitespace=%j", (reverse, whitespace) => {
        const root = create(`<table><tbody><tr>${whitespace}<td>ABC</td>${whitespace}</tr><tr><td>DEF</td></tr></tbody></table>`);
        const cells = root.querySelectorAll("td");
        select(cells[0].firstChild!, 0, cells[1].firstChild!, 2, reverse);
        reversible({ type: "insertHtml", html: "<td>X</td>" }, () => {
            expect([...root.querySelectorAll("tr")].map(row => row.textContent)).toEqual(["X", "F"]);
        });
        expect(editor.execute({ type: "insertText", text: "Z" })).toBe(true);
        expect([...root.querySelectorAll("td")].map(cell => cell.textContent)).toEqual(["XZ", "F"]);
    });

    it.each([false, true])("uses a root gap when replacing the entire document: reverse=%s", reverse => {
        const root = create('<section><p>ABC</p></section><table><tbody><tr><td>DEF</td></tr></tbody></table>');
        select(root, 0, root, root.childNodes.length, reverse);
        reversible({ type: "insertHtml", html: "<p>X</p>" }, () => expect(editor.html).toBe("<p>X</p>"));
    });

    it("preserves redo and the directed selection after rejected replacement", () => {
        const root = create('<p>ABC</p><section><p>DEF</p></section>');
        select(root.querySelector("p")!.firstChild!, 1, root.querySelector("p")!.firstChild!, 1, false);
        editor.execute({ type: "insertText", text: "X" });
        editor.execute({ type: "undo" });
        select(root.querySelector("p")!.firstChild!, 1, root.querySelector("section p")!.firstChild!, 2, true);
        const before = editor.html, selection = editor.selection;
        expect(editor.execute({ type: "insertHtml", html: "<span><div>Invalid</div></span>" })).toBe(false);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.canRedo).toBe(true);
        expect(editor.canUndo).toBe(false);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(root.querySelector("p")!.textContent).toBe("AXBC");
    });

    it("leaves a usable flow caret after inserting columns without an editable cell", () => {
        const root = create('<table><colgroup><col></colgroup><tbody><tr><td>A</td></tr></tbody></table><p>After</p>');
        const columns = root.querySelector("colgroup")!;
        select(columns, 1, columns, 1, false);
        reversible({ type: "insertHtml", html: "<col>" }, () => expect(root.querySelectorAll("col")).toHaveLength(2));
        expect(editor.execute({ type: "insertText", text: "X" })).toBe(true);
        expect([...root.children].map(node => node.textContent)).toEqual(["A", "X", "After"]);
    });

    it.each(["insertText", "insertParagraph", "insertLineBreak"])("routes native %s through one replacement transaction", inputType => {
        const root = create('<table><tbody><tr><td>ABC</td></tr></tbody></table><ul><li>DEF</li></ul>');
        select(root.querySelector("td")!.firstChild!, 1, root.querySelector("li")!.firstChild!, 2, true);
        const before = editor.html, selection = editor.selection;
        const event = new InputEvent("beforeinput", { inputType, data: inputType === "insertText" ? "X" : null, bubbles: true, cancelable: true });
        root.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(root.querySelector("td")!.textContent).toBe(inputType === "insertText" ? "AX" : "A");
        expect(root.querySelector("li")!.textContent).toBe("F");
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.canUndo).toBe(false);
    });

    it.each([
        { html: "<h3>X</h3><p>Y</p>", text: "XY", expected: "AXY" },
        { html: "<span><div>Invalid</div></span>", text: "X", expected: "AX" },
        { html: "<script>bad()</script>", text: "", expected: undefined }
    ])("handles paste replacement and fallback atomically: $expected", ({ html, text, expected }) => {
        const root = create('<section><p>ABC</p></section><table><tbody><tr><td>DEF</td></tr></tbody></table>');
        select(root.querySelector("p")!.firstChild!, 1, root.querySelector("td")!.firstChild!, 2, true);
        const before = editor.html, selection = editor.selection;
        const event = new Event("paste", { bubbles: true, cancelable: true });
        Object.defineProperty(event, "clipboardData", { value: { getData: (type: string) => type === "text/html" ? html : text } });
        root.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        if (expected === undefined) {
            expect(editor.html).toBe(before);
            expect(editor.selection).toEqual(selection);
            expect(editor.canUndo).toBe(false);
        } else {
            expect(root.querySelector("section")!.textContent).toBe(expected);
            expect(root.querySelector("td")!.textContent).toBe("F");
            expect(editor.execute({ type: "undo" })).toBe(true);
            expect(editor.html).toBe(before);
            expect(editor.selection).toEqual(selection);
            expect(editor.canUndo).toBe(false);
        }
    });
});
