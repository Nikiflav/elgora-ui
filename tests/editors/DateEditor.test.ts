import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateEditor, type DateEditorOptions } from "../../src/components/editors/DateEditor";

const editors: DateEditor[] = [];
function create(options: Partial<DateEditorOptions> = {}) {
    const editor = new DateEditor({ value: "2026-10-14", today: "2026-10-14", label: "Delivery date", ...options });
    editors.push(editor);
    editor.mount(document.body);
    return editor;
}
function type(editor: DateEditor, text: string): HTMLInputElement {
    const input = editor.dom.querySelector("input")!;
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return input;
}
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
beforeEach(() => {
    const matches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function(this: HTMLElement, selector) {
        return selector === ":popover-open" ? this.hasAttribute("data-test-open") : matches.call(this, selector);
    });
    Object.defineProperty(HTMLElement.prototype, "showPopover", { configurable: true, value: function(this: HTMLElement) {
        this.setAttribute("data-test-open", ""); this.dispatchEvent(new Event("toggle"));
    } });
    Object.defineProperty(HTMLElement.prototype, "hidePopover", { configurable: true, value: function(this: HTMLElement) {
        this.removeAttribute("data-test-open"); this.dispatchEvent(new Event("toggle"));
    } });
});
afterEach(async () => {
    editors.splice(0).forEach(editor => editor.dispose());
    await frame();
    document.body.replaceChildren(); vi.restoreAllMocks();
    delete (HTMLElement.prototype as any).showPopover;
    delete (HTMLElement.prototype as any).hidePopover;
});

