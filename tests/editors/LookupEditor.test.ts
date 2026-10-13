import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LookupEditor, type LookupEditorOptions, type LookupQuery } from "../../src/components/editors/LookupEditor";

type Item = { id: number; name: string };
const items: Item[] = [{ id: 1, name: "Northwind" }, { id: 2, name: "Contoso" }, { id: 3, name: "Northstar" }];
const editors: LookupEditor<number, Item>[] = [];
function create(overrides: Partial<LookupEditorOptions<number, Item>> = {}) {
    const editor = new LookupEditor<number, Item>({ value: 1, label: "Customer",
        columns: [{ name: "name" }], searchDelay: 0,
        loadItems: async query => {
            const matches = items.filter(item => item.name.toLowerCase().includes(query.search.toLowerCase()));
            return { items: matches.slice(query.skip ?? 0, (query.skip ?? 0) + (query.top ?? 50)), totalCount: matches.length };
        }, getItemValue: item => item.id, getItemText: item => item.name,
        getValueText: value => items.find(item => item.id === value)?.name ?? "", ...overrides });
    editors.push(editor);
    editor.mount(document.body);
    return editor;
}
function type(editor: LookupEditor<number, Item>, text: string) {
    const input = editor.dom.querySelector("input")!;
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return input;
}
beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        font: "", measureText: (text: string) => ({ width: text.length * 8 })
    } as any);
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    const originalMatches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function(this: HTMLElement, selector) {
        return selector === ":popover-open" ? this.hasAttribute("data-test-open") : originalMatches.call(this, selector);
    });
    Object.defineProperty(HTMLElement.prototype, "showPopover", { configurable: true, value: function(this: HTMLElement) {
        this.setAttribute("data-test-open", "");
        this.dispatchEvent(new Event("toggle"));
    } });
    Object.defineProperty(HTMLElement.prototype, "hidePopover", { configurable: true, value: function(this: HTMLElement) {
        this.removeAttribute("data-test-open");
        this.dispatchEvent(new Event("toggle"));
    } });
});
afterEach(async () => {
    editors.splice(0).forEach(editor => editor.dispose());
    await new Promise(resolve => setTimeout(resolve, 25));
    document.body.replaceChildren();
    vi.restoreAllMocks(); vi.unstubAllGlobals();
    delete (HTMLElement.prototype as any).showPopover;
    delete (HTMLElement.prototype as any).hidePopover;
});

