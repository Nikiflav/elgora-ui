import { afterEach, describe, expect, it, vi } from "vitest";
import { createFieldEditor } from "../../src/components/editors/createFieldEditor";
import { TextEditor, NumberEditor, CheckboxEditor, ToggleEditor, ValueEditor } from "../../src/components/editors/ValueEditor";
import { LookupEditor } from "../../src/components/editors/LookupEditor";
import { DateEditor } from "../../src/components/editors/DateEditor";
import { DateTimeEditor } from "../../src/components/editors/DateTimeEditor";
import { DataViewFieldUtils, type DataViewField } from "../../src/data/DataViewField";

const editors: ValueEditor<any>[] = [];
afterEach(() => { editors.splice(0).forEach(editor => editor.dispose()); document.body.replaceChildren(); });
const row = { id: 1, value: "original" };
function create(field: DataViewField<typeof row>, value: any = "original", onCommit = vi.fn()) {
    const editor = createFieldEditor({ row, field, value, onCommit });
    editors.push(editor); editor.mount(document.body); return editor;
}
function type(editor: ValueEditor<any>, text: string) {
    const input = editor.dom.querySelector("input")!; input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
}
describe("field editor adapter", () => {
    it("keeps the raw precision in the editor independently of numeric displayFormat", async () => {
        const save = vi.fn();
        const editor = create({ name: "value", dataType: "number", displayFormat: "C2€", displayLocale: "bg-BG" }, 1234.56789, save);
        expect(editor.dom.querySelector("input")!.value).toBe("1234.56789");
        type(editor, "1234.567891");
        expect(await editor.commit()).toBe(true);
        expect(save).toHaveBeenCalledWith(1234.567891, editor);
    });
    it.each([
        ["string", "abc", TextEditor], ["number", 12, NumberEditor],
        ["boolean", true, CheckboxEditor], ["date", "2026-10-15", DateEditor],
        ["datetime", "2026-10-15T10:00", DateTimeEditor]
    ] as const)("selects the %s editor", (dataType, value, constructor) => {
        expect(create({ name: "value", dataType }, value)).toBeInstanceOf(constructor);
    });
    it("binds conversion and async validation to the original domain row", async () => {
        const save = vi.fn();
        const resolve = vi.fn((text, ctx) => { expect(ctx.row).toBe(row); return Number(text) * 2; });
        const validate = vi.fn(async (value, ctx) => { expect(ctx.row).toBe(row); return value < 0 ? "Negative" : undefined; });
        const editor = create({ name: "value", dataType: "number", resolveText: resolve, validate }, 1, save);
        type(editor, "-1"); expect(await editor.commit()).toBe(false); expect(save).not.toHaveBeenCalled();
        type(editor, "3"); expect(await editor.commit()).toBe(true); expect(save).toHaveBeenCalledWith(6, editor);
        expect(row.value).toBe("original");
    });
    it("applies required validation to custom editors too", async () => {
        const save = vi.fn();
        const editor = create({ name: "value", required: true, createEditor: ctx =>
            new TextEditor({ value: ctx.value, onCommit: ctx.onCommit }) }, "ok", save);
        type(editor, ""); expect(await editor.commit()).toBe(false); expect(editor.error).toContain("required");
        expect(save).not.toHaveBeenCalled();
    });
    it("supports custom boolean presentation", () => {
        expect(create({ name: "value", createEditor: ctx => new ToggleEditor({ value: ctx.value, onCommit: ctx.onCommit }) }, true))
            .toBeInstanceOf(ToggleEditor);
    });
    it("keeps lookup context, multiple columns and label precedence without creating an editor for display", async () => {
        const lookup = { columns: [{ name: "code" }, { name: "name" }],
            loadItems: vi.fn(async (_query, ctx) => { expect(ctx.row).toBe(row); return { items: [{ id: 3, name: "Third" }], totalCount: 1 }; }),
            getItemValue: (item: any) => item.id, getItemText: (item: any) => item.name,
            getValueText: vi.fn(async (value, ctx) => { expect(ctx.row).toBe(row); return `Item ${value}`; }) };
        const field: DataViewField<typeof row> = { name: "id", lookup };
        expect(await DataViewFieldUtils.getText(field, row)).toBe("Item 1");
        const editor = create(field, 1); expect(editor).toBeInstanceOf(LookupEditor);
        expect(await editor.resolveText("Third")).toBe(3);
        field.getText = async () => "Local label";
        expect(await DataViewFieldUtils.getText(field, row)).toBe("Local label");
    });
    it("lets a custom lookup resolver accept text outside the list", async () => {
        const loadItems = vi.fn(async () => ({ items: [], totalCount: 0 }));
        const editor = create({ name: "value", resolveText: text => text.trim(), lookup: {
            loadItems, getItemValue: item => item, getItemText: item => item, getValueText: value => value
        } });
        expect(await editor.resolveText(" new ")).toBe("new"); expect(loadItems).not.toHaveBeenCalled();
    });
});
