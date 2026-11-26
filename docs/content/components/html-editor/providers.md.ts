import { HtmlEditor, createHtmlEditorClassProvider, createHtmlEditorFreeStyleProvider,
    createHtmlEditorInlineStyleProvider, cdiv, e } from "../../../../src/index";

export default function demo(): void {
    const sizes = [80, 100, 125, 150, 200].map(size => ({ id: `${size}%`, text: `${size}%` }));
    const classes = [{ id: "compact", text: "Compact" }, { id: "large", text: "Large" }];
    const editor = new HtmlEditor({
        value: '<h2>Make your words stand out</h2><p>Select a phrase and try a color or size. Apply a class to see how the host can offer its own design choices.</p>',
        toolbar: true, inspector: true, minHeight: 300,
        properties: [{ id: "text.size", cssProperty: "font-size", providers: [
            createHtmlEditorInlineStyleProvider("sizes", "Sizes", "font-size", sizes, Object.fromEntries(sizes.map(size => [size.id, size.id]))),
            createHtmlEditorFreeStyleProvider("custom", "Custom", "font-size", { type: "length", units: ["px", "em", "rem", "%"], min: 0.01 }),
            createHtmlEditorClassProvider("classes", "Classes", classes, { compact: "demo-text-compact", large: "demo-text-large" })
        ] }]
    });
    const styles = e("style", ".demo-text-compact { font-size: 80%; } .demo-text-large { font-size: 150%; }");
    cdiv({ ui: ["d-flex", "flex-col", "gap-2", "p-1"] }, styles, editor).mount(document.body);
}
