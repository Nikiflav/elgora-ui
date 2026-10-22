import { DatePicker, cdiv, e } from "../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] });
    const holder = cdiv({ ui: ["d-flex", "flex-wrap", "gap-3", "items-start"] });
    const result = e("div", { ui: ["text-muted"], role: "status" }, "Selected date: 2026-10-13");
    const explanation = e("p", { ui: ["text-muted", "m-0"] }, "Browse with arrows; click a day or press Enter to select it.");
    let calendar: DatePicker;
    let value: string | null = "2026-10-13";
    const locale = e("select", { ui: ["elg", "field"], ariaLabel: "DatePicker locale", onchange: () => rebuild() },
        e("option", { value: "en-GB" }, "English"), e("option", { value: "bg-BG" }, "Български"));
    const firstDay = e("select", { ui: ["elg", "field"], ariaLabel: "First weekday", onchange: () => rebuild() },
        e("option", { value: "1" }, "Monday"), e("option", { value: "0" }, "Sunday"));
    const bounds = e("input", { type: "checkbox", ariaLabel: "Restrict booking dates", onchange: () => rebuild() });
    function rebuild(): void {
        calendar?.dispose();
        if (bounds.checked && value && (value < "2026-10-01" || value > "2026-11-30")) value = null;
        calendar = new DatePicker({ value, today: "2026-10-13", locale: locale.value,
            firstDayOfWeek: Number(firstDay.value), min: bounds.checked ? "2026-10-01" : undefined,
            max: bounds.checked ? "2026-11-30" : undefined, ui: ["border"],
            onSelect: date => { value = date; result.textContent = "Selected date: " + date; }
        });
        holder.append(calendar);
        result.textContent = "Selected date: " + (value ?? "none");
        explanation.textContent = bounds.checked ? "Booking dates: 1 October – 30 November 2026 (inclusive)."
            : "Browse with arrows; click a day or press Enter to select it.";
    }
    root.append([
        e("div", { ui: ["d-flex", "flex-wrap", "gap-2", "items-center"] },
            e("label", {}, "Locale ", locale), e("label", {}, "Week starts ", firstDay),
            e("label", { ui: ["d-flex", "gap-1", "items-center"] }, bounds, "Booking dates only")),
        holder, result, explanation
    ]);
    rebuild();
    root.mount(document.body);
}
