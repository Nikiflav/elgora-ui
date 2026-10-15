import { DateTimeEditor, TimeEditor, cdiv, e } from "../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["grid", "gap-2", "p-1"] });
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Ready");
    const save = async (label: string, value: string | null) => {
        status.textContent = `${label}: ${value ?? "empty"}`;
    };
    const start = new TimeEditor({ value: "09:30", label: "Start time", onCommit: value => save("Start", value) });
    const meeting = new DateTimeEditor({ value: "2026-10-14T14:05", label: "Meeting",
        dateFormat: "dd.MM.yyyy", onCommit: value => save("Meeting", value) });
    root.append([
        cdiv({ ui: ["col-12", "col-sm-6", "d-flex", "flex-col", "gap-1"] }, e("span", {}, "Start time"), start),
        cdiv({ ui: ["col-12", "col-sm-6", "d-flex", "flex-col", "gap-1"] }, e("span", {}, "Meeting"), meeting),
        status
    ]);
    root.mount(document.body);
}
