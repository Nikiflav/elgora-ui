import { HtmlEditor, cdiv, e } from "../../../src/index";

export default function demo(): void {
    const initialHtml = `<h2>Field notes</h2>
<p>A good page starts with a clear <strong>idea</strong> and a little room to explore.</p>
<p>Edit this copy, select a phrase, and try <em>Ctrl+B</em> or <em>⌘B</em>.</p>
<p>Before the image <img src="/docs/assets/elgora-mark.svg" alt="Elgora mark" width="36" height="36"> after the image.</p>
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
    const samples = {
        text: { title: "Rich text and lists", html: initialHtml },
        layout: { title: "Containers and media", html: `<h2>Working with structure</h2>
<section style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div style="padding:12px;border:1px solid var(--elg-border-color)"><p>First card</p><p>Split and join paragraphs inside this card.</p></div>
<div style="padding:12px;border:1px solid var(--elg-border-color)">This card starts as direct text.</div>
</section><p>Before the divider</p><hr><p>After the divider</p>
<p>Before <img src="/docs/assets/elgora-mark.svg" alt="Elgora mark" width="28" height="28"> after</p>` },
        table: { title: "Table cells", html: `<h2>Editing inside a table</h2>
<table style="border-collapse:collapse"><tbody><tr><th style="border:1px solid var(--elg-border-color);padding:8px">Name</th><th style="border:1px solid var(--elg-border-color);padding:8px">Notes</th></tr>
<tr><td style="border:1px solid var(--elg-border-color);padding:8px">First item</td><td style="border:1px solid var(--elg-border-color);padding:8px">Split this cell with Enter.</td></tr>
<tr><td style="border:1px solid var(--elg-border-color);padding:8px">Second item</td><td style="border:1px solid var(--elg-border-color);padding:8px"><p>First paragraph</p><p>Second paragraph</p></td></tr></tbody></table>
<p>Paragraph after the table</p>` }
    };
    const saved = { html: initialHtml };
    const status = e("div", { ui: ["text-muted"], role: "status" }, "Draft is ready. Save to accept your changes.");
    const output = e("pre", {
        ui: ["m-0", "p-1", "border"],
        style: { maxHeight: "240px", overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }
    }, initialHtml);
    const editor = new HtmlEditor({
        value: initialHtml,
        label: "Page content",
        placeholder: "Write page content…",
        minHeight: 350,
        onCommit: async html => {
            status.textContent = "Saving…";
            await new Promise(resolve => setTimeout(resolve, 250));
            saved.html = html;
            output.textContent = saved.html;
            status.textContent = "Saved. The host now owns this accepted HTML.";
        }
    });
    editor.content.style.width = "100%";
    editor.content.style.height = "350px";
    editor.content.style.boxSizing = "border-box";
    editor.input.subscribe(() => {
        status.textContent = editor.modified ? "Unsaved changes. Save to accept, or discard to restore." : "No pending changes.";
    });
    const selectionState = e("pre", { ui: ["m-0"], style: { whiteSpace: "pre-wrap" } }, "Select text in the editor.");
    editor.selectionChanged.subscribe(selection => { selectionState.textContent = JSON.stringify(selection, null, 2) ?? "No saved selection"; });
    const save = e("button", { type: "button", ui: ["elg", "btn", "primary"], onclick: async () => {
        const accepted = await editor.commit();
        if (!accepted && !editor.error) status.textContent = "Nothing was accepted. Review the editor state and retry.";
    } }, "Save");
    const discard = e("button", { type: "button", ui: ["elg", "btn", "neutral"], onclick: () => {
        editor.cancel();
        status.textContent = "Draft discarded. Showing the last accepted HTML.";
    } }, "Discard");
    const commandButtons = (["bold", "italic", "undo", "redo"] as const).map(type => e("button", {
        type: "button", ui: ["elg", "btn", "neutral"],
        onclick: () => { editor.execute({ type }); }
    }, type[0].toUpperCase() + type.slice(1)));
    const sample = e("select", { class: "elg", onchange: () => {
        const selected = samples[sample.value as keyof typeof samples];
        editor.setHtml(selected.html);
        saved.html = selected.html;
        output.textContent = selected.html;
        status.textContent = "Sample loaded. Edit inside a card or cell, and try Enter, Backspace, Delete and Undo.";
    } }, ...Object.entries(samples).map(([value, sample]) => e("option", { value }, sample.title)));
    sample.setAttribute("aria-label", "Editor sample");
    const fragments = {
        inline: { title: "Formatted text", html: '<strong>Bold</strong> and <em>italic</em>' },
        list: { title: "List", html: '<ul><li>First pasted item</li><li>Second pasted item</li></ul>' },
        table: { title: "Table", html: '<table><tbody><tr><td>Left cell</td><td>Right cell</td></tr></tbody></table>' },
        layout: { title: "Layout card", html: '<section style="padding:12px;border:1px solid var(--elg-border-color)"><h3>Pasted card</h3><p>The card keeps its structure.</p></section>' }
    };
    const fragment = e("select", { class: "elg" }, ...Object.entries(fragments).map(([value, sample]) => e("option", { value }, sample.title)));
    fragment.setAttribute("aria-label", "HTML fragment");
    const insert = e("button", { type: "button", ui: ["elg", "btn", "neutral"], onclick: () => {
        const html = fragments[fragment.value as keyof typeof fragments].html;
        status.textContent = editor.execute({ type: "insertHtml", html })
            ? "Fragment inserted. Try Undo and Redo, or continue typing."
            : "Place the caret inside the editor, or select content within one editable area.";
    } }, "Insert HTML");
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"], style: { width: "100%", boxSizing: "border-box" } },
        e("label", { ui: ["d-flex", "flex-wrap", "gap-1", "items-center"] }, "Sample", sample),
        e("small", { ui: ["text-muted"] }, "Changing the sample replaces the current draft."),
        e("div", { ui: ["d-flex", "flex-wrap", "gap-1"] }, ...commandButtons, save, discard),
        e("div", { ui: ["d-flex", "flex-wrap", "gap-1"] }, fragment, insert),
        editor,
        status,
        e("details", {}, e("summary", {}, "Selection state"), selectionState),
        e("div", {}, e("strong", {}, "Last accepted HTML"), output));
    root.mount(document.body);
}
