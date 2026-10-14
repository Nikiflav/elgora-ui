import { ToggleEditor, cdiv, e } from "../../../../src/index";

export default function demo(): void {
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Priority: false");
    const editor = new ToggleEditor({ value: false, label: "Priority order",
        onCommit: async value => {
            await new Promise(resolve => setTimeout(resolve, 250));
            status.textContent = "Priority: " + value;
        } });
    cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] },
        cdiv({ ui: ["d-flex", "items-center", "gap-2"] }, editor, e("span", {}, "Priority order")), status).mount(document.body);
}
