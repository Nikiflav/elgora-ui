import { Component, type ComponentOptions } from "../../core/Component";
import { ObservableEvent } from "../../core/ElgoraUI";
import { e, setElementProps, v } from "../../core/e";
import type { UiStyle } from "../../core/UiStyle";
import type { LocaleOptions } from "../../localization/Localization";
import { DataRow } from "../../data/dataset/DataRow";
import type { DataViewButton, DataViewButtonContext, DataViewField, FieldEditContext } from "../../data/DataViewField";
import { DataViewFieldUtils } from "../../data/DataViewField";
import { createFieldEditor, getFieldEditorButton } from "../editors/createFieldEditor";
import { TextEditor, type ValueEditor } from "../editors/ValueEditor";
import { PopoverEditor } from "../editors/PopoverEditor";
import "./DataForm.css";

/** Reads and accepts one form row. DataForm supplies a default adapter for plain objects and DataRow. */
export interface DataFormAdapter<TRow> {
    getValue(row: TRow, field: DataViewField<TRow>): any | Promise<any>;
    getText(row: TRow, field: DataViewField<TRow>, value: any, locale?: string): string | Promise<string>;
    setValue(row: TRow, field: DataViewField<TRow>, value: any): Promise<void>;
}

/** Label placement, independent of the row's layout. Hidden labels retain accessible field names. */
export type DataFormLabelPosition = "top" | "start" | "none";
/** Placement of an existing field; field metadata and validation remain shared with DataGrid. */
export interface DataFormLayoutItem {
    /** Name of a field in the form. Each field may appear at most once. */
    field: string;
    /** Typed utility styles applied to the field wrapper, including its label and value. */
    ui?: UiStyle | UiStyle[];
    /** Number of columns in a grid row (1–12). Defaults to 12. */
    span?: number;
    /** Flex item width, in pixels or a CSS length. Defaults to auto. */
    width?: number | string;
    /** Overrides the row/form label placement. */
    labelPosition?: DataFormLabelPosition;
}
/** A row of fields. Flex supports arbitrary item counts; grid distributes twelve columns. */
export interface DataFormLayoutRow {
    /** Typed utility styles applied to the row container. */
    ui?: UiStyle | UiStyle[];
    /** Defaults to flex. */
    display?: "flex" | "grid";
    /** Flex wrapping defaults to true. False keeps one horizontally scrollable row. */
    wrap?: boolean;
    /** Row-specific label placement. */
    labelPosition?: DataFormLabelPosition;
    /** Ordered field placements. Unlisted fields are omitted from the layout. */
    fields: readonly DataFormLayoutItem[];
}
/** Named section containing ordinary layout rows. IDs preserve disclosure state across form recreation. */
export interface DataFormLayoutGroup {
    /** Unique group identity, independent from its translated title. */
    id: string;
    /** Visible and accessible section heading. */
    title: string;
    /** Allows keyboard and pointer disclosure through a native details/summary control. */
    collapsible?: boolean;
    /** Initial state when groupState does not contain this ID. Defaults to false. */
    collapsed?: boolean;
    /** Utility styles on the section container. */
    ui?: UiStyle | UiStyle[];
    /** Ordered rows within the group. */
    rows: readonly DataFormLayoutRow[];
}
/** Forms may interleave standalone rows and named groups. */
export type DataFormLayout = readonly (DataFormLayoutRow | DataFormLayoutGroup)[];
/** Data-bound form options. A form edits one object, not a query of rows. */
export interface DataFormOptions<TRow> extends Omit<ComponentOptions, "tag" | "children">, LocaleOptions {
    /** Object or DataRow displayed and edited by the form. */
    data: TRow;
    /** Field metadata shared with DataGrid. */
    fields: readonly DataViewField<TRow>[];
    /** Positions labels above controls or beside them. Defaults to top. */
    labelPosition?: DataFormLabelPosition;
    /** Optional visual rows. Omission renders all fields vertically; keyboard traversal follows layout order. */
    layout?: DataFormLayout;
    /** Restored collapsed states by group ID. Read once on construction; obtain updates with getGroupState(). */
    groupState?: ReadonlyMap<string, boolean>;
    /** Controls the form container chrome. `none` removes its frame, background and padding for embedded forms. */
    surface?: "default" | "none";
    /** Prevents entering field editors. Defaults to true. */
    allowEdit?: boolean;
    /** Optional notification after a field has been accepted. */
    onCommit?: (row: TRow, field: DataViewField<TRow>, value: any) => void | Promise<void>;
    /** Explicit adapter for proxy/domain objects. */
    adapter?: DataFormAdapter<TRow>;
}

