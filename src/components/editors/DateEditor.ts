import { LocalizedError } from "../../localization/Messages";
import { PopoverEditor } from "./PopoverEditor";
import { editorButtons } from "./EditorButton";
import { type TextEditorOptions } from "./ValueEditor";
import { DatePicker } from "../date-picker/DatePicker";
import { parseDatePickerDate } from "../date-picker/DatePickerDate";
import { Popover } from "../popup/popover";
import { e } from "../../core/e";
import type { PopoverEditorOptions } from "./PopoverEditorOptions";
import { DateFormatter } from "../../formatting/DateFormatter";
import { Localization } from "../../localization/Localization";

/** Date-only text editing with an optional calendar popup. Values are YYYY-MM-DD or null. */
export interface DateEditorOptions extends TextEditorOptions<string | null>, PopoverEditorOptions {
    /** Inclusive earliest accepted and selectable date, in YYYY-MM-DD form. */
    min?: string;
    /** Inclusive latest accepted and selectable date, in YYYY-MM-DD form. */
    max?: string;
    /** Display and input pattern; defaults to yyyy-MM-dd. Custom converters override their respective direction. */
    dateFormat?: string;
    /** DatePicker first weekday, 0 = Sunday through 6 = Saturday; defaults to Monday. */
    firstDayOfWeek?: number;
    /** Optional application-local current date, forwarded to DatePicker. */
    today?: string;
}

/** Checks canonical values and inclusive bounds, without running business validation. */
function checkValue(value: string | null, min?: string, max?: string): void {
    if (value === null) return;
    parseDatePickerDate(value);
    if ((min && value < min) || (max && value > max))
        throw new LocalizedError("dateEditor.outOfRange");
}

/**
 * Date-only editor with a keyed DatePicker picker. Text and selected calendar days
 * use the shared asynchronous validation/commit lifecycle; the host performs saving.
 * @example new DateEditor({ value: "2026-10-14", onCommit: date => updateDeliveryDate(date) });
 */
export class DateEditor extends PopoverEditor<string | null> {
    private readonly dateOptions: DateEditorOptions;

    /** A click on the active date input opens the calendar; focus alone does not. */
    override get openOnInputClick(): boolean { return true; }
    private readonly formatDate: (value: string | null) => string;
    private datePicker?: DatePicker;
    private fieldset?: HTMLFieldSetElement;

    /** Creates a stable text input and a VNode-rendered calendar button. */
    constructor(options: DateEditorOptions) {
        options = { ...options, locale: Localization.resolveLocale(options) };
        const { min, max, locale, dateFormat, firstDayOfWeek, today, openOnFocus, ...textOptions } = options;
        const formatter = new DateFormatter(dateFormat, locale);
        const formatDate = options.format ?? (value => value === null ? "" : formatter.format(value));
        if (min) parseDatePickerDate(min);
        if (max) parseDatePickerDate(max);
        if (min && max && min > max) throw new Error("Failed to create date editor. Minimum date must not exceed maximum date.");
        if (today) parseDatePickerDate(today);
        if (firstDayOfWeek !== undefined && (!Number.isInteger(firstDayOfWeek) || firstDayOfWeek < 0 || firstDayOfWeek > 6))
            throw new Error("Failed to create date editor. firstDayOfWeek must be an integer from 0 to 6.");
        checkValue(options.value, min, max);
        super({ ...textOptions, locale, openOnFocus, triggerIcon: editorButtons.date.icon, triggerLabel: editorButtons.date.label, triggerMessage: "dateEditor.open", commitOnBlur: options.commitOnBlur ?? true, format: formatDate,
            parse: options.parse ?? (text => text.trim() ? formatter.parse(text) : null) });
        this.dateOptions = options;
        this.formatDate = formatDate;

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
        super.setValue(value);
        this.datePicker?.setValue(value);
    }

    /** Resolves the current draft for calendar browsing without accepting it. */
    protected override async preparePopup(): Promise<void> {
        let value = this.value;
        try { value = await this.resolveText(this.text); } catch { /* Browse the current value when input is invalid. */ }
        this.browsingValue = value;
    }

    private browsingValue: string | null = null;

    /** Synchronizes the picker and focuses its selected day after showing. */
    protected override focusPopup(): void {
        this.datePicker!.setValue(this.browsingValue);
        this.datePicker!.focus();
    }

    /** Clears scheduled calendar focus before hiding the picker. */
    protected override onPopupClosing(): void { this.datePicker?.setValue(this.value); }

    /** Creates a composed DatePicker once; the two components patch their own subtrees. */
    protected override createPopup(): Popover {
        this.datePicker = new DatePicker({ value: this.value, min: this.dateOptions.min, max: this.dateOptions.max,
            locale: this.dateOptions.locale, localization: this.dateOptions.localization, firstDayOfWeek: this.dateOptions.firstDayOfWeek, today: this.dateOptions.today,
            onSelect: date => {
                if (!this.canEdit()) return;
                this.acceptPickerText(this.formatDate(date));
            }
        });
        this.fieldset = e("fieldset", { ui: ["border-0", "p-0", "m-0"] });
        this.datePicker.mount(this.fieldset);
        const popup = new Popover({ anchorElement: this.control, bindAnchorTarget: false, closeMode: "manual", role: "dialog",
            ariaLabel: this.messages.text("dateEditor.popup", { label: this.dateOptions.label ?? this.messages.text("dateEditor.label") }), children: this.fieldset });
        
        popup.addCleanup(this.datePicker);

        return popup;
    }
}

