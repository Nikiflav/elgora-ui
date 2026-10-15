import { Component, type ComponentOptions } from "../../core/Component";
import { ObservableEvent } from "../../core/ElgoraUI";
import { assignElementProps, e, setElementProps, v } from "../../core/e";
import { Tooltip } from "../popup/Tooltip";
import { createInputErrorAdornment } from "./InputAdornment";

/** Configuration shared by editors in forms, grids and standalone controls. */
export interface ValueEditorOptions<T> extends Omit<ComponentOptions, "tag" | "children"> {
    value: T;
    readOnly?: boolean;
    disabled?: boolean;
    /** Accessible name for the input or button. */
    label?: string;
    /** Compares values without cloning them; defaults to Object.is. */
    equals?: (left: T, right: T) => boolean;
    /** Converts external text to a value without changing editor state or saving. */
    resolveText?: (text: string) => T | Promise<T>;
    /** Returns an error message, or undefined when the value is valid. */
    validate?: (value: T) => string | undefined | Promise<string | undefined>;
    /** Accepts a value externally. Rejection leaves the edit available for retry. */
    onCommit?: (value: T, editor: ValueEditor<T>) => void | Promise<void>;
}

/** Configuration shared by boolean editors. */
export interface BooleanEditorOptions extends ValueEditorOptions<boolean> {
    /** Makes the visible label activate the boolean control. */
    labelClickable?: boolean;
}

/**
 * Value-editing lifecycle independent of rows and data sources.
 * Values are retained by reference. The host decides whether accepting a value
 * updates a local model or saves it elsewhere.
 */
export abstract class ValueEditor<T> extends Component {
    /** Notifies about user input, before validation or confirmation. */
    readonly input = new ObservableEvent<void>();
    /** Notifies after successful external acceptance. */
    readonly committed = new ObservableEvent<T>();
    /** Notifies after restoring the last accepted value. */
    readonly cancelled = new ObservableEvent<void>();
    protected draft: T;
    protected accepted: T;
    protected readonly editorOptions: ValueEditorOptions<T>;
    protected control!: HTMLInputElement | HTMLButtonElement;
    private errorElement: HTMLElement;
    private errorAdornment?: HTMLElement;
    private errorTooltipCleanup?: () => void;
    private pending?: Promise<boolean>;
    private working = false;
    private message?: string;

    /** Creates the lifecycle and an inline validation-message container. */
    constructor(options: ValueEditorOptions<T>) {
        const { value, readOnly, disabled, label, equals, resolveText, validate, onCommit, ...domOptions } = options;
        super({ ...domOptions, tag: "div" });
        this.editorOptions = options;
        this.draft = this.accepted = value;
        this.errorElement = e("div", { class: "elg-editor-error-message", role: "alert", hidden: true });
        this.append(this.errorElement);
        this.addCleanup(this.input);
        this.addCleanup(this.committed);
        this.addCleanup(this.cancelled);
    }

    /** Current typed value. Text editors may additionally contain unparsed text. */
    get value(): T { return this.draft; }
    /** Last successfully accepted value, also used by cancel(). */
    get confirmedValue(): T { return this.accepted; }
    /** Whether the current draft differs from the accepted value. */
    get modified(): boolean { return !this.same(this.draft, this.accepted); }
    /** True throughout parsing, validation and the external callback. */
    get busy(): boolean { return this.working; }
    /** Current parsing, validation or external-acceptance error. */
    get error(): string | undefined { return this.message; }

    /** Uses the configured comparison; object values use reference equality by default. */
    protected same(left: T, right: T): boolean {
        return (this.editorOptions.equals ?? Object.is)(left, right);
    }

    /** Installs a native control without replacing it during subsequent edits. */
    protected installControl(control: HTMLInputElement | HTMLButtonElement): void {
        this.control = control;
        if (this.editorOptions.label) control.setAttribute("aria-label", this.editorOptions.label);
        this.dom.insertBefore(control, this.errorElement);
        if (control instanceof HTMLInputElement && control.type !== "checkbox") {
            this.errorAdornment = createInputErrorAdornment(control);
        } else {
            // Boolean controls must remain directly clickable. Their error icon
            // lives beside the control instead of covering it with an inset slot.
            this.errorAdornment = e("div", { class: "elg-input-error-adornment", hidden: true });
            this.dom.insertBefore(this.errorAdornment, control);
            assignElementProps(this.dom, { ui: ["d-flex", "items-center", "gap-1"] });
        }
        this.errorElement.id = `elg-editor-error-${Math.random().toString(36).slice(2)}`;
        control.setAttribute("aria-describedby", this.errorElement.id);
        this.syncControl();
    }

