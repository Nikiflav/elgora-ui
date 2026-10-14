import { CheckboxEditor, cdiv, e } from "../../../../src/index";

export default function demo(): void {
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Shipped: false");
    const editor = new CheckboxEditor({ value: false, label: "Shipped",
        onCommit: async value => {
            await new Promise(resolve => setTimeout(resolve, 250));
            status.textContent = "Shipped: " + value;
        } });
    cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] }, editor, status).mount(document.body);
}
