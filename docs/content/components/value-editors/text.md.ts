import { TextEditor, cdiv, e } from "../../../../src/index";

export default function demo(): void {
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Accepted: SO-1042");
    const editor = new TextEditor({ value: "SO-1042", label: "Order reference",
        validate: value => value.trim() ? undefined : "Reference is required.",
        onCommit: async value => {
            await new Promise(resolve => setTimeout(resolve, 250));
            status.textContent = "Accepted: " + value;
        } });
    cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] },
        e("span", {}, "Order reference"), editor, status).mount(document.body);
}