    /** Moves the control into a semantic label so clicking its text activates it. */
    protected makeLabelClickable(label: string): void {
        const labelElement = e("label", { ui: ["d-flex", "items-center", "gap-1"] });
        const textElement = e("span", {}, label);
        this.dom.insertBefore(labelElement, this.control);
        labelElement.append(this.control, textElement);
        this.listen(textElement, "click", event => {
            event.preventDefault();
            if (!this.canEdit()) return;
            if (this.control instanceof HTMLInputElement && this.control.type === "checkbox") {
                this.control.checked = !this.control.checked;
                this.control.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
                this.control.click();
            }
        });
    }

    /** Updates enabled and validation states while keeping native focus and selection. */
    protected syncControl(): void {
        if (!this.control) return;
        this.control.disabled = !!this.editorOptions.disabled || this.busy
            || (this.control instanceof HTMLButtonElement && !!this.editorOptions.readOnly)
            || (this.control instanceof HTMLInputElement && this.control.type === "checkbox" && !!this.editorOptions.readOnly);
        if (this.control instanceof HTMLInputElement) this.control.readOnly = !!this.editorOptions.readOnly;
        this.control.setAttribute("aria-invalid", String(!!this.message));
        this.dom.setAttribute("aria-busy", String(this.busy));
        this.errorElement.hidden = !this.message;
        this.errorElement.textContent = this.message ?? "";
        if (this.control instanceof HTMLInputElement && this.control.type !== "checkbox") {
            this.control.style.paddingLeft = this.message ? "1.5rem" : "";
        }
        if (this.errorAdornment) {
            this.errorTooltipCleanup?.();
            this.errorTooltipCleanup = undefined;
            // Patch only dynamic state so inset positioning is retained for
            // text controls and inline layout is retained for boolean controls.
            assignElementProps(this.errorAdornment, {
                hidden: !this.message,
                ariaLabel: this.message ? `Validation error: ${this.message}` : undefined,
                vnodes: this.message ? [v("i", {
                    class: "ri-error-warning-line",
                    // Keep the icon transparent; the input supplies the background.
                    ui: ["text-danger"],
                    ariaHidden: "true"
                })] : []
            });
            if (this.message) this.errorTooltipCleanup = Tooltip.attach(this.errorAdornment, this.message, { placement: "top", gap: 4 });
        }
    }

    /** Whether the control may accept a user edit right now. */
    protected canEdit(): boolean {
        return !this.busy && !this.disposed.Value && !this.editorOptions.disabled && !this.editorOptions.readOnly;
    }

    /** Records user input and clears the previous error without saving anything. */
    protected notifyInput(): void {
        this.message = undefined;
        this.syncControl();
        this.input.invoke(undefined);
    }

    /** Displays an asynchronous editor error without accepting or saving a value. */
    protected reportError(error: unknown): void {
        this.message = error instanceof Error ? error.message : String(error);
        this.syncControl();
    }

    /** Resolves a candidate value. Text editors override this to parse their text. */
    protected async candidate(): Promise<T> { return this.draft; }

    /**
     * Converts text into a typed value, or throws/rejects when it cannot be resolved.
     * Does not modify draft, error, busy or confirmation state, invoke validation,
     * emit events or save. Hosts can use this independently for clipboard paste.
     * @example const value = await editor.resolveText(clipboardText);
     */
    abstract resolveText(text: string): T | Promise<T>;

    /** Restores the control's visual representation from the current typed value. */
    protected abstract displayValue(): void;

    /**
     * Loads an externally supplied value as both draft and confirmation baseline.
     * Does not invoke onCommit or input. For example: editor.setValue(order.quantity).
     */
    setValue(value: T): void {
        if (this.busy) throw new Error("Failed to set editor value. Confirmation is still in progress.");
        this.draft = this.accepted = value;
        this.message = undefined;
        this.displayValue();
        this.syncControl();
    }

    /**
     * Parses, validates and awaits external acceptance. Returns false on failure.
     * Concurrent calls share one operation; unchanged values do not invoke onCommit.
     * For example: if (await editor.commit()) closeDialog().
     */
    commit(): Promise<boolean> {
        if (this.pending) return this.pending;
        if (!this.canEdit()) return Promise.resolve(false);
        if (!this.modified) return Promise.resolve(true);
        const hadFocus = this.control.ownerDocument.activeElement === this.control;
        this.working = true;
        this.message = undefined;
        this.syncControl();
        this.pending = Promise.resolve().then(async () => {
            try {
                const value = await this.candidate();
                const error = await this.editorOptions.validate?.(value);
                if (error) throw new Error(error);
                this.draft = value;
                if (!this.same(value, this.accepted)) await this.editorOptions.onCommit?.(value, this);
                this.accepted = value;
                this.displayValue();
            } catch (error) {
                this.message = error instanceof Error ? error.message : String(error);
                return false;
            } finally {
                this.working = false;
                this.pending = undefined;
                this.syncControl();
                // Disabling a focused native input can blur it. Do not steal focus
                // if the user moved to another field while awaiting acceptance.
                if (hadFocus && !this.disposed.Value && this.control.ownerDocument.activeElement === this.control.ownerDocument.body)
                    this.focus();
            }
            this.committed.invoke(this.accepted);
            return true;
        });
        return this.pending;
    }

