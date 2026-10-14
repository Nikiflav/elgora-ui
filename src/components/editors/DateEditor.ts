import { TextEditor, type TextEditorOptions } from "./ValueEditor";
import { Calendar } from "../calendar/Calendar";
import { parseCalendarDate } from "../calendar/CalendarDate";
import { Popover } from "../popup/popover";
import { e, v, setElementProps, assignElementProps } from "../../core/e";
import { createInputAdornment, inputAdornmentProps } from "./InputAdornment";
import type { PopoverEditorOptions } from "./PopoverEditorOptions";
import { DateFormatter } from "../../formatting/DateFormatter";

/** Date-only text editing with an optional calendar popup. Values are YYYY-MM-DD or null. */
export interface DateEditorOptions extends TextEditorOptions<string | null>, PopoverEditorOptions {
    min?: string;
    max?: string;
    /** Controls calendar labels and the locale-dependent standard dateFormat "d". */
    locale?: string;
    /** Display and input pattern; defaults to yyyy-MM-dd. Custom converters override their respective direction. */
    dateFormat?: string;
    /** Calendar first weekday, 0 = Sunday through 6 = Saturday; defaults to Monday. */
    firstDayOfWeek?: number;
    /** Optional application-local current date, forwarded to Calendar. */
    today?: string;
}

/** Checks canonical values and inclusive bounds, without running business validation. */
function checkValue(value: string | null, min?: string, max?: string): void {
    if (value === null) return;
    parseCalendarDate(value);
    if ((min && value < min) || (max && value > max))
        throw new Error("Failed to resolve date. The date is outside the allowed range.");
}

/**
 * Date-only editor with a keyed Calendar picker. Text and selected calendar days
 * use the shared asynchronous validation/commit lifecycle; the host performs saving.
 * @example new DateEditor({ value: "2026-10-14", onCommit: date => updateDeliveryDate(date) });
 */
export class DateEditor extends TextEditor<string | null> {
    private readonly dateOptions: DateEditorOptions;
    private readonly auxiliary: HTMLElement;
    private readonly formatDate: (value: string | null) => string;
    private popup?: Popover;
    private removeOutsidePointerDown?: () => void;
    private calendar?: Calendar;
    private fieldset?: HTMLFieldSetElement;
    private openingVersion = 0;
    private restoringInputFocus = false;
    private inputPointerDownWasOpen = false;

