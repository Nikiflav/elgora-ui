import { PopoverEditor } from "./PopoverEditor";
import { type TextEditorOptions } from "./ValueEditor";
import { Calendar } from "../calendar/Calendar";
import { parseCalendarDate } from "../calendar/CalendarDate";
import { Popover } from "../popup/popover";
import { e } from "../../core/e";
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
export class DateEditor extends PopoverEditor<string | null> {
    private readonly dateOptions: DateEditorOptions;
    private readonly formatDate: (value: string | null) => string;
    private calendar?: Calendar;
    private fieldset?: HTMLFieldSetElement;

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
        super({ ...textOptions, openOnFocus, triggerIcon: "ri-calendar-line", triggerLabel: "Open calendar", commitOnBlur: options.commitOnBlur ?? true, format: formatDate,
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
        this.calendar?.setValue(value);
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
        this.calendar!.setValue(this.browsingValue);
        this.calendar!.focus();
    }

    /** Clears scheduled calendar focus before hiding the picker. */
    protected override onPopupClosing(): void { this.calendar?.setValue(this.value); }

    /** Creates a composed Calendar once; the two components patch their own subtrees. */
    protected override createPopup(): Popover {
        this.calendar = new Calendar({ value: this.value, min: this.dateOptions.min, max: this.dateOptions.max,
            locale: this.dateOptions.locale, firstDayOfWeek: this.dateOptions.firstDayOfWeek, today: this.dateOptions.today,
            onSelect: date => {
                if (!this.canEdit()) return;
                this.acceptPickerText(this.formatDate(date));
            }
        });
        this.fieldset = e("fieldset", { ui: ["border-0", "p-0", "m-0"] });
        this.calendar.mount(this.fieldset);
        const popup = new Popover({ anchorElement: this.control, bindAnchorTarget: false, closeMode: "manual", role: "dialog",
            ariaLabel: `${this.dateOptions.label ?? "Date"} calendar`, children: this.fieldset });
        
        popup.addCleanup(this.calendar);

        return popup;
    }
}

