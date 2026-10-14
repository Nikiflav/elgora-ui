import { Component, type ComponentOptions } from "../../core/Component";
import { ObservableEvent } from "../../core/ElgoraUI";
import { e, v, setElementProps, type VNode, type ElementProps } from "../../core/e";
import type { UiStyle } from "../../core/UiStyle";
import { parseCalendarDate as parseDate, formatCalendarDate as formatDate, localCalendarToday as localToday } from "./CalendarDate";

/** Standalone date-only calendar options. Dates use strict YYYY-MM-DD strings. */
export interface CalendarOptions extends Omit<ComponentOptions, "tag" | "children"> {
    value?: string | null;
    min?: string;
    max?: string;
    /** Formatting locale; defaults to the browser language. */
    locale?: string;
    /** 0 = Sunday, 1 = Monday, ... 6 = Saturday. Defaults to Monday. */
    firstDayOfWeek?: number;
    /** Overrides the local current date, for reproducible demos or an application clock. */
    today?: string;
    /** Receives an explicit user selection, including choosing the already selected date. */
    onSelect?: (date: string, calendar: Calendar) => void;
}

/**
 * Compact date picker with day, month and year views, using standard UI utilities.
 * Selection is independent of keyboard focus. No data source or save operation is involved.
 * @example new Calendar({ value: "2026-10-13", onSelect: date => console.log(date) });
 */
export class Calendar extends Component {
    /** User-selection notification; external setValue() never emits this event. */
    readonly selected = new ObservableEvent<string>();
    private readonly calendarOptions: CalendarOptions;
    private readonly min: string;
    private readonly max: string;
    private readonly today: string;
    private readonly firstDay: number;
    private readonly formatter: Intl.DateTimeFormat;
    private readonly monthFormatter: Intl.DateTimeFormat;
    private readonly weekdayFormatter: Intl.DateTimeFormat;
    private currentValue: string | null;
    private focusedDate: string;
    private visibleMonth: string;
    private view: "days" | "months" | "years" = "days";
    private yearStart = 0;
    private readonly content: HTMLElement;
    private pendingFocus?: string;

    /** Validates dates and bounds, then creates the default monthly view. */
    constructor(options: CalendarOptions = {}) {
        const { value, min, max, locale, firstDayOfWeek, today, onSelect, ...domOptions } = options;
        super({ ...domOptions, tag: "div", ui: ["elg", "surface", "p-2", "rounded-2", ...(Array.isArray(options.ui) ? options.ui : options.ui ? [options.ui] : [])] });
        this.calendarOptions = options;
        this.min = min ?? "0001-01-01";
        this.max = max ?? "9999-12-31";
        parseDate(this.min); parseDate(this.max);
        if (this.min > this.max) throw new Error("Failed to create calendar. Minimum date must not exceed maximum date.");
        this.today = today ?? localToday();
        parseDate(this.today);
        this.firstDay = firstDayOfWeek ?? 1;
        if (!Number.isInteger(this.firstDay) || this.firstDay < 0 || this.firstDay > 6)
            throw new Error("Failed to create calendar. firstDayOfWeek must be an integer from 0 to 6.");
        const language = locale ?? navigator.language;
        this.formatter = new Intl.DateTimeFormat(language, { dateStyle: "full", timeZone: "UTC" });
        this.monthFormatter = new Intl.DateTimeFormat(language, { month: "long", timeZone: "UTC" });
        this.weekdayFormatter = new Intl.DateTimeFormat(language, { weekday: "short", timeZone: "UTC" });
        this.currentValue = value ?? null;
        if (this.currentValue !== null) this.validateValue(this.currentValue);
        this.focusedDate = this.currentValue ?? this.clamp(this.today);
        this.visibleMonth = this.focusedDate.slice(0, 7);
        Object.assign(this.dom.style, { width: "280px", maxWidth: "100%", boxSizing: "border-box" });
        this.content = e("div");
        this.append(this.content);
        this.addCleanup(this.selected);
        this.listen(this.content, "keydown", event => this.handleKey(event as KeyboardEvent));
        this.listen(this.content, "focusin", event => {
            const value = (event.target as HTMLElement).getAttribute("data-date");
            if (value && value !== this.focusedDate) {
                this.focusedDate = value;
                this.requestRender();
            }
        });
        this.renderTasks.push(this.renderCalendar);
        // First paint is immediate; subsequent updates share one frame-batched task.
        this.renderCalendar();
    }

