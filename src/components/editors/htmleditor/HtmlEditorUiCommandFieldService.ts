import { v } from "../../../core/e";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { LocaleOptions } from "../../../localization/Localization";
import type { DataViewButton, DataViewField, FieldLookup } from "../../../data/DataViewField";
import type { LookupQuery } from "../LookupEditor";
import { PopupMenu } from "../../popup/PopupMenu";
import { DataForm, type DataFormAdapter } from "../../dataform/DataForm";
import type { HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorUiCommandTargetContext, HtmlEditorUiCommandExecutionContext, HtmlEditorUiCommandFormRow, HtmlEditorResolvedUiCommandField,
    HtmlEditorUiCommandPresentationKind } from "./HtmlEditorInspection";
export type { HtmlEditorUiCommandPresentationKind } from "./HtmlEditorInspection";

export type HtmlEditorUiCommandDensity = "full" | "compact";
export type HtmlEditorUiCommandControl = "data" | "buttons";

/** Shared field projection used by every HtmlEditor DataForm surface. */
export class HtmlEditorUiCommandFieldService {
    private choiceMenu?: PopupMenu;

    constructor(private readonly registry: HtmlEditorCommandRegistry,
        private readonly messages: LocalizedMessages, private readonly localeOptions: LocaleOptions = {}) { }

    /** Closes the active option menu without ending its current form lifecycle. */
    hideMenus(): void { this.choiceMenu?.hide(); }

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
    }

    /** Resolves fields for a presentation slot; surfaces may then choose a subset/order. */
    resolve(context: HtmlEditorUiCommandTargetContext, presentation: HtmlEditorUiCommandPresentationKind): HtmlEditorResolvedUiCommandField[] {
        const result = new Map<string, HtmlEditorResolvedUiCommandField>();
        this.registry.getUiCommandFields(context).forEach(field => result.set(field.command.id, field));
        this.registry.getCommands(this.registry.context(), true).forEach(command => {
            const definition = command.field;
            if (!definition || !this.visible(definition, presentation) || result.has(command.id)) return;
            const targets = definition.resolveTargets(context);
            const commandContext: HtmlEditorUiCommandExecutionContext = { ...context, resolution: { context, targets } };
            if (!(command.isVisible?.(commandContext) ?? true)) return;
            result.set(command.id, { command, definition, context: commandContext,
                value: definition.type === "data" ? definition.getValue(commandContext) : undefined,
                enabled: this.registry.enabled(command, commandContext) });
        });
        return [...result.values()].filter(field => this.visible(field.definition, presentation));
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
                field.buttons = [{ id: command.id, text: binding.value?.kind === "mixed"
                    ? this.messages.text("htmlEditorInspector.mixed") : selected?.text ?? String(value ?? "—"),
                    icon, appearance, tooltip: visual?.tooltip === "caption" ? field.caption : visual?.tooltip ?? field.tooltip,
                    render: isColor ? () => v("span", { class: "elg-html-editor-color-choice" },
                        showValue ? v("span", { class: "elg-menu-color-swatch", "data-empty": !selected?.color,
                            ariaHidden: "true", style: { backgroundColor: selected?.color ?? (typeof value === "string" ? value : "transparent") } })
                            : v("i", { class: icon, ariaHidden: "true", style: { color: selected?.color || undefined } }),
                        showValue ? v("span", binding.value?.kind === "mixed" ? this.messages.text("htmlEditorInspector.mixed")
                            : selected?.text ?? String(value ?? "—")) : undefined,
                        showArrow ? v("i", { class: "ri-arrow-down-s-line", ariaHidden: "true" }) : undefined) : undefined,
                    disabled: !binding.enabled, onClick: async ({ owner }) => {
                        const form = owner as DataForm<HtmlEditorUiCommandFormRow>;
                        const anchor = [...form.dom.querySelectorAll<HTMLElement>("[data-field]")]
                            .find(host => host.dataset.field === command.id)?.querySelector<HTMLButtonElement>("button");
                        if (!anchor) return;
                        if (presentation === "toolbar" && action?.(command.id, anchor)) return;
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
            field.getValue = () => this.inspectorValue(row.fields.get(command.id)!);
        } else {
            const state = this.registry.state(command, binding.context);
            const button: DataViewButton<HtmlEditorUiCommandFormRow> = {
                id: command.id, text: this.registry.label(command), icon: command.icon,
                appearance: command.id === "link.remove" ? "iconAndText" : "iconOnly",
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

    /** Creates the horizontal toolbar form from the same command field service. */
    createToolbarForm(context: HtmlEditorUiCommandTargetContext,
        action?: (commandId: string, anchor: HTMLButtonElement) => boolean): DataForm<HtmlEditorUiCommandFormRow> | undefined {
        this.disposeMenus();
        const order = ["block.heading", "block.align", "bold", "italic", "text.size", "text.color", "element.backgroundColor", "clear-formatting", "link", "undo", "redo"];
        const available = new Map(this.resolve(context, "toolbar").map(field => [field.command.id, field]));
        const fields = order.map(id => available.get(id)).filter((field): field is HtmlEditorResolvedUiCommandField => !!field);
        if (!fields.length) return undefined;
        const row: HtmlEditorUiCommandFormRow = { context, fields: new Map(fields.map(field => [field.command.id, field])) };
        const dataFields = fields.map(field => {
            const result = this.field(field, row, "toolbar", action);
            result.hideLabel = true;
            if (result.buttons) result.buttons.forEach(button => { button.ui = ["btn-ghost"]; });
            return result;
        });
        const adapter: DataFormAdapter<HtmlEditorUiCommandFormRow> = {
            getValue: (_row, field) => this.inspectorValue(row.fields.get(field.name)! ),
            getText: async (_row, field, value) => {
                const binding = row.fields.get(field.name);
                if (!binding?.value || binding.value.kind === "unset") return "—";
                if (binding.value.kind === "mixed") return this.messages.text("htmlEditorInspector.mixed");
                if (field.lookup) return field.lookup.getValueText(value, { row, field, value });
                return String(value ?? "");
            },
            setValue: async (_row, field, value) => {
                const binding = row.fields.get(field.name);
                if (!binding || !this.registry.executeUiCommandField(binding, value))
                    throw new Error(this.messages.text("htmlEditorInspector.propertiesHint"));
            }
        };
        return new DataForm<HtmlEditorUiCommandFormRow>({ data: row, fields: dataFields,
            layout: [{ display: "flex", wrap: false, labelPosition: "none", ui: ["gap-0"],
                fields: dataFields.map(field => ({ field: field.name, labelPosition: "none" })) }],
            class: "elg-html-editor-toolbar-form", labelPosition: "none", surface: "none", allowEdit: true,
            locale: this.localeOptions.locale, localization: this.localeOptions.localization, adapter });
    }

    private visible(definition: any, presentation: HtmlEditorUiCommandPresentationKind): boolean {
        if (definition.visibleIn) return definition.visibleIn.includes(presentation);
        if (presentation === "basic" || presentation === "advanced") return !definition.toolbarOnly;
        return presentation === "toolbar";
    }

    private inspectorValue(binding: HtmlEditorResolvedUiCommandField): any {
        return binding.value?.kind === "value" ? binding.value.value : binding.value?.kind === "mixed" ? null : undefined;
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


