import { afterEach, describe, expect, it } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";

describe("HtmlEditor preformatted text and quotes", () => {
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
        const before = editor.html, selection = editor.selection;
        expect(editor.execute(command)).toBe(true);
        check();
        const after = editor.html, caret = editor.selection;
        expect(editor.restoreSelection()).toBe(true);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.html).toBe(before);
        expect(editor.selection).toEqual(selection);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(editor.html).toBe(after);
        expect(editor.selection).toEqual(caret);
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    it.each(["insertParagraph", "insertLineBreak"] as const)("uses a literal newline for %s inside pre/code", type => {
        const root = create('<pre id="pre"><code class="language-js">AB</code></pre><p>After</p>');
        select(root.querySelector("code")!.firstChild!, 1);
        reversible({ type }, () => {
            expect(root.querySelectorAll("pre")).toHaveLength(1);
            expect(root.querySelectorAll("code")).toHaveLength(1);
            expect(root.querySelector("code")!.textContent).toBe("A\nB");
            expect(root.querySelector("br")).toBeNull();
            expect(editor.nativeSelection?.anchorOffset).toBe(2);
        });
    });

    it("replaces all preformatted text without removing its authored shell", () => {
        const root = create('<pre id="pre"><code>ABC</code></pre>');
        const text = root.querySelector("code")!.firstChild!;
        select(text, 0, text, 3);
        reversible({ type: "insertText", text: "X\r\nY" }, () => {
            expect(root.querySelector("#pre code")!.textContent).toBe("X\nY");
            expect(root.querySelector("br")).toBeNull();
        });
    });

    it("retains an empty code wrapper when starting preformatted input", () => {
        const root = create('<pre><code class="language-js"></code></pre>');
        select(root.querySelector("code")!, 0);
        reversible({ type: "insertParagraph" }, () => {
            expect(root.querySelector("code.language-js")!.textContent).toBe("\n");
        });
    });

    it("retains a leading pre newline through export, commit and reimport", async () => {
        const root = create('<pre>A</pre>');
        select(root.querySelector("pre")!.firstChild!, 0);
        reversible({ type: "insertParagraph" }, () => expect(root.querySelector("pre")!.textContent).toBe("\nA"));
        const html = editor.html;
        expect(await editor.commit()).toBe(true);
        expect(root.querySelector("pre")!.textContent).toBe("\nA");
        editor.setHtml(html);
        expect(root.querySelector("pre")!.textContent).toBe("\nA");
    });

    it.each([false, true])("indents selected lines and preserves range direction: reverse=%s", reverse => {
        const root = create('<pre><code>A\nB\nC</code></pre>');
        const text = root.querySelector("code")!.firstChild!;
        select(text, reverse ? 4 : 0, text, reverse ? 0 : 4);
        reversible({ type: "indent" }, () => {
            expect(root.querySelector("pre")!.textContent).toBe("\tA\n\tB\nC");
            expect(root.querySelectorAll("code")).toHaveLength(1);
            expect(editor.nativeSelection?.anchorOffset).toBe(reverse ? 6 : 1);
            expect(editor.nativeSelection?.focusOffset).toBe(reverse ? 1 : 6);
        });
    });

    it("outdents tabs and up to four spaces while keeping an interior caret usable", () => {
        const root = create('<pre><code>\tA\n    B\n  C</code></pre>');
        const text = root.querySelector("code")!.firstChild!;
        select(text, 0, text, text.textContent!.length);
        reversible({ type: "outdent" }, () => expect(root.querySelector("code")!.textContent).toBe("A\nB\nC"));
        select(root.querySelector("code")!.firstChild!, 0);
        expect(editor.execute({ type: "insertText", text: "X" })).toBe(true);
        expect(root.textContent).toBe("XA\nB\nC");
    });

    it("handles Tab/Shift+Tab only in pre and respects canceled keyboard events", () => {
        const root = create('<pre>AB</pre><p><code>Inline</code></p>');
        select(root.querySelector("pre")!.firstChild!, 1);
        const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        root.dispatchEvent(tab);
        expect(tab.defaultPrevented).toBe(true);
        expect(root.querySelector("pre")!.textContent).toBe("\tAB");
        const out = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
        root.dispatchEvent(out);
        expect(out.defaultPrevented).toBe(true);
        expect(root.querySelector("pre")!.textContent).toBe("AB");
        const canceled = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        canceled.preventDefault();
        root.dispatchEvent(canceled);
        expect(root.querySelector("pre")!.textContent).toBe("AB");
        select(root.querySelector("p code")!.firstChild!, 1);
        const outside = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        root.dispatchEvent(outside);
        expect(outside.defaultPrevented).toBe(false);
    });

    it("keeps inline code in ordinary paragraph Enter behavior", () => {
        const root = create('<p><code>AB</code></p>');
        select(root.querySelector("code")!.firstChild!, 1);
        reversible({ type: "insertParagraph" }, () => {
            expect([...root.querySelectorAll("p")].map(node => node.textContent)).toEqual(["A", "B"]);
        });
    });

    it("indents a leading empty line without shifting the operation to the next line", () => {
        const root = create('<pre><code>\nA</code></pre>');
        select(root.querySelector("code")!.firstChild!, 0);
        reversible({ type: "indent" }, () => expect(root.textContent).toBe("\t\nA"));
    });

    it("does not add a history entry when outdenting a line with no indent", () => {
        const root = create('<pre>A</pre>');
        select(root.querySelector("pre")!.firstChild!, 1);
        expect(editor.execute({ type: "outdent" })).toBe(true);
        expect(editor.canUndo).toBe(false);
        expect(root.textContent).toBe("A");
    });

    it("retains inline formatting when indenting across code children", () => {
        const root = create('<pre><code><strong>A</strong>\n<em>B</em></code></pre>');
        select(root.querySelector("strong")!.firstChild!, 0, root.querySelector("em")!.firstChild!, 1);
        reversible({ type: "indent" }, () => {
            expect(root.textContent).toBe("\tA\n\tB");
            expect(root.querySelector("strong")!.textContent).toBe("\tA");
            expect(root.querySelector("em")!.textContent).toBe("B");
        });
    });

    it("routes native Enter in pre through the literal-text transaction", () => {
        const root = create('<pre><code>AB</code></pre>');
        select(root.querySelector("code")!.firstChild!, 1);
        const event = new InputEvent("beforeinput", { inputType: "insertParagraph", bubbles: true, cancelable: true });
        root.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(root.querySelector("code")!.textContent).toBe("A\nB");
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(root.textContent).toBe("AB");
    });

    it.each(["", "<br>"])("exits an empty final quoted paragraph containing %j", empty => {
        const root = create(`<blockquote id="quote"><p>Keep</p><p id="exit">${empty}</p></blockquote><p>After</p>`);
        select(root.querySelector("#exit")!, 0);
        reversible({ type: "insertParagraph" }, () => {
            expect(root.querySelector("#quote")!.textContent).toBe("Keep");
            expect(root.querySelector("#exit")!.parentElement).toBe(root);
            expect(root.lastElementChild!.textContent).toBe("After");
        });
    });

    it("Backspace removes one quote level while preserving the following quote and formatting", () => {
        const root = create('<blockquote id="quote" class="note"><p id="lift"><strong>A</strong></p><p>B</p></blockquote>');
        select(root.querySelector("strong")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#lift")!.parentElement).toBe(root);
            expect(root.querySelector("#lift strong")!.textContent).toBe("A");
            expect(root.querySelector("#quote")!.className).toBe("note");
            expect(root.querySelector("#quote")!.textContent).toBe("B");
        });
    });

    it("exits direct inline quote content without discarding its formatting", () => {
        const root = create('<blockquote><strong>ABC</strong></blockquote>');
        select(root.querySelector("strong")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("blockquote")).toBeNull();
            expect(root.querySelector("p strong")!.textContent).toBe("ABC");
        });
    });

    it("lifts a nested quote only one level", () => {
        const root = create('<blockquote id="outer"><p>Outer</p><blockquote><p id="lift">A</p></blockquote></blockquote>');
        select(root.querySelector("#lift")!.firstChild!, 0);
        reversible({ type: "deleteBackward" }, () => {
            expect(root.querySelector("#lift")!.parentElement!.id).toBe("outer");
            expect(root.querySelectorAll("blockquote")).toHaveLength(1);
        });
    });

    it("exits the last empty paragraph of a nested quote only one level", () => {
        const root = create('<blockquote id="outer"><blockquote><p>A</p><p id="exit"></p></blockquote><p>Tail</p></blockquote>');
        select(root.querySelector("#exit")!, 0);
        reversible({ type: "insertParagraph" }, () => {
            expect(root.querySelector("#exit")!.parentElement!.id).toBe("outer");
            expect(root.querySelectorAll("blockquote")).toHaveLength(2);
            expect(root.querySelector("#outer")!.lastElementChild!.textContent).toBe("Tail");
        });
    });

    it("does not escape a layout container or a nonfinal empty paragraph inside a quote", () => {
        const root = create('<blockquote><section><p id="inside">A</p></section><p id="empty"></p><p>B</p></blockquote>');
        select(root.querySelector("#inside")!.firstChild!, 0);
        const before = editor.html;
        expect(editor.execute({ type: "deleteBackward" })).toBe(false);
        expect(editor.html).toBe(before);
        select(root.querySelector("#empty")!, 0);
        expect(editor.execute({ type: "insertParagraph" })).toBe(true);
        expect(root.children).toHaveLength(1);
    });
});
