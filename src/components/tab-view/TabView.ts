import { Component, type ComponentOptions, type ComponentChild } from "../../core/Component";
import { ObservableEvent } from "../../core/ElgoraUI";
import { e } from "../../core/e";
import "./TabView.css";

/** One stable tab and its persistent panel content. */
export interface TabViewItem {
    id: string;
    text: string;
    content?: ComponentChild;
    disabled?: boolean;
}
/** Compact horizontal tabs with automatic keyboard activation. */
export interface TabViewOptions extends Omit<ComponentOptions, "children"> {
    items: readonly TabViewItem[];
    selectedId?: string;
    /** Accessible name for the tab list. */
    label?: string;
}
let nextId = 0;

/** Persistent panels with roving tab focus, arrow/Home/End navigation and native accessible relationships. */
export class TabView extends Component {
    readonly selectionChanged = new ObservableEvent<string>();
    private readonly buttons = new Map<string, HTMLButtonElement>();
    private readonly panels = new Map<string, HTMLElement>();
    private activeId?: string;

    constructor(options: TabViewOptions) {
        const { items, selectedId, label, ...rest } = options;
        super({ ...rest, class: `${rest.class ?? ""} elg-tab-view`.trim() });
        this.addCleanup(this.selectionChanged);
        const prefix = `elg-tabs-${++nextId}`;
        const list = e("div", { class: "elg-tab-view-tabs", role: "tablist", ariaLabel: label });
        this.append(list);
        for (const [index, item] of items.entries()) {
            if (this.buttons.has(item.id)) throw new Error(`Duplicate TabView item: ${item.id}`);
            const panel = new Component({ class: "elg-tab-view-panel", role: "tabpanel", tabIndex: 0,
                id: `${prefix}-panel-${index}`, "aria-labelledby": `${prefix}-tab-${index}`, children: item.content });
            const button = e("button", { type: "button", class: "elg-tab-view-tab", role: "tab",
                id: `${prefix}-tab-${index}`, disabled: item.disabled, tabIndex: -1,
                onclick: () => { this.select(item.id); } }, item.text);
            button.setAttribute("aria-controls", panel.dom.id);
            list.append(button); this.append(panel);
            this.buttons.set(item.id, button); this.panels.set(item.id, panel.dom);
        }
        this.listen(list, "keydown", event => {
            const key = event as KeyboardEvent;
            if (key.altKey || key.ctrlKey || key.metaKey || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(key.key)) return;
            const enabled = [...this.buttons.entries()].filter(([, button]) => !button.disabled);
            const index = enabled.findIndex(([, button]) => button === key.target);
            if (index < 0) return;
            key.preventDefault();
            const next = key.key === "Home" ? 0 : key.key === "End" ? enabled.length - 1
                : (index + (key.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length;
            this.select(enabled[next][0]); enabled[next][1].focus();
        });
        const initial = items.find(item => item.id === selectedId && !item.disabled) ?? items.find(item => !item.disabled);
        this.paint(initial?.id);
    }

    get selectedId(): string | undefined { return this.activeId; }
    /** Activates an enabled tab without replacing panel content or moving focus. */
    select(id: string): boolean {
        const button = this.buttons.get(id);
        if (!button || button.disabled || this.disposed.Value) return false;
        if (id !== this.activeId) { this.paint(id); this.selectionChanged.invoke(id); }
        return true;
    }
    /** Updates a translated label without replacing the focused tab button. */
    setTabText(id: string, text: string): void { const button = this.buttons.get(id); if (button) button.textContent = text; }
    /** Persistent panel host, suitable for updating its contents. */
    getPanel(id: string): HTMLElement | undefined { return this.panels.get(id); }
    private paint(id?: string): void {
        this.activeId = id;
        for (const [key, button] of this.buttons) {
            button.setAttribute("aria-selected", String(key === id));
            button.tabIndex = key === id ? 0 : -1;
            this.panels.get(key)!.hidden = key !== id;
        }
    }
}
