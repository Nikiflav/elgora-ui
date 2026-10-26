import { afterEach, describe, expect, it, vi } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";

describe("HtmlEditor transactions", () => {
    let editor: HtmlEditor;
    const create = (html: string) => {
        editor = new HtmlEditor({ value: html });
        editor.content.setAttribute("contenteditable", "true"); // jsdom property reflection.
        editor.mount(document.body);
        return editor;
    };
    const select = (node: Node, offset: number, end = node, endOffset = offset) => {
        document.getSelection()!.setBaseAndExtent(node, offset, end, endOffset);
        document.dispatchEvent(new Event("selectionchange"));
    };
    const input = (inputType: string, data: string | null = null, cancelable = true) => {
        const event = new InputEvent("beforeinput", { inputType, data, bubbles: true, cancelable });
        editor.content.dispatchEvent(event);
        return event;
    };
    afterEach(() => { editor?.dispose(); document.body.replaceChildren(); document.getSelection()?.removeAllRanges(); });

    it("intercepts typing, patches the model and keeps events bubbling", () => {
        create("<p>Hello</p>");
        const paragraph = editor.content.firstChild!;
        const bubble = vi.fn();
        editor.dom.addEventListener("beforeinput", bubble);
        select(paragraph.firstChild!, 2);
        expect(input("insertText", "X").defaultPrevented).toBe(true);
        expect(bubble).toHaveBeenCalledTimes(1);
        expect(editor.content.textContent).toBe("HeXllo");
        expect(editor.document.children[0].children.map(node => node.text).join("")).toBe("HeXllo");
        expect(editor.content.firstChild).toBe(paragraph);
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("HeXllo");
        expect(editor.nativeSelection?.anchorOffset).toBe(3);
    });

    it("replaces a backward selection across sibling blocks and undoes the selection as well", () => {
        create("<p>Hello</p><p>World</p>");
        select(editor.content.lastChild!.firstChild!, 3, editor.content.firstChild!.firstChild!, 2);
        expect(input("insertText", "X").defaultPrevented).toBe(true);
        expect(editor.content.children).toHaveLength(2);
        expect(editor.content.textContent).toBe("HeXld");
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.content.children).toHaveLength(2);
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("World");
        expect(editor.nativeSelection?.anchorOffset).toBe(3);
        expect(editor.nativeSelection?.focusOffset).toBe(2);
        expect(editor.modified).toBe(false);
        expect(editor.execute({ type: "redo" })).toBe(true);
        expect(editor.content.textContent).toBe("HeXld");
    });

    it.each([["*", "UL"], ["-", "UL"], ["1.", "OL"], ["5.", "OL"]])("converts %s paragraphs into a list on Enter with reversible caret placement", (marker, tag) => {
        create(`<p id="item">${marker} First</p><p>Following</p>`);
        select(editor.content.firstChild!.firstChild!, `${marker} First`.length);
        const saved = editor.selection;
        input("insertParagraph");
        expect(editor.content.firstElementChild?.tagName).toBe(tag);
        expect([...editor.content.querySelectorAll("li")].map(node => node.textContent)).toEqual(["First", ""]);
        expect(editor.nativeSelection?.anchorNode).toBe(editor.content.querySelectorAll("li")[1]);
        expect(editor.content.querySelectorAll("#item")).toHaveLength(1);
        if (marker === "5.") expect(editor.content.firstElementChild?.getAttribute("start")).toBe("5");
        editor.execute({ type: "undo" });
        expect(editor.content.firstElementChild?.textContent).toBe(`${marker} First`);
        expect(editor.selection).toEqual(saved);
        editor.execute({ type: "redo" });
        input("insertText", "Second");
        expect(editor.content.querySelectorAll("li")[1].textContent).toBe("Second");
        expect(editor.content.lastElementChild?.textContent).toBe("Following");
    });

    it("keeps inline formatting and supports an empty list marker", () => {
        create('<p>- <strong>Bold</strong></p>');
        select(editor.content.querySelector("strong")!.firstChild!, 4);
        input("insertParagraph");
        expect(editor.content.querySelector("li strong")?.textContent).toBe("Bold");
        editor.setHtml('<p>* </p>');
        select(editor.content.firstChild!.firstChild!, 2);
        input("insertParagraph");
        expect(editor.content.querySelectorAll("li")).toHaveLength(1);
        input("insertParagraph");
        expect(editor.content.querySelector("ul")).toBeNull();
        expect(editor.content.firstElementChild?.tagName).toBe("P");
    });

    it("formats a paragraph selected through enclosing element boundaries", () => {
        create("<p>Hello</p><p>Next</p>");
        select(editor.content, 0, editor.content, 1);
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect(editor.content.innerHTML).toBe("<p><strong>Hello</strong></p><p>Next</p>");
        select(editor.content, 0, editor.content, 1);
        expect(editor.execute({ type: "italic" })).toBe(true);
        expect(editor.content.innerHTML).toBe("<p><em><strong>Hello</strong></em></p><p>Next</p>");
    });

    it("formats independent text areas across different container parents", () => {
        create('<div style="display:grid"><div>Grid A</div><div>Grid B</div><div>Grid C</div></div>');
        const cells = [...editor.content.firstElementChild!.children];
        select(cells[0].firstChild!, 0, cells[2].firstChild!, 6);
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect([...editor.content.querySelectorAll("strong")].map(node => node.textContent)).toEqual(["Grid A", "Grid B", "Grid C"]);
    });

    it.each(['<p>Text - item</p>', '<p>-item</p>', '<pre>- item</pre>', '<p><code>- item</code></p>', '<ul><li><p>- item</p></li></ul>'])("does not convert ordinary or protected content: %s", html => {
        create(html);
        const text = document.createTreeWalker(editor.content, NodeFilter.SHOW_TEXT).nextNode()!;
        select(text, text.textContent!.length);
        const lists = editor.content.querySelectorAll("ul, ol").length;
        input("insertParagraph");
        expect(editor.content.querySelectorAll("ul, ol")).toHaveLength(lists);
    });

    it("does not convert on Space, Shift+Enter or Enter inside a paragraph", () => {
        create('<p>- Item</p>');
        select(editor.content.firstChild!.firstChild!, 2);
        input("insertText", " ");
        input("insertLineBreak");
        expect(editor.content.querySelector("ul")).toBeNull();
        editor.setHtml('<p>- Item</p>');
        select(editor.content.firstChild!.firstChild!, 3);
        input("insertParagraph");
        expect(editor.content.querySelector("ul")).toBeNull();
    });

    it.each(["ul", "ol"])("joins a following paragraph to the final %s item on Backspace", tag => {
        create(`<${tag}><li>First</li><li><strong>Last</strong></li></${tag}><p><em>Next</em></p><p>Following</p>`);
        select(editor.content.querySelector("em")!.firstChild!, 0);
        const saved = editor.selection;
        const textId = editor.document.children[1].children[0].children[0].id;
        expect(input("deleteContentBackward").defaultPrevented).toBe(true);
        expect(editor.content.querySelectorAll("li")[1].innerHTML).toBe("<strong>Last</strong><em>Next</em>");
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("Last");
        expect(editor.nativeSelection?.anchorOffset).toBe(4);
        expect(editor.document.children[0].children[1].children[1].children[0].id).toBe(textId);
        expect(editor.content.lastElementChild?.textContent).toBe("Following");
        editor.execute({ type: "undo" });
        expect(editor.selection).toEqual(saved);
        expect(editor.content.children).toHaveLength(3);
        editor.execute({ type: "redo" });
        expect(editor.content.children).toHaveLength(2);
        input("insertText", "!");
        expect(editor.content.querySelectorAll("li")[1].textContent).toBe("Last!Next");
    });

    it("uses the visible caret when native Backspace reports a range crossing the list boundary", () => {
        create('<ul><li>Last</li></ul><p>Next</p>');
        const last = editor.content.querySelector("li")!.firstChild!;
        const next = editor.content.querySelector("p")!.firstChild!;
        select(next, 0);
        const event = new InputEvent("beforeinput", { inputType: "deleteContentBackward", cancelable: true });
        Object.defineProperty(event, "getTargetRanges", { value: () => [{
            startContainer: last, startOffset: 4, endContainer: next, endOffset: 0
        }] });
        editor.content.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(editor.content.children).toHaveLength(1);
        expect(editor.content.querySelector("li")?.textContent).toBe("LastNext");
        expect(editor.nativeSelection?.anchorOffset).toBe(4);
        editor.execute({ type: "undo" });
        expect(editor.content.children).toHaveLength(2);
        expect(editor.nativeSelection?.anchorOffset).toBe(0);
    });

    it.each(['', '<br>', '<p><br></p>', '<strong></strong>'])("removes an empty item containing %s and moves back without deleting previous text", html => {
        create(`<ul><li>Previous</li><li>${html}</li><li>Following</li></ul>`);
        select(editor.content.querySelectorAll("li")[1], 0);
        const saved = editor.selection;
        input("deleteContentBackward");
        expect([...editor.content.querySelectorAll("li")].map(node => node.textContent)).toEqual(["Previous", "Following"]);
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("Previous");
        expect(editor.nativeSelection?.anchorOffset).toBe(8);
        editor.execute({ type: "undo" });
        expect(editor.selection).toEqual(saved);
        expect(editor.content.querySelectorAll("li")).toHaveLength(3);
        editor.execute({ type: "redo" });
        expect(editor.content.querySelectorAll("li")).toHaveLength(2);
    });

    it("moves back to the last nested item of the previous sibling", () => {
        create('<ul><li>Parent<ul><li>Nested</li></ul></li><li></li></ul>');
        select(editor.content.firstElementChild!.lastChild!, 0);
        input("deleteContentBackward");
        expect(editor.content.querySelectorAll("li")).toHaveLength(2);
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("Nested");
        expect(editor.nativeSelection?.anchorOffset).toBe(6);
    });

    it.each(["ul", "ol"])("exits the first empty %s item on Backspace and preserves following items", tag => {
        create(`<${tag}><li></li><li>Following</li></${tag}>`);
        select(editor.content.querySelector("li")!, 0);
        input("deleteContentBackward");
        expect(editor.content.firstElementChild?.tagName).toBe("P");
        expect(editor.nativeSelection?.anchorNode).toBe(editor.content.firstChild);
        expect(editor.content.querySelector("li")?.textContent).toBe("Following");
        editor.execute({ type: "undo" });
        expect(editor.content.firstElementChild?.tagName).toBe(tag.toUpperCase());
    });

    it("lifts the first empty nested item on Backspace", () => {
        create('<ul><li>Parent<ul><li></li><li>Following</li></ul></li></ul>');
        select(editor.content.querySelector("ul ul li")!, 0);
        input("deleteContentBackward");
        expect(editor.content.firstElementChild?.children).toHaveLength(2);
        expect(editor.content.firstElementChild?.lastElementChild?.querySelector("li")?.textContent).toBe("Following");
        input("insertText", "Lifted");
        expect(editor.content.firstElementChild?.lastElementChild?.textContent).toBe("LiftedFollowing");
    });

    it("returns to the list after exiting an empty final item", () => {
        create('<ul><li>Last</li><li></li></ul>');
        select(editor.content.querySelectorAll("li")[1], 0);
        input("insertParagraph");
        expect(editor.content.lastElementChild?.tagName).toBe("P");
        input("deleteContentBackward");
        expect(editor.content.children).toHaveLength(1);
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("Last");
        expect(editor.nativeSelection?.anchorOffset).toBe(4);
    });

    it.each([
        '<ul><li><p>Last</p></li></ul>',
        '<ul><li>Parent<ol><li>Last</li></ol></li></ul>'
    ])("joins at the final text block of a structured list: %s", list => {
        create(`${list}<p>Next</p>`);
        select(editor.content.lastChild!.firstChild!, 0);
        input("deleteContentBackward");
        expect(editor.content.children).toHaveLength(1);
        expect(editor.content.textContent).toContain("LastNext");
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("LastNext");
        expect(editor.nativeSelection?.anchorOffset).toBe(4);
    });

    it("keeps Backspace inside the following paragraph as ordinary character deletion", () => {
        create('<ul><li>Last</li></ul><p>Next</p>');
        select(editor.content.lastChild!.firstChild!, 1);
        input("deleteContentBackward");
        expect(editor.content.children).toHaveLength(2);
        expect(editor.content.lastChild!.textContent).toBe("ext");
    });

    it("splits inline formatting on Enter and joins blocks on Backspace", () => {
        create("<p>Hi <strong>world</strong></p>");
        select(editor.content.querySelector("strong")!.firstChild!, 1);
        expect(input("insertParagraph").defaultPrevented).toBe(true);
        expect([...editor.content.children].map(node => node.textContent)).toEqual(["Hi w", "orld"]);
        expect(editor.content.lastElementChild?.querySelector("strong")?.textContent).toBe("orld");
        expect(input("deleteContentBackward").defaultPrevented).toBe(true);
        expect(editor.content.children).toHaveLength(1);
        expect(editor.content.textContent).toBe("Hi world");
    });

    it.each(["ul", "ol"])("exits the empty last %s item and restores both selection and structure with undo", tag => {
        create(`<${tag}><li>Last</li></${tag}><p>Following</p>`);
        select(editor.content.querySelector("li")!.firstChild!, 4);
        expect(input("insertParagraph").defaultPrevented).toBe(true);
        expect(editor.content.querySelectorAll("li")).toHaveLength(2);
        const empty = editor.selection!;
        expect(input("insertParagraph").defaultPrevented).toBe(true);
        expect([...editor.content.children].map(node => node.tagName)).toEqual([tag.toUpperCase(), "P", "P"]);
        expect(editor.content.querySelectorAll("li")).toHaveLength(1);
        expect(editor.nativeSelection?.anchorNode).toBe(editor.content.children[1]);
        expect(editor.nativeSelection?.anchorOffset).toBe(0);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.selection).toEqual(empty);
        expect(editor.content.querySelectorAll("li")).toHaveLength(2);
        expect(editor.execute({ type: "redo" })).toBe(true);
        input("insertText", "Outside");
        expect(editor.content.children[1].textContent).toBe("Outside");
        expect(editor.content.lastElementChild?.textContent).toBe("Following");
    });

    it.each(["", "<br>", "<strong></strong>", "<p><br></p>"])("exits a sole empty item containing %s", html => {
        create(`<div><ul><li>${html}</li></ul></div>`);
        const item = editor.content.querySelector("li")!;
        select(item, 0);
        input("insertParagraph");
        expect(editor.content.querySelector("ul")).toBeNull();
        expect(editor.content.firstElementChild?.children[0].tagName).toBe("P");
        expect(editor.nativeSelection?.anchorNode).toBe(editor.content.querySelector("p"));
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.content.querySelector("li")).not.toBeNull();
    });

    it("splits a list around an empty middle item and preserves authored IDs without duplicates", () => {
        create('<ol id="list" class="steps" start="5"><li>A</li><li></li><li id="last">B</li></ol>');
        const followingId = editor.document.children[0].children[2].id;
        select(editor.content.querySelectorAll("li")[1], 0);
        input("insertParagraph");
        expect([...editor.content.children].map(node => node.tagName)).toEqual(["OL", "P", "OL"]);
        expect(editor.content.querySelectorAll("#list")).toHaveLength(1);
        expect(editor.content.lastElementChild?.getAttribute("start")).toBe("7");
        expect(editor.content.lastElementChild?.className).toBe("steps");
        expect(editor.document.children[2].children[0].id).toBe(followingId);
        expect(editor.content.querySelector("#last")?.textContent).toBe("B");
    });

    it("preserves implicit reversed numbering when removing the last empty item", () => {
        create('<ol reversed><li>A</li><li></li></ol>');
        select(editor.content.querySelectorAll("li")[1], 0);
        input("insertParagraph");
        expect(editor.content.querySelector("ol")?.getAttribute("start")).toBe("2");
    });

    it("lifts the empty last nested item one level, then exits the outer list on the next Enter", () => {
        create('<ul><li>Parent<ol><li>Nested</li><li></li></ol></li><li>Sibling</li></ul>');
        select(editor.content.querySelectorAll("ol li")[1], 0);
        const saved = editor.selection!;
        input("insertParagraph");
        const list = editor.content.firstElementChild!;
        expect([...list.children].map(node => node.textContent)).toEqual(["ParentNested", "", "Sibling"]);
        expect(editor.content.querySelectorAll("ol li")).toHaveLength(1);
        expect(editor.nativeSelection?.anchorNode).toBe(list.children[1]);
        editor.execute({ type: "undo" });
        expect(editor.selection).toEqual(saved);
        editor.execute({ type: "redo" });
        input("insertParagraph");
        expect([...editor.content.children].map(node => node.tagName)).toEqual(["UL", "P", "UL"]);
    });

    it("lifts a middle nested item without losing following nested items or parent content", () => {
        create('<ul><li>Parent<ol start="3"><li>A</li><li></li><li>B</li></ol><p>Tail</p></li><li>Sibling</li></ul>');
        select(editor.content.querySelectorAll("ol li")[1], 0);
        input("insertParagraph");
        const lifted = editor.content.firstElementChild!.children[1];
        expect(lifted.tagName).toBe("LI");
        expect(lifted.querySelector("ol")?.getAttribute("start")).toBe("5");
        expect(lifted.textContent).toBe("BTail");
        expect(editor.nativeSelection?.anchorNode).toBe(lifted.firstChild);
        input("insertText", "Lifted");
        expect(lifted.textContent).toBe("LiftedBTail");
        expect(editor.content.firstElementChild!.lastElementChild?.textContent).toBe("Sibling");
        editor.execute({ type: "undo" });
        editor.execute({ type: "undo" });
        expect(editor.content.querySelectorAll("ol")).toHaveLength(1);
        expect(editor.content.querySelectorAll("ol li")).toHaveLength(3);
        expect(editor.content.querySelector("ul > li > p")?.textContent).toBe("Tail");
    });

    it("inserts a hard break and deletes a complete grapheme", () => {
        create("<p>A👨‍👩‍👧‍👦B</p>");
        const text = editor.content.firstChild!.firstChild!;
        select(text, "A👨‍👩‍👧‍👦".length);
        input("deleteContentBackward");
        expect(editor.content.textContent).toBe("AB");
        input("insertLineBreak");
        expect(editor.content.querySelectorAll("br")).toHaveLength(1);
    });

    it("toggles range formatting and applies a collapsed formatting override to subsequent typing", () => {
        create("<p>abcd</p>");
        select(editor.content.firstChild!.firstChild!, 1, editor.content.firstChild!.firstChild!, 3);
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect(editor.content.querySelector("strong")?.textContent).toBe("bc");
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect(editor.content.querySelector("strong")).toBeNull();
        select(editor.content.firstChild!, 0);
        editor.execute({ type: "italic" });
        input("insertText", "X");
        expect(editor.content.querySelector("em")?.textContent).toBe("X");
    });

    it("merges existing and newly formatted bold fragments", () => {
        create("<p>Hello <strong>bold</strong> world</p>");
        const paragraph = editor.content.firstElementChild!;
        select(paragraph.firstChild!, 0, paragraph.lastChild!, paragraph.lastChild!.textContent!.length);
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect(paragraph.querySelectorAll("strong")).toHaveLength(1);
        expect(paragraph.querySelector("strong")?.textContent).toBe("Hello bold world");
    });

    it("merges adjacent text nodes after removing a mark", () => {
        create("<p><strong>A</strong><strong>B</strong></p>");
        const paragraph = editor.content.firstElementChild!;
        select(paragraph.querySelector("strong")!.firstChild!, 0, paragraph.querySelectorAll("strong")[1].firstChild!, 1);
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect(editor.content.innerHTML).toBe("<p>AB</p>");
        expect(editor.document.children[0].children).toHaveLength(1);
        expect(editor.document.children[0].children[0].type).toBe("text");
    });

    it("uses beforeinput target ranges for replacement rather than the visible caret", () => {
        create("<p>teh word</p>");
        const text = editor.content.firstChild!.firstChild!;
        select(text, 8);
        const event = new InputEvent("beforeinput", { inputType: "insertReplacementText", data: "the", cancelable: true });
        Object.defineProperty(event, "getTargetRanges", { value: () => [{ startContainer: text, startOffset: 0, endContainer: text, endOffset: 3 }] });
        editor.content.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(editor.content.textContent).toBe("the word");
    });

    it("formats a range that starts at the previous block's trailing boundary", () => {
        create("<h2>Title</h2><p>New paragraph</p>");
        select(editor.content.firstChild!.firstChild!, 5, editor.content.lastChild!.firstChild!, 13);
        expect(editor.execute({ type: "bold" })).toBe(true);
        expect(editor.content.querySelector("h2 strong")).toBeNull();
        expect(editor.content.querySelector("p strong")?.textContent).toBe("New paragraph");
        editor.execute({ type: "undo" });
        expect(editor.content.querySelector("strong")).toBeNull();
    });

    it("imports clipboard HTML through the content policy and the command history", () => {
        create("<p>AB</p>");
        select(editor.content.firstChild!.firstChild!, 1);
        const paste = new Event("paste", { cancelable: true, bubbles: true });
        Object.defineProperty(paste, "clipboardData", { value: { getData: (type: string) => type === "text/html"
            ? '<p onclick="bad()">Hello <strong>world</strong><script>bad()</script><a href="javascript:bad()">link</a></p>' : "Hello worldlink" } });
        editor.content.dispatchEvent(paste);
        expect(paste.defaultPrevented).toBe(true);
        expect(editor.content.textContent).toBe("AHello worldlinkB");
        expect(editor.content.querySelector("strong")?.textContent).toBe("world");
        expect(editor.html).not.toMatch(/onclick|javascript:|script/);
        editor.execute({ type: "undo" });
        expect(editor.content.textContent).toBe("AB");
    });

    it("reconciles noncancelable native input as one undoable transaction", () => {
        create("<p>Old</p>");
        select(editor.content.firstChild!.firstChild!, 3);
        expect(input("insertText", "!", false).defaultPrevented).toBe(false);
        editor.content.firstChild!.firstChild!.textContent = "Old!";
        editor.content.dispatchEvent(new Event("input", { bubbles: true }));
        expect(editor.document.children[0].children[0].text).toBe("Old!");
        expect(editor.canUndo).toBe(true);
        editor.execute({ type: "undo" });
        expect(editor.content.textContent).toBe("Old");
    });

    it("reverts foreign structural and attribute mutations instead of adopting them", async () => {
        create("<p>Safe</p>");
        editor.content.append(document.createElement("aside"));
        editor.content.firstElementChild!.setAttribute("onclick", "bad()");
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(editor.content.querySelector("aside")).toBeNull();
        expect(editor.content.firstElementChild!.hasAttribute("onclick")).toBe(false);
        expect(editor.canUndo).toBe(false);
    });

    it("captures composition once and undoes it through the same history", async () => {
        create("<p>Old</p>");
        select(editor.content.firstChild!.firstChild!, 3);
        editor.content.dispatchEvent(new Event("compositionstart"));
        editor.content.firstChild!.firstChild!.textContent = "新";
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.document.children[0].children[0].text).toBe("Old");
        editor.content.dispatchEvent(new Event("compositionend"));
        editor.content.dispatchEvent(new Event("input"));
        await new Promise(resolve => setTimeout(resolve, 0));
        editor.execute({ type: "undo" });
        expect(editor.content.textContent).toBe("Old");
        expect(editor.canUndo).toBe(false);
    });

    it("clears redo after a new edit and resets history at an accepted baseline", async () => {
        create("<p>A</p>");
        select(editor.content.firstChild!.firstChild!, 1);
        input("insertText", "B");
        editor.execute({ type: "undo" });
        input("insertText", "C");
        expect(editor.canRedo).toBe(false);
        expect(await editor.commit()).toBe(true);
        expect(editor.canUndo).toBe(false);
        expect(input("historyUndo").defaultPrevented).toBe(true);
    });

    it("keeps spaces and one text identity while typing and omits editing fillers from HTML", () => {
        create("<p></p>");
        expect(editor.content.querySelector("br[data-elg-html-editor-placeholder]")).not.toBeNull();
        expect(editor.html).not.toContain("placeholder");
        select(editor.content.firstChild!, 0);
        input("insertText", "A");
        const id = editor.document.children[0].children[0].id;
        input("insertText", " ");
        input("insertText", "B");
        expect(editor.content.textContent).toBe("A B");
        expect(editor.document.children[0].children).toHaveLength(1);
        expect(editor.document.children[0].children[0].id).toBe(id);
        expect(editor.nativeSelection?.anchorOffset).toBe(3);
    });

    it("normalizes block elements introduced inside a paragraph by a native fallback", () => {
        create("<p>A</p>");
        input("insertText", "B", false);
        const block = document.createElement("div");
        block.textContent = "B";
        editor.content.firstChild!.appendChild(block);
        select(block.firstChild!, 1);
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.content.querySelector("p div")).toBeNull();
        expect(editor.content.querySelector("p br")).not.toBeNull();
        expect(editor.content.textContent).toBe("AB");
        expect(editor.nativeSelection?.anchorNode?.textContent).toBe("B");
    });

    it("keeps readonly content protected from commands, beforeinput and observed DOM mutation", async () => {
        editor = new HtmlEditor({ value: "<p>Read</p>", readOnly: true });
        editor.mount(document.body);
        select(editor.content.firstChild!.firstChild!, 1);
        expect(editor.execute({ type: "insertText", text: "X" })).toBe(false);
        expect(input("insertText", "X").defaultPrevented).toBe(true);
        editor.content.firstChild!.firstChild!.textContent = "Changed outside";
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(editor.content.textContent).toBe("Read");
        expect(editor.canUndo).toBe(false);
    });

    it("does not duplicate HTML element IDs when splitting blocks and formatting wrappers", () => {
        create('<p id="intro"><strong id="emphasis">AB</strong></p>');
        select(editor.content.querySelector("strong")!.firstChild!, 1);
        input("insertParagraph");
        expect(editor.content.querySelectorAll("#intro")).toHaveLength(1);
        expect(editor.content.querySelectorAll("#emphasis")).toHaveLength(1);
    });

    it("blocks unknown cancelable input without opening a later native fallback", () => {
        create("<p>Safe</p>");
        select(editor.content.firstChild!.firstChild!, 2);
        expect(input("formatUnderline").defaultPrevented).toBe(true);
        editor.content.firstChild!.firstChild!.textContent = "Foreign";
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.content.textContent).toBe("Safe");
        expect(editor.canUndo).toBe(false);
        expect(editor.modified).toBe(false);
    });

    it("handles structural replacement through beforeinput and reserves formatting shortcuts", () => {
        create("<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>");
        select(editor.content.querySelectorAll("td")[0].firstChild!, 0,
            editor.content.querySelectorAll("td")[1].firstChild!, 1);
        expect(input("insertParagraph").defaultPrevented).toBe(true);
        const shortcut = new KeyboardEvent("keydown", { key: "b", ctrlKey: true, cancelable: true });
        editor.content.dispatchEvent(shortcut);
        expect(shortcut.defaultPrevented).toBe(true);
        expect(editor.content.querySelectorAll("td")).toHaveLength(0);
        expect(editor.content.textContent).toBe("");
        expect(editor.canUndo).toBe(true);
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.content.querySelectorAll("td")).toHaveLength(2);
        expect(editor.content.textContent).toBe("AB");
    });

    it("reverts unannounced input and observed text mutations without clearing redo", async () => {
        create("<p>A</p>");
        select(editor.content.firstChild!.firstChild!, 1);
        input("insertText", "B");
        editor.execute({ type: "undo" });
        editor.content.firstChild!.firstChild!.textContent = "Foreign";
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.content.textContent).toBe("A");
        editor.content.firstChild!.firstChild!.textContent = "Outside";
        await Promise.resolve();
        expect(editor.content.textContent).toBe("A");
        expect(editor.canUndo).toBe(false);
        expect(editor.canRedo).toBe(true);
        editor.execute({ type: "redo" });
        expect(editor.content.textContent).toBe("AB");
    });

    it("expires native permission even when the browser emits no input", async () => {
        create("<p>A</p>");
        input("insertReplacementText", null, false);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(editor.canUndo).toBe(false);
        editor.content.firstChild!.firstChild!.textContent = "Late";
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.content.textContent).toBe("A");
    });

    it("settles noncancelable mutations without input and records only one history entry", async () => {
        create("<p>A</p>");
        input("insertReplacementText", null, false);
        editor.content.firstChild!.firstChild!.textContent = "B";
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(editor.content.textContent).toBe("B");
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.content.textContent).toBe("A");
        expect(editor.canUndo).toBe(false);
    });

    it("does not grant readonly composition permission or leave stale permission after replacement", async () => {
        editor = new HtmlEditor({ value: "<p>Read</p>", readOnly: true });
        editor.content.dispatchEvent(new Event("compositionstart"));
        editor.content.firstChild!.firstChild!.textContent = "Foreign";
        editor.content.dispatchEvent(new Event("compositionend"));
        editor.content.dispatchEvent(new Event("input"));
        await Promise.resolve();
        expect(editor.content.textContent).toBe("Read");
        editor.dispose();
        create("<p>A</p>");
        input("insertText", "B", false);
        editor.setHtml("<p>Replacement</p>");
        await Promise.resolve();
        expect(editor.canUndo).toBe(false);
        expect(editor.content.textContent).toBe("Replacement");
    });

    it("keeps native selection/navigation alone and blocks dropped content", () => {
        create("<p>AB</p>");
        select(editor.content.firstChild!.firstChild!, 1);
        for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
            const event = new KeyboardEvent("keydown", { key, cancelable: true });
            editor.content.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        const drop = new Event("drop", { cancelable: true });
        editor.content.dispatchEvent(drop);
        expect(drop.defaultPrevented).toBe(true);
        expect(input("deleteByDrag").defaultPrevented).toBe(true);
        expect(editor.canUndo).toBe(false);
    });

    it("handles composing beforeinput without compositionstart using bounded permission", async () => {
        create("<p>A</p>");
        const event = new InputEvent("beforeinput", {
            inputType: "insertCompositionText", data: "新", isComposing: true, cancelable: true
        });
        editor.content.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        editor.content.firstChild!.firstChild!.textContent = "新";
        editor.content.dispatchEvent(new Event("input"));
        await Promise.resolve();
        expect(editor.content.textContent).toBe("新");
        expect(editor.execute({ type: "undo" })).toBe(true);
        expect(editor.content.textContent).toBe("A");
    });

    it("does not interfere with active IME and ignores pending reconciliation after dispose", async () => {
        create("<p>A</p>");
        editor.content.dispatchEvent(new Event("compositionstart"));
        expect(input("insertCompositionText", "新").defaultPrevented).toBe(false);
        const text = editor.content.firstChild!.firstChild!;
        text.textContent = "新";
        await Promise.resolve();
        expect(editor.content.firstChild!.firstChild).toBe(text);
        expect(editor.document.children[0].children[0].text).toBe("A");
        expect(await editor.commit()).toBe(false);
        editor.content.dispatchEvent(new Event("compositionend"));
        editor.dispose();
        await Promise.resolve();
        expect(editor.canUndo).toBe(false);
    });

    it("does not grant native permission when a host already canceled beforeinput", () => {
        create("<p>A</p>");
        const event = new InputEvent("beforeinput", { inputType: "insertText", data: "B", cancelable: true });
        event.preventDefault();
        editor.content.dispatchEvent(event);
        editor.content.firstChild!.firstChild!.textContent = "AB";
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.content.textContent).toBe("A");
        expect(editor.canUndo).toBe(false);
    });

    it("waits past microtasks for native default actions and the final composition input", async () => {
        create("<p>A</p>");
        input("insertText", "B", false);
        await Promise.resolve(); // Checkpoint between the listener and the UA default action.
        editor.content.firstChild!.firstChild!.textContent = "AB";
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.document.children[0].children[0].text).toBe("AB");
        editor.content.dispatchEvent(new Event("compositionstart"));
        editor.content.dispatchEvent(new Event("compositionend"));
        await Promise.resolve();
        editor.content.firstChild!.firstChild!.textContent = "新";
        editor.content.dispatchEvent(new Event("input"));
        expect(editor.document.children[0].children[0].text).toBe("AB");
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(editor.document.children[0].children[0].text).toBe("新");
        editor.execute({ type: "undo" });
        expect(editor.content.textContent).toBe("AB");
        editor.execute({ type: "undo" });
        expect(editor.content.textContent).toBe("A");
    });
});
