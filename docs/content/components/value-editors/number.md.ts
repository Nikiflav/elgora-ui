import { NumberEditor, cdiv, e } from "../../../../src/index";

export default function demo(): void {
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Accepted quantity: 2");
    const editor = new NumberEditor({ value: 2, label: "Quantity", step: 1, min: 0, max: 100,
        validate: value => value === null || value <= 0 ? "Quantity must be positive." : undefined,
        onCommit: async value => {
            await new Promise(resolve => setTimeout(resolve, 250));
            status.textContent = "Accepted quantity: " + value;
        } });
    cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] },
        e("span", {}, "Quantity"), editor, status).mount(document.body);
}
