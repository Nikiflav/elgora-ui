import { Component, type ComponentOptions } from "../../core/Component";
import { e, v, setElementProps, type VNode } from "../../core/e";
import { TimeFormatter } from "../../formatting/TimeFormatter";

export interface TimePickerOptions extends Omit<ComponentOptions, "tag" | "children"> {
    value?: string | null;
    timeFormat?: "HH:mm" | "HH:mm:ss";
    minuteStep?: number;
    /** Time used for initial focus when no value has been selected. Defaults to 10:00. */
    defaultTime?: string;
    /** Maximum height of the scrollable slot list. Defaults to 240px. */
    maxHeight?: string;
    onSelect?: (value: string, picker: TimePicker) => void;
}

/** Compact button-based time picker for mouse and touch input. */
export class TimePicker extends Component {
    private readonly pickerOptions: TimePickerOptions;
    private readonly formatter: TimeFormatter;
    private readonly format: "HH:mm" | "HH:mm:ss";
    private readonly step: number;
    private readonly defaultTime: string;
    private readonly maxHeight: string;
    private currentValue: string | null;
    private readonly content: HTMLElement;

    constructor(options: TimePickerOptions = {}) {
        const { value, timeFormat = "HH:mm", minuteStep = 15, defaultTime = "10:00", maxHeight = "240px", onSelect, ...domOptions } = options;
        if (!Number.isInteger(minuteStep) || minuteStep < 1 || minuteStep > 60 || 60 % minuteStep !== 0)
            throw new Error("Failed to create time picker. minuteStep must divide 60 evenly.");
        const formatter = new TimeFormatter(timeFormat);
        const normalizedDefault = timeFormat === "HH:mm:ss" && defaultTime.length === 5 ? `${defaultTime}:00` : defaultTime;
        formatter.parse(normalizedDefault);
        if (value !== undefined && value !== null) formatter.parse(value);
        super({ ...domOptions, tag: "div", ui: ["elg", "surface", "p-2", "rounded-2", "d-flex", "flex-col", ...(Array.isArray(options.ui) ? options.ui : options.ui ? [options.ui] : [])] });
        this.pickerOptions = options;
        this.formatter = formatter;
        this.format = timeFormat;
        this.step = minuteStep;
        this.defaultTime = normalizedDefault;
        this.maxHeight = maxHeight;
        this.currentValue = value ?? null;
        this.content = e("div");
        this.append(this.content);
        Object.assign(this.content.style, { flex: "1 1 auto", minHeight: "0", boxSizing: "border-box" });
        Object.assign(this.dom.style, { width: "260px", maxWidth: "100%", boxSizing: "border-box" });
        this.listen(this.content, "keydown", event => this.handleKey(event as KeyboardEvent));
        this.renderPicker();
    }

    get value(): string | null { return this.currentValue; }

    setValue(value: string | null): void {
        if (value !== null) this.formatter.parse(value);
        this.currentValue = value;
        this.renderPicker();
    }

    focus(): void {
        const target = this.content.querySelector<HTMLButtonElement>(`button[data-time='${this.currentValue ?? this.defaultTime}']`)
            ?? this.content.querySelector<HTMLButtonElement>("button[data-time]");
        target?.focus();
    }

    private button(value: string): VNode<HTMLButtonElement> {
        const selected = value === this.currentValue;
        return v("button", { key: value, type: "button", ...( { "data-time": value } as any),
            ui: ["elg", "btn", "border-0", "rounded-1", "hover", ...(selected ? ["primary"] : [])],
            ariaLabel: value, ariaPressed: String(selected), onclick: () => this.choose(value) }, value);
    }

    private renderPicker(): void {
        const buttons: VNode<HTMLButtonElement>[] = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += this.step) {
                const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                buttons.push(this.button(this.format === "HH:mm:ss" ? `${value}:00` : value));
            }
        }
        setElementProps(this.content, { vnodes: [
            v("div", { key: "times", ui: ["d-flex", "flex-col", "gap-1"], style: { flex: "1 1 auto", minHeight: "0", height: this.maxHeight, maxHeight: this.maxHeight, boxSizing: "border-box", overflow: "auto" } }, ...buttons)
        ] });
    }

    private handleKey(event: KeyboardEvent): void {
        if (event.isComposing || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
        const target = event.target instanceof HTMLButtonElement ? event.target : undefined;
        if (!target?.dataset.time) return;
        const buttons = [...this.content.querySelectorAll<HTMLButtonElement>("button[data-time]")];
        const index = buttons.indexOf(target);
        const next = buttons[index + (event.key === "ArrowUp" ? -1 : 1)];
        if (!next) return;
        event.preventDefault();
        next.focus();
    }

    private choose(value: string): void {
        this.currentValue = value;
        this.pickerOptions.onSelect?.(value, this);
        this.renderPicker();
    }
}
