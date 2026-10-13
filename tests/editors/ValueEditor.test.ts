import { describe, expect, it, vi } from "vitest";
import { CheckboxEditor, NumberEditor, TextEditor, ToggleEditor } from "../../src/components/editors/ValueEditor";

function type(editor: TextEditor<any>, text: string): HTMLInputElement {
    const input = editor.dom.querySelector("input")!;
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return input;
}

describe("Value editors", () => {
    it("resolves external text without changing drafts, validation or events", async () => {
        const validate = vi.fn();
        const save = vi.fn();
        const editor = new NumberEditor({ value: 10, validate, onCommit: save });
        const notified = vi.fn();
        editor.input.subscribe(notified);
        editor.committed.subscribe(notified);
        type(editor, "pending text");
        notified.mockClear();
        expect(await editor.resolveText("12,5")).toBe(12.5);
        expect(editor.value).toBe(10);
        expect(editor.confirmedValue).toBe(10);
        expect(editor.text).toBe("pending text");
        expect(editor.busy).toBe(false);
        expect(editor.error).toBeUndefined();
        expect(validate).not.toHaveBeenCalled();
        expect(save).not.toHaveBeenCalled();
        expect(notified).not.toHaveBeenCalled();
    });

    it("leaves existing errors unchanged when external resolution fails or succeeds", async () => {
        const editor = new NumberEditor({ value: 10 });
        type(editor, "invalid");
        await editor.commit();
        const error = editor.error;
        expect(() => editor.resolveText("12abc")).toThrow();
        expect(editor.resolveText("20")).toBe(20);
        expect(editor.error).toBe(error);
        expect(editor.text).toBe("invalid");
    });

    it("keeps text unchanged, including empty text and whitespace", () => {
        const editor = new TextEditor({ value: "original" });
        expect(editor.resolveText("  pasted  ")).toBe("  pasted  ");
        expect(editor.resolveText("")).toBe("");
        expect(editor.value).toBe("original");
    });

    it("shares custom async resolution between commit and external text", async () => {
        const resolve = vi.fn(async (text: string) => Number(text) * 2);
        const parse = vi.fn();
        const editor = new TextEditor<number>({ value: 2, resolveText: resolve, parse, format: String });
        expect(await editor.resolveText("3")).toBe(6);
        expect(editor.value).toBe(2);
        type(editor, "4");
        expect(await editor.commit()).toBe(true);
        expect(editor.value).toBe(8);
        expect(resolve.mock.calls).toEqual([["3"], ["4"]]);
        expect(parse).not.toHaveBeenCalled();
    });

    it("propagates rejected async resolution without mutating editor state", async () => {
        const editor = new TextEditor({ value: "old", resolveText: async () => { throw new Error("Not found"); } });
        await expect(editor.resolveText("new")).rejects.toThrow("Not found");
        expect(editor.value).toBe("old");
        expect(editor.error).toBeUndefined();
        type(editor, "new");
        expect(await editor.commit()).toBe(false);
        expect(editor.error).toBe("Not found");
    });

    describe.each([CheckboxEditor, ToggleEditor])("boolean text resolution", Editor => {
        it.each([["true", true], ["YES", true], [" 1 ", true], ["false", false], ["No", false], ["0", false]])(
            "resolves %s to %s", async (text, value) => {
                const save = vi.fn();
                const editor = new Editor({ value: false, onCommit: save });
                expect(await editor.resolveText(text as string)).toBe(value);
                expect(editor.value).toBe(false);
                expect(editor.modified).toBe(false);
                expect(save).not.toHaveBeenCalled();
            });
        it.each(["", " ", "truth", "yes please", "2"])("rejects ambiguous or unsupported %s", text => {
            const editor = new Editor({ value: true });
            expect(() => editor.resolveText(text)).toThrow("Failed to resolve boolean text");
            expect(editor.value).toBe(true);
            expect(editor.error).toBeUndefined();
        });
        it("allows a custom asynchronous boolean resolver", async () => {
            const editor = new Editor({ value: false, resolveText: async text => {
                if (text === "да") return true;
                throw new Error("Unsupported text");
            } });
            expect(await editor.resolveText("да")).toBe(true);
            await expect(editor.resolveText("other")).rejects.toThrow("Unsupported text");
            expect(editor.value).toBe(false);
        });
    });

    it("separates raw text, typed value and external acceptance", async () => {
        const save = vi.fn();
        const editor = new NumberEditor({ value: 12, onCommit: save });
        const input = type(editor, "24,5");
        expect(editor.text).toBe("24,5");
        expect(editor.value).toBe(12);
        expect(save).not.toHaveBeenCalled();
        expect(await editor.commit()).toBe(true);
        expect(editor.value).toBe(24.5);
        expect(editor.confirmedValue).toBe(24.5);
        expect(editor.modified).toBe(false);
        expect(save).toHaveBeenCalledWith(24.5, editor);
        expect(editor.dom.querySelector("input")).toBe(input);
    });

    it.each(["12abc", "NaN", "Infinity", "1,2,3", "1e999"])("retains invalid number %s", async text => {
        const save = vi.fn();
        const editor = new NumberEditor({ value: 12, onCommit: save });
        type(editor, text);
        expect(await editor.commit()).toBe(false);
        expect(editor.text).toBe(text);
        expect(editor.value).toBe(12);
        expect(editor.error).toBeTruthy();
        expect(editor.dom.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
        expect(save).not.toHaveBeenCalled();
        expect(editor.cancel()).toBe(true);
        expect(editor.text).toBe("12");
        expect(editor.error).toBeUndefined();
    });

    it.each([["", null], [".5", .5], ["-2.5e2", -250]])("parses %s as %s", async (text, value) => {
        const editor = new NumberEditor({ value: 0 });
        type(editor, text as string);
        expect(await editor.commit()).toBe(true);
        expect(editor.value).toBe(value);
    });

    it("shares concurrent confirmation and locks editing until acceptance completes", async () => {
        let resolve!: () => void;
        const save = vi.fn(() => new Promise<void>(done => { resolve = done; }));
        const editor = new TextEditor({ value: "old", onCommit: save });
        const input = type(editor, "new");
        const first = editor.commit();
        expect(editor.busy).toBe(true);
        expect(input.disabled).toBe(true);
        expect(editor.commit()).toBe(first);
        expect(editor.cancel()).toBe(false);
        expect(() => editor.setValue("other")).toThrow("Confirmation is still in progress");
        await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
        expect(editor.confirmedValue).toBe("old");
        resolve();
        expect(await first).toBe(true);
        expect(editor.busy).toBe(false);
        expect(input.disabled).toBe(false);
    });

    it("retains rejected edits for retry and only emits committed on success", async () => {
        const save = vi.fn().mockRejectedValueOnce(new Error("Server unavailable")).mockResolvedValue(undefined);
        const editor = new TextEditor({ value: "old", onCommit: save });
        const committed = vi.fn();
        editor.committed.subscribe(committed);
        type(editor, "new");
        expect(await editor.commit()).toBe(false);
        expect(editor.confirmedValue).toBe("old");
        expect(editor.text).toBe("new");
        expect(editor.error).toBe("Server unavailable");
        expect(committed).not.toHaveBeenCalled();
        expect(await editor.commit()).toBe(true);
        expect(committed).toHaveBeenCalledWith("new");
        expect(editor.error).toBeUndefined();
    });

    it("awaits custom parsing and validation before external acceptance", async () => {
        const save = vi.fn();
        const editor = new TextEditor<number>({ value: 1, parse: async text => Number(text),
            format: String, validate: async value => value > 10 ? "Maximum is 10" : undefined, onCommit: save });
        type(editor, "20");
        expect(await editor.commit()).toBe(false);
        expect(save).not.toHaveBeenCalled();
        expect(editor.text).toBe("20");
        type(editor, "5");
        expect(editor.error).toBeUndefined();
        expect(await editor.commit()).toBe(true);
        expect(save).toHaveBeenCalledWith(5, editor);
    });

    it("does not save unchanged values, including normalized input", async () => {
        const save = vi.fn();
        const editor = new NumberEditor({ value: 1, onCommit: save });
        expect(await editor.commit()).toBe(true);
        type(editor, "1.0");
        expect(await editor.commit()).toBe(true);
        expect(editor.text).toBe("1");
        expect(save).not.toHaveBeenCalled();
    });

    it("loads external values silently and cancels to the latest baseline", () => {
        const save = vi.fn();
        const editor = new TextEditor({ value: "first", onCommit: save });
        const input = vi.fn();
        const cancelled = vi.fn();
        editor.input.subscribe(input);
        editor.cancelled.subscribe(cancelled);
        editor.setValue("second");
        expect(input).not.toHaveBeenCalled();
        type(editor, "third");
        editor.cancel();
        expect(editor.text).toBe("second");
        expect(cancelled).toHaveBeenCalledTimes(1);
        expect(save).not.toHaveBeenCalled();
    });

    it("confirms on Enter or blur and cancels on Escape without capturing arrows", async () => {
        const editor = new TextEditor({ value: "old" });
        const input = type(editor, "new");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
        await vi.waitFor(() => expect(editor.confirmedValue).toBe("new"));
        type(editor, "cancelled");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
        expect(editor.text).toBe("new");
        const arrow = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
        input.dispatchEvent(arrow);
        expect(arrow.defaultPrevented).toBe(false);
        type(editor, "blurred");
        input.dispatchEvent(new Event("blur"));
        await vi.waitFor(() => expect(editor.confirmedValue).toBe("blurred"));
    });

    it("allows forms to defer blur confirmation and ignores IME Enter", async () => {
        const editor = new TextEditor({ value: "old", commitOnBlur: false });
        const input = type(editor, "new");
        input.dispatchEvent(new Event("blur"));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true }));
        await Promise.resolve();
        expect(editor.confirmedValue).toBe("old");
    });

    it("confirms checkbox values without parsing text", async () => {
        const save = vi.fn();
        const editor = new CheckboxEditor({ value: false, label: "Active", onCommit: save });
        editor.mount(document.body);
        editor.dom.querySelector("input")!.click();
        await vi.waitFor(() => expect(editor.confirmedValue).toBe(true));
        expect(save).toHaveBeenCalledWith(true, editor);
        expect(editor.modified).toBe(false);
        editor.dispose();
    });

    it("retains failed switch values and restores checked state on cancel", async () => {
        const editor = new ToggleEditor({ value: false, label: "Active", onCommit: async () => { throw new Error("Rejected"); } });
        const button = editor.dom.querySelector("button")!;
        button.click();
        await vi.waitFor(() => expect(editor.error).toBe("Rejected"));
        expect(button.getAttribute("role")).toBe("switch");
        expect(button.getAttribute("aria-checked")).toBe("true");
        expect(button.hasAttribute("aria-pressed")).toBe(false);
        editor.cancel();
        expect(button.getAttribute("aria-checked")).toBe("false");
        expect(button.classList.contains("elg-switch")).toBe(true);
    });

    it.each(["readOnly", "disabled"] as const)("prevents confirmation when %s", async key => {
        const save = vi.fn();
        const editor = new ToggleEditor({ value: false, [key]: true, onCommit: save });
        editor.dom.querySelector("button")!.click();
        expect(await editor.commit()).toBe(false);
        expect(save).not.toHaveBeenCalled();
    });

    it("supports custom equality and preserves references", async () => {
        const initial = { id: 1 };
        const save = vi.fn();
        const editor = new TextEditor({ value: initial, parse: text => ({ id: Number(text) }),
            format: value => String(value.id), equals: (a, b) => a.id === b.id, onCommit: save });
        expect(editor.value).toBe(initial);
        type(editor, "01");
        expect(await editor.commit()).toBe(true);
        expect(save).not.toHaveBeenCalled();
    });

    it("releases DOM listeners on disposal", async () => {
        const save = vi.fn();
        const editor = new ToggleEditor({ value: false, onCommit: save });
        const button = editor.dom.querySelector("button")!;
        editor.dispose();
        button.click();
        expect(await editor.commit()).toBe(false);
        expect(save).not.toHaveBeenCalled();
    });
});
