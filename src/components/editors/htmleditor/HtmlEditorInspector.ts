import { Component } from "../../../core/Component";
import { e, v } from "../../../core/e";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { LocaleOptions } from "../../../localization/Localization";
import { Popover } from "../../popup/popover";
import { PopupMenu } from "../../popup/PopupMenu";
import { TreeView } from "../../tree-view/TreeView";
import { TabView } from "../../tab-view/TabView";
import { DataForm, type DataFormAdapter, type DataFormLayoutGroup, type DataFormLayoutRow } from "../../dataform/DataForm";
import type { DataViewField, DataViewButton, FieldLookup } from "../../../data/DataViewField";
import type { LookupQuery } from "../LookupEditor";
import type { HtmlEditorSurface } from "./HtmlEditorSurface";
import type { HtmlEditorElement, HtmlEditorNode, HtmlEditorText } from "./HtmlEditorModel";
import type { HtmlEditorNodeCoverage } from "./HtmlEditorRange";
import { isAtomic } from "./HtmlEditorStructure";
import type { HtmlEditorCommandRegistry } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorInspectionContext, HtmlEditorInspectionRow, HtmlEditorInspectorTargets, HtmlEditorResolvedInspectorField } from "./HtmlEditorInspection";


/** Inspector scaffold owned by HtmlEditor. Targets are previews, not structural editor selections. */
export class HtmlEditorInspector extends Component {
    private readonly selector: HTMLButtonElement;
    private readonly selectorCoverage: HTMLButtonElement;
    private readonly selectorRow: HTMLElement;
    private readonly tabView: TabView;
    private readonly panels: HTMLElement[];
    private readonly nodes = new Map<string, HtmlEditorNode>();
    private readonly parents = new Map<string, HtmlEditorElement>();
    private roots: HtmlEditorNode[] = [];
    private targetId?: string;
    private mixed = false;
    private commonAncestorId?: string;
    private coverage: ReadonlyMap<string, HtmlEditorNodeCoverage> = new Map();
    private tree?: TreeView<HtmlEditorNode>;
    private popup?: Popover;
    private commandPopup?: Popover;
    private readonly basicPanel: HTMLElement;
    private basicForm?: DataForm<HtmlEditorInspectionRow>;
    private inspectedIds: string[] = [];
    private basicRenderKey = "";
    private basicRefreshQueued = false;
    private inspectionVersion = 0;
    private choiceMenu?: PopupMenu;
    /** User choices survive selection changes, including temporarily absent groups. */
    private readonly categoryState = new Map<string, boolean>();

    /** Current property targets, derived from the remembered editor selection. */
    get inspectedElements(): readonly string[] { return [...this.inspectedIds]; }
    /** Monotonic version for consumers that render snapshot-based field states. */
    get stateVersion(): number { return this.inspectionVersion; }
    /** Resolves the same command-specific targets used by the inspector field. */
    getCommandPreviewTargets(commandId: string): HtmlEditorInspectorTargets | undefined {
        return this.commands.getInspectorFields(this.basicInspectionContext()).find(field => field.command.id === commandId)
            ?.context.inspection.targets;
    }

    /** Connects one surface to the element navigator and placeholder property tabs. */
    constructor(private readonly surface: HtmlEditorSurface, private readonly messages: LocalizedMessages,
        private readonly commands: HtmlEditorCommandRegistry,
        private readonly localeOptions: LocaleOptions = {}) {
        super({ class: "elg-html-editor-inspector", role: "complementary" });
        this.selector = e("button", { type: "button", class: "elg-html-editor-node-selector",
            ui: ["elg", "btn", "neutral", "btn-ghost"], onclick: () => { void this.openElements(); } });
        this.selector.setAttribute("aria-haspopup", "dialog");
        this.selector.setAttribute("aria-expanded", "false");
        this.selectorCoverage = e("button", { type: "button", class: "elg-html-editor-node-coverage",
            onpointerdown: event => event.preventDefault(), onmousedown: event => event.preventDefault(),
            onclick: event => {
                event.stopPropagation();
                if (!this.mixed && this.targetId && !this.selectorCoverage.disabled) {
                    this.surface.selectNode(this.targetId);
                    this.selectorCoverage.focus();
                }
            } });
        this.selectorRow = e("div", { class: "elg-html-editor-selector-row" }, this.selectorCoverage, this.selector);
        this.basicPanel = e("div", { class: "elg-html-editor-basic-commands" });
        this.tabView = new TabView({ label: this.messages.text("htmlEditorInspector.label"), items: [
            { id: "basic", text: this.messages.text("htmlEditorInspector.properties"), content: this.basicPanel },
            { id: "advanced", text: this.messages.text("htmlEditorInspector.advanced") }
        ] });
        this.panels = [this.tabView.getPanel("basic")!, this.tabView.getPanel("advanced")!];
        this.append([this.selectorRow, this.tabView]);
        this.refreshDocument();
    }

