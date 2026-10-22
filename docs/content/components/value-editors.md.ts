import { cdiv, e, TextEditor, NumberEditor, CheckboxEditor, ToggleEditor, LookupEditor, DateEditor, TimeEditor, DateTimeEditor } from "../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["grid", "gap-2", "p-1"] });
    const status = e("div", { ui: ["text-muted", "col-12"], role: "status" }, "Changes are accepted by external callbacks.");
    const model = { customer: "Northwind Office", quantity: 2, active: true, priority: false,
        productId: 1, delivery: "2026-10-14" as string | null,
        start: "10:00" as string | null, meeting: "2026-10-14T10:00" as string | null };
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
    for (const editor of [customer, quantity]) editor.dom.querySelector("input")!.style.width = "100%";
    const products = [{ id: 1, name: "Desk lamp" }, { id: 2, name: "Office chair" }, { id: 3, name: "Standing desk" }];
    const product = new LookupEditor({ value: model.productId, label: "Product", columns: [{ name: "name", caption: "Product" }],
        loadItems: async ({ search, skip = 0, top = 50 }) => {
            const matches = products.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
            return { items: matches.slice(skip, skip + top), totalCount: matches.length };
        }, getItemValue: item => item.id, getItemText: item => item.name,
        getValueText: id => products.find(item => item.id === id)?.name ?? "",
        onCommit: value => accept("productId", value) });
    const delivery = new DateEditor({ value: model.delivery, label: "Delivery date", dateFormat: "dd.MM.yyyy",
        today: "2026-10-14", onCommit: value => accept("delivery", value) });
    const start = new TimeEditor({ value: model.start, label: "Start time", onCommit: value => accept("start", value) });
    const meeting = new DateTimeEditor({ value: model.meeting, label: "Meeting", dateFormat: "dd.MM.yyyy",
        onCommit: value => accept("meeting", value) });
    for (const [label, editor] of [["Customer · Text", customer], ["Quantity · Number", quantity],
        ["Product · Lookup", product], ["Delivery date · Date", delivery],
        ["Start · Time", start], ["Meeting · DateTime", meeting],
        ["Active · Checkbox", active], ["Priority · Toggle", priority]] as const) {
        const field = cdiv({ ui: ["col-12", "col-sm-6", "d-flex", "flex-col", "gap-1"] }, e("span", {}, label), editor);
        root.append(field);
    }
    root.append(status);
    root.mount(document.body);
}
