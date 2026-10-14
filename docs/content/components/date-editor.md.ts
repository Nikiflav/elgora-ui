import { DateEditor, cdiv, e } from "../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] });
    const fields = cdiv({ ui: ["grid", "gap-2"] });
    const state = { delivery: "2026-10-14" as string | null, booking: "2026-10-14" as string | null };
    const status = e("div", { ui: ["text-muted"], role: "status" }, JSON.stringify(state));
    const fail = e("input", { type: "checkbox", ariaLabel: "Simulate save failure" });
    const save = async (field: "delivery" | "booking", value: string | null) => {
        status.textContent = "Accepting " + field + "…";
        await new Promise(resolve => setTimeout(resolve, 250));
        if (fail.checked) {
            status.textContent = "Not accepted. Uncheck failure and retry, or press Escape.";
            throw new Error("Failed to accept date. Simulated service failure.");
        }
        state[field] = value;
        status.textContent = JSON.stringify(state);
    };
    const delivery = new DateEditor({ value: state.delivery, label: "Delivery date",
        today: "2026-10-14", locale: "en-GB", onCommit: value => save("delivery", value) });
    const booking = new DateEditor({ value: state.booking, label: "Booking date",
        dateFormat: "dd.MM.yyyy",
        openOnFocus: true,
        today: "2026-10-14", locale: "bg-BG", min: "2026-10-01", max: "2026-11-30",
        validate: value => {
            if (value === null) return "Booking date is required.";
            const weekday = new Date(value + "T12:00:00Z").getUTCDay();
            return weekday === 0 || weekday === 6 ? "Choose a weekday for the booking." : undefined;
        }, onCommit: value => save("booking", value) });
    fields.append([
        cdiv({ ui: ["col-12", "col-sm-6", "d-flex", "flex-col", "gap-1"] }, e("span", {}, "Delivery date"), delivery),
        cdiv({ ui: ["col-12", "col-sm-6", "d-flex", "flex-col", "gap-1"] }, e("span", {}, "Booking date (weekday only)"), booking)
    ]);
    root.append([fields, e("label", { ui: ["d-flex", "items-center", "gap-1"] }, fail, "Simulate save failure"), status,
        e("p", { ui: ["text-muted", "m-0"] }, "Booking focuses Calendar automatically. Escape returns to typing; Alt+Down opens Calendar again.")]);
    root.mount(document.body);
}
