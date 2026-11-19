import { HtmlEditor, cdiv, e } from "../../../../src/index";

export default function demo(): void {
    const editor = new HtmlEditor({
        value: "<h2>Insert a fragment</h2><p>Place the caret here, then choose a fragment to insert.</p>",
        toolbar: true,
        minHeight: 230
    });
    const fragments = {
        inline: { title: "Formatted text", html: "<strong>Bold</strong> and <em>italic</em>" },
        list: { title: "List", html: "<ul><li>First item</li><li>Second item</li></ul>" },
        table: { title: "Table", html: "<table><tbody><tr><td>Left cell</td><td>Right cell</td></tr></tbody></table>" },
        layout: { title: "Layout card", html: '<section style="padding:12px;border:1px solid var(--elg-border-color)"><h3>Inserted card</h3><p>The card keeps its structure.</p></section>' }
    };
    const fragment = e("select", { class: "elg", ariaLabel: "HTML fragment" },
        ...Object.entries(fragments).map(([value, item]) => e("option", { value }, item.title)));
    const status = e("div", { role: "status", ui: ["text-muted"] }, "Place the caret inside the editor.");
    const insert = e("button", { type: "button", ui: ["elg", "btn", "neutral"], onclick: () => {
        const item = fragments[fragment.value as keyof typeof fragments];
        status.textContent = item && editor.execute({ type: "insertHtml", html: item.html })
            ? "Fragment inserted. Try Undo and Redo."
            : "Place the caret inside the editor or select content first.";
    } }, "Insert HTML");
    cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] },
        e("div", { ui: ["d-flex", "flex-wrap", "gap-1"] }, fragment, insert), editor, status).mount(document.body);
}
