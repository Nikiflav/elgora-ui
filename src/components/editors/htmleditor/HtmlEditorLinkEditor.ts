import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import type { DataViewField } from "../../../data/DataViewField";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { DataFormAdapter } from "../../dataform/DataForm";
import { DataForm } from "../../dataform/DataForm";
import { Popover } from "../../popup/popover";
import { PopupMenu } from "../../popup/PopupMenu";
import { isSafeHtmlEditorHref, type HtmlEditorUiCommandContext, type HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorSelectionRange } from "./HtmlEditorModel";

type LinkDraft = { href: string; target: string; title: string };
/**
 * Internal link dialog used by the toolbar. It deliberately is not part of the
 * public package API. Its fields are local DataForm fields over a staged draft;
 * the inspector command fields remain registry-owned and are not reused here.
 */
export class HtmlEditorLinkEditor extends Component {
    private readonly popup: Popover;
    private readonly formHost: HTMLElement;
    private readonly apply: HTMLButtonElement;
    private readonly cancel: HTMLButtonElement;
    private readonly remove: HTMLButtonElement;
    private readonly hint: HTMLSpanElement;
    private readonly targetMenu = new PopupMenu({ density: "compact" });
    private form?: DataForm<LinkDraft>;
    private staged: LinkDraft = { href: "", target: "_self", title: "" };
    private anchor?: HTMLElement;
    private selection?: HtmlEditorSelectionRange;
    private hasLink = false;
    private outsideActive = false;

    constructor(private readonly registry: HtmlEditorCommandRegistry, private readonly messages: LocalizedMessages) {
        super({ class: "elg-html-editor-link-editor" });
        this.popup = new Popover({ point: { x: 0, y: 0 }, bindAnchorTarget: false, closeMode: "manual",
            role: "dialog", class: "elg-html-editor-link-editor-popover" });
        this.popup.dom.setAttribute("aria-label", this.messages.text("htmlEditorToolbar.link"));
        this.formHost = e("div", { class: "elg-html-editor-link-editor-form-host" });
        this.apply = e("button", { type: "button", "data-action": "apply", class: "elg-html-editor-link-editor-apply",
            ui: ["elg", "btn", "primary"], onclick: () => { void this.commit(); } },
            this.messages.text("htmlEditorBasic.linkApply"));
        this.cancel = e("button", { type: "button", "data-action": "cancel", class: "elg-html-editor-link-editor-cancel",
            ui: ["elg", "btn", "btn-ghost"], onclick: () => this.hide() },
            this.messages.text("dataGrid.cancel"));
        this.remove = e("button", { type: "button", "data-action": "remove", class: "elg-html-editor-link-editor-remove",
            ui: ["elg", "btn", "btn-ghost"], onclick: () => this.removeLink() },
            this.messages.text("htmlEditorBasic.unlink"));
        this.hint = e("span", { class: "elg-html-editor-link-editor-hint", role: "alert" });
        this.hint.hidden = true;
        this.append([this.formHost,
            e("div", { class: "elg-html-editor-link-editor-actions" }, this.apply, this.cancel, this.remove), this.hint]);
        this.popup.setContent(this.dom);
        this.addCleanup(this.targetMenu);
        this.subscribe(this.popup.closed, () => {
            this.form?.cancelEdit();
            this.stopOutsideTracking();
        });
        this.listen(this.popup.dom, "keydown", event => {
            if ((event as KeyboardEvent).key === "Escape") { event.preventDefault(); this.hide(); }
        });
        this.addCleanup(this.popup);
        this.addCleanup(() => this.popup.hide());
    }

    show(anchor: HTMLElement, context: HtmlEditorUiCommandContext): void {
        this.anchor = anchor;
        this.selection = context.selection ? structuredClone(context.selection) : undefined;
        this.prefill(context);
        this.popup.setAnchor(anchor);
        if (!this.popup.dom.isConnected) this.popup.mount(anchor.ownerDocument.body);
        this.popup.show();
        this.startOutsideTracking();
        requestAnimationFrame(() => void this.form?.beginEditField("href"));
    }

    hide(): void {
        this.form?.cancelEdit();
        this.stopOutsideTracking();
        this.popup.hide();
    }

    get isOpen(): boolean { return this.popup.isOpen(); }

    private async commit(): Promise<void> {
        if (!this.form || !await this.form.finishEdit()) return;
        const url = this.staged.href.trim();
        if (!url) {
            if (this.hasLink) { this.removeLink(); return; }
            this.invalid(); return;
        }
        if (!isSafeHtmlEditorHref(url)) { this.invalid(); return; }
        if (!this.selection) { this.invalid(); return; }
        const context = this.registry.context();
        const succeeded = context.surface.execute({ type: "link", property: "update",
            href: url, target: this.staged.target, title: this.staged.title }, this.selection);
        if (!succeeded) return;
        context.surface.restoreSelection(this.selection);
        this.hide();
    }

