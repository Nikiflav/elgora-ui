import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import type { LocalizedMessages } from "../../../localization/Messages";
import type { LocaleOptions } from "../../../localization/Localization";
import { Popover } from "../../popup/popover";
import { TreeView } from "../../tree-view/TreeView";
import { LookupEditor } from "../LookupEditor";
import type { HtmlEditorSurface } from "./HtmlEditorSurface";
import type { HtmlEditorElement, HtmlEditorNode, HtmlEditorText } from "./HtmlEditorModel";
import type { HtmlEditorNodeCoverage } from "./HtmlEditorRange";
import { isAtomic } from "./HtmlEditorStructure";
import type { HtmlEditorCommandRegistry, HtmlEditorUiCommand } from "./HtmlEditorCommandRegistry";

let nextInspector = 0;

/** Inspector scaffold owned by HtmlEditor. Targets are previews, not structural editor selections. */
export class HtmlEditorInspector extends Component {
    private readonly breadcrumb: HTMLElement;
    private readonly selector: HTMLButtonElement;
    private readonly tabs: HTMLButtonElement[];
    private readonly panels: HTMLElement[];
    private readonly nodes = new Map<string, HtmlEditorNode>();
    private readonly parents = new Map<string, HtmlEditorElement>();
    private roots: HtmlEditorNode[] = [];
    private targetId?: string;
    private mixed = false;
    private commonAncestorId?: string;
    private breadcrumbKey = "";
    private ancestorPopup?: Popover;
    private ancestorAnchor?: HTMLButtonElement;
    private coverage: ReadonlyMap<string, HtmlEditorNodeCoverage> = new Map();
    private tree?: TreeView<HtmlEditorNode>;
    private popup?: Popover;
    private commandPopup?: Popover;
    private readonly basicPanel: HTMLElement;
    private basicLookup?: LookupEditor<string, { id: string; text: string }>;
    private basicLookupHost?: HTMLElement;
    private basicRenderKey = "";

