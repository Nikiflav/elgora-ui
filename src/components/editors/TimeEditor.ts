import { PopoverEditor } from "./PopoverEditor";
import { type TextEditorOptions } from "./ValueEditor";
import { TimeFormatter } from "../../formatting/TimeFormatter";
import { TimePicker } from "../time-picker/TimePicker";
import { Popover } from "../popup/popover";
import { e } from "../../core/e";
import type { PopoverEditorOptions } from "./PopoverEditorOptions";

export interface TimeEditorOptions extends TextEditorOptions<string | null>, PopoverEditorOptions {
    timeFormat?: "HH:mm" | "HH:mm:ss";
    minuteStep?: number;
    defaultTime?: string;
}

/** Text time editor with an optional mouse/touch time picker. */
export class TimeEditor extends PopoverEditor<string | null> {
    private readonly timeOptions: TimeEditorOptions;
    private picker?: TimePicker;

    constructor(options: TimeEditorOptions) {
        const { timeFormat = "HH:mm", minuteStep = 15, openOnFocus, ...textOptions } = options;
        const formatter = new TimeFormatter(timeFormat);
        super({ ...textOptions, openOnFocus, triggerIcon: "ri-time-line", triggerLabel: "Open time picker", commitOnBlur: false, parse: options.parse ?? (text => {
            const value = text.trim();
            return value ? formatter.parse(value) : null;
        }), format: options.format ?? (value => value ?? "") });
        this.timeOptions = options;
        this.control.setAttribute("inputmode", "numeric");
    }

    /** Resolves strict time text asynchronously for a consistent editor API. */
    override async resolveText(text: string): Promise<string | null> {
        return await super.resolveText(text);
    }

    private browsingValue: string | null = null;

    /** Prepares the time list from draft text without accepting it. */
    protected override async preparePopup(): Promise<void> {
        try { this.browsingValue = await this.resolveText(this.text); }
        catch { this.browsingValue = this.value; }
    }

    /** Synchronizes the list and focuses its current time. */
    protected override focusPopup(): void { this.picker?.setValue(this.browsingValue); this.picker?.focus(); }

    protected override createPopup(): Popover {
        this.picker = new TimePicker({ value: this.value, timeFormat: this.timeOptions.timeFormat, minuteStep: this.timeOptions.minuteStep, defaultTime: this.timeOptions.defaultTime,
            onSelect: value => this.acceptPickerText(value) });
        const fieldset = e("fieldset", { ui: ["border-0", "p-0", "m-0"] });
        this.picker.mount(fieldset);
        const popup = new Popover({ anchorElement: this.control, bindAnchorTarget: false, closeMode: "manual", role: "dialog", ariaLabel: `${this.timeOptions.label ?? "Time"} picker`, children: fieldset });
        popup.addCleanup(this.picker);
        return popup;
    }
}

