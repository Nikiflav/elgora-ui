import { TextEditor, type TextEditorOptions } from "./ValueEditor";
import type { PopoverEditorOptions } from "./PopoverEditorOptions";
import { Popover } from "../popup/popover";
import { assignElementProps, setElementProps, v } from "../../core/e";
import { createInputAdornment, inputAdornmentProps } from "./InputAdornment";
import type { MessageKey } from "../../localization/Messages";

/** Input, inset trigger and picker lifecycle shared by concrete popover editors. */
export interface PopoverTextEditorOptions<T> extends TextEditorOptions<T>, PopoverEditorOptions {
    /** Icon class for the inset button that opens or closes the picker. */
    triggerIcon: string;
    /** Accessible name and tooltip for the picker trigger button. */
    triggerLabel: string;
    /** Optional built-in message key; custom triggerLabel is otherwise retained verbatim. */
    triggerMessage?: MessageKey;
}

/**
 * Text editor with a lazily created picker. Closing changes visibility only;
 * parsing, validation and acceptance remain independent editor operations.
 * Subclasses provide picker content, preparation and the initial focus target.
 * @example
 * class ColorEditor extends PopoverEditor<string> {
 *     protected createPopup(): Popover {
 *         return new Popover({ anchorElement: this.control, bindAnchorTarget: false,
 *             closeMode: "manual", children: e("button", {
 *                 onclick: () => this.acceptPickerText("blue")
 *             }, "Blue") });
 *     }
 * }
 * const editor = new ColorEditor({ value: "red", triggerIcon: "ri-palette-line", triggerLabel: "Choose color" });
 */
export abstract class PopoverEditor<T> extends TextEditor<T> {
    protected popup?: Popover;
    private readonly auxiliary: HTMLElement;
    private readonly popoverOptions: PopoverTextEditorOptions<T>;
    private openingVersion = 0;
    private suppressFocusOpen = false;
    private pointerWasOpen = false;
    private removeOutside?: () => void;

    /** Creates a stable input and keyed trigger; picker content is created on first open. */
    constructor(options: PopoverTextEditorOptions<T>) {
        const { triggerIcon, triggerLabel, triggerMessage, openOnFocus, ...textOptions } = options;
        super({ ...textOptions, commitOnBlur: false });
        this.popoverOptions = options;
        this.auxiliary = createInputAdornment(this.control as HTMLInputElement);
        assignElementProps(this.control, { role: "combobox", ariaHasPopup: "dialog", ariaExpanded: "false" });
        this.control.setAttribute("autocomplete", "off");
        this.renderTasks.push(this.renderTrigger);
        this.renderTrigger();
        this.listen(this.control, "pointerdown", () => {
            this.suppressFocusOpen = false;
            this.pointerWasOpen = this.isOpen;
        });
        this.listen(this.control, "focus", () => {
            if (openOnFocus && !this.suppressFocusOpen && !this.pointerWasOpen) void this.openFromFocus();
        });
        this.listen(this.control.ownerDocument, "focusin", event => {
            const target = event.target;
            if (target instanceof Node && target !== this.control.ownerDocument.body && !this.dom.contains(target))
                this.suppressFocusOpen = false;
        });
        this.listen(this.control, "click", () => {
            if (this.pointerWasOpen && this.isOpen) this.close();
            else if (!this.pointerWasOpen && this.openOnInputClick && !this.isOpen) void this.open();
            this.pointerWasOpen = false;
        });
        this.listen(this.control, "keydown", event => {
            const key = event as KeyboardEvent;
            if (!key.isComposing && key.altKey && key.key === "ArrowDown") {
                key.preventDefault(); key.stopPropagation(); void this.open();
            }
        });
        this.listen(this.dom, "focusout", event => {
            if (this.dom.contains((event as FocusEvent).relatedTarget as Node | null)) return;
            requestAnimationFrame(() => {
                if (this.disposed.Value || this.dom.contains(this.dom.ownerDocument.activeElement)) return;
                if (options.commitOnBlur === true && this.canEdit()) void this.commit();
            });
        });
        this.addCleanup(() => { this.openingVersion++; this.removeOutside?.(); this.popup?.dispose(); });
    }

    /** Whether the picker is currently visible, independent of commit state. */
    get isOpen(): boolean { return this.popup?.isOpen() ?? false; }

    /** Creates picker content without mounting it; the base class owns its lifetime. */
    protected abstract createPopup(): Popover;
    /** Synchronizes picker state before showing; asynchronous work may be invalidated by close(). */
    protected preparePopup(): void | Promise<void> {}
    /** Places focus after showing. Lookup editors may retain focus in the input. */
    protected focusPopup(): void {}
    /** Lookup search fields can explicitly open the picker on an input click. */
    protected get openOnInputClick(): boolean { return false; }
    /** Releases picker-specific searches or scheduled focus work before hiding. */
    protected onPopupClosing(): void {}

