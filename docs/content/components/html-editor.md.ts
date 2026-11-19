import { HtmlEditor, cdiv, e } from "../../../src/index";

export default function demo(): void {
    const initialHtml = `<p><img src="/docs/assets/elgora-mark.svg" alt="Elgora mark" width="36" height="36"> &nbsp; <strong>THE CREATIVE WORKSPACE</strong></p>
<h1>Make room for good ideas.</h1>
<p>Every great page starts with a thought. Give yours shape with <strong>clear words</strong>, <em>thoughtful details</em> and a little space to explore.</p>
<blockquote><p>“The secret of getting ahead is getting started.”</p></blockquote>
<h2>Start with what matters</h2>
<p>Write freely, then select a phrase to try the toolbar. Add a link, change a color, or use the inspector to explore the structure of your page.</p>
<p><img src="/docs/assets/products/lamp.svg" alt="A desk lamp" width="180" height="180"></p>
<p>A little light and a comfortable space can make it easier to focus on your next idea.</p>
<p>Emoji: 😀 · 👩‍💻 · 👨‍👩‍👧‍👦 · 👍🏽 · 🇧🇬</p>
<p>Combining marks: Cafe&#x301; · a&#x308; · n&#x303;. Across formatting: <strong>e</strong><em>&#x301;</em> · <strong>👩</strong><em>&#x200D;💻</em>.</p>
<p>Try Backspace/Delete beside an emoji, accented letter or image, then Undo.</p>
<ul><li>Keep the message focused</li><li>Give each section a purpose</li></ul>
<section style="display:flex;flex-direction:column;gap:12px;padding:12px;border:1px solid var(--elg-border-color)">
<h3>Structured content</h3>
<div style="display:flex;gap:12px;align-items:stretch">
<div style="flex:1;padding:12px;background:var(--elg-surface-1)"><p><strong>Flex row</strong></p><p>Two columns inside a responsive row.</p></div>
<div style="flex:1;padding:12px;background:var(--elg-surface-1)"><p><strong>Second panel</strong></p><ol><li>First step</li><li>Second step</li></ol></div>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
<div style="padding:10px;border:1px solid var(--elg-border-color)"><p><strong>Grid A</strong></p><p>Editable card content.</p></div>
<div style="padding:10px;border:1px solid var(--elg-border-color)"><p><strong>Grid B</strong></p><p>Try Enter and Backspace.</p></div>
<div style="padding:10px;border:1px solid var(--elg-border-color)"><p><strong>Grid C</strong></p><p>Containers keep their shell.</p></div>
</div>
</section>
<h3>Data table</h3>
<table style="width:100%;border-collapse:collapse;border:1px solid var(--elg-border-color)"><thead><tr><th style="border:1px solid var(--elg-border-color);padding:8px;text-align:left">Element</th><th style="border:1px solid var(--elg-border-color);padding:8px;text-align:left">Purpose</th><th style="border:1px solid var(--elg-border-color);padding:8px;text-align:left">Status</th></tr></thead><tbody>
<tr><td style="border:1px solid var(--elg-border-color);padding:8px">Paragraph</td><td style="border:1px solid var(--elg-border-color);padding:8px">Text editing and formatting</td><td style="border:1px solid var(--elg-border-color);padding:8px">Ready</td></tr>
<tr><td style="border:1px solid var(--elg-border-color);padding:8px">Container</td><td style="border:1px solid var(--elg-border-color);padding:8px">Flex and grid layout</td><td style="border:1px solid var(--elg-border-color);padding:8px">In progress</td></tr>
<tr><td style="border:1px solid var(--elg-border-color);padding:8px">Table row</td><td style="border:1px solid var(--elg-border-color);padding:8px">Structured cell content</td><td style="border:1px solid var(--elg-border-color);padding:8px">Ready</td></tr>
</tbody></table>
<h3>Code and quotes</h3>
<pre><code>const message = "Hello";
console.log(message);</code></pre>
<blockquote><p>A quoted paragraph. Try Backspace at its beginning to remove one quote level.</p><p></p></blockquote>
<p>Continue editing below the table. The whole document is one model-managed draft.</p>`;
    const saved = { html: initialHtml };
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Draft is ready. Save to accept your changes.");
    const output = e("pre", {
        ui: ["m-0", "p-1", "border"],
        style: { maxHeight: "240px", overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }
    }, initialHtml);
    const editor = new HtmlEditor({
        value: initialHtml,
        toolbar: true,
        inspector: true,
        label: "Page content",
        placeholder: "Write page content…",
        minHeight: 550,
        onCommit: async html => {
            status.textContent = "Saving…";
            await new Promise(resolve => setTimeout(resolve, 250));
            saved.html = html;
            output.textContent = saved.html;
            status.textContent = "Saved. The host now owns this accepted HTML.";
        }
    });
    editor.content.style.width = "100%";
    editor.content.style.height = "550px";
    editor.content.style.boxSizing = "border-box";
    editor.input.subscribe(() => {
        status.textContent = editor.modified ? "Unsaved changes. Save to accept, or discard to restore." : "No pending changes.";
    });
    const save = e("button", { type: "button", ui: ["elg", "btn", "primary"], onclick: async () => {
        const accepted = await editor.commit();
        if (!accepted && !editor.error) status.textContent = "Nothing was accepted. Review the editor state and retry.";
    } }, "Save");
    const discard = e("button", { type: "button", ui: ["elg", "btn", "neutral"], onclick: () => {
        editor.cancel();
        status.textContent = "Draft discarded. Showing the last accepted HTML.";
    } }, "Discard");
    const chevron = e("i", { class: "ri-arrow-right-s-line", ariaHidden: "true" });
    const acceptedHtml = e("details", { ontoggle: (_event, details) => {
        chevron.className = details.open ? "ri-arrow-down-s-line" : "ri-arrow-right-s-line";
    } }, e("summary", { style: { display: "flex", alignItems: "center", cursor: "pointer" } },
        chevron, e("strong", {}, "Last accepted HTML")), output);
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"], style: { width: "100%", boxSizing: "border-box" } },
        e("div", { ui: ["d-flex", "flex-wrap", "gap-1"] }, save, discard),
        editor,
        status,
        acceptedHtml);
    root.mount(document.body);
}
