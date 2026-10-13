import { cdiv, e, TextEditor, NumberEditor, CheckboxEditor, ToggleEditor } from "../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["grid", "gap-2", "p-1"] });
    const status = e("div", { ui: ["text-muted", "col-12"], role: "status" }, "Changes are accepted by external callbacks.");
    const model = { customer: "Northwind Office", quantity: 2, active: true, priority: false };
    const accept = async (field: keyof typeof model, value: unknown) => {
        status.textContent = "Accepting " + field + "…";
        await new Promise(resolve => setTimeout(resolve, 300));
        Object.assign(model, { [field]: value });
        status.textContent = JSON.stringify(model);
    };
    const customer = new TextEditor({ value: model.customer, label: "Customer", onCommit: value => accept("customer", value) });
    const quantity = new NumberEditor({ value: model.quantity, label: "Quantity",
        validate: value => value === null || value <= 0 ? "Quantity must be positive." : undefined,
        onCommit: value => accept("quantity", value) });
    const active = new CheckboxEditor({ value: model.active, label: "Active", onCommit: value => accept("active", value) });
    const priority = new ToggleEditor({ value: model.priority, label: "Priority", onCommit: value => accept("priority", value) });
    for (const [label, editor] of [["Customer", customer], ["Quantity", quantity], ["Active", active], ["Priority", priority]] as const) {
        const field = cdiv({ ui: ["col-12", "col-sm-6", "d-flex", "flex-col", "gap-1"] }, e("span", {}, label), editor);
        root.append(field);
    }
    root.append(status);
    root.mount(document.body);
}
