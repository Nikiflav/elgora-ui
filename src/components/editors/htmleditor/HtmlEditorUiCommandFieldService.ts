import { e, v } from "../../../core/e";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { LocaleOptions } from "../../../localization/Localization";
import type { DataViewButton, DataViewField, FieldLookup } from "../../../data/DataViewField";
import type { LookupQuery } from "../LookupEditor";
import { PopupMenu } from "../../popup/PopupMenu";
import { Popover } from "../../popup/popover";
import { TabView } from "../../tab-view/TabView";
import { DataForm, type DataFormAdapter } from "../../dataform/DataForm";
import type { HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorUiCommandTargetContext, HtmlEditorUiCommandFormRow, HtmlEditorResolvedUiCommandField,
    HtmlEditorUiCommandPresentationKind } from "./HtmlEditorInspection";
export type { HtmlEditorUiCommandPresentationKind } from "./HtmlEditorInspection";

/** Shared field projection used by every HtmlEditor DataForm surface. */
export class HtmlEditorUiCommandFieldService {
    private choiceMenu?: PopupMenu;
    private propertyPopup?: Popover;

    constructor(private readonly registry: HtmlEditorCommandRegistry,
        private readonly messages: LocalizedMessages, private readonly localeOptions: LocaleOptions = {}) { }

    /** Closes the active option menu without ending its current form lifecycle. */
    hideMenus(): void { this.choiceMenu?.hide(); this.propertyPopup?.hide(); }

    /**
     * Releases the option menu before its owning DataForm is disposed.
     *
     * The menu is mounted into the active form so native popover light-dismiss
     * remains local to that surface. DataForm recursively disposes mounted
     * components, therefore the service must release its reference before the
     * form is replaced; the next button click creates a fresh menu instance.
     */
    disposeMenus(): void {
        this.choiceMenu?.dispose();
        this.choiceMenu = undefined;
        this.propertyPopup?.dispose();
        this.propertyPopup = undefined;
    }

    /** Resolves fields for a presentation slot; surfaces may then choose a subset/order. */
    resolve(context: HtmlEditorUiCommandTargetContext, presentation: HtmlEditorUiCommandPresentationKind): HtmlEditorResolvedUiCommandField[] {
        return this.registry.getUiCommandFields(context, presentation);
    }

    /** Shares value display, lookup text and commit behavior across DataForm surfaces. */
    createFormAdapter(): DataFormAdapter<HtmlEditorUiCommandFormRow> {
        return {
            getValue: (row, field) => this.fieldValue(row.fields.get(field.name)),
            getText: async (row, field, value) => {
                const binding = row.fields.get(field.name);
                if (!binding?.value || binding.value.kind === "unset") return "—";
                if (binding.value.kind === "mixed") return this.messages.text("htmlEditorInspector.mixed");
                if (field.lookup) return field.lookup.getValueText(value, { row, field, value });
                return String(value ?? "");
            },
            setValue: async (row, field, value) => {
                const binding = row.fields.get(field.name);
                if (!binding || !this.registry.executeUiCommandField(binding, value))
                    throw new Error(this.messages.text("htmlEditorInspector.propertiesHint"));
            }
        };
    }

