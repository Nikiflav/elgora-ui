import { DataForm, e, type DataViewField, type DataFormLayout } from "../../../src/index";

export default function demo(): void {
    const fields: DataViewField<any>[] = [
        { name: "name", caption: "Name" },
        { name: "city", caption: "City" },
        { name: "quantity", caption: "Quantity", dataType: "number" },
        { name: "actions", caption: "Actions", hideLabel: true, type: "buttons", buttons: [
            { id: "save", text: "Accept draft", icon: "ri-check-line", onClick: ({ owner }) => {
                status.textContent = JSON.stringify((owner as DataForm<any>).value);
            } }
        ] }
    ];
    const status = e("p", { role: "status" }, "Edit any field, then accept its draft.");
    const examples: { title: string; layout?: DataFormLayout }[] = [
        { title: "Collapsible groups", layout: [
            { id: "identity", title: "Identity", collapsible: true, rows: [
                { fields: [{ field: "name", width: "100%" }] },
                { fields: [{ field: "city", width: "100%" }] }
            ] },
            { id: "details", title: "Details", collapsible: true, collapsed: true,
                rows: [{ fields: [{ field: "quantity", width: 100 }] }] },
            { fields: [{ field: "actions" }] }
        ] },
        { title: "Vertical (default)" },
        { title: "Horizontal flex with wrapping", layout: [{ fields: [
            { field: "name", width: 180 }, { field: "city", width: 160 },
            { field: "quantity", width: 100 }, { field: "actions" }
        ] }] },
        { title: "Twelve-column grid", layout: [{ display: "grid", fields: [
            { field: "name", span: 6 }, { field: "city", span: 4 }, { field: "quantity", span: 2 }
        ] }, { labelPosition: "none", fields: [{ field: "actions" }] }] },
        { title: "Mixed rows and label placement", layout: [
            { labelPosition: "start", ui: ["gap-2"], fields: [{ field: "name", width: "100%", ui: ["mb-2"] }] },
            { display: "grid", fields: [{ field: "city", span: 8 }, { field: "quantity", span: 4 }] },
            { labelPosition: "none", fields: [{ field: "actions" }] }
        ] }
    ];
    for (const example of examples) {
        const section = e("section", { style: { marginBottom: "16px" } }, e("h3", example.title));
        document.body.append(section);
        new DataForm({ data: { name: "Alex", city: "Sofia", quantity: 12 }, fields, layout: example.layout }).mount(section);
    }
    document.body.append(status);
}