    private elements(nodes: HtmlEditorNode[]): HtmlEditorElement[] {
        return nodes.filter((node): node is HtmlEditorElement => node.type === "element");
    }

    private treeNodes(nodes: HtmlEditorNode[]): HtmlEditorNode[] { return [...nodes]; }

    private text(node: HtmlEditorNode): string {
        return node.type === "text" ? node.text : node.children.map(child => this.text(child)).join("")
            + (/^(p|div|section|li|tr|td|th|h[1-6]|pre|blockquote)$/.test(node.tag) ? " " : "");
    }

    private description(item: HtmlEditorNode): string {
        const full = (item.type === "text" ? item.text.trim() : this.text(item).trim() || item.attributes.alt
            || item.attributes.src?.split("/").pop() || this.messages.text("htmlEditorInspector.empty")).replace(/\s+/g, " ");
        const Segmenter = (Intl as unknown as { Segmenter?: new (...args: unknown[]) => { segment(value: string): Iterable<{ segment: string }> } }).Segmenter;
        const parts = Segmenter ? [...new Segmenter(undefined, { granularity: "grapheme" }).segment(full)].map(part => part.segment) : Array.from(full);
        return parts.length > 64 ? parts.slice(0, 63).join("") + "…" : full;
    }

    /** Rebuilds the node index after the shared command-surface coordinator observes a model change. */
    refreshDocument(): void {
        this.inspectionVersion++;
        this.popup?.hide();
        this.nodes.clear(); this.parents.clear();
        const snapshot = this.surface.document;
        const visit = (node: HtmlEditorNode, parent?: HtmlEditorElement) => {
            this.nodes.set(node.id, node);
            if (parent) this.parents.set(node.id, parent);
            if (node.type === "element") node.children.forEach(child => visit(child, node));
        };
        snapshot.children.forEach(node => visit(node));
        this.roots = this.treeNodes(snapshot.children);
        this.refreshSelection();
    }

    /** Resolves the current remembered selection into inspector targets. */
    refreshSelection(): void {
        this.inspectionVersion++;
        const selection = this.surface.selection;
        const node = selection ? this.nodes.get(selection.focus.nodeId) : undefined;
        this.coverage = this.surface.getSelectionCoverage(selection);
        // Count content owners, not every enclosing shell: one selected word in
        // a td also intersects tr/tbody/table, but is not a Mixed selection.
        const owners = new Set<string>();
        for (const [id] of this.coverage) {
            const selected = this.nodes.get(id);
            if (selected?.type === "text") {
                const parent = this.parents.get(id);
                if (parent) owners.add(parent.id);
            } else if (selected && (isAtomic(selected) || !selected.children.length)) owners.add(id);
        }
        // Fully covered outer elements own their descendants as a single target,
        // regardless of whether the range originated in the tree or the surface.
        const endpointAncestors = new Set(selection
            ? [...this.elementPath(selection.anchor.nodeId), ...this.elementPath(selection.focus.nodeId)].map(node => node.id) : []);
        const full = [...this.coverage].filter(([id, coverage]) => coverage === "full"
            && !endpointAncestors.has(id) && this.nodes.get(id)?.type === "element").map(([id]) => id);
        for (const id of full) {
            if (this.elementPath(id).slice(0, -1).some(parent => full.includes(parent.id))) continue;
            for (const owner of owners) if (this.elementPath(owner).some(parent => parent.id === id)) owners.delete(owner);
            owners.add(id);
        }
        this.mixed = owners.size > 1;
        let common: HtmlEditorElement[] | undefined;
        if (this.mixed) for (const id of owners) {
            const path = this.elementPath(id);
            if (!common) common = path;
            else {
                let index = 0;
                while (index < common.length && index < path.length && common[index].id === path[index].id) index++;
                common = common.slice(0, index);
            }
        }
        this.commonAncestorId = common?.[common.length - 1]?.id;
        this.targetId = owners.size === 1 ? owners.values().next().value
            : node?.type === "element" ? node.id : node ? this.parents.get(node.id)?.id : undefined;
        this.inspectedIds = owners.size ? [...owners] : this.targetId ? [this.targetId] : [];
        this.updateTreeCoverage();
        this.update();
    }

