import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";

/** Initial command toolbar. Created, placed and disposed by HtmlEditor, not by the surface. */
export class HtmlEditorToolbar extends Component {
    private readonly commands: ReturnType<HtmlEditorCommandRegistry["getCommands"]>;
    private readonly buttons: HTMLButtonElement[];

    /** Connects supported commands to one surface; contains no document or history of its own. */
    constructor(private readonly registry: HtmlEditorCommandRegistry, private readonly messages: LocalizedMessages) {
        super({ class: "elg-html-editor-toolbar", role: "toolbar" });
        this.commands = registry.getCommands().filter(command => command.id !== "select-node");
        this.buttons = this.commands.map(type => {
            const button = e("button", { type: "button", ui: ["elg", "btn"], class: "elg-btn-ghost",
                onclick: () => { registry.execute(type.id); } });
            // A pointer click must not replace the document's native text selection.
            this.listen(button, "mousedown", event => event.preventDefault());
            this.listen(button, "focus", () => this.buttons.forEach(item => { item.tabIndex = item === button ? 0 : -1; }));
            this.append(button);
            return button;
        });
        this.listen(this.dom, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.altKey || key.ctrlKey || key.metaKey || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(key.key)) return;
            const enabled = this.buttons.filter(button => !button.disabled);
            const index = enabled.indexOf(this.dom.ownerDocument.activeElement as HTMLButtonElement);
            if (index < 0) return;
            key.preventDefault();
            const next = key.key === "Home" ? 0 : key.key === "End" ? enabled.length - 1
                : (index + (key.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length;
            enabled[next].focus();
        });
        this.subscribe(registry.context().surface.documentChanged, () => this.update());
        this.subscribe(registry.context().surface.selectionChanged, () => this.update());
        this.subscribe(registry.context().surface.interactionChanged, () => this.update());
        this.update();
    }

    /** Refreshes localized labels and command availability without rebuilding controls. */
    update(): void {
        this.dom.setAttribute("aria-label", this.messages.text("htmlEditorToolbar.label"));
        this.buttons.forEach((button, index) => {
            const command = this.commands[index];
            const context = this.registry.context();
            const state = this.registry.state(command, context);
            button.textContent = this.registry.label(command);
            button.disabled = !this.registry.enabled(command, context);
            if (state) {
                button.dataset.commandState = state;
                button.setAttribute("aria-pressed", state === "on" ? "true" : state === "mixed" ? "mixed" : "false");
            } else {
                delete button.dataset.commandState;
                button.removeAttribute("aria-pressed");
            }
        });
        const active = this.buttons.find(button => !button.disabled && button === this.dom.ownerDocument.activeElement)
            ?? this.buttons.find(button => !button.disabled && button.tabIndex === 0)
            ?? this.buttons.find(button => !button.disabled);
        this.buttons.forEach(button => { button.tabIndex = button === active ? 0 : -1; });
    }
}