    /** Connects one surface to the element navigator and placeholder property tabs. */
    constructor(private readonly surface: HtmlEditorSurface, private readonly messages: LocalizedMessages,
        private readonly commands: HtmlEditorCommandRegistry,
        private readonly localeOptions: LocaleOptions = {}) {
        super({ class: "elg-html-editor-inspector", role: "complementary" });
        const id = `elg-html-inspector-${++nextInspector}`;
        this.breadcrumb = e("nav", { class: "elg-html-editor-breadcrumb", hidden: true });
        this.selector = e("button", { type: "button", class: "elg-html-editor-node-selector",
            ui: ["elg", "btn", "neutral", "btn-ghost"], onclick: () => { void this.openElements(); } });
        this.selector.setAttribute("aria-haspopup", "dialog");
        this.selector.setAttribute("aria-expanded", "false");
        const tablist = e("div", { class: "elg-html-editor-inspector-tabs", role: "tablist" });
        this.basicPanel = e("div", { class: "elg-html-editor-basic-commands" });
        this.panels = [0, 1].map(index => e("div", { id: `${id}-panel-${index}`, role: "tabpanel", tabIndex: 0 }));
        this.tabs = [0, 1].map(index => {
            const button = e("button", { id: `${id}-tab-${index}`, type: "button", role: "tab",
                ui: ["elg", "btn", "btn-ghost"], onclick: () => this.selectTab(index) });
            button.setAttribute("aria-controls", this.panels[index].id);
            this.panels[index].setAttribute("aria-labelledby", button.id);
            tablist.append(button);
            return button;
        });
        this.listen(tablist, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.altKey || key.ctrlKey || key.metaKey || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(key.key)) return;
            const index = this.tabs.indexOf(key.target as HTMLButtonElement);
            if (index < 0) return;
            key.preventDefault();
            const next = key.key === "Home" ? 0 : key.key === "End" ? 1 : 1 - index;
            this.selectTab(next); this.tabs[next].focus();
        });
        this.append([this.breadcrumb, this.selector, tablist, ...this.panels]);
        this.subscribe(surface.documentChanged, () => { this.basicRenderKey = ""; this.refreshDocument(); });
        this.subscribe(surface.selectionChanged, () => this.followSelection());
        this.subscribe(surface.interactionChanged, () => this.update());
        this.selectTab(0);
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

    private refreshDocument(): void {
        this.popup?.hide();
        this.ancestorPopup?.hide();
        this.nodes.clear(); this.parents.clear();
        const snapshot = this.surface.document;
        const visit = (node: HtmlEditorNode, parent?: HtmlEditorElement) => {
            this.nodes.set(node.id, node);
            if (parent) this.parents.set(node.id, parent);
            if (node.type === "element") node.children.forEach(child => visit(child, node));
        };
        snapshot.children.forEach(node => visit(node));
        this.roots = this.treeNodes(snapshot.children);
        this.followSelection();
    }

    private followSelection(): void {
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
        this.updateTreeCoverage();
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
        this.popup?.hide(); this.ancestorPopup?.hide();
        this.targetId = item.id;
        this.mixed = false;
        this.surface.setSelectedNodes([item.id]);
        this.update();
        this.selector.focus();
    }

    private renderBreadcrumb(): void {
        // A Mixed selector has no current tag, so include its common ancestor.
        // The ordinary selector already shows the target: list only its parents.
        const path = this.mixed ? this.elementPath(this.commonAncestorId) : this.elementPath(this.targetId).slice(0, -1);
        const label = this.messages.text("htmlEditorInspector.ancestors");
        const more = this.messages.text("htmlEditorInspector.moreAncestors");
        this.breadcrumb.setAttribute("aria-label", label);
        const key = JSON.stringify([this.selector.disabled, label, more,
            this.messages.text("htmlEditorInspector.inspectAncestor", { tag: "" }),
            path.map(item => [item.id, item.tag, item.attributes.id, item.classes])]);
        // Permission/selection events often preserve the path. Keep its buttons
        // (and any focused overflow anchor) rather than rebuilding on every update.
        if (key === this.breadcrumbKey) return;
        this.breadcrumbKey = key;
        this.ancestorPopup?.hide();
        this.breadcrumb.replaceChildren();
        this.breadcrumb.hidden = !path.length;
        const separator = () => e("span", { ariaHidden: "true", class: "elg-html-editor-breadcrumb-separator" }, "›");
        if (path.length > 3) {
            const earlier = path.slice(0, -3);
            const button = e("button", { type: "button", ui: ["elg", "btn", "btn-ghost"],
                disabled: this.selector.disabled, ariaLabel: more, title: more,
                onclick: () => this.openAncestors(button, earlier) }, "…");
            button.setAttribute("aria-haspopup", "dialog");
            button.setAttribute("aria-expanded", "false");
            this.breadcrumb.append(button, separator());
        }
        path.slice(-3).forEach((item, index) => {
            if (index) this.breadcrumb.append(separator());
            const title = `<${item.tag}>${item.attributes.id ? ` #${item.attributes.id}` : ""}${item.classes.map(name => ` .${name}`).join("")}`;
            this.breadcrumb.append(e("button", { type: "button", ui: ["elg", "btn", "btn-ghost"],
                disabled: this.selector.disabled, title,
                ariaLabel: this.messages.text("htmlEditorInspector.inspectAncestor", { tag: item.tag }),
                onclick: () => this.inspect(item) }, item.tag));
        });
    }

    private openAncestors(anchor: HTMLButtonElement, items: HtmlEditorElement[]): void {
        if (anchor.disabled || this.disposed.Value) return;
        if (this.ancestorPopup?.isOpen() && this.ancestorAnchor === anchor) { this.ancestorPopup.hide(); return; }
        this.popup?.hide();
        this.ancestorAnchor = anchor;
        if (!this.ancestorPopup) {
            this.ancestorPopup = new Popover({ anchorElement: anchor, bindAnchorTarget: false, role: "dialog",
                class: "elg-html-editor-ancestor-popup" });
            this.addCleanup(this.ancestorPopup);
            this.listen(this.ancestorPopup.dom, "toggle", () => {
                const open = this.ancestorPopup!.isOpen();
                this.ancestorAnchor?.setAttribute("aria-expanded", String(open));
                if (!open) this.ancestorPopup!.hide();
            });
            this.listen(this.ancestorPopup.dom, "keydown", event => {
                if ((event as KeyboardEvent).key === "Escape") {
                    event.preventDefault(); this.ancestorPopup!.hide();
                    (this.ancestorAnchor?.isConnected ? this.ancestorAnchor : this.selector).focus();
                }
            });
        }
        this.ancestorPopup.setAnchor(anchor);
        this.ancestorPopup.dom.setAttribute("aria-label", this.messages.text("htmlEditorInspector.moreAncestors"));
        this.ancestorPopup.setContent(items.map(item => {
            const button = e("button", { type: "button", ui: ["elg", "btn", "btn-ghost"],
                onclick: () => this.inspect(item) });
            this.renderNodeLabel(button, item);
            return button;
        }));
        this.ancestorPopup.mount(this.dom.ownerDocument.body);
        this.ancestorPopup.show();
        this.ancestorPopup.dom.querySelector<HTMLButtonElement>("button")?.focus();
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

    private selectTab(index: number): void {
        this.tabs.forEach((button, current) => {
            button.setAttribute("aria-selected", String(current === index));
            button.tabIndex = current === index ? 0 : -1;
            this.panels[current].hidden = current !== index;
        });
    }

    private basicContext() { return this.commands.context(this.targetId); }

    private renderBasicCommands(): void {
        this.basicPanel.replaceChildren();
        const context = this.basicContext();
        const commands = this.commands.getCommands(context).filter(command => command.id !== "select-node" && command.id !== "undo" && command.id !== "redo");
        if (!commands.length) {
            this.basicPanel.append(e("span", { class: "elg-html-editor-inspector-empty" }, this.messages.text("htmlEditorInspector.propertiesHint")));
            return;
        }
        const list = e("div", { class: "elg-html-editor-basic-command-list" });
        commands.forEach(command => {
            const row = e("div", { class: "elg-html-editor-basic-command-row" });
            const button = e("button", { type: "button", class: "elg-html-editor-basic-command-button",
                disabled: !this.commands.enabled(command, context), title: this.commands.label(command),
                onclick: () => this.activateBasicCommand(command) });
            if (command.icon) button.append(e("i", { class: `elg-icon ${command.icon}`, ariaHidden: "true" }));
            button.append(document.createTextNode(this.commands.label(command)));
            const state = this.commands.state(command, context);
            if (state) button.dataset.commandState = state;
            row.append(button);
            if (command.options?.length) {
                const value = command.getValue?.(context);
                const current = value?.mixed ? "" : value?.value ?? "";
                const summary = command.options.find(option => option.id === current)?.text
                    ?? (value?.mixed ? this.messages.text("htmlEditorInspector.mixed") : "—");
                const optionButton = e("button", { type: "button", class: "elg-html-editor-basic-command-value",
                    disabled: !this.commands.enabled(command, context), title: summary,
                    onclick: () => this.activateBasicCommand(command) }, summary);
                row.append(optionButton);
            }
            list.append(row);
        });
        this.basicPanel.append(list);
        this.renderBasicLookup();
    }

    private activateBasicCommand(command: HtmlEditorUiCommand): void {
        if (!command.options?.length) { this.commands.execute(command.id, this.basicContext()); return; }
        this.activeBasicCommand = command;
        this.renderBasicLookup();
        this.basicLookup?.focus();
    }

    private activeBasicCommand?: HtmlEditorUiCommand;

    private renderBasicLookup(): void {
        this.basicLookupHost?.remove(); this.basicLookupHost = undefined;
        this.basicLookup?.dispose(); this.basicLookup = undefined;
        const command = this.activeBasicCommand;
        if (!command?.options?.length) return;
        const context = this.basicContext();
        const current = command.getValue?.(context)?.value ?? command.options[0].id;
        const items = command.options.map(option => ({ id: option.id, text: option.text }));
        this.basicLookupHost = e("div", { class: "elg-html-editor-basic-lookup" });
        this.basicLookup = new LookupEditor<string, { id: string; text: string }>({
            value: current, label: this.commands.label(command), popupWidth: 220, popupHeight: 220, resizable: false,
            locale: this.localeOptions.locale, localization: this.localeOptions.localization,
            columns: [{ name: "text", caption: "Text" }],
            loadItems: async () => ({ items, totalCount: items.length }),
            getItemValue: item => item.id, getItemText: item => item.text, getValueText: value => items.find(item => item.id === value)?.text ?? value,
            onCommit: async value => {
                const succeeded = this.commands.execute(command.id, context, value);
                this.activeBasicCommand = undefined;
                this.basicRenderKey = "";
                if (succeeded) this.update();
            }
        });
        this.basicLookup.mount(this.basicLookupHost);
        this.basicPanel.append(this.basicLookupHost);
    }

    /** Updates labels/availability without cloning the document or moving DOM focus. */
    update(): void {
        this.dom.setAttribute("aria-label", this.messages.text("htmlEditorInspector.label"));
        const target = this.targetId ? this.nodes.get(this.targetId) : undefined;
        if (!this.mixed && target?.type === "element") this.renderNodeLabel(this.selector, target);
        else this.selector.replaceChildren(e("span", { class: "elg-html-editor-node-description" },
            this.messages.text(this.mixed ? "htmlEditorInspector.mixed" : "htmlEditorInspector.chooseElement")));
        this.selector.title = this.selector.textContent;
        this.selector.disabled = this.surface.content.getAttribute("aria-disabled") === "true";
        this.renderBreadcrumb();
        if (this.selector.disabled) this.popup?.hide();
        this.tabs[0].textContent = this.messages.text("htmlEditorInspector.properties");
        this.tabs[1].textContent = this.messages.text("htmlEditorInspector.advanced");
        const basicKey = `${this.targetId ?? ""}|${this.mixed}|${this.surface.content.getAttribute("aria-disabled") ?? "false"}`;
        if (basicKey !== this.basicRenderKey) {
            this.basicRenderKey = basicKey;
            this.renderBasicCommands();
        }
        this.panels[0].replaceChildren(this.basicPanel);
        this.panels[1].textContent = this.messages.text("htmlEditorInspector.advancedHint");
    }

    /** Opens a lazy model tree. Choosing a node previews it without changing caret, HTML or history. */
    async openElements(): Promise<void> {
        if (this.disposed.Value || this.selector.disabled) return;
        this.ancestorPopup?.hide();
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
                            if ((this.coverage.get(item.id) ?? "none") !== "full")
                                this.commands.execute("select-node", this.commands.context(item.id));
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
                const target = item.type === "element" ? item : this.parents.get(item.id);
                if (target) this.inspect(target);
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

    protected override onUnmount(): void { this.popup?.hide(); this.commandPopup?.hide(); this.ancestorPopup?.hide(); }
}