    private removeLink(): void {
        if (!this.selection) return;
        const context = this.registry.context();
        if (!context.surface.execute({ type: "link", property: "remove" }, this.selection)) return;
        context.surface.restoreSelection(this.selection);
        this.hide();
    }

    private prefill(context: HtmlEditorUiCommandContext): void {
        const inspection = this.registry.uiCommandTargetContext([]);
        const resolved = this.registry.getUiCommandFields(inspection);
        const value = (id: string, fallback: string): string => {
            const state = resolved.find(field => field.command.id === id)?.value;
            return state?.kind === "value" && typeof state.value === "string" ? state.value : fallback;
        };
        this.hasLink = this.registry.getCommands(context).some(command => command.id === "link.remove");
        this.staged = {
            href: value("link.href", ""),
            target: value("link.target", "_self"),
            title: value("link.title", "")
        };
        const dataFields = this.createFields();
        const adapter: DataFormAdapter<LinkDraft> = {
            getValue: (_row, field) => this.stagedValue(field.name),
            getText: async (_row, field, current) => field.name === "target"
                ? this.targetText(String(current ?? "_self")) : String(current ?? ""),
            setValue: async (_row, field, current) => { this.setStagedValue(field.name, String(current ?? "")); }
        };
        this.form?.dispose();
        this.form = new DataForm<LinkDraft>({ data: this.staged, fields: dataFields, labelPosition: "top",
            surface: "none", allowEdit: true, adapter });
        this.formHost.replaceChildren(); this.form.mount(this.formHost);
        this.remove.hidden = !this.hasLink;
        this.hint.hidden = true;
        this.hint.textContent = "";
        this.dom.dataset.hasLink = String(this.hasLink);
    }

    private stagedValue(name: string): string { return this.staged[this.key(name)]; }

    private setStagedValue(name: string, value: string): void { this.staged[this.key(name)] = value; }

    private key(name: string): keyof LinkDraft { return name as keyof LinkDraft; }

    private targetOptions(): readonly { value: string; text: string }[] {
        return [
            { value: "_self", text: this.messages.text("htmlEditorBasic.linkTargetSelf") },
            { value: "_blank", text: this.messages.text("htmlEditorBasic.linkTargetBlank") }
        ];
    }

    private targetText(value: string): string {
        return this.targetOptions().find(option => option.value === value)?.text ?? value;
    }

    private createFields(): DataViewField<LinkDraft>[] {
        const tooltip = (key: "linkUrl" | "linkTarget" | "linkTitle") => this.messages.text(`htmlEditorBasic.${key}` as never);
        const targetButton = {
            id: "target", text: this.targetText(this.staged.target), icon: "ri-arrow-down-s-line" as const,
            appearance: "textAndIcon" as const, tooltip: tooltip("linkTarget"), onClick: async ({ owner }: { owner: unknown }) => {
                const form = owner as DataForm<LinkDraft>;
                const anchor = form.dom.querySelector<HTMLButtonElement>('[data-field="target"] button');
                if (!anchor) return;
                if (this.targetMenu.dom.parentElement !== form.dom) this.targetMenu.mount(form.dom);
                await this.targetMenu.show({ anchor, items: this.targetOptions().map(option => ({
                    key: option.value, text: option.text, checked: () => this.staged.target === option.value,
                    action: async () => {
                        this.staged.target = option.value;
                        targetButton.text = option.text;
                        await form.refreshField("target");
                    }
                })) });
            }
        };
        return [
            { name: "href", dataType: "string", caption: tooltip("linkUrl"), tooltip: tooltip("linkUrl") },
            {
                name: "target", type: "buttons", dataType: "string", caption: tooltip("linkTarget"), tooltip: tooltip("linkTarget"),
                buttons: [targetButton]
            },
            { name: "title", dataType: "string", caption: tooltip("linkTitle"), tooltip: tooltip("linkTitle") }
        ];
    }

    private invalid(): void {
        this.hint.textContent = this.messages.text("htmlEditorBasic.invalidUrl");
        this.hint.hidden = false;
        this.form?.dom.querySelector<HTMLElement>('[data-field="href"] input')?.focus();
    }

    private closeOnOutside = (event: PointerEvent): void => {
        const target = event.target as Node;
        if (target && (this.popup.dom.contains(target) || this.anchor?.contains(target))) return;
        this.hide();
    };

    private startOutsideTracking(): void {
        if (this.outsideActive) return;
        this.popup.dom.ownerDocument.addEventListener("pointerdown", this.closeOnOutside);
        this.outsideActive = true;
    }

    private stopOutsideTracking(): void {
        if (!this.outsideActive) return;
        this.popup.dom.ownerDocument.removeEventListener("pointerdown", this.closeOnOutside);
        this.outsideActive = false;
    }
}




