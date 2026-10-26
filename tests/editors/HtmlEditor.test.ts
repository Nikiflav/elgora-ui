import { afterEach, describe, expect, it, vi } from "vitest";
import { HtmlEditor } from "../../src/components/editors/htmleditor/HtmlEditor";

function content(editor: HtmlEditor): HTMLDivElement {
    return editor.dom.querySelector<HTMLDivElement>(".elg-html-editor-content")!;
}

describe("HtmlEditor", () => {
    it("retains inline structure and whitespace", () => {
        const editor = new HtmlEditor({ value: '<p><strong>Hello</strong> <em>world</em></p>' });
        expect(content(editor).querySelectorAll('p')).toHaveLength(1);
        expect(content(editor).textContent).toBe('Hello world');
        editor.dispose();
    });
    it("commits native user input and cancels subsequent changes", async () => {
        const accepted: string[] = [];
        const editor = new HtmlEditor({ value: '<p>Old</p>', onCommit: html => { accepted.push(html); } });
        content(editor).dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText' }));
        content(editor).textContent = 'New';
        content(editor).dispatchEvent(new Event('input', { bubbles: true }));
        expect(editor.modified).toBe(true);
        expect(await editor.commit()).toBe(true);
        expect(accepted).toHaveLength(1);
        content(editor).textContent = 'Other';
        content(editor).dispatchEvent(new Event('input', { bubbles: true }));
        editor.cancel();
        expect(content(editor).textContent).toBe('New');
        editor.dispose();
    });
    it("starts readonly content with native editing disabled", () => {
        const editor = new HtmlEditor({ value: '<p>Read</p>', readOnly: true });
        expect(content(editor).contentEditable).toBe('false');
        editor.dispose();
    });
    it("parses HTML into controlled VNode content", () => {
        const editor = new HtmlEditor({ value: "<h2>Hello <strong>world</strong></h2>" });
        expect(content(editor).innerHTML).toContain("<h2");
        expect(content(editor).querySelector("strong")?.textContent).toBe("world");
        expect(content(editor).querySelector("[data-elg-html-editor-node]")).toBeNull();
        editor.dispose();
    });

    it("serializes external values through the model", () => {
        const editor = new HtmlEditor({ value: "<script>alert(1)</script><p>Safe</p>" });
        expect(editor.getHtml()).not.toContain("script");
        expect(editor.getHtml()).toContain("Safe");
        editor.setHtml("<p>Changed</p>");
        expect(editor.getHtml()).toContain("Changed");
        editor.dispose();
    });

    it("preserves content classes while removing editor system metadata", () => {
        const editor = new HtmlEditor({ value: '<div class="d-flex custom-card" data-elg-html-editor-node="old"><img class="rounded" src="image.png"></div>' });
        expect(editor.document.children[0].classes).toEqual(["d-flex", "custom-card"]);
        expect(editor.getHtml()).toContain('class="d-flex custom-card"');
        expect(editor.getHtml()).toContain('class="rounded"');
        expect(editor.getHtml()).not.toContain("data-elg-html-editor");
        editor.dispose();
    });

    it("keeps media and table structure as HtmlEditorNodes", () => {
        const editor = new HtmlEditor({ value: '<table><tbody><tr><td rowspan="2">A</td><td>B</td></tr></tbody></table><video src="movie.mp4"></video><iframe src="https://example.test"></iframe>' });
        expect(editor.document.children[0].type).toBe("element");
        expect(editor.document.children[0].tag).toBe("table");
        expect(content(editor).querySelector("video")).not.toBeNull();
        expect(editor.document.children[0].children[0].children[0].tag).toBe("tr");
        expect(editor.getHtml()).toContain("<table");
        expect(editor.getHtml()).toContain("movie.mp4");
        editor.dispose();
    });

    it("keeps the editor integrated with ValueEditor commit and cancel", async () => {
        const editor = new HtmlEditor({ value: "<p>Old</p>" });
        editor.setHtml("<p>New</p>");
        expect(editor.modified).toBe(false);
        expect(editor.confirmedValue).toContain("New");
        expect(editor.cancel()).toBe(true);
        expect(editor.getHtml()).toContain("New");
        editor.dispose();
    });
});