    /** Converts one resolved command field into the shared DataViewField contract. */
    field(binding: HtmlEditorResolvedUiCommandField, row: HtmlEditorUiCommandFormRow,
        presentation: HtmlEditorUiCommandPresentationKind = "basic",
        action?: (commandId: string, anchor: HTMLButtonElement) => boolean): DataViewField<HtmlEditorUiCommandFormRow> {
        const source = binding.definition.field ?? {};
        const visual = binding.definition.presentations?.[presentation];
        const command = binding.command;
        const showLabel = visual?.showLabel ?? (presentation === "basic" || presentation === "advanced" || presentation === "focused"
            ? binding.definition.type === "data" : false);
        const field: DataViewField<HtmlEditorUiCommandFormRow> = {
            ...source,
            name: command.id,
            type: visual?.control ?? binding.definition.type,
            hideLabel: !showLabel,
            caption: source.caption?.startsWith("htmlEditor")
                ? this.messages.text(source.caption as never) : source.caption ?? this.registry.label(command),
            tooltip: source.tooltip ?? this.registry.tooltip(command),
            readonly: source.readonly || !binding.enabled,
            showInRow: () => true
        };
        const optionsAsButtons = binding.definition.type === "data" && command.options?.length
            && binding.definition.presentation !== "lookup" && visual?.control !== "data";
        if (optionsAsButtons) {
            field.type = "buttons";
            field.hideLabel = !showLabel;
            const value = binding.value?.kind === "value" ? binding.value.value : undefined;
            if (visual?.control === "buttons" || binding.definition.presentation === "buttons") {
                field.buttons = command.options!.map(option => ({ id: option.id, text: option.text,
                    icon: option.icon ?? ({ default: "ri-format-clear", start: "ri-align-left", center: "ri-align-center", end: "ri-align-right" } as Record<string, string>)[option.id],
                    appearance: option.icon || command.id === "block.align" ? "iconOnly" : "textOnly",
                    ui: "btn-ghost", pressed: value === option.id, disabled: !binding.enabled || option.disabled,
                    onClick: () => { this.registry.executeUiCommandField(binding, command.id === "block.align" && value === option.id ? undefined : option.id); } }));
            } else {
                const selected = command.options!.find(option => option.id === value
                    || binding.value?.kind === "unset" && option.id === "default");
                const isColor = command.options!.some(option => option.color !== undefined);
                const showValue = visual?.showValue !== false;
                const showArrow = visual?.showArrow !== false;
                const appearance = visual?.appearance ?? "textAndIcon";
                const icon = visual?.icon ?? selected?.icon ?? (isColor ? "ri-font-color" : "ri-font-size");
                const displayColor = selected?.color ?? (typeof value === "string" ? value : undefined);
                // Transparent backgrounds and unset selections must not make the
                // toolbar glyph itself transparent; inherit the button color instead.
                const iconColor = !displayColor || /^(?:transparent|rgba\([^)]*,\s*0(?:\.0+)?\s*\)|(?:rgba?|color)\([^)]*\/\s*0(?:\.0+)?%?\s*\))$/i.test(displayColor)
                    ? "currentColor" : displayColor;
                field.buttons = [{ id: command.id, text: binding.value?.kind === "mixed"
                    ? this.messages.text("htmlEditorInspector.mixed") : selected?.text ?? String(value ?? "—"),
                    icon, appearance, tooltip: visual?.tooltip === "caption" ? field.caption : visual?.tooltip ?? field.tooltip,
                    render: isColor ? () => v("span", { class: "elg-html-editor-color-choice" },
                        showValue ? v("span", { class: "elg-menu-color-swatch", "data-empty": !displayColor,
                            ariaHidden: "true", style: { backgroundColor: displayColor ?? "transparent" } })
                            : v("i", { class: icon, ariaHidden: "true", style: { color: iconColor } }),
                        showValue ? v("span", binding.value?.kind === "mixed" ? this.messages.text("htmlEditorInspector.mixed")
                            : selected?.text ?? String(value ?? "—")) : undefined,
                        showArrow ? v("i", { class: "ri-arrow-down-s-line", ariaHidden: "true" }) : undefined) : undefined,
                    disabled: !binding.enabled, onClick: async ({ owner }) => {
                        const form = owner as DataForm<HtmlEditorUiCommandFormRow>;
                        const anchor = [...form.dom.querySelectorAll<HTMLElement>("[data-field]")]
                            .find(host => host.dataset.field === command.id)?.querySelector<HTMLButtonElement>("button");
                        if (!anchor) return;
                        if (presentation === "toolbar" && action?.(command.id, anchor)) return;
                        const property = this.registry.propertyDefinition(command.id);
                        if (property?.providers.length) {
                            this.showPropertyPopup(form, anchor, binding, presentation);
                            return;
                        }
                        this.choiceMenu ??= new PopupMenu({ density: "compact" });
                        if (this.choiceMenu.dom.parentElement !== form.dom) {
                            this.choiceMenu.hide();
                            this.choiceMenu.mount(form.dom);
                        }
                        await this.choiceMenu.show({ anchor, items: command.options!.map(option => ({ key: option.id,
                            text: option.text, icon: option.icon, color: option.color, disabled: option.disabled,
                            checked: () => selected?.id === option.id,
                            action: () => { this.registry.executeUiCommandField(binding, option.id); } })) });
                    } }];
            }
        } else if (binding.definition.type === "data") {
            field.lookup = source.lookup ?? this.optionsLookup(binding);
            field.getValue = () => this.fieldValue(row.fields.get(command.id));
        } else {
            const state = this.registry.state(command, binding.context);
            const button: DataViewButton<HtmlEditorUiCommandFormRow> = {
                id: command.id, text: this.registry.label(command), icon: command.id === "image.lockAspect"
                    ? state === "on" ? "ri-lock-line" : "ri-lock-unlock-line" : command.icon,
                appearance: command.id === "link.remove" || command.id === "image.lockAspect" ? "iconAndText" : "iconOnly",
                ui: "btn-ghost", tooltip: this.registry.tooltip(command),
                pressed: state === "mixed" ? "mixed" : state === "on", disabled: !binding.enabled,
                onClick: async ({ owner }) => {
                    const form = owner as DataForm<HtmlEditorUiCommandFormRow>;
                    const anchor = [...form.dom.querySelectorAll<HTMLElement>("[data-field]")]
                        .find(host => host.dataset.field === command.id)?.querySelector<HTMLButtonElement>("button");
                    if (presentation === "toolbar" && action && anchor && action(command.id, anchor)) return;
                    this.registry.executeUiCommandField(binding);
                }
            };
            field.buttons = [button];
        }
        return field;
    }

    /** Provider panels share one popover and a captured selection; they never claim CSS precedence. */
    private showPropertyPopup(form: DataForm<HtmlEditorUiCommandFormRow>, anchor: HTMLElement,
        binding: HtmlEditorResolvedUiCommandField, presentation: HtmlEditorUiCommandPresentationKind): void {
        const definition = this.registry.propertyDefinition(binding.command.id);
        if (!definition?.providers.length) return;
        this.propertyPopup?.dispose();
        const popup = new Popover({ anchorElement: anchor, bindAnchorTarget: false, role: "dialog",
            class: "elg-html-editor-property-popup", ui: presentation === "toolbar" ? ["fs-80"] : undefined });
        this.propertyPopup = popup;
        const panels = definition.providers.map(provider => {
            const targetInfos = binding.context.resolution.targets.kind === "nodes"
                ? binding.context.resolution.targets.nodeInfos : binding.context.nodeInfos;
            const values = targetInfos.map(info => binding.context.surface.findElement(info.id))
                .filter((item): item is NonNullable<typeof item> => !!item).map(item => provider.read(item));
            const pending = binding.context.surface.pendingProperty(definition.id);
            const current = pending ? pending.providerId === provider.id ? pending.value : undefined
                : values.length && values.every(value => value === values[0]) ? values[0] : undefined;
            const panel = e("div", { class: "elg-html-editor-property-provider" });
            const apply = (value: string) => {
                if (!provider.accepts(value)) { status.textContent = "Invalid value"; return; }
                popup.hide();
                this.registry.applyProperty(binding, provider.id, value);
            };
            const status = e("div", { role: "status" });
            if (provider.control.type === "palette") {
                const grid = e("div", { class: "elg-html-editor-palette", role: "group", ariaLabel: provider.text });
                provider.control.options.forEach(option => grid.append(e("button", { type: "button", class: "elg-html-editor-palette-swatch",
                    title: option.color ? `${option.text} (${option.color})` : option.text, ariaLabel: option.color ? `${option.text} (${option.color})` : option.text, ariaPressed: String(option.id === current),
                    style: { backgroundColor: option.color ?? "transparent" }, onclick: () => apply(option.id) })));
                panel.append(grid);
            } else if (provider.control.type === "choices") {
                provider.control.options.forEach(option => panel.append(e("button", { type: "button", class: "elg btn neutral btn-ghost",
                    ariaPressed: String(option.id === current), onclick: () => apply(option.id) },
                    option.color ? e("span", { class: "elg-menu-color-swatch", style: { backgroundColor: option.color }, ariaHidden: "true" }) : undefined,
                    option.text)));
            } else if (provider.control.type === "length") {
                const config = provider.control;
                const parsed = current?.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]+)$/i);
                const number = e("input", { class: "elg elg-field", type: "text", inputMode: "decimal",
                    value: parsed && config.units.includes(parsed[2]) ? parsed[1] : "", ariaLabel: `${provider.text} value` });
                const units = e("select", { class: "elg", ariaLabel: `${provider.text} unit` },
                    ...config.units.map(unit => e("option", { value: unit }, unit)));
                if (parsed && config.units.includes(parsed[2])) units.value = parsed[2];
                panel.append(number, units, e("button", { type: "button", class: "elg btn neutral",
                    onclick: () => apply(number.value.trim().replace(",", ".") + units.value) }, "Apply"));
            } else {
                const input = e("input", { class: "elg elg-field", type: "text", value: current ?? "", ariaLabel: provider.text });
                if (provider.control.type === "color") {
                    const picker = e("input", { type: "color", ariaLabel: `${provider.text} color picker`, value: /^#[0-9a-f]{6}$/i.test(current ?? "") ? current : "#000000",
                        oninput: (_event, control) => { input.value = control.value; } });
                    input.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(input.value)) picker.value = input.value; });
                    panel.append(picker);
                }
                panel.append(input, e("button", { type: "button", class: "elg btn neutral", onclick: () => apply(input.value.trim()) }, "Apply"));
            }
            panel.append(e("button", { type: "button", class: "elg btn neutral btn-ghost", onclick: () => {
                popup.hide();
                this.registry.clearProperty(binding, provider.id);
            } }, this.messages.text("htmlEditorBasic.clearProvider")), status);
            return { id: provider.id, text: provider.text, content: panel };
        });
        if (panels.length === 1) popup.setContent(panels[0].content);
        else popup.setContent(new TabView({ items: panels, label: definition.id }));
        popup.mount(form.dom);
        popup.show();
    }

    /** Creates the horizontal toolbar form from the same command field service. */
    createToolbarForm(context: HtmlEditorUiCommandTargetContext,
        action?: (commandId: string, anchor: HTMLButtonElement) => boolean): DataForm<HtmlEditorUiCommandFormRow> | undefined {
        this.disposeMenus();
        const order = ["block.heading", "block.align", "bold", "italic", "text.size", "text.color", "element.backgroundColor", "clear-formatting", "link", "undo", "redo"];
        const available = new Map(this.resolve(context, "toolbar").map(field => [field.command.id, field]));
        const fields = order.map(id => available.get(id)).filter((field): field is HtmlEditorResolvedUiCommandField => !!field);
        if (!fields.length) return undefined;
        const row: HtmlEditorUiCommandFormRow = { fields: new Map(fields.map(field => [field.command.id, field])) };
        const dataFields = fields.map(field => {
            const result = this.field(field, row, "toolbar", action);
            result.hideLabel = true;
            if (result.buttons) result.buttons.forEach(button => { button.ui = ["btn-ghost"]; });
            return result;
        });
        const adapter = this.createFormAdapter();
        return new DataForm<HtmlEditorUiCommandFormRow>({ data: row, fields: dataFields,
            layout: [{ display: "flex", wrap: false, labelPosition: "none", ui: ["gap-0"],
                fields: dataFields.map(field => ({ field: field.name, labelPosition: "none" })) }],
            class: "elg-html-editor-toolbar-form", labelPosition: "none", surface: "none", allowEdit: true,
            locale: this.localeOptions.locale, localization: this.localeOptions.localization, adapter });
    }

    private fieldValue(binding?: HtmlEditorResolvedUiCommandField): any {
        return binding?.value?.kind === "value" ? binding.value.value : binding?.value?.kind === "mixed" ? null : undefined;
    }

    private optionsLookup(binding: HtmlEditorResolvedUiCommandField): FieldLookup<HtmlEditorUiCommandFormRow> | undefined {
        const options = binding.command.options;
        if (!options?.length) return undefined;
        return {
            loadItems: async (query: LookupQuery) => {
                const search = query.search.trim().toLocaleLowerCase();
                const items = options.filter(option => !search || option.text.toLocaleLowerCase().includes(search));
                const skip = query.skip ?? 0, top = query.top ?? items.length;
                return { items: items.slice(skip, skip + top), totalCount: items.length };
            },
            getItemValue: item => item.id, getItemText: item => item.text,
            getValueText: value => options.find(option => option.id === value)?.text ?? String(value ?? ""),
            popupWidth: 220, popupHeight: 220, resizable: false
        };
    }
}