    /** Selected date or null. Keyboard browsing does not change this value. */
    get value(): string | null { return this.currentValue; }
    /** Currently displayed month as YYYY-MM, even in month/year selection views. */
    get month(): string { return this.visibleMonth; }

    /** Loads a date silently and shows its month; null clears selection and shows today. */
    setValue(value: string | null): void {
        if (value !== null) this.validateValue(value);
        this.currentValue = value;
        this.focusedDate = value ?? this.clamp(this.today);
        this.visibleMonth = this.focusedDate.slice(0, 7);
        this.view = "days";
        this.requestRender();
    }

    /** Shows the month containing a valid date without selecting it. */
    showMonth(date: string): void {
        parseDate(date);
        this.focusedDate = this.clamp(date);
        this.visibleMonth = this.focusedDate.slice(0, 7);
        this.view = "days";
        this.requestRender();
    }

    /** Moves native focus to the browsed day in the calendar. */
    focus(): void {
        const target = this.content.querySelector<HTMLButtonElement>(`button[data-date='${this.focusedDate}']`);
        if (this.view === "days" && target) target.focus();
        else this.requestRender(`button[data-date='${this.focusedDate}']`);
    }

    /** Validates a selected/programmatically assigned value against the inclusive bounds. */
    private validateValue(value: string): void {
        parseDate(value);
        if (value < this.min || value > this.max)
            throw new Error("Failed to set calendar date. The date is outside the allowed range.");
    }

    /** Limits browsing to the inclusive date bounds. */
    private clamp(value: string): string { return value < this.min ? this.min : value > this.max ? this.max : value; }

    /** Describes a keyed button; the patcher owns its properties and event handler. */
    private button(text: string, label: string, action: () => void, ui: UiStyle[] = [],
        props: ElementProps<HTMLButtonElement> & { "data-date"?: string } = {}): VNode<HTMLButtonElement> {
        return v("button", { key: label, type: "button", ui: ["elg", "btn", "border-0", "surface", "rounded-1", "hover", ...ui],
            ariaLabel: label, onclick: action, ...props }, text);
    }

