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
    it("opens on focus without moving search focus, and Escape does not reopen results", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        input.focus();
        expect(input.getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(input);
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await new Promise(resolve => requestAnimationFrame(resolve));
        expect(input.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(input);
    });
    it("keeps the popup open for input and trigger pointerdown, and closes outside", () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        const trigger = editor.dom.querySelector("button[aria-label='Open lookup']")!;
        const outside = document.createElement("button");
        document.body.append(outside);

        editor.open();
        input.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        expect(editor.dom.querySelector("[popover]")!.hasAttribute("data-test-open")).toBe(true);
        trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        expect(editor.dom.querySelector("[popover]")!.hasAttribute("data-test-open")).toBe(true);

        outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        expect(editor.dom.querySelector("[popover]")!.hasAttribute("data-test-open")).toBe(false);
        outside.remove();
    });
    it("does not reopen on focus caused by selecting a result", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        input.focus();
        await vi.waitFor(() => expect(editor.dom.querySelector(".elg-data-grid-row-data")).not.toBeNull());
        const row = editor.dom.querySelector<HTMLElement>(".elg-data-grid-row-data")!;
        const cell = row.querySelector<HTMLElement>(".elg-data-grid-cell")!;
        cell.dispatchEvent(new MouseEvent("mousedown", { button: 0, bubbles: true }));
        cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await vi.waitFor(() => expect(input.getAttribute("aria-expanded")).toBe("false"));
        expect(document.activeElement).toBe(input);
    });
    it("does not open on focus by default or when read-only", () => {
        const editor = create(); editor.dom.querySelector("input")!.focus();
        expect(editor.dom.querySelector("[popover]")).toBeNull();
        const readOnly = create({ openOnFocus: true, readOnly: true });
        readOnly.dom.querySelector("input")!.focus();
        expect(readOnly.dom.querySelector("[popover]")).toBeNull();
    });
    it.each([120, 360])("matches a %ipx input with a 200px minimum and remeasures on reopening", width => {
        const editor = create({ resizable: false });
        const input = editor.dom.querySelector("input")!;
        const rect = vi.spyOn(input, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);
        editor.open();
        const popup = editor.dom.querySelector<HTMLElement>("[popover]")!;
        expect(popup.style.width).toBe(`${Math.max(200, width)}px`);
        expect(popup.style.boxSizing).toBe("border-box");
        editor.close();
        rect.mockReturnValue({ width: 500 } as DOMRect);
        editor.open();
        expect(popup.style.width).toBe("500px");
    });
    it("lets a narrow viewport take precedence over the automatic minimum", () => {
        vi.spyOn(window, "innerWidth", "get").mockReturnValue(180);
        const editor = create();
        vi.spyOn(editor.dom.querySelector("input")!, "getBoundingClientRect").mockReturnValue({ width: 600 } as DOMRect);
        editor.open();
        expect(editor.dom.querySelector<HTMLElement>("[popover]")!.style.width).toBe("172px");
    });
    it("uses explicit popupWidth instead of the input width", () => {
        const editor = create({ popupWidth: 280 });
        vi.spyOn(editor.dom.querySelector("input")!, "getBoundingClientRect").mockReturnValue({ width: 600 } as DOMRect);
        editor.open();
        expect(editor.dom.querySelector<HTMLElement>("[popover]")!.style.width).toBe("280px");
    });
    it("removes row separators for a single-column result list", () => {
        const singleColumn = create();
        singleColumn.open();
        const singleGrid = singleColumn.dom.querySelector<HTMLElement>(".elg-data-grid")!;
        expect(singleGrid.classList.contains("elg-data-grid-no-border")).toBe(true);
        expect(singleGrid.classList.contains("elg-data-grid-no-cell-borders")).toBe(true);
        expect(singleGrid.classList.contains("elg-data-grid-no-selection")).toBe(false);
        expect(singleGrid.classList.contains("elg-data-grid-cursor-default")).toBe(true);
        expect(singleGrid.classList.contains("elg-data-grid-hover-row")).toBe(true);
        expect(singleGrid.classList.contains("elg-lookup-grid-single-column")).toBe(true);

        const multiColumn = create({ columns: [{ name: "name" }, { name: "id" }] });
        multiColumn.open();
        const multiGrid = multiColumn.dom.querySelector<HTMLElement>(".elg-data-grid")!;
        expect(multiGrid.classList.contains("elg-data-grid-no-cell-borders")).toBe(false);
        expect(multiGrid.classList.contains("elg-lookup-grid-single-column")).toBe(false);
    });
    it("retains a manually resized automatic popup even when the input changes width", () => {
        const editor = create();
        const rect = vi.spyOn(editor.dom.querySelector("input")!, "getBoundingClientRect").mockReturnValue({ width: 360 } as DOMRect);
        editor.open();
        const popup = editor.dom.querySelector<HTMLElement>("[popover]")!;
        vi.spyOn(popup, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 360, height: 300 } as DOMRect);
        vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1000);
        vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(800);
        const grip = popup.querySelector<HTMLElement>(".elg-resize-handle")!;
        grip.setPointerCapture = vi.fn();
        grip.hasPointerCapture = () => false;
        const pointer = (type: string, x: number) => {
            const event = new MouseEvent(type, { clientX: x, clientY: 300, button: 0, bubbles: true, cancelable: true });
            Object.defineProperty(event, "pointerId", { value: 1 });
            grip.dispatchEvent(event);
        };
        pointer("pointerdown", 360); pointer("pointermove", 520); pointer("pointerup", 520);
        expect(popup.style.width).toBe("520px");
        editor.close(); rect.mockReturnValue({ width: 700 } as DOMRect); editor.open();
        expect(popup.style.width).toBe("520px");
    });
    it("insets a keyed trigger without a Tab stop and keeps input focus on pointer opening", async () => {
        const editor = create();
        const input = editor.dom.querySelector("input")!;
        const trigger = editor.dom.querySelector<HTMLButtonElement>("button[aria-label='Open lookup']")!;
        expect(trigger.tabIndex).toBe(-1);
        expect(input.style.paddingRight).toBe("2rem");
        expect(input.parentElement!.contains(trigger)).toBe(true);
        const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
        trigger.dispatchEvent(down);
        expect(down.defaultPrevented).toBe(true);
        trigger.click();
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute("aria-expanded")).toBe("true");
        await new Promise(resolve => requestAnimationFrame(resolve));
        expect(editor.dom.querySelector("button[aria-label='Open lookup']")).toBe(trigger);
        expect(trigger.parentElement!.classList.contains("elg-position-absolute")).toBe(true);
        expect(trigger.parentElement!.style.top).toBe("50%");
        expect(trigger.parentElement!.parentElement).toBe(input.parentElement);
        trigger.click();
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("Alt+Down opens without selecting or saving; Left/Right remain native caret keys", async () => {
        const onCommit = vi.fn();
        const editor = create({ onCommit });
        const input = editor.dom.querySelector("input")!;
        input.focus();
        const key = new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, cancelable: true });
        input.dispatchEvent(key);
        expect(key.defaultPrevented).toBe(true);
        expect(input.getAttribute("aria-expanded")).toBe("true");
        await vi.waitFor(() => expect(editor.dom.querySelector("[role='status']")!.textContent).toBe("3 matches"));
        const arrow = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
        input.dispatchEvent(arrow);
        expect(arrow.defaultPrevented).toBe(false);
        expect(editor.dom.querySelector(".elg-data-grid-selected")).toBeNull();
        expect(document.activeElement).toBe(input);
        expect(onCommit).not.toHaveBeenCalled();
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("shows the active lookup row when navigating with the arrow keys", async () => {
        const editor = create({ openOnFocus: true });
        const input = editor.dom.querySelector("input")!;
        input.focus();
        await vi.waitFor(() => expect(editor.dom.querySelector("[role='status']")!.textContent).toBe("3 matches"));
        await vi.waitFor(() => expect(editor.dom.querySelector(".elg-data-grid-row-data")).not.toBeNull());
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect((editor as any).grid.getActiveSelectionCell()).toEqual({ rowIndex: 0, colIndex: 0 }));
        expect((editor as any).grid.dom.classList.contains("elg-data-grid-no-selection")).toBe(false);
    });
    it.each(["readOnly", "disabled"] as const)("disables the inset trigger for %s", key => {
        const editor = create({ [key]: true });
        const trigger = editor.dom.querySelector<HTMLButtonElement>("button[aria-label='Open lookup']")!;
        expect(trigger.disabled).toBe(true);
        trigger.click();
        expect(editor.dom.querySelector("[popover]")).toBeNull();
    });
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
        const editor = create({ onCommit: save, openOnFocus: true });
        const input = type(editor, "Contoso");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        await vi.waitFor(() => expect(editor.confirmedValue).toBe(2));
        expect(editor.text).toBe("Contoso");
        expect(save).toHaveBeenCalledWith(2, editor);
        expect(input.getAttribute("aria-expanded")).toBe("false");
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(input.getAttribute("aria-expanded")).toBe("false");
    });
    it("keeps failed confirmation text and error while closing the results popup", async () => {
        const editor = create({ onCommit: async () => { throw new Error("Save failed"); } });
        type(editor, "Contoso");
        expect(await editor.commit()).toBe(false);
        expect(editor.error).toBe("Save failed");
        expect(editor.text).toBe("Contoso");
        expect(editor.confirmedValue).toBe(1);
        expect(editor.dom.querySelector("input")!.getAttribute("aria-expanded")).toBe("false");
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
        await vi.waitFor(() => expect(editor.dom.querySelector("[role='status']")!.textContent).toBe("1 match"));
        expect(queries.find(query => query.search === "Old")!.abortSignal!.aborted).toBe(true);
    });
    it("retains popup dimensions on reopening and optionally omits the resize grip", async () => {
        const editor = create({ resizable: false, popupWidth: 440 });
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
    it("retains unconfirmed text on native outside dismissal", async () => {
        const editor = create();
        await vi.waitFor(() => expect(editor.text).toBe("Northwind"));
        type(editor, "Contoso");
        (editor.dom.querySelector("[popover]") as any).hidePopover();
        expect(editor.text).toBe("Contoso");
        expect(editor.confirmedValue).toBe(1);
        expect(editor.modified).toBe(true);
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