    /** Applies an explicit structural selection from the shared surface coordinator. */
    refreshSelectedNodes(ids: readonly string[]): void {
        if (!ids.length) return;
        this.inspectionVersion++;
        this.inspectedIds = ids.filter(id => this.nodes.get(id)?.type === "element");
        this.targetId = this.inspectedIds[0];
        this.mixed = this.inspectedIds.length > 1;
        this.update();
    }

    private itemLabel(item: HtmlEditorNode): string {
        const coverage = this.coverage.get(item.id);
        const label = item.type === "text" ? `#text ${this.description(item)}` : `${item.tag} ${this.description(item)}`;
        return `${label}${coverage ? ` — ${this.messages.text(coverage === "full"
            ? "htmlEditorInspector.fullySelected" : "htmlEditorInspector.partiallySelected")}` : ""}`;
    }

    private renderNodeLabel(host: HTMLElement, item: HtmlEditorElement): void {
        const derived = item.children.some(child => child.type === "element");
        host.replaceChildren(e("code", { class: "elg-html-editor-node-tag" }, `<${item.tag}>`),
            document.createTextNode(" "), e("span", { class: `elg-html-editor-node-description${derived ? " elg-html-editor-node-description-derived" : ""}` }, this.description(item)));
    }

    private renderTextLabel(host: HTMLElement, item: HtmlEditorText): void {
        host.replaceChildren(e("code", { class: "elg-html-editor-node-text-tag" }, "#text"),
            document.createTextNode(" "), e("span", { class: "elg-html-editor-node-description" }, this.description(item)));
    }

    private elementPath(id: string | undefined): HtmlEditorElement[] {
        const path: HtmlEditorElement[] = [];
        let node = id ? this.nodes.get(id) : undefined;
        while (node?.type === "element") {
            path.unshift(node);
            node = this.parents.get(node.id);
        }
        return path;
    }

    private inspect(item: HtmlEditorElement): void {
        if (this.selector.disabled || this.disposed.Value || !this.nodes.has(item.id)) return;
        this.popup?.hide();
        this.targetId = item.id;
        this.inspectedIds = [item.id];
        this.mixed = false;
        this.surface.selectNode(item.id);
        this.update();
        this.selector.focus();
    }


    private openCommandMenu(anchor: HTMLButtonElement, item: HtmlEditorElement): void {
        if (this.disposed.Value) return;
        if (this.commandPopup?.isOpen()) { this.commandPopup.hide(); return; }
        const context = this.commands.context(item.id);
        const buttons = this.commands.getCommands(context).map(command => {
            const button = e("button", { type: "button", class: "elg-html-editor-command-menu-item",
                title: this.commands.label(command), disabled: !this.commands.enabled(command, context),
                onclick: () => {
                    if (this.commands.execute(command.id, context)) this.commandPopup?.hide();
                } });
            const state = this.commands.state(command, context);
            if (state) {
                button.dataset.commandState = state;
                button.setAttribute("aria-pressed", state === "on" ? "true" : state === "mixed" ? "mixed" : "false");
            }
            if (command.icon) button.append(e("i", { class: `elg-icon ${command.icon}`, ariaHidden: "true" }));
            button.append(document.createTextNode(this.commands.label(command)));
            return button;
        });
        if (!this.commandPopup) {
            this.commandPopup = new Popover({ anchorElement: anchor, bindAnchorTarget: false,
                placement: "left-start", role: "menu", class: "elg-html-editor-command-menu" });
            this.addCleanup(this.commandPopup);
            this.listen(this.commandPopup.dom, "keydown", event => {
                if ((event as KeyboardEvent).key === "Escape") {
                    event.preventDefault(); this.commandPopup!.hide(); anchor.focus();
                }
            });
        }
        this.commandPopup.setAnchor(anchor);
        this.commandPopup.setContent(buttons);
        // Keep the action menu in the tree popover's DOM subtree. Native
        // popover light-dismiss then treats it as a nested menu and keeps the
        // tree open while the child menu is active.
        this.commandPopup.mount(this.popup!.dom);
        this.commandPopup.show();
        this.commandPopup.dom.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    }

