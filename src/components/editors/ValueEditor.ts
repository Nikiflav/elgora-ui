import { Component, type ComponentOptions } from "../../core/Component";
import { ObservableEvent } from "../../core/ElgoraUI";
import { e } from "../../core/e";

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
    private pending?: Promise<boolean>;
    private working = false;
    private message?: string;

    /** Creates the lifecycle and an inline validation-message container. */
    constructor(options: ValueEditorOptions<T>) {
        const { value, readOnly, disabled, label, equals, resolveText, validate, onCommit, ...domOptions } = options;
        super({ ...domOptions, tag: "div" });
        this.editorOptions = options;
        this.draft = this.accepted = value;
        this.errorElement = e("div", { ui: ["text-danger"], role: "alert", hidden: true });
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
        this.syncControl();
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
        if (typeof options.value !== "string" && !options.parse && !options.resolveText)
            throw new Error("Failed to create text editor. Provide a parser for non-string values.");
        this.textOptions = options;
        this.installControl(e("input", { type: "text", ui: ["elg", "field"] }));
        this.displayValue();
        this.listen(this.control, "input", () => {
            if (!this.canEdit()) return;
            this.draftText = (this.control as HTMLInputElement).value;
            this.notifyInput();
        });
        this.listen(this.control, "blur", () => { if (options.commitOnBlur !== false) void this.commit(); });
        this.listen(this.control, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.isComposing) return;
            if (key.key === "Enter") { key.preventDefault(); void this.commit(); }
            if (key.key === "Escape") { key.preventDefault(); this.cancel(); }
        });
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

/** Numeric text input; empty input maps to null and malformed numbers are rejected. */
export class NumberEditor extends TextEditor<number | null> {
    /** Accepts decimal-dot or decimal-comma input; custom parse/format may override it. */
    constructor(options: TextEditorOptions<number | null>) {
        super({ ...options, parse: options.parse ?? (text => {
            const normalized = text.trim().replace(",", ".");
            if (!normalized) return null;
            if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized))
                throw new Error("Failed to confirm number. Enter a valid number.");
            const value = Number(normalized);
            if (!Number.isFinite(value)) throw new Error("Failed to confirm number. Enter a finite number.");
            return value;
        }) });
        this.control.setAttribute("inputmode", "decimal");
    }
}

/** Checkbox editing a boolean value, confirming immediately after user changes. */
export class CheckboxEditor extends ValueEditor<boolean> {
    /** Resolves true/false, yes/no and 1/0, ignoring case and surrounding whitespace. */
    resolveText(text: string): boolean | Promise<boolean> {
        return this.editorOptions.resolveText ? this.editorOptions.resolveText(text) : resolveBooleanText(text);
    }
    /** Creates a native checkbox with an optional accessible label. */
    constructor(options: ValueEditorOptions<boolean>) {
        super(options);
        this.installControl(e("input", { type: "checkbox" }));
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
    constructor(options: ValueEditorOptions<boolean>) {
        super(options);
        this.installControl(e("button", {
            type: "button", role: "switch", class: "elg-switch", ui: ["elg"],
            ariaLabel: options.label ?? "Toggle"
        }));
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
