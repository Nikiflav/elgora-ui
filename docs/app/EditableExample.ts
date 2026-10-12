import { Component } from "../../src/core/Component";
import { cbutton, cdiv } from "../../src/core/c";
import { e } from "../../src/core/e";
import type { MarkdownDemo } from "./types";
import type { DemoEditor } from "./MonacoEditor";

const SANDBOX_URL = "./demo-sandbox.html";

/** Preview and pre-highlighted source; Monaco is loaded only when Edit code is selected. */
export class EditableExample extends Component {
    private editor?: DemoEditor;
    private readonly host: HTMLElement;
    private readonly source: HTMLElement;
    private readonly preview: HTMLIFrameElement;
    private readonly status: HTMLElement;
    private readonly demo: MarkdownDemo;
    private opening = false;

    constructor(demo: MarkdownDemo) {
        const source = e("div", { className: "docs-code-preview" });
        if (demo.sourceHtml) source.innerHTML = demo.sourceHtml;
        else source.append(e("pre", {}, e("code", {}, demo.source)));
        const host = e("div", { style: { height: "400px" }, hidden: true });
        const preview = e("iframe", { ui: ["elg", "border-0", "w-100"] });
        preview.style.height = demo.height || "320px";
        preview.title = demo.id + " live preview";
        preview.setAttribute("sandbox", "allow-scripts allow-same-origin");
        preview.src = SANDBOX_URL;
        const status = e("div", { ui: ["elg", "text-muted", "fs-90"], role: "status" }, "Loading preview…");
        const edit = cbutton({ ui: ["elg", "btn", "neutral"], type: "button" }, "Edit code");
        const run = cbutton({ ui: ["elg", "btn", "primary"], type: "button" }, "Run");
        const reset = cbutton({ ui: ["elg", "btn", "neutral"], type: "button" }, "Reset");
        const copy = cbutton({ ui: ["elg", "btn", "neutral"], type: "button" }, "Copy");
        const shell = cdiv({ ui: ["elg", "d-flex", "flex-col", "gap-3", "mb-4"] },
            preview,
            cdiv({ ui: ["elg", "d-flex", "items-center", "flex-wrap", "gap-2"] }, edit, run, reset, copy, status),
            source, host);
        super({ children: shell });
        this.demo = demo;
        this.preview = preview;
        this.status = status;
        this.host = host;
        this.source = source;

        this.listen(window, "message", raw => {
            const event = raw as MessageEvent;
            if (event.source !== preview.contentWindow) return;
            const message = event.data as { type?: string; message?: string };
            if (message.type === "ready") this.run();
            else if (message.type === "success") this.setStatus("Example executed successfully.");
            else if (message.type === "error") this.setStatus(message.message || "Example failed.", true);
            else if (message.type === "log") this.setStatus(message.message || "");
        });
        this.listen(edit.dom, "click", async () => {
            if (this.opening || this.editor) return;
            this.opening = true;
            edit.dom.setAttribute("disabled", "");
            this.setStatus("Loading editor…");
            try {
                const { createDemoEditor } = await import("./MonacoEditor");
                if (this.disposed.Value) return;
                host.hidden = false;
                const editor = await createDemoEditor(host, demo.source);
                if (this.disposed.Value) { editor.dispose(); return; }
                this.editor = editor;
                source.hidden = true;
                edit.dom.textContent = "Editing";
                editor.focus();
                this.setStatus("Ready to edit");
            } catch (error) {
                host.hidden = true;
                edit.dom.removeAttribute("disabled");
                this.setStatus(error instanceof Error ? error.message : String(error), true);
            } finally { this.opening = false; }
        });
        this.listen(run.dom, "click", () => this.run());
        this.listen(reset.dom, "click", () => { this.editor?.setValue(demo.source); this.run(); });
        this.listen(copy.dom, "click", async () => {
            try {
                if (!navigator.clipboard) throw new Error("Clipboard is unavailable in this browser.");
                await navigator.clipboard.writeText(this.editor?.getValue() ?? demo.source);
                this.setStatus("Code copied.");
            } catch (error) { this.setStatus(String(error), true); }
        });
        this.addCleanup(() => this.editor?.dispose());
    }

    private run(): void {
        this.setStatus("Running…");
        this.preview.contentWindow?.postMessage({ type: "run", code: this.editor?.getValue() ?? this.demo.code }, "*");
    }

    private setStatus(message: string, error = false): void {
        this.status.classList.toggle("elg-text-danger", error);
        this.status.textContent = message;
    }
}
