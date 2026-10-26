import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import { Popover } from "../../popup/popover";
import type { HtmlEditorCommandContext, HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";

/** Shared command-menu renderer used for the editor context menu and future menu surfaces. */
export class HtmlEditorCommandMenu extends Component {
    private readonly popup: Popover;

    constructor(private readonly registry: HtmlEditorCommandRegistry) {
        super({ class: "elg-html-editor-command-menu" });
        this.popup = new Popover({ point: { x: 0, y: 0 }, bindAnchorTarget: false, role: "menu", class: "elg-html-editor-command-menu" });
        this.addCleanup(this.popup);
        this.addCleanup(() => this.popup.hide());
    }

    /** Shows the same filtered registry commands at a viewport point. */
    showAt(x: number, y: number, context: HtmlEditorCommandContext = this.registry.context()): void {
        const buttons = this.registry.getCommands(context).map(command => {
            const button = e("button", { type: "button", class: "elg-html-editor-command-menu-item",
                title: this.registry.label(command), disabled: !this.registry.enabled(command, context),
                onclick: () => {
                    if (this.registry.execute(command.id, context)) this.popup.hide();
                } });
            const state = this.registry.state(command, context);
            if (state) {
                button.dataset.commandState = state;
                button.setAttribute("aria-pressed", state === "on" ? "true" : state === "mixed" ? "mixed" : "false");
            }
            if (command.icon) button.append(e("i", { class: `elg-icon ${command.icon}`, ariaHidden: "true" }));
            button.append(document.createTextNode(this.registry.label(command)));
            return button;
        });
        this.popup.setPoint(x, y);
        this.popup.setContent(buttons);
        this.popup.mount(this.dom.ownerDocument.body);
        this.popup.show();
        this.popup.dom.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    }

    /** Closes the menu without changing the editor selection or document. */
    hide(): void { this.popup.hide(); }
    /** Whether the menu is currently visible. */
    get isOpen(): boolean { return this.popup.isOpen(); }
}