function isDataRow(value: unknown): value is DataRow {
    return !!value && typeof value === "object"
        && typeof (value as DataRow).getValue === "function"
        && typeof (value as DataRow).setValue === "function"
        && "table" in value;
}

function createObjectAdapter<TRow extends Record<string, any>>(draft: TRow): DataFormAdapter<TRow> {
    return {
        getValue: (row, field) => field.getValue ? field.getValue(row) : (draft as Record<string, any>)[field.name],
        getText: async (row, field, value, locale) => field.getText ? field.getText(row)
            : field.formatValue ? field.formatValue(value, { row, field, value, locale })
                : DataViewFieldUtils.formatDisplayValue(field, value, locale),
        setValue: async (_row, field, value) => { (draft as Record<string, any>)[field.name] = value; }
    };
}

const dataRowAdapter: DataFormAdapter<DataRow> = {
    getValue: (row, field) => field.getValue ? field.getValue(row) : row.getValue(field.name),
    getText: async (row, field, value, locale) => field.getText ? field.getText(row)
        : field.formatValue ? field.formatValue(value, { row, field, value, locale })
            : DataViewFieldUtils.formatDisplayValue(field, value, locale),
    setValue: async (row, field, value) => {
        const result = await row.setValue(field.name, value);
        if (!result.success) throw new Error(result.error);
    }
};

type ActiveEdit<TRow> = {
    field: DataViewField<TRow>;
    editor: ValueEditor<any>;
    host: HTMLElement;
    index: number;
    committed: { dispose(): void };
    cancelled: { dispose(): void };
    focusOut: (event: FocusEvent) => void;
    keyDown: (event: KeyboardEvent) => void;
};

/**
 * Compact one-object editor using the same DataViewField and field-editor contract as DataGrid.
 * It supports top/start labels, click/F2/Enter editing, async acceptance and Escape cancellation.
 */
export class DataForm<TRow> extends Component {
    /** Emitted after an accepted or cancelled editor has been disposed. */
    readonly editEnded = new ObservableEvent<void>();
    private readonly options: DataFormOptions<TRow>;
    private readonly draft: TRow;
    private readonly adapter: DataFormAdapter<TRow>;
    private active?: ActiveEdit<TRow>;
    private readonly fieldRows = new Map<string, HTMLElement>();
    private readonly groups = new Map<string, HTMLDetailsElement>();

    constructor(options: DataFormOptions<TRow>) {
        const { data, fields, labelPosition, layout, groupState, surface, allowEdit, onCommit, adapter, ...componentOptions } = options;
        super({ ...componentOptions, class: `${options.class ?? ""} elg-data-form`.trim() });
        this.options = options;
        this.addCleanup(this.editEnded);
        this.draft = isDataRow(options.data) ? options.data : { ...(options.data as any) };
        this.adapter = options.adapter ?? (isDataRow(options.data)
            ? dataRowAdapter as unknown as DataFormAdapter<TRow>
            : createObjectAdapter(this.draft as TRow & Record<string, any>) as unknown as DataFormAdapter<TRow>);
        this.dom.dataset.labelPosition = options.labelPosition ?? "top";
        this.dom.dataset.surface = surface ?? "default";
        this.renderFields();
    }

