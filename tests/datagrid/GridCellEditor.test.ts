import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GridCellEditor } from "../../src/components/datagrid/GridCellEditor";
import { DateEditor } from "../../src/components/editors/DateEditor";

const sessions: GridCellEditor<any>[] = [];
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
    sessions.splice(0).forEach(session => session.dispose()); await frame();
    document.body.replaceChildren(); vi.restoreAllMocks();
    delete (HTMLElement.prototype as any).showPopover; delete (HTMLElement.prototype as any).hidePopover;
});
function create(dataType: "date" | "string" = "date") {
    const saved = vi.fn(async () => {}), finished = vi.fn();
    const session = new GridCellEditor(document.body, { row: {}, field: { name: "delivery", dataType },
        value: dataType === "date" ? "2026-10-20" : "Original", onCommit: saved }, finished);
    sessions.push(session); session.focus(); return { session, saved, finished };
}
describe("GridCellEditor picker ownership", () => {
    it("matches the exact cell box, font, alignment and content insets", () => {
        const { session } = create("string");
        const host = document.createElement("div"), cell = document.createElement("div");
        document.body.append(host, cell);
        cell.style.cssText = "padding: 4px 6px; border-bottom: 1px solid black; font: 15px/22.5px Arial; text-align: right";
        const rect = (left: number, top: number, width: number, height: number) =>
            ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON() {} });
        vi.spyOn(host, "getBoundingClientRect").mockReturnValue(rect(10, 20, 400, 300));
        Object.defineProperty(host, "clientLeft", { value: 1 }); Object.defineProperty(host, "clientTop", { value: 1 });
        vi.spyOn(cell, "getBoundingClientRect").mockReturnValue(rect(30, 60, 150, 36));
        session.position(cell, host);
        expect(session.element.style.left).toBe("19px"); expect(session.element.style.top).toBe("39px");
        expect(session.element.style.width).toBe("150px"); expect(session.element.style.height).toBe("36px");
        expect(session.element.style.minHeight).toBe("");
        expect(session.element.style.textAlign).toBe("right");
        expect(session.element.style.font).toContain("15px");
        expect(session.element.style.getPropertyValue("--elg-data-grid-editor-padding")).toBe("4px 6px 5px 6px");
    });
    it("keeps arrows inside an open picker even after typing starts the edit", async () => {
        const { session, saved, finished } = create();
        session.focus("2026-10-20");
        const editor = session.editor as DateEditor;
        await editor.open(); await frame();
        editor.dom.querySelector<HTMLElement>('[data-date="2026-10-20"]')!
            .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        await frame(); expect(editor.isOpen).toBe(true);
        expect(saved).not.toHaveBeenCalled(); expect(finished).not.toHaveBeenCalled();
    });
    it("does not finish in the transient body-focus gap of a native focus transfer", async () => {
        const { session, finished } = create("string");
        const button = document.createElement("button"); session.element.append(button);
        session.editor.dom.querySelector("input")!.blur();
        await Promise.resolve(); // A focusout microtask must not finish the cell here.
        button.focus(); await frame();
        expect(finished).not.toHaveBeenCalled();
    });
    it("saves a picked date before signalling successful cell completion", async () => {
        const { session, saved, finished } = create();
        const editor = session.editor as DateEditor;
        await editor.open(); await frame();
        const day = editor.dom.querySelector<HTMLButtonElement>('button[data-date="2026-10-22"]')!;
        day.focus(); await Promise.resolve(); day.click();
        await vi.waitFor(() => expect(saved).toHaveBeenCalled());
        expect(saved.mock.calls[0][0]).toBe("2026-10-22");
        await vi.waitFor(() => expect(finished).toHaveBeenCalledTimes(1));
        expect(editor.isOpen).toBe(false);
    });
    it("lets Escape close the picker first and only then cancel the cell", async () => {
        const { session, saved, finished } = create();
        const editor = session.editor as DateEditor;
        await editor.open(); await frame();
        editor.dom.querySelector<HTMLElement>('[data-date="2026-10-20"]')!
            .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await frame(); expect(editor.isOpen).toBe(false); expect(finished).not.toHaveBeenCalled();
        editor.dom.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        expect(finished).toHaveBeenCalledTimes(1); expect(saved).not.toHaveBeenCalled();
    });
});