    /** Restores the last accepted value. Returns false while confirmation is running. */
    cancel(): boolean {
        if (this.busy || this.disposed.Value) return false;
        this.draft = this.accepted;
        this.message = undefined;
        this.displayValue();
        this.syncControl();
        this.cancelled.invoke(undefined);
        return true;
    }

    /** Moves focus to the native editing control. */
    focus(): void { this.control.focus(); }
}

/** Text-specific parsing and formatting, in addition to the shared value lifecycle. */
export interface TextEditorOptions<T = string> extends ValueEditorOptions<T> {
    parse?: (text: string) => T | Promise<T>;
    format?: (value: T) => string;
    /** Defaults to true. Enter always confirms; Escape always cancels. */
    commitOnBlur?: boolean;
}

/** Text input with a separately retained draft string, including invalid input. */
export class TextEditor<T = string> extends ValueEditor<T> {
    private readonly textOptions: TextEditorOptions<T>;
    private draftText = "";
    private acceptedText = "";

    /** Creates a stable input. Supply parse/format when T is not string. */
    constructor(options: TextEditorOptions<T>) {
        const { parse, format, commitOnBlur, ...baseOptions } = options;
        super(baseOptions);
        if (typeof options.value !== "string" && !options.parse && !options.resolveText && this.resolveText === TextEditor.prototype.resolveText)
            throw new Error("Failed to create text editor. Provide a parser for non-string values.");
        this.textOptions = options;
        this.installControl(e("input", { type: "text", ui: ["elg", "field"] }));
        this.displayValue();
        this.listen(this.control, "input", () => {
            if (!this.canEdit()) return;
            this.draftText = (this.control as HTMLInputElement).value;
            this.onTextInput();
        });
        this.listen(this.control, "blur", () => { if (options.commitOnBlur !== false) void this.commit(); });
        this.listen(this.control, "keydown", event => {
            this.onTextKeyDown(event as KeyboardEvent);
        });
    }

    /** Handles draft input; picker editors may additionally schedule a search. */
    protected onTextInput(): void { this.notifyInput(); }

    /** Handles text acceptance keys; subclasses may provide specialized navigation. */
    protected onTextKeyDown(key: KeyboardEvent): void {
        if (key.isComposing) return;
        if (key.key === "Enter") { key.preventDefault(); void this.commit(); }
        if (key.key === "Escape") { key.preventDefault(); this.cancel(); }
    }

    /** Current raw input, which may not yet be a valid typed value. */
    get text(): string { return this.draftText; }
    /** Includes differences in unparsed text as well as typed values. */
    override get modified(): boolean { return this.draftText !== this.acceptedText || super.modified; }
    /** Parses input without changing the last accepted value. */
    protected override async candidate(): Promise<T> {
        return this.resolveText(this.draftText);
    }
    /**
     * Resolves text using resolveText, then parse, or unchanged text for string editors.
     * Uses the same conversion for interactive confirmation and external paste.
     * @example await numberEditor.resolveText("12,5"); // 12.5
     */
    resolveText(text: string): T | Promise<T> {
        const resolve = this.editorOptions.resolveText ?? this.textOptions.parse;
        return resolve ? resolve(text) : text as T;
    }
    /** Formats a loaded, cancelled or successfully accepted value. */
    protected displayValue(): void {
        this.draftText = this.acceptedText = this.textOptions.format
            ? this.textOptions.format(this.value) : String(this.value ?? "");
        (this.control as HTMLInputElement).value = this.draftText;
    }
    /** Selects all text, for example when beginning a grid-cell edit with F2. */
    selectAll(): void { (this.control as HTMLInputElement).select(); }
}

/** Configuration for the numeric editor's keyboard stepping behavior. */
export interface NumberEditorOptions extends TextEditorOptions<number | null> {
    /** Amount added or subtracted by ArrowUp/ArrowDown. Defaults to 1. */
    step?: number;
    /** Lower bound used by keyboard stepping. */
    min?: number;
    /** Upper bound used by keyboard stepping. */
    max?: number;
}

/** Numeric text input; empty input maps to null and malformed numbers are rejected. */
export class NumberEditor extends TextEditor<number | null> {
    private readonly numberOptions: Pick<NumberEditorOptions, "step" | "min" | "max" | "format">;
    private stepping = false;