    private paintCoverage(element: HTMLElement, item: HtmlEditorNode): void {
        element.dataset.htmlEditorNodeId = item.id;
        const coverage = this.coverage.get(item.id) ?? "none";
        element.dataset.htmlEditorCoverage = coverage;
        const indicator = element.querySelector<HTMLButtonElement>(".elg-html-editor-node-coverage");
        if (indicator) {
            const hint = coverage === "full" ? this.messages.text("htmlEditorInspector.fullySelected")
                : coverage === "partial" ? this.messages.text("htmlEditorInspector.partiallySelectedHint")
                    : this.messages.text("htmlEditorInspector.notSelectedHint");
            indicator.title = hint;
            indicator.setAttribute("aria-label", hint);
            indicator.setAttribute("aria-disabled", String(coverage === "full"));
        }
        const row = element.closest('[role="treeitem"]');
        row?.setAttribute("aria-label", this.itemLabel(item));
    }

    private updateTreeCoverage(): void {
        // These are presentation attributes on renderer-owned hosts. Do not reload
        // branches or change TreeView's single preview selection to paint a text range.
        this.tree?.dom.querySelectorAll<HTMLElement>("[data-html-editor-node-id]").forEach(element => {
            const item = this.nodes.get(element.dataset.htmlEditorNodeId!);
            if (item) this.paintCoverage(element, item);
        });
    }


    private basicContext() { return this.commands.context(this.targetId); }

    private basicInspectionContext(): HtmlEditorInspectionContext {
        return this.commands.inspectionContext(this.inspectedIds);
    }

    private inspectorValue(binding: HtmlEditorResolvedInspectorField): any {
        const value = binding.value;
        return value?.kind === "value" ? value.value : value?.kind === "mixed" ? null : undefined;
    }

    private optionsLookup(binding: HtmlEditorResolvedInspectorField): FieldLookup<HtmlEditorInspectionRow> | undefined {
        const options = binding.command.options;
        if (!options?.length) return undefined;
        return {
            loadItems: async (query: LookupQuery) => {
                const search = query.search.trim().toLocaleLowerCase();
                const items = options.filter(option => !search || option.text.toLocaleLowerCase().includes(search));
                const skip = query.skip ?? 0, top = query.top ?? items.length;
                return { items: items.slice(skip, skip + top), totalCount: items.length };
            },
            getItemValue: item => item.id,
            getItemText: item => item.text,
            getValueText: value => options.find(option => option.id === value)?.text ?? String(value ?? ""),
            popupWidth: 220,
            popupHeight: 220,
            resizable: false
        };
    }

