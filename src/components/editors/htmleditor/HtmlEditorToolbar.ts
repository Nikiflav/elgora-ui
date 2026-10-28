import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorInspector } from "./HtmlEditorInspector";
import { HtmlEditorLinkEditor } from "./HtmlEditorLinkEditor";
import type { DataForm } from "../../dataform/DataForm";
import type { HtmlEditorUiCommandFormRow } from "./HtmlEditorInspection";
import { HtmlEditorUiCommandFieldService } from "./HtmlEditorUiCommandFieldService";

/** Compact command toolbar backed exclusively by the shared DataForm field service. */
export class HtmlEditorToolbar extends Component {
    private readonly formHost: HTMLElement;
    private readonly propertiesButton: HTMLButtonElement;
    private form?: DataForm<HtmlEditorUiCommandFormRow>;
    private inspector?: HtmlEditorInspector;
    private linkEditor?: HtmlEditorLinkEditor;
    private formRenderKey = "";
    private refreshQueued = false;
    private readonly fields: HtmlEditorUiCommandFieldService;

    constructor(private readonly registry: HtmlEditorCommandRegistry, private readonly messages: LocalizedMessages,
        fields?: HtmlEditorUiCommandFieldService) {
        super({ class: "elg-html-editor-toolbar", role: "toolbar" });
        this.fields = fields ?? new HtmlEditorUiCommandFieldService(registry, messages);
        this.formHost = e("div", { class: "elg-html-editor-toolbar-form-host" });
        this.append(this.formHost);
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

    setInspector(inspector: HtmlEditorInspector): void {
        this.inspector = inspector;
        this.formRenderKey = "";
        this.update();
    }

    /** Rebuilds localized field captions and labels without changing editor state. */
    refreshLocalization(): void {
        this.formRenderKey = "";
        this.update();
    }

    update(): void {
        this.dom.setAttribute("aria-label", this.messages.text("htmlEditorToolbar.label"));
        this.rebuildForm();
        if (this.inspector) {
            this.propertiesButton.hidden = false;
            this.propertiesButton.disabled = !this.registry.context().surface.editable;
            this.propertiesButton.setAttribute("aria-pressed", String(!this.inspector.dom.hidden));
        }
    }

    private toggleProperties(): void {
        const inspector = this.inspector;
        if (!inspector) return;
        const visible = !inspector.dom.hidden;
        inspector.dom.hidden = visible;
        inspector.dom.parentElement?.classList.toggle("elg-html-editor-with-inspector", !visible);
        this.propertiesButton.setAttribute("aria-pressed", String(!visible));
    }

    private toggleLinkEditor(anchor: HTMLElement): boolean {
        if (!this.linkEditor) {
            this.linkEditor = new HtmlEditorLinkEditor(this.registry, this.messages);
            this.addCleanup(this.linkEditor);
        }
        if (this.linkEditor.isOpen) this.linkEditor.hide();
        else this.linkEditor.show(anchor, this.registry.context());
        return true;
    }

    private rebuildForm(): void {
        const surface = this.registry.context().surface;
        const inspected = this.inspector?.inspectedElements ?? [];
        const key = `${this.inspector?.stateVersion ?? 0}|${inspected.join(",")}|${surface.modelVersion}|${JSON.stringify(surface.selection)}|${surface.editable}`;
        if (key === this.formRenderKey || this.form?.isEditing) return;
        this.formRenderKey = key;
        this.form?.dispose();
        const context = this.registry.uiCommandTargetContext(inspected);
        this.form = this.fields.createToolbarForm(context, (commandId, anchor) => {
            if (commandId === "link") { this.toggleLinkEditor(anchor); return true; }
            return false;
        });
        this.formHost.replaceChildren();
        if (this.form) {
            this.form.editEnded.subscribe(() => this.queueRefresh());
            this.form.mount(this.formHost);
        }
        this.formHost.hidden = !this.form;
    }

    private queueRefresh(): void {
        if (this.refreshQueued) return;
        this.refreshQueued = true;
        setTimeout(() => {
            this.refreshQueued = false;
            if (!this.disposed.Value) this.update();
        });
    }
}


