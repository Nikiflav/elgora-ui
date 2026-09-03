import { Component } from "../../src/core/Component";
import { cdiv } from "../../src/core/c";
import { e } from "../../src/core/e";
import { MarkdownDemo } from "./types";

const SANDBOX_URL = "./demo-sandbox.html";

export class ReadonlyExample extends Component {
    private readonly preview: HTMLIFrameElement;
    private readonly status: HTMLElement;
    private readonly messageHandler: (event: MessageEvent) => void;

    constructor(demo: MarkdownDemo) {
        const preview = e("iframe", { ui: ["elg", "border-0", "w-100"] });
        if (demo.height) preview.style.height = demo.height;
        preview.title = demo.id + " live preview";
        preview.setAttribute("sandbox", "allow-scripts allow-same-origin");
        preview.src = SANDBOX_URL;

        const status = e("div", { ui: ["elg", "text-muted", "fs-80"] }, "Loading preview…");
        const previewPanel = cdiv({ ui: ["elg"] }, preview);
        const sourcePanel = cdiv(
            { ui: ["elg", "surface-3", "p-3", "overflow-auto"] },
            e("pre", { ui: ["elg", "m-0"] }, e("code", { ui: ["elg"] }, demo.source))
        );
        const shell = cdiv({ ui: ["elg", "d-flex", "flex-col", "gap-2"] }, previewPanel, sourcePanel, status);

        super({ children: shell });

        this.preview = preview;
        this.status = status;
        this.messageHandler = event => {
            if (event.source !== this.preview.contentWindow) return;
            const message = event.data as { type?: string; message?: string };
            if (message.type === "ready") {
                this.preview.contentWindow?.postMessage(
                    demo.module
                        ? { type: "run-module", module: demo.module }
                        : { type: "run", code: demo.code },
                    "*"
                );
            } else if (message.type === "success") {
                this.status.className = "elg elg-text-muted fs-80";
                this.status.textContent = "Live preview";
            } else if (message.type === "error") {
                this.status.className = "elg elg-text-danger fs-80";
                this.status.textContent = message.message || "Example failed.";
            }
        };

        window.addEventListener("message", this.messageHandler);
    }

    dispose(): void {
        window.removeEventListener("message", this.messageHandler);
        super.dispose();
    }
}