    private formField(binding: HtmlEditorResolvedInspectorField, row: HtmlEditorInspectionRow,
        surface: "inspector" | "toolbar" = "inspector"): DataViewField<HtmlEditorInspectionRow> {
        const presentation = binding.definition.field ?? {};
        const surfacePresentation = binding.definition.presentations?.[surface];
        const command = binding.command;
        const field: DataViewField<HtmlEditorInspectionRow> = {
            ...presentation,
            name: command.id,
            type: binding.definition.type,
            hideLabel: binding.definition.type === "buttons" ? true : presentation.hideLabel,
            caption: presentation.caption?.startsWith("htmlEditor")
                ? this.messages.text(presentation.caption as never) : presentation.caption ?? this.commands.label(command),
            readonly: presentation.readonly || !binding.enabled,
            showInRow: () => true
        };
        if (binding.definition.type === "data" && binding.definition.presentation
            && binding.definition.presentation !== "lookup" && command.options?.length) {
            field.type = "buttons";
            const value = binding.value?.kind === "value" ? binding.value.value : undefined;
            if (binding.definition.presentation === "buttons") {
                field.hideLabel = true;
                field.buttons = command.options.map(option => ({ id: option.id, text: option.text,
                    icon: option.icon ?? ({ default: "ri-format-clear", start: "ri-align-left", center: "ri-align-center", end: "ri-align-right" } as Record<string, string>)[option.id],
                    appearance: option.icon || command.id === "block.align" ? "iconOnly" : "textOnly",
                    ui: "btn-ghost", pressed: value === option.id, disabled: !binding.enabled || option.disabled,
                    onClick: () => {
                        const toggleOff = command.id === "block.align" && value === option.id;
                        this.commands.executeInspectorField(binding, toggleOff ? undefined : option.id);
                    } }));
            } else {
                const selected = command.options.find(option => option.id === value
                    || binding.value?.kind === "unset" && option.id === "default");
                const isColor = command.options.some(option => option.color !== undefined);
                const showValue = surfacePresentation?.showValue !== false;
                const showArrow = surfacePresentation?.showArrow !== false;
                const appearance = surfacePresentation?.appearance ?? "textAndIcon";
                const tooltip = surfacePresentation?.tooltip === "caption" ? field.caption : surfacePresentation?.tooltip;
                const icon = surfacePresentation?.icon ?? selected?.icon ?? (isColor ? "ri-font-color" : "ri-font-size");
                field.buttons = [{ id: command.id, text: binding.value?.kind === "mixed"
                    ? this.messages.text("htmlEditorInspector.mixed") : selected?.text ?? String(value ?? "—"),
                    icon, appearance,
                    tooltip,
                    render: isColor ? () => v("span", {
                        class: "elg-html-editor-color-choice"
                    }, surfacePresentation?.showValue === false
                        ? v("i", { class: icon, ariaHidden: "true",
                            style: { color: selected?.color || undefined } })
                        : v("span", { class: "elg-menu-color-swatch", ariaHidden: "true",
                            "data-empty": !selected?.color,
                            style: { backgroundColor: selected?.color ?? (typeof value === "string" ? value : "transparent") }
                        }),
                    showValue ? v("span", binding.value?.kind === "mixed" ? this.messages.text("htmlEditorInspector.mixed")
                        : selected?.text ?? String(value ?? "—")) : undefined,
                    showArrow ? v("i", { class: "ri-arrow-down-s-line", ariaHidden: "true" }) : undefined) : undefined,
                    disabled: !binding.enabled, onClick: async ({ owner }) => {
                        const form = owner as DataForm<HtmlEditorInspectionRow>;
                        const anchor = [...form.dom.querySelectorAll<HTMLElement>("[data-field]")]
                            .find(host => host.dataset.field === command.id)?.querySelector<HTMLButtonElement>("button");
                        if (!anchor) return;
                        if (!this.choiceMenu) {
                            this.choiceMenu = new PopupMenu({ density: "compact" });
                            this.choiceMenu.mount(this.dom.ownerDocument.body);
                            this.addCleanup(this.choiceMenu);
                        }
                        await this.choiceMenu.show({ anchor, items: command.options!.map(option => ({ key: option.id,
                            text: option.text, icon: option.icon, color: option.color, disabled: option.disabled,
                            checked: () => selected?.id === option.id,
                            action: () => { this.commands.executeInspectorField(binding, option.id); } })) });
                    } }];
            }
        } else if (binding.definition.type === "data") {
            field.lookup = presentation.lookup ?? this.optionsLookup(binding);
            field.getValue = () => this.inspectorValue(row.fields.get(command.id)!);
        } else {
            const state = this.commands.state(command, binding.context);
            const button: DataViewButton<HtmlEditorInspectionRow> = {
                id: command.id,
                text: this.commands.label(command),
                icon: command.icon,
                appearance: "iconOnly",
                ui: "btn-ghost",
                tooltip: this.commands.label(command),
                pressed: state === "mixed" ? "mixed" : state === "on",
                disabled: !binding.enabled,
                onClick: async () => {
                    this.commands.executeInspectorField(binding);
                }
            };
            field.buttons = [button];
        }
        return field;
    }

