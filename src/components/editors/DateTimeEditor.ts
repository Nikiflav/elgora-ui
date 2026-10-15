import { PopoverEditor } from "./PopoverEditor";
import { type TextEditorOptions } from "./ValueEditor";
import { DateFormatter } from "../../formatting/DateFormatter";
import { TimeFormatter } from "../../formatting/TimeFormatter";
import { Calendar } from "../calendar/Calendar";
import { parseCalendarDate } from "../calendar/CalendarDate";
import { TimePicker } from "../time-picker/TimePicker";
import { Popover } from "../popup/popover";
import { e } from "../../core/e";
import type { PopoverEditorOptions } from "./PopoverEditorOptions";

export interface DateTimeEditorOptions extends TextEditorOptions<string | null>, PopoverEditorOptions {
    dateFormat?: string;
    timeFormat?: "HH:mm" | "HH:mm:ss";
    locale?: string;
    firstDayOfWeek?: number;
    minuteStep?: number;
    defaultTime?: string;
}

/** Local date-time editor combining Calendar and TimePicker in one popover. */
export class DateTimeEditor extends PopoverEditor<string | null> {
    private readonly dateOptions: DateTimeEditorOptions;
    private readonly dateFormatter: DateFormatter;
    private readonly timeFormatter: TimeFormatter;
    private calendar?: Calendar;
    private picker?: TimePicker;
    private layout?: HTMLElement;
    private resizeObserver?: ResizeObserver;

    constructor(options: DateTimeEditorOptions) {
        const { dateFormat = "yyyy-MM-dd", timeFormat = "HH:mm", locale, firstDayOfWeek, minuteStep = 15, openOnFocus, ...textOptions } = options;
        const dateFormatter = new DateFormatter(dateFormat, locale);
        const timeFormatter = new TimeFormatter(timeFormat);
        super({ ...textOptions, openOnFocus, triggerIcon: "ri-calendar-line", triggerLabel: "Open date and time picker", commitOnBlur: false, format: options.format ?? (value => value === null ? "" : `${dateFormatter.format(value.slice(0, 10))} ${value.slice(11)}`), parse: options.parse ?? (text => {
            const value = text.trim();
            if (!value) return null;
            const match = /^(.*)\s+(\d{2}:\d{2}(?::\d{2})?)$/.exec(value);
            if (!match) throw new Error(`Failed to parse date-time. Use ${dateFormat} ${timeFormat}.`);
            return `${dateFormatter.parse(match[1])}T${timeFormatter.parse(match[2])}`;
        }) });
        this.dateOptions = options;
        this.dateFormatter = dateFormatter;
        this.timeFormatter = timeFormatter;
        this.addCleanup(() => this.resizeObserver?.disconnect());

    }

    /** Resolves and validates a local canonical date-time. */
    override async resolveText(text: string): Promise<string | null> {
        const value = await super.resolveText(text);
        if (value !== null) {
            const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)$/.exec(value);
            if (!match) throw new Error("Failed to resolve date-time. Use a canonical date-time value.");
            parseCalendarDate(match[1]); this.timeFormatter.parse(match[2]);
        }
        return value;
    }

    private browsingValue: string | null = null;

    /** Prepares the picker from current text without accepting it. */
    protected override async preparePopup(): Promise<void> {
        try { this.browsingValue = await this.resolveText(this.text); }
        catch { this.browsingValue = this.value; }
    }

    /** Synchronizes both pickers and focuses Calendar. */
    protected override focusPopup(): void {
        this.setPickerValue(this.browsingValue);
        this.resizePickerLayout();
        this.calendar?.focus();
    }

    /** Clears queued calendar focus when the picker is hidden. */
    protected override onPopupClosing(): void { this.calendar?.setValue(this.value?.slice(0, 10) ?? null); }

    private setPickerValue(value: string | null): void {
        const date = value?.slice(0, 10) ?? null;
        const time = value?.slice(11) ?? this.dateOptions.defaultTime ?? "10:00";
        this.calendar!.setValue(date); this.picker!.setValue(time);
    }

    private currentParts(): { date: string | null; time: string | null } { return { date: this.calendar?.value ?? null, time: this.picker?.value ?? null }; }
    private selectPart(): void {
        const { date, time } = this.currentParts();
        if (!date || !time) return;
        this.acceptPickerText(`${this.dateFormatter.format(date)} ${time}`);
    }

    protected override createPopup(): Popover {
        this.calendar = new Calendar({ value: this.value?.slice(0, 10) ?? null, locale: this.dateOptions.locale, firstDayOfWeek: this.dateOptions.firstDayOfWeek,
            onSelect: () => this.selectPart() });
        this.picker = new TimePicker({ value: this.value?.slice(11) ?? null, timeFormat: this.dateOptions.timeFormat, minuteStep: this.dateOptions.minuteStep, defaultTime: this.dateOptions.defaultTime,
            maxHeight: "100%",
            onSelect: () => this.selectPart() });
        const fieldset = e("fieldset", { ui: ["border-0", "p-0", "m-0", "d-flex", "flex-wrap", "items-stretch", "gap-2"], style: { maxWidth: "100%", boxSizing: "border-box" } });
        fieldset.style.width = "max-content";
        fieldset.style.maxWidth = "calc(100vw - 16px)";
        this.calendar.dom.style.flex = "0 0 280px";
        this.picker.dom.style.width = this.dateOptions.timeFormat === "HH:mm:ss" ? "104px" : "84px";
        this.picker.dom.style.boxSizing = "border-box";
        this.picker.dom.style.alignSelf = "stretch";
        this.picker.dom.style.flex = `0 0 ${this.dateOptions.timeFormat === "HH:mm:ss" ? "104px" : "84px"}`;
        this.calendar.mount(fieldset); this.picker.mount(fieldset);
        this.layout = fieldset;
        const popup = new Popover({ anchorElement: this.control, bindAnchorTarget: false, closeMode: "manual", role: "dialog", ariaLabel: `${this.dateOptions.label ?? "Date and time"} picker`, children: fieldset });
        popup.dom.style.overflow = "hidden";
        popup.addCleanup(this.calendar); popup.addCleanup(this.picker);
        this.resizeObserver = new ResizeObserver(() => this.resizePickerLayout());
        this.resizeObserver.observe(this.calendar.dom);
        return popup;
    }

    private resizePickerLayout(): void {
        if (!this.calendar || !this.picker) return;
        const pickerHeight = this.picker.dom.style.height;
        this.picker.dom.style.height = "0px";
        const height = this.calendar?.dom.offsetHeight ?? 0;
        if (this.layout && height > 0) this.layout.style.height = `${height}px`;
        this.picker.dom.style.height = pickerHeight || "100%";
    }
}
