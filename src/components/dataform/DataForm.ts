import { Component, type ComponentOptions } from "../../core/Component";
import { e } from "../../core/e";
import type { LocaleOptions } from "../../localization/Localization";
import { DataRow } from "../../data/dataset/DataRow";
import type { DataViewField, FieldEditContext } from "../../data/DataViewField";
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

/** Data-bound form options. A form edits one object, not a query of rows. */
export interface DataFormOptions<TRow> extends Omit<ComponentOptions, "tag" | "children">, LocaleOptions {
    /** Object or DataRow displayed and edited by the form. */
    data: TRow;
    /** Field metadata shared with DataGrid. */
    fields: readonly DataViewField<TRow>[];
    /** Positions labels above controls or beside them. Defaults to top. */
    labelPosition?: "top" | "start";
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
    private readonly options: DataFormOptions<TRow>;
    private readonly draft: TRow;
    private readonly adapter: DataFormAdapter<TRow>;
    private active?: ActiveEdit<TRow>;
    private readonly fieldRows = new Map<string, HTMLElement>();

    constructor(options: DataFormOptions<TRow>) {
        const { data, fields, labelPosition, allowEdit, onCommit, adapter, ...componentOptions } = options;
        super({ ...componentOptions, class: `${options.class ?? ""} elg-data-form`.trim() });
        this.options = options;
        this.draft = isDataRow(options.data) ? options.data : { ...(options.data as any) };
        this.adapter = options.adapter ?? (isDataRow(options.data)
            ? dataRowAdapter as unknown as DataFormAdapter<TRow>
            : createObjectAdapter(this.draft as TRow & Record<string, any>));
        this.dom.dataset.labelPosition = options.labelPosition ?? "top";
        this.renderFields();
    }

    /** Current plain-object draft or the source-owned DataRow. */
    get value(): TRow { return this.draft; }

    private visibleFields(): DataViewField<TRow>[] {
        return this.options.fields.filter(field => field.showInRow?.(this.draft) ?? true);
    }

    private async displayText(field: DataViewField<TRow>, value: any): Promise<string> {
        return this.adapter.getText(this.draft, field, value, field.locale ?? this.options.locale);
    }

    private renderFields(): void {
        this.active?.editor.dispose(); this.active = undefined;
        this.fieldRows.clear(); this.dom.replaceChildren();
        this.visibleFields().forEach((field, index) => {
            const row = e("div", { class: "elg-data-form-field", "data-field": field.name });
            const label = e("label", { class: "elg-data-form-label" }, field.caption ?? field.name,
                field.required ? e("span", { class: "elg-data-form-required", ariaHidden: "true" }, "*") : undefined);
            const value = e("div", { class: "elg-data-form-value", tabIndex: this.options.allowEdit === false || field.readonly ? -1 : 0,
                role: "button", ariaLabel: field.caption ?? field.name,
                onclick: () => {
                    // The display host keeps its handler after the editor is
                    // mounted. Do not restart the same edit when a picker
                    // trigger or input click bubbles from the active editor.
                    if (this.active?.host === value) return;
                    void this.beginEdit(field, index);
                },
                onkeydown: (event: KeyboardEvent) => {
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
            row.append(label, value); if (description) row.append(description);
            this.dom.append(row); this.fieldRows.set(field.name, value);
            void this.updateDisplay(field, value);
        });
    }

    private async updateDisplay(field: DataViewField<TRow>, host: HTMLElement): Promise<void> {
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

    private async beginEdit(field: DataViewField<TRow>, index: number, initialText?: string): Promise<boolean> {
        if (this.options.allowEdit === false || field.readonly || this.disposed.Value) return false;
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
        const fields = this.visibleFields().filter(item => this.options.allowEdit !== false && !item.readonly);
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