describe("HtmlEditor DOM selection", () => {
    const editors: HtmlEditor[] = [];
    const create = (html = "<p>Hello <strong>world</strong></p><p>Next</p>") => {
        const editor = new HtmlEditor({ value: html });
        // jsdom does not reflect the contentEditable property to its HTML attribute.
        editor.content.setAttribute("contenteditable", "true");
        editor.mount(document.body);
        editors.push(editor);
        return editor;
    };
    const select = (anchor: Node, start: number, focus = anchor, end = start) => {
        document.getSelection()!.setBaseAndExtent(anchor, start, focus, end);
        document.dispatchEvent(new Event("selectionchange"));
    };
    // These mapping tests simulate the permitted noncancelable native-input path.
    const input = (editor: HtmlEditor) => {
        editor.content.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText" }));
        editor.content.dispatchEvent(new Event("input", { bubbles: true }));
    };
    afterEach(() => {
        editors.splice(0).forEach(editor => editor.dispose());
        document.getSelection()?.removeAllRanges();
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("maps raw Text nodes and keeps their IDs when text or siblings change", () => {
        const editor = create();
        const text = editor.content.querySelector("strong")!.firstChild!;
        select(text, 2);
        const before = editor.selection!;
        expect(before.anchor.nodeId).toBe(editor.document.children[0].children[1].children[0].id);
        text.textContent = "world!";
        editor.content.prepend(document.createElement("hr"));
        input(editor);
        expect(editor.document.children[1].children[1].children[0].id).toBe(before.anchor.nodeId);
        expect(editor.restoreSelection(before)).toBe(true);
        expect(editor.nativeSelection?.anchorNode).toBe(text);
        expect(editor.nativeSelection?.anchorOffset).toBe(2);
        expect(editor.content.querySelector("span")).toBeNull();
        expect(editor.getHtml()).not.toContain("data-elg-");
    });

    it("restores backward ranges across blocks without reversing anchor and focus", () => {
        const editor = create();
        const first = editor.content.firstChild!.firstChild!;
        const last = editor.content.lastChild!.firstChild!;
        select(last, 3, first, 1);
        const snapshot = editor.selection!;
        select(first, 0);
        expect(editor.restoreSelection(snapshot)).toBe(true);
        expect(editor.nativeSelection?.anchorNode).toBe(last);
        expect(editor.nativeSelection?.anchorOffset).toBe(3);
        expect(editor.nativeSelection?.focusNode).toBe(first);
        expect(editor.nativeSelection?.focusOffset).toBe(1);
    });

    it("supports empty blocks and root child boundaries, skipping filtered DOM children", () => {
        const editor = create("<p></p><p>Text</p>");
        const empty = editor.content.firstChild!;
        select(empty, 0);
        const caret = editor.selection!;
        const comment = document.createComment("not part of the model");
        editor.content.insertBefore(comment, editor.content.lastChild);
        select(editor.content, 2, editor.content, 3);
        const boundary = editor.selection!;
        expect(boundary.anchor.offset).toBe(1);
        expect(boundary.focus.offset).toBe(2);
        input(editor);
        expect(editor.restoreSelection(caret)).toBe(true);
        expect(editor.nativeSelection?.anchorNode).toBe(empty);
        expect(editor.restoreSelection(boundary)).toBe(true);
        expect(editor.nativeSelection?.anchorOffset).toBe(1);
        expect(editor.nativeSelection?.focusOffset).toBe(2);
    });

    it("represents an image selection through element boundaries and an entirely empty surface", () => {
        const editor = create('<p>A<img src="image.png">B</p>');
        const paragraph = editor.content.firstChild!;
        select(paragraph, 1, paragraph, 2);
        const imageRange = editor.selection!;
        select(paragraph.firstChild!, 0);
        expect(editor.restoreSelection(imageRange)).toBe(true);
        expect(editor.nativeSelection?.getRangeAt(0).cloneContents().querySelector("img")).not.toBeNull();
        editor.content.replaceChildren();
        input(editor);
        select(editor.content, 0);
        expect(editor.document.children).toHaveLength(1);
        expect(editor.restoreSelection()).toBe(true);
        expect(editor.nativeSelection?.anchorNode).toBe(editor.content);
    });

    it("normalizes adjacent native text nodes while retaining the surviving identity", () => {
        const editor = create("<p>Hello</p>");
        const first = editor.content.firstChild!.firstChild as Text;
        const originalId = editor.document.children[0].children[0].id;
        first.splitText(2);
        input(editor);
        expect(editor.document.children[0].children[0].id).toBe(originalId);
        expect(editor.document.children[0].children).toHaveLength(1);
        const merged = editor.content.firstChild!.firstChild as Text;
        select(merged, 2);
        const mergedRange = editor.selection!;
        expect(mergedRange.anchor.nodeId).toBe(originalId);
        editor.content.firstChild!.normalize();
        input(editor);
        expect(editor.document.children[0].children).toHaveLength(1);
        expect(editor.document.children[0].children[0].id).toBe(originalId);
        expect(editor.restoreSelection(mergedRange)).toBe(true);
    });

    it("retains a detached selection when focus or selection moves outside the editor", () => {
        const editor = create();
        const text = editor.content.firstChild!.firstChild!;
        select(text, 1, text, 4);
        const saved = editor.selection!;
        const toolbar = document.createElement("button");
        toolbar.textContent = "Bold";
        document.body.append(toolbar);
        toolbar.focus();
        select(toolbar.firstChild!, 0);
        expect(editor.nativeSelection).toBeNull();
        expect(editor.selection).toEqual(saved);
        const copy = editor.selection!;
        copy.anchor.offset = 100;
        expect(editor.selection).toEqual(saved);
        expect(editor.restoreSelection()).toBe(true);
        expect(document.activeElement).toBe(editor.content);
        expect(document.getSelection()?.toString()).toBe("ell");
    });

    it("emits only changed snapshots and isolates event payloads and multiple editors", () => {
        const first = create();
        const second = create("<p>Another</p>");
        const notifications = vi.fn(state => { if (state) state.anchor.offset = 99; });
        first.selectionChanged.subscribe(notifications);
        select(first.content.firstChild!.firstChild!, 2);
        document.dispatchEvent(new Event("selectionchange"));
        expect(notifications).toHaveBeenCalledTimes(1);
        expect(first.selection?.anchor.offset).toBe(2);
        expect(second.selection).toBeUndefined();
        select(second.content.firstChild!.firstChild!, 1);
        expect(first.selection?.anchor.offset).toBe(2);
        expect(second.selection?.anchor.offset).toBe(1);
        expect(second.restoreSelection(first.selection)).toBe(false);
    });

    it("rejects removed IDs and clamps offsets after text is shortened", () => {
        const editor = create();
        const text = editor.content.querySelector("strong")!.firstChild!;
        select(text, 5);
        const snapshot = editor.selection!;
        text.textContent = "x";
        input(editor);
        expect(editor.restoreSelection(snapshot)).toBe(true);
        expect(editor.nativeSelection?.anchorOffset).toBe(1);
        text.parentNode!.removeChild(text);
        input(editor);
        expect(editor.restoreSelection(snapshot)).toBe(false);
    });

    it("defers DOM synchronization during composition and maps the final nodes", async () => {
        const editor = create("<p>Old</p>");
        const paragraphId = editor.document.children[0].id;
        editor.content.dispatchEvent(new Event("compositionstart"));
        const paragraph = editor.content.firstChild!;
        paragraph.textContent = "新";
        input(editor);
        expect(editor.document.children[0].children[0].text).toBe("Old");
        select(paragraph.firstChild!, 1);
        editor.content.dispatchEvent(new Event("compositionend"));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(editor.document.children[0].id).toBe(paragraphId);
        expect(editor.document.children[0].children[0].text).toBe("新");
        expect(editor.selection?.anchor.nodeId).toBe(editor.document.children[0].children[0].id);
    });

    it("invalidates old snapshots on explicit replacement, cancel and commit", async () => {
        const editor = create("<p>Old</p>");
        select(editor.content.firstChild!.firstChild!, 1);
        const original = editor.selection!;
        editor.setHtml("<p>New</p>");
        expect(editor.restoreSelection(original)).toBe(false);
        select(editor.content.firstChild!.firstChild!, 1);
        const beforeCancel = editor.selection!;
        editor.cancel();
        expect(editor.restoreSelection(beforeCancel)).toBe(false);
        editor.content.firstChild!.firstChild!.textContent = "Edited";
        input(editor);
        select(editor.content.firstChild!.firstChild!, 2);
        const beforeCommit = editor.selection!;
        expect(await editor.commit()).toBe(true);
        expect(editor.restoreSelection(beforeCommit)).toBe(false);
    });

    it("removes the document listener and releases selection on dispose", () => {
        const remove = vi.spyOn(document, "removeEventListener");
        const editor = create();
        select(editor.content.firstChild!.firstChild!, 1);
        const snapshot = editor.selection!;
        editor.dispose();
        expect(remove.mock.calls.some(([name]) => name === "selectionchange")).toBe(true);
        expect(editor.selection).toBeUndefined();
        expect(editor.restoreSelection(snapshot)).toBe(false);
    });
});
