import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PopoverEditor, type PopoverTextEditorOptions } from "../../src/components/editors/PopoverEditor";
import { Popover } from "../../src/components/popup/popover";
import { e } from "../../src/core/e";

class PickerEditor extends PopoverEditor<string> {
    prepare?: () => Promise<void>;
    protected override preparePopup(): void | Promise<void> { return this.prepare?.(); }
    protected override createPopup(): Popover {
        return new Popover({ anchorElement: this.control, bindAnchorTarget: false, closeMode: "manual",
            children: e("button", { type: "button", onclick: () => this.acceptPickerText("chosen") }, "Choose") });
    }
    protected override focusPopup(): void { this.popup!.dom.querySelector<HTMLButtonElement>("button")!.focus(); }
}

const editors: PickerEditor[] = [];
const frame = () => new Promise<void>(done => requestAnimationFrame(() => done()));
function create(options: Partial<PopoverTextEditorOptions<string>> = {}) {
    const editor = new PickerEditor({ value: "original", triggerIcon: "ri-calendar-line", triggerLabel: "Open picker", ...options });
    editors.push(editor); editor.mount(document.body);
    return editor;
}
function type(editor: PickerEditor, text: string) {
    const input = editor.dom.querySelector("input")!;
    input.value = text; input.dispatchEvent(new Event("input", { bubbles: true }));
    return input;
}
beforeEach(() => {
    const matches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function(selector) {
        return selector === ":popover-open" ? this.hasAttribute("data-test-open") : matches.call(this, selector);
    });
    Object.defineProperty(HTMLElement.prototype, "showPopover", { configurable: true, value: function() {
        this.setAttribute("data-test-open", ""); this.dispatchEvent(new Event("toggle"));
    } });
    Object.defineProperty(HTMLElement.prototype, "hidePopover", { configurable: true, value: function() {
        this.removeAttribute("data-test-open"); this.dispatchEvent(new Event("toggle"));
    } });
});
afterEach(async () => {
    editors.splice(0).forEach(editor => editor.dispose()); await frame();
    document.body.replaceChildren(); vi.restoreAllMocks();
    delete (HTMLElement.prototype as any).showPopover;
    delete (HTMLElement.prototype as any).hidePopover;
});

describe("PopoverEditor lifecycle", () => {
    it("emits opened and closed events through the component API", async () => {
        const editor = create();
        await editor.open();
        const popup = (editor as any).popup as Popover;
        const opened = vi.fn(), closed = vi.fn();
        popup.opened.subscribe(opened);
        popup.closed.subscribe(closed);

        editor.close();
        await editor.open();

        expect(closed).toHaveBeenCalledTimes(1);
        expect(opened).toHaveBeenCalledTimes(1);
        expect(opened.mock.calls[0][0].popover).toBe(popup);
        expect(closed.mock.calls[0][0].popover).toBe(popup);
    });

    it("opens on the first focus click and closes on a later input click", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        input.dispatchEvent(new Event("pointerdown", { bubbles: true })); input.focus(); input.click();
        expect(editor.isOpen).toBe(true);
        input.dispatchEvent(new Event("pointerdown", { bubbles: true })); input.focus(); input.click();
        expect(editor.isOpen).toBe(false);
        expect(document.activeElement).toBe(input);
    });
    it("close retains unparsed text and does not resolve, validate, accept or cancel it", async () => {
        const resolveText = vi.fn(text => text), validate = vi.fn(), onCommit = vi.fn(), cancelled = vi.fn();
        const editor = create({ resolveText, validate, onCommit });
        editor.cancelled.subscribe(cancelled);
        type(editor, "draft"); await editor.open(); editor.close();
        expect(editor.text).toBe("draft"); expect(editor.confirmedValue).toBe("original");
        expect(resolveText).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
        expect(onCommit).not.toHaveBeenCalled(); expect(cancelled).not.toHaveBeenCalled();
    });
    it("picker choice closes before acceptance finishes and remains closed after a failure", async () => {
        let reject!: (reason: Error) => void;
        const editor = create({ openOnFocus: true, onCommit: () => new Promise((_, fail) => { reject = fail; }) });
        await editor.open(); editor.dom.querySelector<HTMLButtonElement>("[popover] button")!.click();
        expect(editor.isOpen).toBe(false);
        await vi.waitFor(() => expect(reject).toBeTypeOf("function"));
        reject(new Error("Rejected")); await vi.waitFor(() => expect(editor.error).toBe("Rejected"));
        expect(editor.text).toBe("chosen"); expect(editor.confirmedValue).toBe("original");
        expect(editor.isOpen).toBe(false);
    });
    it("closing does not cancel an outstanding commit", async () => {
        let finish!: () => void;
        const editor = create({ onCommit: () => new Promise<void>(done => { finish = done; }) });
        type(editor, "draft"); await editor.open();
        const committing = editor.commit(); await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
        editor.close(); finish(); expect(await committing).toBe(true);
        expect(editor.confirmedValue).toBe("draft"); expect(editor.isOpen).toBe(false);
    });
    it("does not reopen after a temporary body focus during fast acceptance", async () => {
        const editor = create({ openOnFocus: true, onCommit: async () => undefined });
        await editor.open(); editor.dom.querySelector<HTMLButtonElement>("[popover] button")!.click();
        const input = editor.dom.querySelector("input")!;
        input.blur();
        await vi.waitFor(() => expect(editor.confirmedValue).toBe("chosen"));
        await frame(); input.focus();
        expect(editor.isOpen).toBe(false);
        const outside = e("input"); document.body.append(outside); outside.focus(); input.focus();
        expect(editor.isOpen).toBe(true);
    });
    it("Escape cancels and native focus restoration does not reopen", async () => {
        const editor = create({ openOnFocus: true });
        const input = type(editor, "draft");
        await editor.open();
        const popup = editor.dom.querySelector<HTMLElement>("[popover]")!;
        Object.defineProperty(popup, "hidePopover", { value: () => {
            popup.removeAttribute("data-test-open"); input.focus(); popup.dispatchEvent(new Event("toggle"));
        } });
        popup.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await frame(); expect(editor.isOpen).toBe(false); expect(editor.text).toBe("original");
        expect(document.activeElement).toBe(input);
    });
    it.each(["close", "cancel", "dispose", "setValue"] as const)("%s invalidates pending asynchronous opening", async action => {
        const editor = create(); let finish!: () => void;
        editor.prepare = () => new Promise<void>(done => { finish = done; });
        const opening = editor.open();
        if (action === "setValue") editor.setValue("loaded"); else editor[action]();
        finish(); await opening; expect(editor.dom.querySelector("[popover]")).toBeNull();
    });
    it("does not steal focus after asynchronous automatic opening", async () => {
        const editor = create({ openOnFocus: true }); let finish!: () => void;
        editor.prepare = () => new Promise<void>(done => { finish = done; });
        editor.dom.querySelector("input")!.focus();
        const outside = e("input"); document.body.append(outside); outside.focus();
        finish(); await frame(); expect(editor.isOpen).toBe(false); expect(document.activeElement).toBe(outside);
    });
    it("releases the outside pointer listener on close and dispose", async () => {
        const remove = vi.spyOn(document, "removeEventListener");
        const editor = create(); await editor.open(); editor.close();
        expect(remove).toHaveBeenCalledWith("pointerdown", expect.any(Function), true);
        remove.mockClear(); await editor.open(); editor.dispose();
        expect(remove).toHaveBeenCalledWith("pointerdown", expect.any(Function), true);
    });
});
