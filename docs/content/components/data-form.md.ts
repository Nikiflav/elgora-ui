import { DataForm, DataSet, e, type DataViewField } from "../../../src/index";

export default function demo(): void {
    const actionStatus = e("span", { ui: ["text-muted"], role: "status" }, "No form action has been invoked.");
    const fields: DataViewField<any>[] = [
        { name: "name", caption: "Name", dataType: "string", required: true },
        { name: "quantity", caption: "Quantity", dataType: "number", displayFormat: "N0", validate: (value: number) =>
            value > 0 ? undefined : "Quantity must be positive." },
        { name: "deliveryDate", caption: "Delivery date", dataType: "date", displayFormat: "dd.MM.yyyy" },
        { name: "status", caption: "Status", dataType: "string", lookup: {
            loadItems: async ({ search, skip = 0, top = 50 }) => {
                const items = [{ id: "draft", text: "Draft" }, { id: "ready", text: "Ready" }]
                    .filter(item => item.text.toLowerCase().includes(search.trim().toLowerCase()));
                return { items: items.slice(skip, skip + top), totalCount: items.length };
            },
            getItemValue: (item: { id: string }) => item.id,
            getItemText: (item: { text: string }) => item.text,
            getValueText: async (value: string) => value === "ready" ? "Ready" : "Draft"
        } },
        { name: "actions", type: "buttons", caption: "Actions", buttons: [
            { id: "reset", text: "Reset name", icon: "ri-restart-line", tooltip: "Reset the name", onClick: ({ row }) => {
                if (row) row.name = "Reset by action";
                actionStatus.textContent = "The action button was invoked.";
            } },
            { id: "info", icon: "ri-information-line", tooltip: "Show action context", onClick: ({ field }) => {
                actionStatus.textContent = `Action field: ${field.caption ?? field.name}`;
            } }
        ] }
    ];
    const plain = { name: "Plain object", quantity: 12, deliveryDate: "2026-10-28", status: "draft" };
    const dataset = new DataSet();
    const row = dataset.createTable("orders", [{ id: 1, name: "DataRow", quantity: 24, deliveryDate: "2026-11-03", status: "ready" }]).rows[0];
    const plainStatus = e("span", { ui: ["text-muted"], role: "status" }, "Original object is unchanged until the host accepts the draft.");
    const rowStatus = e("span", { ui: ["text-muted"], role: "status" }, "DataRow changes are tracked by its table.");
    const plainForm = new DataForm({ data: plain, fields, labelPosition: "top", onCommit: async (_draft, field, value) => {
        plainStatus.textContent = `${field.caption}: ${String(value)} accepted in the draft.`;
    } });
    const rowForm = new DataForm({ data: row, fields, labelPosition: "start", onCommit: async (_row, field, value) => {
        rowStatus.textContent = `${field.caption}: ${String(value)} committed through DataRow.`;
    } });
    plainForm.dom.classList.add("elg-box", "surface", "p-2");
    rowForm.dom.classList.add("elg-box", "surface", "p-2");
    const plainSection = e("section", { ui: ["d-flex", "flex-col", "gap-1"], style: { maxWidth: "760px" } }, e("h3", { ui: ["m-0", "mb-1"] }, "Plain object adapter"), plainStatus, actionStatus);
    const rowSection = e("section", { ui: ["d-flex", "flex-col", "gap-1"], style: { maxWidth: "760px" } }, e("h3", { ui: ["m-0", "mb-1"] }, "DataRow adapter"), rowStatus);
    document.body.append(e("div", { ui: ["d-flex", "flex-col", "gap-3"] },
        e("p", { ui: ["m-0", "text-muted", "fs-80"] },
            "A field with type: buttons is rendered as semantic row actions. DataForm owns the button element, focus behavior and accessibility; use render only when the icon/text content needs customization."),
        plainSection, rowSection));
    plainForm.mount(plainSection);
    rowForm.mount(rowSection);
}