describe("DateEditor", () => {
    it("uses dateFormat for input, loaded values, cancellation and calendar choices", async () => {
        const editor = create({ dateFormat: "dd.MM.yyyy" });
        expect(editor.text).toBe("14.10.2026");
        expect(await editor.resolveText("20.10.2026")).toBe("2026-10-20");
        expect(await editor.resolveText(" ")).toBeNull();
        type(editor, "20.10.2026"); await editor.commit();
        expect(editor.confirmedValue).toBe("2026-10-20");
        type(editor, "invalid"); editor.cancel(); expect(editor.text).toBe("20.10.2026");
        editor.setValue("2026-10-14"); expect(editor.text).toBe("14.10.2026");
        await editor.open(); await frame();
        editor.dom.querySelector<HTMLButtonElement>("button[data-date='2026-10-21']")!.click();
        await vi.waitFor(() => expect(editor.confirmedValue).toBe("2026-10-21"));
        expect(editor.text).toBe("21.10.2026");
    });
    it("uses locale for standard d and still enforces canonical bounds", async () => {
        const editor = create({ dateFormat: "d", locale: "en-US", max: "2026-10-20" });
        expect(editor.text).toBe("10/14/2026");
        expect(await editor.resolveText("10/20/2026")).toBe("2026-10-20");
        await expect(editor.resolveText("10/21/2026")).rejects.toThrow("outside the allowed range");
    });
    it("prioritizes explicit format and resolveText over dateFormat and parse", async () => {
        const parse = vi.fn(() => "2026-10-15");
        const editor = create({ dateFormat: "dd.MM.yyyy", parse, resolveText: async () => "2026-10-20",
            format: value => value === null ? "empty" : `Date ${value}` });
        expect(editor.text).toBe("Date 2026-10-14");
        expect(await editor.resolveText("custom")).toBe("2026-10-20");
        expect(parse).not.toHaveBeenCalled();
    });
    it("allows parse to override only parsing while dateFormat controls display", async () => {
        const editor = create({ dateFormat: "dd.MM.yyyy", parse: () => "2026-10-20" });
        expect(editor.text).toBe("14.10.2026");
        type(editor, "custom"); await editor.commit();
        expect(editor.text).toBe("20.10.2026");
    });
    it("rejects an unsupported dateFormat even with custom callbacks", () => {
        expect(() => create({ dateFormat: "dd.MMM.yyyy", format: () => "custom" })).toThrow("Failed to create date formatter.");
    });
    it("opens on focus, focuses DatePicker, and Escape returns to typing without reopening", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        input.focus();
        await vi.waitFor(() => expect(document.activeElement?.getAttribute("data-date")).toBe("2026-10-14"));
        document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await frame();
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute("aria-expanded")).toBe("false");
        type(editor, "2026-10-20");
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("keeps the calendar open when the first click opens it through focus", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector<HTMLInputElement>("input")!;
        input.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
        input.focus();
        input.click();
        await vi.waitFor(() => expect(input.getAttribute("aria-expanded")).toBe("true"));
    });
    it("closes the calendar when the already open input is clicked", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector<HTMLInputElement>("input")!;
        input.focus();
        await vi.waitFor(() => expect(input.getAttribute("aria-expanded")).toBe("true"));
        input.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
        input.focus();
        input.click();
        await frame();
        expect(input.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(input);
    });
    it("keeps the calendar open while navigating to the next month", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector<HTMLInputElement>("input")!;
        input.focus();
        await vi.waitFor(() => expect(input.getAttribute("aria-expanded")).toBe("true"));
        const next = editor.dom.querySelector<HTMLButtonElement>("button[aria-label='Next period']")!;
        next.focus();
        next.click();
        await frame();
        expect(input.getAttribute("aria-expanded")).toBe("true");
        expect(editor.dom.querySelector("button[data-date='2026-11-14']")).not.toBeNull();
    });
    it("keeps DatePicker closed after accepting a date and restoring input focus", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        input.focus();
        await vi.waitFor(() => expect(document.activeElement?.getAttribute("data-date")).toBe("2026-10-14"));
        editor.dom.querySelector<HTMLButtonElement>("button[data-date='2026-10-20']")!.click();
        await vi.waitFor(() => expect(editor.confirmedValue).toBe("2026-10-20"));
        await frame();
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("does not steal focus if it leaves during asynchronous automatic opening", async () => {
        let resolve!: (value: string) => void;
        const editor = create({ openOnFocus: true, commitOnBlur: false,
            resolveText: () => new Promise(done => { resolve = done; }) });
        editor.dom.querySelector("input")!.focus();
        const next = document.createElement("input"); document.body.append(next); next.focus();
        resolve("2026-10-14"); await frame();
        expect(document.activeElement).toBe(next);
        expect(editor.dom.querySelector("[popover]")).toBeNull();
    });
    it("does not automatically open a read-only calendar", async () => {
        const editor = create({ openOnFocus: true, readOnly: true });
        editor.dom.querySelector("input")!.focus(); await frame();
        expect(editor.dom.querySelector("[popover]")).toBeNull();
    });
    it("does not reopen when native hiding restores anchor focus synchronously", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        input.focus();
        await vi.waitFor(() => expect(document.activeElement?.getAttribute("data-date")).toBe("2026-10-14"));
        const popup = editor.dom.querySelector<HTMLElement>("[popover]")!;
        Object.defineProperty(popup, "hidePopover", { configurable: true, value: () => {
            popup.removeAttribute("data-test-open");
            input.focus(); popup.dispatchEvent(new Event("toggle"));
        } });
        editor.cancel(); await frame();
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("insets the trigger without a Tab stop and preserves native input arrow keys", () => {
        const editor = create();
        const input = editor.dom.querySelector("input")!;
        const trigger = editor.dom.querySelector<HTMLButtonElement>("button[aria-label='Open date picker']")!;
        expect(trigger.tabIndex).toBe(-1);
        expect(input.style.paddingRight).toBe("2rem");
        expect(input.parentElement!.contains(trigger)).toBe(true);
        input.focus(); input.setSelectionRange(3, 3);
        const arrow = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
        input.dispatchEvent(arrow);
        expect(arrow.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(input);
        expect(editor.dom.querySelector("[popover]")).toBeNull();
    });
    it("Alt+Down opens and focuses DatePicker without saving; Escape returns to the input", async () => {
        const onCommit = vi.fn();
        const editor = create({ onCommit });
        const input = type(editor, "2026-10-20");
        input.focus();
        const key = new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true });
        input.dispatchEvent(key);
        await vi.waitFor(() => expect(input.getAttribute("aria-expanded")).toBe("true"));
        await frame();
        expect(key.defaultPrevented).toBe(true);
        expect(document.activeElement?.getAttribute("data-date")).toBe("2026-10-20");
        document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        expect(document.activeElement).toBe(input);
        expect(editor.text).toBe("2026-10-14");
        expect(onCommit).not.toHaveBeenCalled();
    });
    it("resolves ISO dates and empty text without changing or saving values", async () => {
        const validate = vi.fn();
        const onCommit = vi.fn();
        const editor = create({ validate, onCommit });
        expect(await editor.resolveText(" 2024-02-29 ")).toBe("2024-02-29");
        expect(await editor.resolveText(" ")).toBeNull();
        expect(editor.value).toBe("2026-10-14");
        expect(editor.text).toBe("2026-10-14");
        expect(validate).not.toHaveBeenCalled();
        expect(onCommit).not.toHaveBeenCalled();
    });
    it.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-1", "14.10.2026", "2026-10-14T00:00:00Z", "0000-01-01"])(
        "rejects invalid/noncanonical %s", async text => {
            const editor = create();
            await expect(editor.resolveText(text)).rejects.toThrow("valid YYYY-MM-DD");
            expect(editor.error).toBeUndefined();
        });
    it("enforces inclusive bounds for external resolution and loaded values", async () => {
        const editor = create({ min: "2026-10-10", max: "2026-10-20" });
        expect(await editor.resolveText("2026-10-10")).toBe("2026-10-10");
        expect(await editor.resolveText("2026-10-20")).toBe("2026-10-20");
        await expect(editor.resolveText("2026-10-21")).rejects.toThrow("outside the allowed range");
        expect(() => editor.setValue("2026-10-09")).toThrow("outside the allowed range");
        expect(editor.value).toBe("2026-10-14");
    });
    it("supports custom asynchronous conversion and formatting without bypassing bounds", async () => {
        const editor = create({ min: "2026-10-10", max: "2026-10-20",
            resolveText: async text => text === "today" ? "2026-10-14" : "2026-10-21",
            format: value => value ? value.split("-").reverse().join(".") : "" });
        expect(editor.text).toBe("14.10.2026");
        expect(await editor.resolveText("today")).toBe("2026-10-14");
        await expect(editor.resolveText("other")).rejects.toThrow("outside the allowed range");
    });
    it("commits typed dates, retains invalid text and cancels to the last accepted text", async () => {
        const onCommit = vi.fn();
        const editor = create({ onCommit });
        const input = type(editor, "2026-10-20");
        expect(await editor.commit()).toBe(true);
        expect(editor.confirmedValue).toBe("2026-10-20");
        type(editor, "2026-02-29");
        expect(await editor.commit()).toBe(false);
        expect(editor.text).toBe("2026-02-29");
        editor.cancel();
        expect(editor.text).toBe("2026-10-20");
        expect(editor.dom.querySelector("input")).toBe(input);
        expect(onCommit).toHaveBeenCalledTimes(1);
    });
    it("picks a calendar day through validation and commit, then closes the popup", async () => {
        const onCommit = vi.fn();
        const validate = vi.fn();
        const editor = create({ onCommit, validate });
        await editor.open(); await frame();
        editor.dom.querySelector<HTMLButtonElement>("button[data-date='2026-10-20']")!.click();
        await vi.waitFor(() => expect(editor.confirmedValue).toBe("2026-10-20"));
        expect(validate).toHaveBeenCalledWith("2026-10-20");
        expect(onCommit).toHaveBeenCalledWith("2026-10-20", editor);
        await frame();
        expect(editor.dom.querySelector("input")!.getAttribute("aria-expanded")).toBe("false");
    });
    it("closes the picker before asynchronous acceptance and keeps failed edits for retry", async () => {
        let reject!: (error: Error) => void;
        const editor = create({ onCommit: () => new Promise((_, fail) => { reject = fail; }) });
        await editor.open(); await frame();
        editor.dom.querySelector<HTMLButtonElement>("button[data-date='2026-10-20']")!.click();
        await vi.waitFor(() => expect(editor.busy).toBe(true));
        await frame();
        expect(editor.dom.querySelector("input")!.disabled).toBe(true);
        expect(editor.isOpen).toBe(false);
        reject(new Error("Save failed"));
        await vi.waitFor(() => expect(editor.error).toBe("Save failed"));
        expect(editor.confirmedValue).toBe("2026-10-14");
        expect(editor.text).toBe("2026-10-20");
        expect(editor.dom.querySelector("input")!.getAttribute("aria-expanded")).toBe("false");
        editor.cancel();
        expect(editor.text).toBe("2026-10-14");
    });
    it("opens DatePicker to typed text without committing and still opens for invalid input", async () => {
        const onCommit = vi.fn();
        const editor = create({ onCommit });
        type(editor, "2026-11-10");
        await editor.open(); await frame();
        expect(editor.dom.querySelector("button[data-date='2026-11-10']")!.parentElement!.getAttribute("aria-selected")).toBe("true");
        expect(editor.confirmedValue).toBe("2026-10-14");
        expect(onCommit).not.toHaveBeenCalled();
        editor.close(); type(editor, "invalid");
        await editor.open(); await frame();
        expect(editor.dom.querySelector("button[data-date='2026-10-14']")).not.toBeNull();
        expect(editor.text).toBe("invalid");
    });
    it("Escape closes the picker and restores the confirmed text", async () => {
        const editor = create();
        type(editor, "2026-10-20");
        await editor.open(); await frame();
        editor.dom.querySelector("button[data-date='2026-10-20']")!.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        expect(editor.text).toBe("2026-10-14");
        await frame();
        expect(editor.dom.querySelector("input")!.getAttribute("aria-expanded")).toBe("false");
    });
    it("does not commit when focus moves into DatePicker", async () => {
        const onCommit = vi.fn();
        const editor = create({ onCommit });
        const input = type(editor, "2026-10-20");
        input.focus();
        await editor.open(); await frame();
        expect(onCommit).not.toHaveBeenCalled();
        expect(editor.modified).toBe(true);
    });
    it("does not commit between internal focusout/focusin when activeElement is temporarily body", async () => {
        const onCommit = vi.fn();
        const editor = create({ onCommit });
        const input = type(editor, "2026-10-20");
        await editor.open(); await frame();
        const target = editor.dom.querySelector("button[data-date='2026-10-21']")!;
        const active = vi.spyOn(document, "activeElement", "get").mockReturnValue(document.body);
        input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: target }));
        await Promise.resolve(); await Promise.resolve();
        active.mockRestore();
        expect(onCommit).not.toHaveBeenCalled();
        expect(editor.modified).toBe(true);
        expect(input.getAttribute("aria-expanded")).toBe("true");
    });
    it("commits on leaving the compound editor, unless disabled by options", async () => {
        const onCommit = vi.fn();
        const editor = create({ onCommit });
        const input = type(editor, "2026-10-20"); input.focus(); input.blur();
        await vi.waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
        const deferred = create({ commitOnBlur: false, onCommit });
        const next = type(deferred, "2026-10-21"); next.focus(); next.blur();
        await frame();
        expect(onCommit).toHaveBeenCalledTimes(1);
    });
    it.each(["readOnly", "disabled"] as const)("cannot open a %s editor", async key => {
        const editor = create({ [key]: true });
        await editor.open();
        expect(editor.dom.querySelector("[popover]")).toBeNull();
        expect(editor.dom.querySelector("button[aria-label='Open date picker']")!.hasAttribute("disabled")).toBe(true);
    });
    it("does not open after cancellation of an outstanding async resolver", async () => {
        let resolve!: (value: string) => void;
        const editor = create({ resolveText: () => new Promise(done => { resolve = done; }) });
        const opening = editor.open();
        editor.cancel();
        resolve("2026-10-14"); await opening;
        expect(editor.dom.querySelector("[popover]")).toBeNull();
    });
    it("preserves the keyed calendar trigger across busy/state updates", async () => {
        const editor = create();
        const trigger = editor.dom.querySelector("button[aria-label='Open date picker']");
        type(editor, "2026-10-20"); await editor.commit(); await frame();
        expect(editor.dom.querySelector("button[aria-label='Open date picker']")).toBe(trigger);
        expect(trigger!.parentElement!.classList.contains("elg-position-absolute")).toBe(true);
        expect(trigger!.parentElement!.style.top).toBe("50%");
        expect(trigger!.parentElement!.parentElement).toBe(editor.dom.querySelector("input")!.parentElement);
    });
});
