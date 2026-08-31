import { Component } from "../../src/core/Component";
import { div, e, p, pre } from "../../src/core/e";
import { DocumentationExample } from "./types";

/** Displays a source snippet beside an example preview. */
export class LiveExample extends Component {
    private readonly preview: HTMLElement;
    private readonly example: DocumentationExample;

    constructor(example: DocumentationExample) {
        const preview = div({
            ui: ["elg", "box", "p-3"]
        });
        super({
            ui: ["elg", "box", "p-3", "d-flex", "flex-col", "gap-3"],
            children: [
                e("div", e("h3", example.title), p(example.description)),
                preview,
                pre({ ui: ["elg", "surface-3", "p-3", "overflow-auto"] }, e("code", { ui: ["elg"] }, example.code.trim()))
            ]
        });
        this.example = example;
        this.preview = preview;
    }

    /** Starts or restarts the live preview. */
    start(): void {
        void this.run();
    }

    private async run(): Promise<void> {
        this.preview.replaceChildren();
        try {
            await this.example.createDemo(this.preview);
        } catch {
            // The static example remains visible even if its preview cannot initialize.
        }
    }
}