    /** Opens explicitly without accepting or saving the draft. */
    open(): Promise<void> { return this.openPicker(false); }
    private openFromFocus(): Promise<void> { return this.openPicker(true); }
    private async openPicker(fromFocus: boolean): Promise<void> {
        if (!this.canEdit() || this.isOpen) return;
        const version = ++this.openingVersion;
        const preparation = this.preparePopup();
        if (preparation) await preparation;
        if (version !== this.openingVersion || !this.canEdit()) return;
        if (fromFocus && this.control.ownerDocument.activeElement !== this.control) return;
        if (!this.popup) {
            this.popup = this.createPopup();
            this.popup.mount(this.dom);
            this.control.setAttribute("aria-controls", this.popup.dom.id);
            this.listen(this.popup.dom, "keydown", event => this.handlePopupKey(event as KeyboardEvent));
            this.listen(this.popup.dom, "toggle", () => {
                if (!this.isOpen) { this.openingVersion++; this.removeOutside?.(); this.removeOutside = undefined; }
                this.control.setAttribute("aria-expanded", String(this.isOpen));
                this.render(this.renderTrigger);
            });
        }
        this.popup.show();
        const doc = this.control.ownerDocument;
        if (!this.removeOutside) {
            const outside = (event: PointerEvent) => {
                if (!(event.target instanceof Node) || !this.dom.contains(event.target)) this.close();
            };
            doc.addEventListener("pointerdown", outside, true);
            this.removeOutside = () => doc.removeEventListener("pointerdown", outside, true);
        }
        this.renderTrigger();
        this.focusPopup();
    }

    /** Hides without accepting or discarding text. Invalidates any pending opening request. */
    close(): void {
        this.openingVersion++;
        this.suppressFocusOpen = true;
        this.removeOutside?.(); this.removeOutside = undefined;
        this.onPopupClosing();
        this.popup?.hide();
        this.control.setAttribute("aria-expanded", "false");
        this.render(this.renderTrigger);
    }

    /** Returns focus after a picker action without triggering openOnFocus again. */
    protected restoreInputFocus(): void { this.suppressFocusOpen = true; this.focus(); }

    /** Loading a value invalidates a picker opening based on an older draft. */
    override setValue(value: T): void { this.openingVersion++; super.setValue(value); }

    /** Updates the draft from a picker choice, then hides and starts independent confirmation. */
    protected acceptPickerText(text: string): void {
        if (!this.canEdit()) return;
        (this.control as HTMLInputElement).value = text;
        this.control.dispatchEvent(new Event("input", { bubbles: true }));
        this.close();
        this.restoreInputFocus();
        void this.commit();
    }

    /** Escape restores accepted text and closes; close() alone never cancels an edit. */
    override cancel(): boolean {
        if (!super.cancel()) return false;
        this.close();
        return true;
    }

    /** Keeps the trigger enabled state synchronized with asynchronous editor work. */
    protected override syncControl(): void {
        super.syncControl();
        if (this.auxiliary) this.render(this.renderTrigger);
    }

    private handlePopupKey(key: KeyboardEvent): void {
        if (key.key !== "Escape" || key.defaultPrevented || key.isComposing) return;
        key.preventDefault(); key.stopPropagation();
        if (this.cancel()) this.restoreInputFocus();
    }

    private readonly renderTrigger = (): void => {
        if (this.disposed.Value) return;
        setElementProps(this.auxiliary, { ...inputAdornmentProps, vnodes: [v("button", {
            key: "picker-trigger", type: "button", tabIndex: -1,
            ui: ["elg", "btn", "border-0", "p-0"], class: "elg-editor-trigger",
            ariaLabel: this.popoverOptions.triggerMessage
                ? (this.messages.text as (key: MessageKey) => string)(this.popoverOptions.triggerMessage)
                : this.popoverOptions.triggerLabel, ariaExpanded: String(this.isOpen), disabled: !this.canEdit(),
            onmousedown: event => event.preventDefault(),
            onclick: () => { if (this.isOpen) this.close(); else void this.open(); }
        }, v("i", { class: this.popoverOptions.triggerIcon, ariaHidden: "true" }))] });
        assignElementProps(this.control, { ariaExpanded: String(this.isOpen) });
        this.popup?.dom.querySelectorAll("fieldset").forEach(fieldset => { fieldset.disabled = !this.canEdit(); });
    };
}