    /**
     * Creates the compact horizontal command form used by HtmlEditorToolbar.
     * The toolbar intentionally reuses the inspector field factory so command
     * state, option menus, tooltips and execution never diverge between views.
     */
    createToolbarForm(): DataForm<HtmlEditorInspectionRow> | undefined {
        const context = this.basicInspectionContext();
        const available = this.toolbarFields(context);
        const order = ["block.heading", "block.align", "bold", "italic", "text.size", "text.color", "element.backgroundColor", "clear-formatting"];
        const fields = order.map(id => available.find(field => field.command.id === id)).filter((field): field is HtmlEditorResolvedInspectorField => !!field);
        if (!fields.length) return undefined;
        const row: HtmlEditorInspectionRow = { context, fields: new Map(fields.map(field => [field.command.id, field])) };
        const dataFields = fields.map(field => {
            const result = this.formField(field, row, "toolbar");
            result.hideLabel = true;
            if (result.buttons) result.buttons.forEach(button => { button.ui = ["btn-ghost"]; });
            return result;
        });
        const adapter: DataFormAdapter<HtmlEditorInspectionRow> = {
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
                if (!binding || !this.commands.executeInspectorField(binding, value))
                    throw new Error(this.messages.text("htmlEditorInspector.propertiesHint"));
            }
        };
        return new DataForm({ data: row, fields: dataFields,
            layout: [{ display: "flex", wrap: false, labelPosition: "none", ui: ["gap-0"],
                fields: dataFields.map(field => ({ field: field.name, labelPosition: "none" })) }],
            class: "elg-html-editor-toolbar-form", labelPosition: "none", surface: "none",
            allowEdit: true, locale: this.localeOptions.locale, localization: this.localeOptions.localization, adapter });
    }

    /** Keeps the compact toolbar visible before a selection exists. */
    private toolbarFields(context: HtmlEditorInspectionContext): HtmlEditorResolvedInspectorField[] {
        const resolved = new Map(this.commands.getInspectorFields(context).map(field => [field.command.id, field]));
        const toolbarCommands = this.commands.getCommands(this.commands.context(), true).flatMap(command => {
            const definition = command.inspector;
            if (!definition) return [];
            const existing = resolved.get(command.id);
            if (existing) return [existing];
            const targets = definition.resolveTargets(context);
            const commandContext = { ...context, inspection: { context, targets } };
            if (!(command.isVisible?.(commandContext) ?? true)) return [];
            return [{ command, definition, context: commandContext, enabled: false }];
        });
        return toolbarCommands;
    }

    private renderBasicCommands(): void {
        this.choiceMenu?.hide();
        for (const [id, collapsed] of this.basicForm?.getGroupState() ?? []) this.categoryState.set(id, collapsed);
        this.basicForm?.dispose(); this.basicForm = undefined;
        this.basicPanel.replaceChildren();
        const context = this.basicInspectionContext();
        const fields = this.commands.getInspectorFields(context);
        if (!fields.length) {
            this.basicPanel.append(e("span", { class: "elg-html-editor-inspector-empty" }, this.messages.text("htmlEditorInspector.propertiesHint")));
            return;
        }
        const row: HtmlEditorInspectionRow = { context, fields: new Map(fields.map(field => [field.command.id, field])) };
        const ordered = [...fields.filter(field => field.definition.area === "text"),
            ...fields.filter(field => field.definition.area !== "text")];
        const dataFields = ordered.map(field => this.formField(field, row));
        const adapter: DataFormAdapter<HtmlEditorInspectionRow> = {
            getValue: (_row, field) => this.inspectorValue(row.fields.get(field.name)!),
            getText: async (_row, field, value) => {
                const binding = row.fields.get(field.name);
                if (!binding?.value || binding.value.kind === "unset") return "—";
                if (binding.value.kind === "mixed") return this.messages.text("htmlEditorInspector.mixed");
                if (field.lookup) return field.lookup.getValueText(value, { row, field, value });
                return String(value ?? "");
            },
            setValue: async (_row, field, value) => {
                const binding = row.fields.get(field.name);
                if (!binding || !this.commands.executeInspectorField(binding, value))
                    throw new Error(this.messages.text("htmlEditorInspector.propertiesHint"));
            }
        };
        const category = (field: HtmlEditorResolvedInspectorField) => field.definition.type === "buttons" ? "format"
            : field.definition.group === "block" ? "paragraph" : field.definition.group ?? "appearance";
        const groups = new Map<string, HtmlEditorResolvedInspectorField[]>();
        for (const field of ordered) {
            const key = category(field);
            groups.set(key, [...groups.get(key) ?? [], field]);
        }
        const labels: Record<string, string> = {
            format: this.messages.text("htmlEditorInspector.formatCategory"),
            typography: this.messages.text("htmlEditorInspector.typographyCategory"),
            paragraph: this.messages.text("htmlEditorInspector.paragraphCategory"),
            appearance: this.messages.text("htmlEditorInspector.appearanceCategory")
        };
        const layout: DataFormLayoutGroup[] = [];
        for (const [key, bindings] of groups) {
            const rows: DataFormLayoutRow[] = [];
            const actions: { field: string }[] = [];
            for (const binding of bindings) {
                const field = dataFields.find(field => field.name === binding.command.id)!;
                if (binding.definition.type === "buttons") {
                    actions.push({ field: field.name });
                } else {
                    if (binding.definition.presentation === "menu") {
                        field.buttons?.forEach(button => button.ui = ["neutral", "w-100"]);
                    }
                    rows.push({ fields: [{ field: field.name, width: "100%",
                        labelPosition: binding.command.id === "block.heading" || field.hideLabel ? "none" : "start" }] });
                }
            }
            if (actions.length) rows.push({ fields: actions, labelPosition: "none", ui: ["gap-0"] });
            layout.push({ id: key, title: labels[key] ?? key, collapsible: true, rows });
        }
        this.basicForm = new DataForm({ data: row, fields: dataFields, layout, groupState: this.categoryState,
            class: "elg-html-editor-basic-form", labelPosition: "start", surface: "none",
            allowEdit: true, locale: this.localeOptions.locale, localization: this.localeOptions.localization, adapter });
        this.basicForm.editEnded.subscribe(() => this.queueBasicRefresh());
        this.basicForm.mount(this.basicPanel);
    }

    private queueBasicRefresh(): void {
        if (this.basicRefreshQueued) return;
        this.basicRefreshQueued = true;
        setTimeout(() => {
            this.basicRefreshQueued = false;
            if (!this.disposed.Value) this.update();
        });
    }

    /** Updates labels/availability without cloning the document or moving DOM focus. */
    update(): void {
        this.dom.setAttribute("aria-label", this.messages.text("htmlEditorInspector.label"));
        const target = this.targetId ? this.nodes.get(this.targetId) : undefined;
        if (!this.mixed && target?.type === "element") this.renderNodeLabel(this.selector, target);
        else this.selector.replaceChildren(e("span", { class: "elg-html-editor-node-description" },
            this.messages.text(this.mixed ? "htmlEditorInspector.mixed" : "htmlEditorInspector.chooseElement")));
        this.selector.title = this.selector.textContent || "";
        this.selector.disabled = this.surface.content.getAttribute("aria-disabled") === "true";
        const coverage = !this.mixed && target ? this.coverage.get(target.id) ?? "none" : "none";
        this.selectorRow.dataset.htmlEditorCoverage = coverage;
        this.selectorCoverage.hidden = this.mixed || target?.type !== "element";
        this.selectorCoverage.disabled = this.selector.disabled || !target;
        const hint = this.messages.text(coverage === "full" ? "htmlEditorInspector.fullySelected"
            : coverage === "partial" ? "htmlEditorInspector.partiallySelectedHint" : "htmlEditorInspector.notSelectedHint");
        this.selectorCoverage.title = hint;
        this.selectorCoverage.setAttribute("aria-label", hint);
        if (this.selector.disabled) this.popup?.hide();
        this.tabView.setTabText("basic", this.messages.text("htmlEditorInspector.properties"));
        this.tabView.setTabText("advanced", this.messages.text("htmlEditorInspector.advanced"));
        const basicKey = `${this.inspectedIds.join(",")}|${this.mixed}|${this.surface.modelVersion}|${JSON.stringify(this.surface.selection)}|${this.surface.editable}`;
        if (basicKey !== this.basicRenderKey) {
            if (!this.basicForm?.isEditing) {
                this.basicRenderKey = basicKey;
                this.renderBasicCommands();
            }
        }
        this.panels[0].replaceChildren(this.basicPanel);
        this.panels[1].textContent = this.messages.text("htmlEditorInspector.advancedHint");
    }

    /** Opens a lazy model tree. Choosing a node previews it without changing caret, HTML or history. */
    async openElements(): Promise<void> {
        if (this.disposed.Value || this.selector.disabled) return;
        if (this.popup?.isOpen()) { this.popup.hide(); return; }
        if (!this.popup) {
            this.tree = new TreeView<HtmlEditorNode>({ ...this.localeOptions,
                label: this.messages.text("htmlEditorInspector.elements"),
                getText: item => this.itemLabel(item),
                data: { getKey: item => item.id,
                    hasChildren: item => item.type === "element" && this.treeNodes(item.children).length > 0,
                    getChildren: item => item ? item.type === "element" ? this.treeNodes(item.children) : [] : this.roots },
                renderItem: ({ item, element }) => {
                    if (item.type === "element") this.renderNodeLabel(element, item);
                    else this.renderTextLabel(element, item);
                    const indicator = e("button", { type: "button", class: "elg-html-editor-node-coverage",
                        ariaLabel: this.messages.text("htmlEditorInspector.notSelectedHint"),
                        onclick: event => {
                            event.stopPropagation();
                            if ((this.coverage.get(item.id) ?? "none") !== "full") {
                                // select-node restores a model range synchronously;
                                // preserve explicit element mode for this command.
                                if (item.type === "element") {
                                    this.inspectedIds = [item.id];
                                    this.targetId = item.id;
                                    this.mixed = false;
                                }
                                this.surface.selectNode(item.id, true);
                            }
                        } });
                    element.querySelector(item.type === "element" ? ".elg-html-editor-node-tag" : ".elg-html-editor-node-text-tag")!.after(indicator);
                    if (item.type === "element") {
                        const actions = e("span", { class: "elg-html-editor-node-actions" });
                        const more = e("button", { type: "button", class: "elg-html-editor-node-action",
                            ariaLabel: this.messages.text("htmlEditorInspector.moreActions"),
                            title: this.messages.text("htmlEditorInspector.moreActions"),
                            onclick: event => { event.stopPropagation(); this.openCommandMenu(more, item); } });
                        more.append(e("i", { class: "elg-icon ri-more-2-fill", ariaHidden: "true" }));
                        actions.append(more);
                        element.append(actions);
                    }
                    element.append(e("i", { class: "elg-icon ri-input-cursor-move elg-html-editor-keyboard-focus",
                        ariaHidden: "true", title: this.messages.text("htmlEditorInspector.keyboardFocus") }));
                    this.paintCoverage(element, item);
                    element.title = this.itemLabel(item);
                }
            });
            this.popup = new Popover({ class: "elg-html-editor-elements-popup", anchorElement: this.selector, bindAnchorTarget: false, role: "dialog", closeMode: "manual",
                "aria-label": this.messages.text("htmlEditorInspector.elements"), children: this.tree,
                style: { width: "420px", height: "300px", padding: "4px", overflow: "hidden" } });
            this.addCleanup(this.popup);
            this.listen(this.popup.dom, "toggle", () => {
                const open = this.popup!.isOpen();
                this.selector.setAttribute("aria-expanded", String(open));
                if (!open) {
                    this.commandPopup?.hide();
                    this.popup!.hide(); // release positioning listeners after native light-dismiss
                }
            });
            this.listen(this.popup.dom, "keydown", event => {
                if ((event as KeyboardEvent).key === "Escape") { event.preventDefault(); this.popup!.hide(); this.selector.focus(); }
            });
            this.listen(this.dom.ownerDocument, "pointerdown", event => {
                if (!this.popup?.isOpen()) return;
                const target = event.target as Node;
                if (!this.popup.dom.contains(target) && !this.commandPopup?.dom.contains(target) && !this.selector.contains(target)) {
                    this.commandPopup?.hide();
                    this.popup.hide();
                }
            });
            this.subscribe(this.tree.selectionChanged, item => {
                if (!item) return;
                if (item.type === "element") this.inspect(item);
                else this.surface.selectNode(item.id);
            });
        }
        this.popup.mount(this.dom.ownerDocument.body);
        this.popup.show();
        await this.tree!.refresh();
        if (this.disposed.Value || !this.popup.isOpen()) return;
        this.tree!.select(undefined);
        // Reveal partial endpoint containers; fully covered subtrees may remain
        // collapsed, with their full-coverage color visible on the parent itself.
        for (const node of this.nodes.values()) {
            if (node.type === "element" && this.coverage.get(node.id) === "partial" && this.elements(node.children).length)
                await this.tree!.expand(node);
            if (this.disposed.Value || !this.popup.isOpen()) return;
        }
        const target = this.mixed ? [...this.nodes.values()].find(node => node.type === "element" && this.coverage.has(node.id))
            : this.targetId ? this.nodes.get(this.targetId) : undefined;
        if (target?.type === "element") {
            const path: HtmlEditorElement[] = [];
            for (let parent = this.parents.get(target.id); parent; parent = this.parents.get(parent.id)) path.unshift(parent);
            for (const parent of path) await this.tree!.expand(parent);
            await this.tree!.reveal(target);
        }
        if (!this.disposed.Value && this.popup.isOpen()) this.tree!.dom.querySelector<HTMLElement>('[role="tree"]')?.focus();
    }

    protected override onUnmount(): void { this.basicForm?.dispose(); this.choiceMenu?.hide(); this.popup?.hide(); this.commandPopup?.hide(); }
}