    /** Current plain-object draft or the source-owned DataRow. */
    get value(): TRow { return this.draft; }
    /** Whether a field editor is currently accepting or cancelling a value. */
    get isEditing(): boolean { return !!this.active; }

    /** Snapshot of current disclosure states, suitable for a replacement form's groupState option. */
    getGroupState(): ReadonlyMap<string, boolean> {
        return new Map([...this.groups].map(([id, element]) => [id, !element.open]));
    }

    private layoutRows(): readonly DataFormLayoutRow[] {
        return this.options.layout?.flatMap(entry => "rows" in entry ? [...entry.rows] : [entry]) ?? [];
    }

    private visibleFields(): DataViewField<TRow>[] {
        const fields = this.options.fields.filter(field => field.showInRow?.(this.draft) ?? true);
        if (!this.options.layout) return fields;
        const names = this.layoutRows().flatMap(row => row.fields.map(item => item.field));
        return names.map(name => fields.find(field => field.name === name)).filter((field): field is DataViewField<TRow> => !!field);
    }

    private async displayText(field: DataViewField<TRow>, value: any): Promise<string> {
        return this.adapter.getText(this.draft, field, value, field.locale ?? this.options.locale);
    }

    private renderFields(): void {
        this.active?.editor.dispose(); this.active = undefined;
        this.fieldRows.clear(); this.dom.replaceChildren();
        this.groups.clear();
        const placements = new Map<string, { host: HTMLElement; item: DataFormLayoutItem; labels: DataFormLabelPosition }>();
        const rowParents = new Map<DataFormLayoutRow, HTMLElement>();
        const groupIds = new Set<string>();
        for (const entry of this.options.layout ?? []) {
            if (!("rows" in entry)) { rowParents.set(entry, this.dom); continue; }
            if (groupIds.has(entry.id)) throw new Error(`Duplicate DataForm group: ${entry.id}`);
            groupIds.add(entry.id);
            const section = entry.collapsible
                ? e("details", { class: "elg-data-form-group", ui: entry.ui, "data-group": entry.id,
                    open: !(this.options.groupState?.get(entry.id) ?? entry.collapsed ?? false) })
                : e("section", { class: "elg-data-form-group", ui: entry.ui, "data-group": entry.id });
            section.append(entry.collapsible
                ? e("summary", { class: "elg-data-form-group-heading" }, entry.title)
                : e("h3", { class: "elg-data-form-group-heading" }, entry.title));
            const body = e("div", { class: "elg-data-form-group-body" });
            section.append(body); this.dom.append(section);
            if (section instanceof HTMLDetailsElement) this.groups.set(entry.id, section);
            for (const row of entry.rows) rowParents.set(row, body);
        }
        for (const [layout, parent] of rowParents) {
            const host = e("div", { class: "elg-data-form-layout-row", ui: layout.ui, "data-display": layout.display ?? "flex",
                "data-wrap": layout.wrap !== false });
            // Insert standalone rows in layout order, even when groups precede/follow them.
            if (parent === this.dom) {
                const entries = this.options.layout!;
                const nextGroup = entries.slice(entries.indexOf(layout) + 1).find(entry => "rows" in entry);
                const nextHost = nextGroup && "rows" in nextGroup
                    ? [...this.dom.children].find(child => (child as HTMLElement).dataset.group === nextGroup.id) : undefined;
                this.dom.insertBefore(host, nextHost ?? null);
            } else parent.append(host);
            for (const item of layout.fields) {
                if (placements.has(item.field)) throw new Error(`Duplicate DataForm layout field: ${item.field}`);
                if (!this.options.fields.some(field => field.name === item.field)) throw new Error(`Unknown DataForm layout field: ${item.field}`);
                if (item.span !== undefined && (!Number.isInteger(item.span) || item.span < 1 || item.span > 12))
                    throw new Error("DataForm grid span must be an integer between 1 and 12.");
                placements.set(item.field, { host, item, labels: item.labelPosition ?? layout.labelPosition ?? this.options.labelPosition ?? "top" });
            }
        }
        this.visibleFields().forEach((field, index) => {
            const buttonField = field.type === "buttons";
            const placement = placements.get(field.name);
            const row = e("div", { class: "elg-data-form-field", ui: placement?.item.ui, "data-field": field.name });
            const labels = placement?.labels ?? this.options.labelPosition ?? "top";
            row.dataset.labelPosition = labels;
            if (placement) {
                row.style.gridColumn = `span ${placement.item.span ?? 12}`;
                row.style.flex = "0 0 auto";
                row.style.width = typeof placement.item.width === "number" ? `${placement.item.width}px` : placement.item.width ?? "auto";
            }
            const label = field.hideLabel || labels === "none" ? undefined : e("label", { class: "elg-data-form-label" }, field.caption ?? field.name,
                field.required ? e("span", { class: "elg-data-form-required", ariaHidden: "true" }, "*") : undefined);
            const value = e("div", { class: buttonField
                ? "elg-data-form-buttons-host elg-data-form-buttons"
                : "elg-data-form-value",
                "data-field": buttonField ? field.name : undefined,
                tabIndex: buttonField ? -1 : (this.options.allowEdit === false || field.readonly ? -1 : 0),
                role: buttonField ? undefined : "button", ariaLabel: field.caption ?? field.name,
                onclick: () => {
                    if (buttonField) return;
                    // The display host keeps its handler after the editor is
                    // mounted. Do not restart the same edit when a picker
                    // trigger or input click bubbles from the active editor.
                    if (this.active?.host === value) return;
                    void this.beginEdit(field, index);
                },
                onkeydown: (event: KeyboardEvent) => {
                    if (buttonField) return;
                    // The host handler remains mounted while the editor lives
                    // inside the cell. Let the active editor receive all
                    // subsequent text instead of treating every character as
                    // a new edit request.
                    if (this.active?.host === value) return;
                    if (event.key === "Enter" || event.key === "F2") { event.preventDefault(); void this.beginEdit(field, index); }
                    else if (!event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
                        // Match DataGrid: typing while a value cell is focused
                        // starts an edit with the typed character as the draft.
                        event.preventDefault(); event.stopPropagation();
                        void this.beginEdit(field, index, event.key);
                    }
                } });
            const description = field.description ? e("div", { class: "elg-data-form-description" }, field.description) : undefined;
            if (label) row.append(label);
            row.append(value); if (description) row.append(description);
            (placement?.host ?? this.dom).append(row); this.fieldRows.set(field.name, value);
            void this.updateDisplay(field, value);
        });
    }