    /** Creates an equal-track grid without using the twelve-column form-layout API. */
    private tracks(count: number, key: string, children: VNode<any>[], role?: string): VNode<HTMLDivElement> {
        return v("div", { key, role, ui: ["d-grid", "gap-1"],
            style: { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` } }, ...children);
    }

    /** Coalesces changes; explicit navigation focuses its target only after patching. */
    private requestRender(focusSelector?: string): void {
        this.pendingFocus = focusSelector;
        this.render(this.renderCalendar);
    }

    /** Patches keyed views using one stable scheduler task; disposed tasks do nothing. */
    private readonly renderCalendar = (): void => {
        if (this.disposed.Value) return;
        const date = parseDate(this.visibleMonth + "-01");
        const year = date.getUTCFullYear();
        const heading: VNode<any>[] = [];
        if (this.view === "years") {
            heading.push(v("span", { key: "year-range", ui: ["fw-600"] }, `${this.yearStart} – ${Math.min(9999, this.yearStart + 11)}`));
        } else {
            if (this.view === "days") heading.push(this.button(this.monthFormatter.format(date), "Choose month", () => {
                this.view = "months"; this.requestRender("[data-calendar-body] button:not(:disabled)");
            }, ["fw-600"]));
            heading.push(this.button(String(year), "Choose year", () => {
                this.yearStart = Math.floor((year - 1) / 12) * 12 + 1;
                this.view = "years"; this.requestRender(`[data-calendar-body] button[aria-label='${year}']:not(:disabled)`);
            }, ["fw-600"]));
        }
        const bodyProps: ElementProps<HTMLDivElement> & { "data-calendar-body": string } = {
            key: "body", ui: ["mt-2"], "data-calendar-body": ""
        };
        setElementProps(this.content, { vnodes: [
            v("div", { key: "toolbar", ui: ["d-flex", "items-center", "gap-1"] },
                this.button("‹", "Previous period", () => this.navigatePeriod(-1), [], { disabled: !this.periodTarget(-1) }),
                v("div", { key: "heading", ui: ["d-flex", "gap-1", "items-center", "justify-center", "flex-1"], ariaLive: "polite" }, ...heading),
                this.button("›", "Next period", () => this.navigatePeriod(1), [], { disabled: !this.periodTarget(1) })),
            v("div", bodyProps,
                ...(this.view === "days" ? this.renderDays(date) : [this.renderPeriods(year)])),
            this.button("Today", "Select today", () => { this.view = "days"; this.choose(this.today); }, [],
                { disabled: this.today < this.min || this.today > this.max })
        ] });
        const selector = this.pendingFocus;
        this.pendingFocus = undefined;
        if (selector) this.content.querySelector<HTMLButtonElement>(selector)?.focus();
    };

    /** Renders weekday labels and six seven-day rows, including adjacent-month days. */
    private renderDays(first: Date): VNode<any>[] {
        const weekdays: VNode<any>[] = [];
        for (let column = 0; column < 7; column++) {
            const day = new Date(first);
            day.setUTCDate(day.getUTCDate() - day.getUTCDay() + (this.firstDay + column) % 7);
            weekdays.push(v("span", { key: column, ui: ["text-center", "text-muted", "fs-80", "py-1"] }, this.weekdayFormatter.format(day)));
        }
        const rows: VNode<any>[] = [];
        const start = new Date(first);
        start.setUTCDate(1 - (first.getUTCDay() - this.firstDay + 7) % 7);
        for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
            const cells: VNode<any>[] = [];
            const week = new Date(start);
            week.setUTCDate(start.getUTCDate() + rowIndex * 7);
            for (let column = 0; column < 7; column++) {
                const date = new Date(start);
                date.setUTCDate(start.getUTCDate() + rowIndex * 7 + column);
                const value = formatDate(date);
                if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) { cells.push(v("span", { key: value, role: "gridcell" })); continue; }
                const isSelected = value === this.currentValue;
                const isToday = value === this.today;
                const day = this.button(String(date.getUTCDate()), this.formatter.format(date), () => this.choose(value),
                    isSelected ? ["primary", "fw-600"] : value.slice(0, 7) !== this.visibleMonth ? ["text-muted"] : [], {
                        key: value, "data-date": value, tabIndex: value === this.focusedDate ? 0 : -1,
                        disabled: value < this.min || value > this.max, ariaCurrent: isToday ? "date" : null,
                        style: { minHeight: "32px", width: "100%", padding: "4px 0",
                            ...(isToday && !isSelected ? { border: "1px solid var(--elg-primary-border)", color: "var(--elg-primary-color)" } : {}) }
                    });
                cells.push(v("div", { key: value, role: "gridcell", ariaSelected: String(isSelected) }, day));
            }
            rows.push(this.tracks(7, formatDate(week), cells, "row"));
        }
        return [this.tracks(7, "weekdays", weekdays),
            v("div", { key: "days", role: "grid", ariaLabel: "Choose date", ui: ["d-flex", "flex-col", "gap-1"] }, ...rows)];
    }

    /** Renders twelve month/year choices; periods outside bounds cannot be selected. */
    private renderPeriods(year: number): VNode<HTMLDivElement> {
        const choices: VNode<any>[] = [];
        for (let index = 0; index < 12; index++) {
            const selectedYear = this.view === "years" ? this.yearStart + index : year;
            if (selectedYear > 9999) continue;
            const month = this.view === "months" ? index + 1 : 1;
            const first = `${String(selectedYear).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
            const last = this.view === "years" ? `${String(selectedYear).padStart(4, "0")}-12-31` : this.lastDay(first);
            const text = this.view === "years" ? String(selectedYear) : this.monthFormatter.format(parseDate(first));
            const button = this.button(text, text, () => {
                const targetMonth = this.view === "years" ? this.visibleMonth.slice(5, 7) : String(month).padStart(2, "0");
                this.focusedDate = this.clamp(`${String(selectedYear).padStart(4, "0")}-${targetMonth}-01`);
                this.visibleMonth = this.focusedDate.slice(0, 7);
                this.view = this.view === "years" ? "months" : "days";
                this.requestRender(this.view === "days" ? `button[data-date='${this.focusedDate}']`
                    : "[data-calendar-body] button:not(:disabled)");
            }, [], { key: this.view === "years" ? selectedYear : month,
                disabled: last < this.min || first > this.max, style: { minHeight: "48px" } });
            choices.push(button);
        }
        return this.tracks(3, this.view, choices);
    }

    /** Returns the month's last valid date, including leap-year February. */
    private lastDay(first: string): string {
        const date = parseDate(first);
        date.setUTCMonth(date.getUTCMonth() + 1, 0);
        return formatDate(date);
    }

    /** Finds an adjacent allowed period, or null when navigation reaches the limits. */
    private periodTarget(direction: 1 | -1): string | null {
        const date = parseDate(this.visibleMonth + "-01");
        if (this.view === "years") {
            const year = this.yearStart + direction * 12;
            if (year < 1 || year > 9999 || year + 11 < Number(this.min.slice(0, 4)) || year > Number(this.max.slice(0, 4))) return null;
            return `${String(year).padStart(4, "0")}-01-01`;
        }
        date.setUTCMonth(date.getUTCMonth() + (this.view === "months" ? direction * 12 : direction));
        if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) return null;
        const first = this.view === "months" ? `${formatDate(date).slice(0, 4)}-01-01` : formatDate(date);
        const last = this.view === "months" ? `${first.slice(0, 4)}-12-31` : this.lastDay(first);
        return last < this.min || first > this.max ? null : first;
    }

    /** Browses a month, year or twelve-year block without selecting a date. */
    private navigatePeriod(direction: 1 | -1): void {
        const target = this.periodTarget(direction);
        if (!target) return;
        if (this.view === "years") this.yearStart = Number(target.slice(0, 4));
        else {
            this.visibleMonth = this.clamp(target).slice(0, 7);
            this.focusedDate = this.clamp(this.visibleMonth + "-01");
        }
        const preferred = direction === 1 ? ["Next", "Previous"] : ["Previous", "Next"];
        this.requestRender(`button[aria-label='${preferred[0]} period']:not(:disabled), button[aria-label='${preferred[1]} period']:not(:disabled)`);
    }

    /** Updates selection immediately, schedules patching and emits user notifications. */
    private choose(value: string): void {
        if (this.disposed.Value || value < this.min || value > this.max) return;
        this.currentValue = this.focusedDate = value;
        this.visibleMonth = value.slice(0, 7);
        this.requestRender(`button[data-date='${this.focusedDate}']`);
        this.selected.invoke(value);
        this.calendarOptions.onSelect?.(value, this);
    }

    /** Moves focus across month boundaries while leaving the selected value unchanged. */
    private moveFocus(value: string): void {
        this.focusedDate = this.clamp(value);
        this.visibleMonth = this.focusedDate.slice(0, 7);
        this.requestRender(`button[data-date='${this.focusedDate}']`);
    }

    /** Handles day arrows, week Home/End and month/year PageUp/PageDown navigation. */
    private handleKey(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
        if (event.key === "Escape" && this.view !== "days") {
            event.preventDefault(); this.view = "days"; this.requestRender(`button[data-date='${this.focusedDate}']`); return;
        }
        if (this.view !== "days" || !(event.target as Element).closest("button[data-date]")) return;
        const date = parseDate(this.focusedDate);
        const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        if (event.key in delta) date.setUTCDate(date.getUTCDate() + delta[event.key]);
        else if (event.key === "Home" || event.key === "End") {
            const weekday = (date.getUTCDay() - this.firstDay + 7) % 7;
            date.setUTCDate(date.getUTCDate() + (event.key === "Home" ? -weekday : 6 - weekday));
        } else if (event.key === "PageUp" || event.key === "PageDown") {
            const day = date.getUTCDate();
            const direction = event.key === "PageUp" ? -1 : 1;
            date.setUTCDate(1);
            date.setUTCMonth(date.getUTCMonth() + direction * (event.shiftKey ? 12 : 1));
            const last = parseDate(this.lastDay(formatDate(date))).getUTCDate();
            date.setUTCDate(Math.min(day, last));
        } else return; // Native Enter/Space activation invokes the date button.
        event.preventDefault();
        const year = date.getUTCFullYear();
        if (year < 1 || year > 9999) return;
        this.moveFocus(formatDate(date));
    }
}
