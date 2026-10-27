import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorInspector } from "./HtmlEditorInspector";
import type { DataForm } from "../../dataform/DataForm";
import type { HtmlEditorInspectionRow } from "./HtmlEditorInspection";

/** Compact command toolbar backed by the inspector's shared DataForm field renderer. */
export class HtmlEditorToolbar extends Component {
    private readonly commands: ReturnType<HtmlEditorCommandRegistry["getCommands"]>;
    private readonly legacyButtons: HTMLButtonElement[];
    private readonly formHost: HTMLElement;
    private readonly propertiesButton: HTMLButtonElement;
    private form?: DataForm<HtmlEditorInspectionRow>;
    private inspector?: HtmlEditorInspector;
    private formRenderKey = "";
    private refreshQueued = false;

    /** Connects supported commands to one surface; field behavior remains owned by the registry. */
    constructor(private readonly registry: HtmlEditorCommandRegistry, private readonly messages: LocalizedMessages) {
        super({ class: "elg-html-editor-toolbar", role: "toolbar" });
        // Underline and strikethrough are Basic-inspector-only for now. Keep
        // them out of both the shared toolbar form and its legacy fallback
        // buttons; otherwise a command omitted from the compact toolbar order
        // would still reappear as an unbound fallback button.
        this.commands = registry.getCommands().filter(command =>
            command.id !== "select-node" && command.id !== "underline" && command.id !== "strikethrough");
        this.formHost = e("div", { class: "elg-html-editor-toolbar-form-host" });
        this.append(this.formHost);
        this.legacyButtons = this.commands.map(type => {
            const button = e("button", { type: "button", ui: ["elg", "btn"], class: "elg-btn-ghost",
                onclick: () => { registry.execute(type.id); } });
            // A pointer click must not replace the document's native text selection.
            this.listen(button, "mousedown", event => event.preventDefault());
            this.listen(button, "focus", () => this.legacyButtons.forEach(item => { item.tabIndex = item === button ? 0 : -1; }));
            this.append(button);
            return button;
        });
        this.legacyButtons.forEach(button => button.hidden = true);
        const propertiesLabel = this.messages.text("htmlEditorInspector.properties");
        this.propertiesButton = e("button", { type: "button", ui: ["elg", "btn", "btn-ghost"],
            class: "elg-html-editor-toolbar-properties", ariaLabel: propertiesLabel, title: propertiesLabel,
            onclick: () => this.toggleProperties() }, e("i", { class: "elg-icon ri-layout-right-line", ariaHidden: "true" }));
        this.propertiesButton.hidden = true;
        this.append(this.propertiesButton);
        this.listen(this.dom, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.altKey || key.ctrlKey || key.metaKey || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(key.key)) return;
            const enabled = [...this.dom.querySelectorAll<HTMLButtonElement>("button:not(:disabled):not([hidden])")];
            const index = enabled.indexOf(this.dom.ownerDocument.activeElement as HTMLButtonElement);
            if (index < 0) return;
            key.preventDefault();
            const next = key.key === "Home" ? 0 : key.key === "End" ? enabled.length - 1
                : (index + (key.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length;
            enabled[next].focus();
        });
        this.update();
    }

    /** Installs the shared inspector field form once the editor has created it. */
    setInspector(inspector: HtmlEditorInspector): void {
        this.inspector = inspector;
        this.formRenderKey = "";
        this.update();
    }

    private toggleProperties(): void {
        const inspector = this.inspector;
        if (!inspector) return;
        const visible = !inspector.dom.hidden;
        inspector.dom.hidden = visible;
        const body = inspector.dom.parentElement;
        body?.classList.toggle("elg-html-editor-with-inspector", !visible);
        this.propertiesButton.setAttribute("aria-pressed", String(!visible));
    }

    /** Refreshes the shared field form and fallback commands without changing document focus. */
    update(): void {
        this.dom.setAttribute("aria-label", this.messages.text("htmlEditorToolbar.label"));
        this.rebuildForm();
        this.refreshLegacyButtons();
    }

    /** Computes whether the toolbar form should be rebuilt and does so if the effective state changed. */
    private rebuildForm(): void {
        if (!this.inspector) return;
        const surface = this.registry.context().surface;
        const key = `${this.inspector.stateVersion}|${this.inspector.inspectedElements.join(",")}|${surface.modelVersion}|${JSON.stringify(surface.selection)}|${surface.editable}`;
        if (key === this.formRenderKey) return;
        if (this.form?.isEditing) return;
        this.formRenderKey = key;
        this.form?.dispose();
        this.form = this.inspector.createToolbarForm();
        this.formHost.replaceChildren();
        if (this.form) {
            this.form.editEnded.subscribe(() => this.queueRefresh());
            this.form.mount(this.formHost);
        }
        this.formHost.hidden = !this.form;
    }

    /** Schedules a single deferred refresh after an edit ends, to reflect updated values. */
    private queueRefresh(): void {
        if (this.refreshQueued) return;
        this.refreshQueued = true;
        setTimeout(() => {
            this.refreshQueued = false;
            if (!this.disposed.Value) this.update();
        });
    }

    /** Updates legacy button labels, enabled state and visibility; does not recreate the form. */
    private refreshLegacyButtons(): void {
        this.legacyButtons.forEach((button, index) => {
            const command = this.commands[index];
            const context = this.registry.context();
            const state = this.registry.state(command, context);
            const label = this.registry.label(command);
            button.replaceChildren(command.icon ? e("i", { class: `elg-icon ${command.icon}`, ariaHidden: "true" }) : document.createTextNode(label));
            button.setAttribute("aria-label", label);
            button.title = label;
            button.disabled = !this.registry.enabled(command, context);
            const represented = !!this.formHost.querySelector(`[data-field="${command.id}"]`);
            button.hidden = !!this.inspector && represented;
            if (state) {
                button.dataset.commandState = state;
                button.setAttribute("aria-pressed", state === "on" ? "true" : state === "mixed" ? "mixed" : "false");
            } else {
                delete button.dataset.commandState;
                button.removeAttribute("aria-pressed");
            }
        });
        const active = this.legacyButtons.find(button => !button.disabled && button === this.dom.ownerDocument.activeElement)
            ?? this.legacyButtons.find(button => !button.disabled && button.tabIndex === 0)
            ?? this.legacyButtons.find(button => !button.disabled);
        this.legacyButtons.forEach(button => { button.tabIndex = button === active ? 0 : -1; });
        if (this.inspector) {
            this.propertiesButton.hidden = false;
            this.propertiesButton.disabled = !this.registry.context().surface.editable;
            this.propertiesButton.setAttribute("aria-pressed", String(!this.inspector.dom.hidden));
        }
    }
}
