import { Component } from "../../src/core/Component";
import { cbutton, cdiv } from "../../src/core/c";
import { e } from "../../src/core/e";
import { MarkdownDemo } from "./types";

const SANDBOX_URL = "./demo-sandbox.html";

export class EditableExample extends Component {
    private readonly codeEditor: HTMLTextAreaElement;
    private readonly preview: HTMLIFrameElement;
    private readonly status: HTMLElement;
    private readonly demo: MarkdownDemo;
    private readonly messageHandler: (event: MessageEvent) => void;

    constructor(demo: MarkdownDemo) {
        const codeEditor = e("textarea", { ui: ["elg", "surface-3", "p-3", "w-100"] });
        codeEditor.value = demo.source;
        codeEditor.style.height = "400px";
        codeEditor.style.boxSizing = "border-box";
        codeEditor.spellcheck = false;
        codeEditor.setAttribute("aria-label", `${demo.id} editable JavaScript`);

        const preview = e("iframe", { ui: ["elg", "border-0", "w-100"] });
        if (demo.height) preview.style.height = demo.height;
        preview.title = `${demo.id} live preview`;
        preview.setAttribute("sandbox", "allow-scripts allow-same-origin");
        preview.src = SANDBOX_URL;

        const status = e("div", { ui: ["elg", "text-muted"] });
        status.textContent = "Loading preview…";

        const run = cbutton({ ui: ["elg", "btn", "primary"], type: "button" }, "Run");
        const reset = cbutton({ ui: ["elg", "btn", "neutral"], type: "button" }, "Reset");
        const copy = cbutton({ ui: ["elg", "btn", "neutral"], type: "button" }, "Copy");

        const toolbar = cdiv({ ui: ["elg", "d-flex", "items-center", "gap-2"] }, run, reset, copy, status);
        const codePanel = cdiv({ ui: ["elg", "d-flex", "flex-col", "gap-2"] }, toolbar, codeEditor);
        const previewPanel = cdiv({ ui: ["elg"] }, preview);
        const shell = cdiv({ ui: ["elg", "d-flex", "flex-col", "gap-3", "mb-4"] }, previewPanel, codePanel);

        super({ children: shell });

        this.demo = demo;
        this.codeEditor = codeEditor;
        this.preview = preview;
        this.status = status;
        this.messageHandler = event => {
            if (event.source !== this.preview.contentWindow) return;
            const message = event.data as { type?: string; message?: string };
            if (message.type === "ready") {
                this.status.textContent = "Ready";
                this.run();
            } else if (message.type === "success") {
                this.setStatus("elg-text-success");
                this.status.textContent = "Example executed successfully.";
            } else if (message.type === "log") {
                this.status.textContent = message.message || "Output received.";
            } else if (message.type === "error") {
                this.setStatus("elg-text-danger");
                this.status.textContent = message.message || "Example failed.";
            }
        };

        window.addEventListener("message", this.messageHandler);
        run.dom.addEventListener("click", () => this.run());
        reset.dom.addEventListener("click", () => {
            this.codeEditor.value = this.demo.source;
            this.run();
        });
        copy.dom.addEventListener("click", async () => {
            await navigator.clipboard?.writeText(this.codeEditor.value);
            this.setStatus("elg-text-success");
            this.status.textContent = "Code copied.";
        });
    }

    private run(): void {
        this.setStatus("elg-text-muted");
        this.status.textContent = "Running…";
        this.preview.contentWindow?.postMessage({
            type: "run",
            code: this.codeEditor.value
        }, "*");
    }

    private setStatus(style: "elg-text-muted" | "elg-text-success" | "elg-text-danger"): void {
        this.status.classList.remove("elg-text-muted", "elg-text-success", "elg-text-danger");
        this.status.classList.add("elg", style);
    }
}