    /** Accepts decimal-dot or decimal-comma input; custom parse/format may override it. */
    constructor(options: NumberEditorOptions) {
        const { step = 1, min, max, ...textOptions } = options;
        if (!Number.isFinite(step) || step <= 0)
            throw new Error("Failed to create number editor. Step must be a positive finite number.");
        if (min !== undefined && !Number.isFinite(min))
            throw new Error("Failed to create number editor. Minimum must be a finite number.");
        if (max !== undefined && !Number.isFinite(max))
            throw new Error("Failed to create number editor. Maximum must be a finite number.");
        if (min !== undefined && max !== undefined && min > max)
            throw new Error("Failed to create number editor. Minimum must not exceed maximum.");

        super({ ...textOptions, parse: options.parse ?? (text => {
            const normalized = text.trim().replace(",", ".");
            if (!normalized) return null;
            if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized))
                throw new Error("Failed to confirm number. Enter a valid number.");
            const value = Number(normalized);
            if (!Number.isFinite(value)) throw new Error("Failed to confirm number. Enter a finite number.");
            return value;
        }) });
        this.numberOptions = { step, min, max, format: options.format };
        this.control.setAttribute("inputmode", "decimal");
        this.listen(this.control, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.isComposing || (key.key !== "ArrowUp" && key.key !== "ArrowDown") || !this.canEdit()) return;
            key.preventDefault();
            key.stopPropagation();
            void this.stepValue(key.key === "ArrowUp" ? 1 : -1);
        });
    }

    /** Moves the draft by one configured step without committing it. */
    private async stepValue(direction: 1 | -1): Promise<void> {
        if (this.stepping) return;
        this.stepping = true;
        try {
            let current: number | null;
            try {
                current = await this.resolveText((this.control as HTMLInputElement).value);
            } catch {
                return;
            }

            let next = (current ?? 0) + direction * this.numberOptions.step!;
            if (this.numberOptions.min !== undefined) next = Math.max(this.numberOptions.min, next);
            if (this.numberOptions.max !== undefined) next = Math.min(this.numberOptions.max, next);
            if (!Number.isFinite(next)) return;

            const input = this.control as HTMLInputElement;
            input.value = this.numberOptions.format?.(next) ?? String(next);
            input.dispatchEvent(new Event("input", { bubbles: true }));
        } finally {
            this.stepping = false;
        }
    }
}

/** Checkbox editing a boolean value, confirming immediately after user changes. */
export class CheckboxEditor extends ValueEditor<boolean> {
    /** Resolves true/false, yes/no and 1/0, ignoring case and surrounding whitespace. */
    resolveText(text: string): boolean | Promise<boolean> {
        return this.editorOptions.resolveText ? this.editorOptions.resolveText(text) : resolveBooleanText(text);
    }
    /** Creates a native checkbox with an optional accessible label. */
    constructor(options: BooleanEditorOptions) {
        super(options);
        this.installControl(e("input", { type: "checkbox" }));
        if (options.label && options.labelClickable !== false) this.makeLabelClickable(options.label);
        this.displayValue();
        this.listen(this.control, "change", () => {
            if (!this.canEdit()) return;
            this.draft = (this.control as HTMLInputElement).checked;
            this.notifyInput();
            void this.commit();
        });
    }
    /** Reflects the current boolean value without recreating the checkbox. */
    protected displayValue(): void { (this.control as HTMLInputElement).checked = this.value; }
}

/** Boolean switch using the shared asynchronous confirmation lifecycle. */
export class ToggleEditor extends ValueEditor<boolean> {
    /** Resolves the same boolean text forms as CheckboxEditor, without toggling it. */
    resolveText(text: string): boolean | Promise<boolean> {
        return this.editorOptions.resolveText ? this.editorOptions.resolveText(text) : resolveBooleanText(text);
    }
    /** Creates a native button with switch semantics; Space/Enter immediately confirm. */
    constructor(options: BooleanEditorOptions) {
        super(options);
        this.installControl(e("button", {
            type: "button", role: "switch", class: "elg-switch", ui: ["elg"],
            ariaLabel: options.label ?? "Toggle"
        }));
        if (options.label && options.labelClickable === true) this.makeLabelClickable(options.label);
        this.displayValue();
        this.listen(this.control, "click", () => {
            if (!this.canEdit()) return;
            this.draft = !this.value;
            this.displayValue();
            this.notifyInput();
            void this.commit();
        });
    }
    /** Updates checked semantics; CSS positions the thumb and colors the track. */
    protected displayValue(): void {
        this.control.setAttribute("aria-checked", String(this.value));
    }
}

/** Shared strict boolean conversion for clipboard and other external text input. */
function resolveBooleanText(text: string): boolean {
    switch (text.trim().toLowerCase()) {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": return false;
        default: throw new Error("Failed to resolve boolean text. Enter true/false, yes/no or 1/0.");
    }
}