describe("LookupEditor", () => {
    it("loads display text independently and resolves external text without editing", async () => {
        const save = vi.fn();
        const editor = create({ onCommit: save });
        await vi.waitFor(() => expect(editor.text).toBe("Northwind"));
        expect(await editor.resolveText("Contoso")).toBe(2);
        expect(editor.value).toBe(1);
        expect(editor.text).toBe("Northwind");
        expect(editor.dom.querySelector("[popover]")).toBeNull();
        expect(save).not.toHaveBeenCalled();
    });
    it("rejects zero or multiple complete-result matches", async () => {
        const editor = create();
        await expect(editor.resolveText("Missing")).rejects.toThrow("No matching item");
        await expect(editor.resolveText("North")).rejects.toThrow("More than one");
        expect(editor.error).toBeUndefined();
    });
    it("does not mistake a single returned item for a unique match", async () => {
        const editor = create({ loadItems: async () => ({ items: [items[0]], totalCount: 100 }) });
        await expect(editor.resolveText("Northwind")).rejects.toThrow("More than one");
    });
    it("detects a malformed unique-match response", async () => {
        const editor = create({ loadItems: async () => ({ items: [], totalCount: 1 }) });
        await expect(editor.resolveText("Northwind")).rejects.toThrow("not returned");
    });
    it("typing searches without changing the value, and Escape restores accepted text", async () => {
        const save = vi.fn();
        const editor = create({ onCommit: save });
        await vi.waitFor(() => expect(editor.text).toBe("Northwind"));
        const input = type(editor, "North");
        expect(editor.value).toBe(1);
        expect(input.getAttribute("aria-expanded")).toBe("true");
        expect(save).not.toHaveBeenCalled();
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(editor.text).toBe("Northwind");
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("Enter resolves a unique typed match and awaits external acceptance", async () => {
        const save = vi.fn();
        const editor = create({ onCommit: save });
        const input = type(editor, "Contoso");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        await vi.waitFor(() => expect(editor.confirmedValue).toBe(2));
        expect(editor.text).toBe("Contoso");
        expect(save).toHaveBeenCalledWith(2, editor);
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("keeps failed confirmation text and popup for correction", async () => {
        const editor = create({ onCommit: async () => { throw new Error("Save failed"); } });
        type(editor, "Contoso");
        expect(await editor.commit()).toBe(false);
        expect(editor.error).toBe("Save failed");
        expect(editor.text).toBe("Contoso");
        expect(editor.confirmedValue).toBe(1);
        expect(editor.dom.querySelector("input")!.getAttribute("aria-expanded")).toBe("true");
        editor.cancel();
        await vi.waitFor(() => expect(editor.text).toBe("Northwind"));
    });
    it("ignores obsolete display-text requests after an external value change", async () => {
        let resolve!: (text: string) => void;
        const editor = create({ getValueText: value => value === 1 ? new Promise(done => { resolve = done; }) : "Contoso" });
        await vi.waitFor(() => expect(resolve).toBeTypeOf("function"));
        editor.setValue(2);
        await vi.waitFor(() => expect(editor.text).toBe("Contoso"));
        resolve("Old label");
        await Promise.resolve(); await Promise.resolve();
        expect(editor.text).toBe("Contoso");
    });
    it("ignores obsolete searches even when the loader ignores AbortSignal", async () => {
        let finish!: (result: { items: Item[]; totalCount: number }) => void;
        const queries: LookupQuery[] = [];
        const editor = create({ loadItems: async query => {
            queries.push(query);
            if (query.search === "Old") return new Promise(done => { finish = done; });
            return { items: [items[1]], totalCount: 1 };
        } });
        type(editor, "Old");
        await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
        type(editor, "New");
        await vi.waitFor(() => expect(queries.some(query => query.search === "New")).toBe(true));
        finish({ items, totalCount: 3 });
        await vi.waitFor(() => expect(editor.dom.querySelector("[role='status']")!.textContent).toBe("1 matches"));
        expect(queries.find(query => query.search === "Old")!.abortSignal!.aborted).toBe(true);
    });
    it("retains popup dimensions on reopening and optionally omits the resize grip", async () => {
        const editor = create({ resizable: false });
        editor.open();
        const popup = editor.dom.querySelector<HTMLElement>("[popover]")!;
        expect(popup.querySelector(".elg-resize-handle")).toBeNull();
        popup.style.width = "520px";
        popup.style.height = "360px";
        editor.close();
        editor.open();
        expect(popup.style.width).toBe("520px");
        expect(popup.style.height).toBe("360px");
    });
    it("ignores IME Enter and respects readOnly", () => {
        const editor = create({ readOnly: true });
        editor.open();
        expect(editor.dom.querySelector("[popover]")).toBeNull();
        const input = editor.dom.querySelector("input")!;
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true }));
        expect(editor.busy).toBe(false);
    });
    it("reports loader failures without changing the accepted value", async () => {
        const editor = create({ loadItems: async () => { throw new Error("Network unavailable"); } });
        editor.open();
        await vi.waitFor(() => expect(editor.error).toBe("Network unavailable"));
        expect(editor.confirmedValue).toBe(1);
        expect(editor.dom.querySelector("[role='status']")!.textContent).toBe("Failed to load lookup items.");
        expect(editor.dom.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
    });
    it("restores the accepted text on native outside dismissal", async () => {
        const editor = create();
        await vi.waitFor(() => expect(editor.text).toBe("Northwind"));
        type(editor, "Contoso");
        (editor.dom.querySelector("[popover]") as any).hidePopover();
        expect(editor.text).toBe("Northwind");
        expect(editor.confirmedValue).toBe(1);
        expect(editor.modified).toBe(false);
    });
    it("uses custom text resolution without opening a popup or invoking validation", async () => {
        const validate = vi.fn();
        const editor = create({ resolveText: async () => 3, validate });
        expect(await editor.resolveText("external code")).toBe(3);
        expect(editor.value).toBe(1);
        expect(validate).not.toHaveBeenCalled();
        expect(editor.dom.querySelector("[popover]")).toBeNull();
    });
});
