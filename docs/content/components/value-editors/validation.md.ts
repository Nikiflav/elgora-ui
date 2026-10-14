import { CheckboxEditor, DateEditor, LookupEditor, NumberEditor, TextEditor, ToggleEditor, cdiv, e } from "../../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["grid", "gap-2", "p-1"] });
    const status = e("div", { ui: ["text-muted", "col-12"], role: "status" },
        "All editors below start with an invalid draft. Correct a value and press Enter, or toggle it back on, to clear the error.");
    const accept = async (name: string) => {
        status.textContent = `${name} accepted.`;
    };

    const text = new TextEditor({ value: "Order-1042", label: "Reference",
        validate: value => value.trim() ? undefined : "Reference is required.",
        onCommit: () => accept("Reference") });
    const number = new NumberEditor({ value: 10, label: "Quantity",
        validate: value => value !== null && value > 0 ? undefined : "Quantity must be greater than zero.",
        onCommit: () => accept("Quantity") });
    const checkbox = new CheckboxEditor({ value: true, label: "Approved",
        validate: value => value ? undefined : "Approval is required.",
        onCommit: () => accept("Approved") });
    const toggle = new ToggleEditor({ value: true, label: "Published",
        validate: value => value ? undefined : "The item must be published.",
        onCommit: () => accept("Published") });

    const customers = [{ id: 1, name: "Northwind" }, { id: 2, name: "Contoso" }];
    const lookup = new LookupEditor({ value: 999, label: "Customer", columns: [{ name: "name", caption: "Customer" }],
        loadItems: async ({ search, skip = 0, top = 50 }) => {
            const matches = customers.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
            return { items: matches.slice(skip, skip + top), totalCount: matches.length };
        },
        getItemValue: item => item.id,
        getItemText: item => item.name,
        getValueText: id => customers.find(item => item.id === id)?.name ?? "Unknown customer",
        onCommit: () => accept("Customer") });

    const date = new DateEditor({ value: "2026-10-14", label: "Delivery date", dateFormat: "dd.MM.yyyy",
        today: "2026-10-14", onCommit: () => accept("Delivery date") });

    const fields = [
        ["Reference · Text", text], ["Quantity · Number", number],
        ["Customer · Lookup", lookup], ["Delivery date · Date", date],
        ["Approved · Checkbox", checkbox], ["Published · Toggle", toggle]
    ] as const;
    for (const [label, editor] of fields)
        root.append(cdiv({ ui: ["col-12", "col-sm-6", "d-flex", "flex-col", "gap-1"] }, e("span", {}, label), editor));
    root.append(status);
    root.mount(document.body);

    // Apply invalid drafts after mount so every editor demonstrates the same
    // validation lifecycle that a user would trigger while editing.
    queueMicrotask(() => {
        const textInput = text.dom.querySelector<HTMLInputElement>("input")!;
        textInput.value = "";
        textInput.dispatchEvent(new Event("input", { bubbles: true }));
        void text.commit();

        const numberInput = number.dom.querySelector<HTMLInputElement>("input")!;
        numberInput.value = "0";
        numberInput.dispatchEvent(new Event("input", { bubbles: true }));
        void number.commit();

        const checkboxInput = checkbox.dom.querySelector<HTMLInputElement>("input")!;
        checkboxInput.click();

        const toggleButton = toggle.dom.querySelector<HTMLButtonElement>("button")!;
        toggleButton.click();

        const input = lookup.dom.querySelector<HTMLInputElement>("input")!;
        input.value = "Unknown customer";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        void lookup.commit();

        const dateInput = date.dom.querySelector<HTMLInputElement>("input")!;
        dateInput.value = "2026-02-29";
        dateInput.dispatchEvent(new Event("input", { bubbles: true }));
        void date.commit();
    });
}
