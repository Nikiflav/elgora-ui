import type { ValueEditor } from "../editors/ValueEditor";
import { TextEditor } from "../editors/ValueEditor";
import { PopoverEditor } from "../editors/PopoverEditor";
import { createFieldEditor } from "../editors/createFieldEditor";
import type { FieldEditorContext } from "../../data/DataViewField";

/** Keys that confirm a cell before moving the grid's active cell. */
export type CellEditNavigationKey = "Enter" | "Tab" | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

/** Internal, disposable lifetime for one cell edit; never attached to a recycled table row. */
export class GridCellEditor<TRow> {
    readonly editor: ValueEditor<any>;
    readonly element: HTMLDivElement;
    private finishing?: Promise<boolean>;
    private disposed = false;
    private typingEntry = false;
    private readonly pointerDown = () => { this.typingEntry = false; };
    private readonly keyDown: (event: KeyboardEvent) => void;
    private readonly focusOut: (event: FocusEvent) => void;
    private readonly committed: { dispose(): void };

    /** Mounts one editor and delegates successful completion/navigation to its grid. */
    constructor(host: HTMLElement, context: FieldEditorContext<TRow>,
        private readonly finished: (key?: CellEditNavigationKey, backwards?: boolean, restoreFocus?: boolean) => void) {
        this.element = host.ownerDocument.createElement("div");
        this.element.className = "elg-data-grid-editor";
        host.append(this.element);
        try { this.editor = createFieldEditor(context); }
        catch (error) { this.element.remove(); throw error; }
        this.editor.mount(this.element);
        this.committed = this.editor.committed.subscribe(() => {
            if (!this.finishing && !this.disposed) this.finished();
        });
        this.keyDown = event => {
            if (event.isComposing) return;
            // A picker owns its own arrows/Enter/Escape. Its callbacks may commit
            // a value, but closing a picker is not the end of the cell edit.
            if (this.editor instanceof PopoverEditor && this.editor.isOpen) {
                return;
            }
            // Switch-like button editors own native Enter activation, just as
            // checkboxes own Space. Their successful commit ends this session.
            if (event.key === "Enter" && event.target instanceof HTMLButtonElement) return;
            const navigateArrow = this.typingEntry && !event.ctrlKey && !event.metaKey && !event.altKey
                && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key);
            if (event.key === "Enter" || event.key === "Tab" || navigateArrow) {
                event.preventDefault(); event.stopImmediatePropagation();
                void this.finish(event.key as CellEditNavigationKey, event.shiftKey);
            } else if (event.key === "Escape") {
                event.preventDefault(); event.stopImmediatePropagation();
                if (this.editor.cancel()) this.finished();
            }
        };
        this.element.addEventListener("keydown", this.keyDown, true);
        // Clicking into the editor explicitly requests caret/value navigation,
        // even if the session originally began by replacing the cell text.
        this.element.addEventListener("pointerdown", this.pointerDown, true);
        this.focusOut = event => {
            if (this.element.contains(event.relatedTarget as Node | null)) return;
            // Native focus transfer can expose body between blur and focusin.
            // Wait for the whole transfer, not merely its first microtask.
            requestAnimationFrame(() => {
                if (!this.disposed && !this.editor.busy && !this.element.contains(host.ownerDocument.activeElement))
                    void this.finish(undefined, false, false);
            });
        };
        this.element.addEventListener("focusout", this.focusOut);
    }

    /** Focuses the input; typing to begin an edit replaces the initial text. */
    focus(initialText?: string): void {
        this.typingEntry = initialText !== undefined;
        this.editor.focus();
        if (this.editor instanceof TextEditor) {
            if (initialText !== undefined) {
                const input = this.editor.dom.querySelector("input")!;
                input.value = initialText;
                input.dispatchEvent(new Event("input", { bubbles: true }));
            } else this.editor.selectAll();
        }
    }

    /** Coalesces navigation requests and retains validation failures for correction. */
    finish(key?: CellEditNavigationKey, backwards = false, restoreFocus = true): Promise<boolean> {
        if (this.finishing) return this.finishing;
        this.finishing = this.editor.commit().then(success => {
            if (!this.disposed) {
                if (success) this.finished(key, backwards, restoreFocus);
                else this.editor.focus();
            }
            return success;
        }).finally(() => { this.finishing = undefined; });
        return this.finishing;
    }

    /** Places the stable overlay over the currently rendered cell. */
    position(cell: HTMLElement, host: HTMLElement): void {
        const bounds = cell.getBoundingClientRect(), parent = host.getBoundingClientRect();
        const style = cell.ownerDocument.defaultView!.getComputedStyle(cell);
        // Include the cell's borders in its content inset because the input has
        // no border of its own. This also preserves the text baseline with a
        // bottom-only separator or full cell borders.
        const inset = (padding: string, border: string) => (parseFloat(padding) || 0) + (parseFloat(border) || 0);
        this.element.style.setProperty("--elg-data-grid-editor-padding", [
            inset(style.paddingTop, style.borderTopWidth), inset(style.paddingRight, style.borderRightWidth),
            inset(style.paddingBottom, style.borderBottomWidth), inset(style.paddingLeft, style.borderLeftWidth)
        ].map(value => `${value}px`).join(" "));
        Object.assign(this.element.style, { left: `${bounds.left - parent.left - host.clientLeft}px`, top: `${bounds.top - parent.top - host.clientTop}px`,
            width: `${bounds.width}px`, height: `${bounds.height}px`, font: style.font, textAlign: style.textAlign });
    }

    /** Removes owned UI, picker resources and listeners; safe during an in-flight request. */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.committed.dispose();
        this.element.removeEventListener("keydown", this.keyDown, true);
        this.element.removeEventListener("pointerdown", this.pointerDown, true);
        this.element.removeEventListener("focusout", this.focusOut);
        this.editor.dispose();
        this.element.remove();
    }
}