    /** Creates a stable text input and a VNode-rendered calendar button. */
    constructor(options: DateEditorOptions) {
        const { min, max, locale, dateFormat, firstDayOfWeek, today, openOnFocus, ...textOptions } = options;
        const formatter = new DateFormatter(dateFormat, locale);
        const formatDate = options.format ?? (value => value === null ? "" : formatter.format(value));
        if (min) parseCalendarDate(min);
        if (max) parseCalendarDate(max);
        if (min && max && min > max) throw new Error("Failed to create date editor. Minimum date must not exceed maximum date.");
        if (today) parseCalendarDate(today);
        if (firstDayOfWeek !== undefined && (!Number.isInteger(firstDayOfWeek) || firstDayOfWeek < 0 || firstDayOfWeek > 6))
            throw new Error("Failed to create date editor. firstDayOfWeek must be an integer from 0 to 6.");
        checkValue(options.value, min, max);
        super({ ...textOptions, commitOnBlur: false, format: formatDate,
            parse: options.parse ?? (text => text.trim() ? formatter.parse(text) : null) });
        this.dateOptions = options;
        this.formatDate = formatDate;
        // The control and composition roots are created once. Only changing
        // adornment state is patched; Calendar owns its own scheduled subtree.
        this.auxiliary = createInputAdornment(this.control as HTMLInputElement);
        assignElementProps(this.control as HTMLInputElement, {
            role: "combobox", ariaHasPopup: "dialog", ariaExpanded: "false", autocomplete: "off" });
        this.renderTasks.push(this.renderAuxiliary);
        this.renderAuxiliary();
        this.listen(this.control, "focus", () => {
            if (this.dateOptions.openOnFocus && !this.restoringInputFocus && !this.inputPointerDownWasOpen)
                void this.openCalendar(true);
        });
        this.listen(this.control, "pointerdown", () => {
            this.inputPointerDownWasOpen = this.popup?.isOpen() ?? false;
        });
        this.listen(this.control, "click", () => {
            if (this.inputPointerDownWasOpen && this.popup?.isOpen()) {
                this.close();
            }
            this.inputPointerDownWasOpen = false;
        });
        this.listen(this.control, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.isComposing) return;
            if (key.altKey && key.key === "ArrowDown") {
                key.preventDefault(); key.stopPropagation(); void this.open();
            }
        });
        this.listen(this.dom, "focusout", event => {
            if (this.dateOptions.commitOnBlur === false) return;
            const next = (event as FocusEvent).relatedTarget;
            // Focus can temporarily expose body between focusout and focusin.
            // An internal destination must not cause a blur commit.
            if (next instanceof Node && this.dom.contains(next)) return;
            // Calendar navigation patches its internal buttons. During that
            // patch the browser may briefly expose body as activeElement;
            // wait until the patch has completed before treating focus as
            // having left the compound editor.
            requestAnimationFrame(() => {
                if (this.canEdit() && !this.dom.contains(this.dom.ownerDocument.activeElement)) void this.commit();
            });
        });
        this.addCleanup(() => {
            this.openingVersion++;
            this.removeOutsidePointerDown?.();
            this.removeOutsidePointerDown = undefined;
            this.popup?.dispose();
        });
    }

    /**
     * Resolves dateFormat input (empty means null), or uses a custom converter.
     * The result must remain a valid canonical date inside min/max. No saving occurs.
     * @example await editor.resolveText("2026-02-29"); // Rejects an invalid date.
     */
    override async resolveText(text: string): Promise<string | null> {
        const value = await super.resolveText(text);
        checkValue(value, this.dateOptions.min, this.dateOptions.max);
        return value;
    }

    /** Loads a canonical date silently and updates an already created calendar. */
    override setValue(value: string | null): void {
        checkValue(value, this.dateOptions.min, this.dateOptions.max);
        this.openingVersion++;
        super.setValue(value);
        this.calendar?.setValue(value);
    }

    /** Updates native busy state immediately and schedules adornment/picker state patching. */
    protected override syncControl(): void {
        super.syncControl();
        if (this.auxiliary) this.render(this.renderAuxiliary);
    }

    /** Patches the keyed trigger, leaving the text input and its selection untouched. */
    private readonly renderAuxiliary = (): void => {
        if (this.disposed.Value) return;
        const open = this.popup?.isOpen() ?? false;
        setElementProps(this.auxiliary, { ...inputAdornmentProps, vnodes: [v("button", {
            key: "calendar-trigger", type: "button", tabIndex: -1,
            ui: ["elg", "btn", "border-0", "p-0"], class: "elg-editor-trigger",
            ariaLabel: "Open calendar", ariaExpanded: String(open), disabled: !this.canEdit(),
            onmousedown: event => event.preventDefault(), onclick: () => { if (open) this.close(); else void this.open(); }
        }, v("i", { class: "ri-calendar-line", ariaHidden: "true" }))] });
        assignElementProps(this.control, { ariaExpanded: String(open) });
        if (this.fieldset) assignElementProps(this.fieldset, { disabled: this.busy || !!this.editorOptions.readOnly || !!this.editorOptions.disabled });
    };

    /** Opens and focuses Calendar. Invalid input still permits choosing a replacement. */
    async open(): Promise<void> {
        await this.openCalendar(false);
    }

    /** Resolves the initial date, ignoring automatic opening if focus has already left the input. */
    private async openCalendar(fromInputFocus: boolean): Promise<void> {
        if (!this.canEdit()) return;
        const version = ++this.openingVersion;
        let date = this.value;
        try { date = await this.resolveText(this.text); } catch { /* Keep the last valid typed value for browsing. */ }
        if (version !== this.openingVersion || !this.canEdit()) return;
        if (fromInputFocus && this.control.ownerDocument.activeElement !== this.control) return;
        if (!this.popup) this.createPopup();
        this.calendar!.setValue(date);
        this.popup!.show();
        this.subscribeOutsidePointerDown();
        this.calendar!.focus();
        this.render(this.renderAuxiliary);
    }

    /** Hides Calendar without discarding the input. Escape uses cancel() instead. */
    close(): void {
        this.openingVersion++;
        // A day choice may have queued a focus request before synchronous acceptance.
        // A silent value update clears that request before the hidden picker patches.
        this.calendar?.setValue(this.value);
        // Native hidePopover may restore anchor focus before returning.
        const restoring = this.restoringInputFocus;
        this.restoringInputFocus = true;
        this.removeOutsidePointerDown?.();
        this.removeOutsidePointerDown = undefined;
        try { this.popup?.hide(); } finally { this.restoringInputFocus = restoring; }
        this.render(this.renderAuxiliary);
    }

    /** Closes the calendar only when a pointer starts outside the editor. */
    private readonly outsidePointerDown = (event: PointerEvent): void => {
        const target = event.target;
        if (target instanceof Node && this.dom.contains(target)) return;
        this.close();
    };

    /** Subscribes once for the current calendar session. */
    private subscribeOutsidePointerDown(): void {
        if (this.removeOutsidePointerDown) return;
        const ownerDocument = this.control.ownerDocument;
        ownerDocument.addEventListener("pointerdown", this.outsidePointerDown, true);
        this.removeOutsidePointerDown = () => ownerDocument.removeEventListener("pointerdown", this.outsidePointerDown, true);
    }

    /** Restores the confirmed text/date and closes Calendar, unless commit is still busy. */
    override cancel(): boolean {
        if (!super.cancel()) return false;
        this.calendar?.setValue(this.confirmedValue);
        this.close();
        return true;
    }

    /** Confirms typed/picked dates and closes only after successful asynchronous acceptance. */
    override async commit(): Promise<boolean> {
        const document = this.dom.ownerDocument;
        const pickerHadFocus = !!this.popup?.dom.contains(document.activeElement);
        const accepted = await super.commit();
        if (accepted && !this.disposed.Value) {
            const canRestore = document.activeElement === document.body || !!this.popup?.dom.contains(document.activeElement);
            this.close();
            if (pickerHadFocus && canRestore) this.restoreInputFocus();
        }
        return accepted;
    }

    /** Returns from the picker without treating focus restoration as a new opening request. */
    private restoreInputFocus(): void {
        this.restoringInputFocus = true;
        try { this.focus(); } finally { this.restoringInputFocus = false; }
    }

    /** Creates a composed Calendar once; the two components patch their own subtrees. */
    private createPopup(): void {
        this.calendar = new Calendar({ value: this.value, min: this.dateOptions.min, max: this.dateOptions.max,
            locale: this.dateOptions.locale, firstDayOfWeek: this.dateOptions.firstDayOfWeek, today: this.dateOptions.today,
            onSelect: date => {
                if (!this.canEdit()) return;
                (this.control as HTMLInputElement).value = this.formatDate(date);
                this.control.dispatchEvent(new Event("input", { bubbles: true }));
                void this.commit();
            }
        });
        this.fieldset = e("fieldset", { ui: ["border-0", "p-0", "m-0"] });
        this.calendar.mount(this.fieldset);
        this.popup = new Popover({ anchorElement: this.control, bindAnchorTarget: false, closeMode: "manual", role: "dialog",
            ariaLabel: `${this.dateOptions.label ?? "Date"} calendar`, children: this.fieldset });
        this.popup.mount(this.dom);
        this.popup.addCleanup(this.calendar);
        this.control.setAttribute("aria-controls", this.popup.dom.id);
        this.listen(this.popup.dom, "toggle", () => this.render(this.renderAuxiliary));
        this.listen(this.popup.dom, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.key === "Escape" && !key.defaultPrevented && !key.isComposing) {
                key.preventDefault(); key.stopPropagation();
                if (this.cancel()) this.restoreInputFocus();
            }
        });
    }
}