    private async updateDisplay(field: DataViewField<TRow>, host: HTMLElement): Promise<void> {
        if (field.type === "buttons") {
            setElementProps(host, { vnodes: this.createButtonField(field) }, true);
            return;
        }
        const value = await this.adapter.getValue(this.draft, field);
        host.replaceChildren(document.createTextNode(await this.displayText(field, value)));
        const visibility = field.editorButtonVisibility ?? "always";
        const button = visibility === "never" ? undefined : getFieldEditorButton(field, this.options);
        if (!button) return;
        host.append(e("button", {
            type: "button", tabIndex: -1,
            class: `elg-data-form-editor-button elg-data-form-editor-button-${visibility}`,
            ariaLabel: button.label, title: button.label, ariaHasPopup: "dialog",
            onpointerdown: (event: PointerEvent) => { event.preventDefault(); event.stopPropagation(); },
            onmousedown: (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); },
            onclick: async (event: MouseEvent) => {
                event.preventDefault(); event.stopPropagation();
                if (!await this.beginEdit(field, this.visibleFields().indexOf(field))) return;
                const editor = this.active?.editor;
                if (editor instanceof PopoverEditor) {
                    // Finish the previous field's focus transition before opening
                    // the new picker; otherwise its outside-focus cleanup can close
                    // this popup immediately when switching fields.
                    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
                    if (this.active?.editor === editor) await editor.open();
                }
            }
        }, e("i", { class: button.icon, ariaHidden: "true" })));
    }

    private createButtonContext(field: DataViewField<TRow>, button: DataViewButton<TRow>): DataViewButtonContext<TRow> {
        return { owner: this, row: this.draft, field, button };
    }

    private createButtonField(field: DataViewField<TRow>): ReturnType<typeof v>[] {
        const buttons = (field.buttons ?? []).map(button => {
            const context = this.createButtonContext(field, button);
            const visible = typeof button.visible === "function" ? button.visible(context) : button.visible !== false;
            if (!visible) return null;
            const disabled = typeof button.disabled === "function" ? button.disabled(context) : button.disabled === true;
            const pressed = typeof button.pressed === "function" ? button.pressed(context) : button.pressed;
            const appearance = DataViewFieldUtils.getButtonAppearance(button);
            const label = DataViewFieldUtils.getButtonLabel(button);
            const showIcon = !!button.icon && appearance !== "textOnly";
            const showText = appearance !== "iconOnly" || !button.icon;
            const icon = showIcon ? v("i", { class: button.icon, ariaHidden: "true" }) : null;
            const text = showText ? DataViewFieldUtils.getButtonText(button) : null;
            const buttonUi: UiStyle[] = button.ui === undefined
                ? ["neutral"]
                : Array.isArray(button.ui) ? [...button.ui] : [button.ui];
            const content = button.render?.(context)
                ?? v("span", { ui: ["d-inline-flex", "items-center", "gap-1"] },
                    appearance === "textAndIcon" ? text : icon,
                    appearance === "textAndIcon" ? icon : text);
            return v("button", {
                key: button.id, type: "button", class: "elg-data-form-action-button",
                ui: ["elg", "btn", ...buttonUi, "p-0"], disabled,
                ariaLabel: label, title: appearance === "iconOnly" ? label : button.tooltip,
                ariaPressed: pressed === undefined ? undefined : String(pressed),
                onmousedown: (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); },
                onpointerdown: (event: PointerEvent) => { event.preventDefault(); event.stopPropagation(); },
                onclick: async (event: MouseEvent, element: HTMLButtonElement) => {
                    event.preventDefault(); event.stopPropagation();
                    if (element.disabled || !button.onClick) return;
                    element.disabled = true;
                    try { await button.onClick(context); }
                    catch (error) { console.error("DataForm action failed.", error); }
                    finally {
                        if (!this.disposed.Value)
                            element.disabled = typeof button.disabled === "function" ? button.disabled(context) : button.disabled === true;
                    }
                }
            }, content);
        }).filter(Boolean) as ReturnType<typeof v>[];
        return buttons;
    }

    private async beginEdit(field: DataViewField<TRow>, index: number, initialText?: string): Promise<boolean> {
        if (this.options.allowEdit === false || field.readonly || field.type === "buttons" || this.disposed.Value) return false;
        if (this.active && !(await this.finishEdit())) return false;
        const host = this.fieldRows.get(field.name); if (!host) return false;
        const value = await this.adapter.getValue(this.draft, field);
        const text = await this.displayText(field, value);
        const editor = createFieldEditor({
            row: this.draft, field, value, text, locale: field.locale ?? this.options.locale,
            localization: this.options.localization,
            onCommit: async candidate => {
                await this.adapter.setValue(this.draft, field, candidate);
                await this.options.onCommit?.(this.draft, field, candidate);
            }
        } as FieldEditContext<TRow> & { onCommit: (value: any) => Promise<void> });
        host.replaceChildren(editor.dom); host.classList.add("elg-data-form-value-editing");
        const active: ActiveEdit<TRow> = {
            field, editor, host, index,
            committed: editor.committed.subscribe(() => {
                if (this.active === active) this.closeEditor(active);
            }),
            cancelled: editor.cancelled.subscribe(() => {
                if (this.active === active) this.closeEditor(active);
            }),
            keyDown: event => {
                if (editor instanceof PopoverEditor && editor.isOpen) {
                    // The picker owns its keyboard commands. Keep printable
                    // input inside the lookup/date control from reaching an
                    // outer form/grid shortcut, while still allowing the
                    // editor's own target listener to process the key.
                    if (!event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1)
                        event.stopPropagation();
                    return;
                }
                if (event.isComposing) return;
                if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "Escape") return;
                event.preventDefault(); event.stopImmediatePropagation();
                if (event.key === "Escape") {
                    if (editor.cancel()) this.focusField(field);
                    return;
                }
                const direction = event.key === "Tab" && event.shiftKey ? -1 : 1;
                void this.finishEdit().then(success => {
                    if (success) this.focusField(field, direction);
                });
            },
            focusOut: () => {
                // Let a picker keep the form active while its popup owns focus.
                requestAnimationFrame(() => {
                    if (this.active !== active || editor.busy ||
                        (editor instanceof PopoverEditor && editor.isOpen) ||
                        host.contains(host.ownerDocument.activeElement)) return;
                    void this.finishEdit();
                });
            }
        };
        host.addEventListener("focusout", active.focusOut);
        host.addEventListener("keydown", active.keyDown, true);
        this.active = active;
        editor.focus();
        if (initialText !== undefined && editor instanceof TextEditor) {
            const input = editor.dom.querySelector<HTMLInputElement>("input, textarea");
            if (input) {
                input.value = initialText;
                input.dispatchEvent(new Event("input", { bubbles: true }));
            }
        }
        return true;
    }

    /** Accepts the active field; failed async validation keeps its editor visible. */
    async finishEdit(): Promise<boolean> {
        const active = this.active; if (!active) return true;
        const success = await active.editor.commit();
        if (!success) { active.editor.focus(); return false; }
        this.closeEditor(active);
        return true;
    }

    /** Cancels the active field and restores its displayed value. */
    cancelEdit(): boolean {
        if (!this.active) return false;
        const active = this.active;
        if (!active.editor.cancel()) return false;
        this.closeEditor(active); return true;
    }

    /** Focuses a neighboring editable field after keyboard confirmation. */
    private focusField(field: DataViewField<TRow>, direction = 0): void {
        const fields = this.visibleFields().filter(item => this.options.allowEdit !== false && !item.readonly && item.type !== "buttons"
            && !this.fieldRows.get(item.name)?.closest("details:not([open])"));
        const current = fields.indexOf(field);
        const target = direction === 0 ? current : current + direction;
        const next = fields[target] ?? field;
        if (direction !== 0 && next !== field) {
            void this.beginEdit(next, this.visibleFields().indexOf(next));
            return;
        }
        this.fieldRows.get(next.name)?.focus();
    }

    private closeEditor(active: ActiveEdit<TRow>): void {
        if (this.active !== active) return;
        active.committed.dispose(); active.cancelled.dispose();
        active.host.removeEventListener("focusout", active.focusOut);
        active.host.removeEventListener("keydown", active.keyDown, true);
        active.editor.dispose(); active.host.classList.remove("elg-data-form-value-editing");
        this.active = undefined;
        void this.updateDisplay(active.field, active.host);
        active.host.focus();
        this.editEnded.invoke();
    }

    protected override onUnmount(): void {
        if (this.active) {
            const active = this.active;
            active.committed.dispose(); active.cancelled.dispose();
            active.host.removeEventListener("focusout", active.focusOut);
            active.host.removeEventListener("keydown", active.keyDown, true);
            active.editor.dispose();
        }
        this.active = undefined;
    }
}
