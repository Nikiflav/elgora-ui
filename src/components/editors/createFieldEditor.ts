import { DataViewFieldUtils, type FieldEditorContext } from "../../data/DataViewField";
import { CheckboxEditor, NumberEditor, TextEditor, type ValueEditorOptions, type ValueEditor } from "./ValueEditor";
import { LookupEditor } from "./LookupEditor";
import { DateEditor } from "./DateEditor";
import { DateTimeEditor } from "./DateTimeEditor";
import { editorButtons, type EditorButton } from "./EditorButton";
import type { DataViewField } from "../../data/DataViewField";

/** Returns picker trigger metadata without creating an editor. Custom factories opt in via editorButton. */
export function getFieldEditorButton(field: DataViewField<any>): EditorButton | undefined {
    if (field.editorButton) return field.editorButton;
    if (field.createEditor) return undefined;
    if (field.lookup) return editorButtons.lookup;
    const type = DataViewFieldUtils.getDataType(field);
    return type === "date" || type === "datetime" ? editorButtons[type] : undefined;
}

/**
 * Creates a value-only editor for a field; shared by grids, forms and cards.
 * The caller owns its lifetime and supplies the asynchronous persistence callback.
 * @example const editor = createFieldEditor({ row, field, value, onCommit: saveValue });
 */
export function createFieldEditor<TRow>(context: FieldEditorContext<TRow>): ValueEditor<any> {
    const { field, value } = context;
    const options: ValueEditorOptions<any> = {
        value, label: field.caption ?? field.name, readOnly: field.readonly,
        resolveText: field.resolveText ? text => field.resolveText!(text, context) : undefined,
        validate: async candidate => {
            if (field.required && (candidate === null || candidate === undefined || candidate === ""))
                return "A value is required.";
            return field.validate?.(candidate, context);
        },
        onCommit: context.onCommit
    };
    if (field.createEditor) return field.createEditor({ ...context, onCommit: async candidate => {
        const error = await options.validate!(candidate);
        if (error) throw new Error(error);
        await context.onCommit(candidate);
    } });
    const textOptions = { ...options, commitOnBlur: false,
        format: field.formatValue ? (candidate: any) => field.formatValue!(candidate, context) : undefined };
    if (field.lookup) {
        const lookup = field.lookup;
        return new LookupEditor({ ...options, ...lookup,
            columns: lookup.columns ?? [{ name: "text", getValue: async item => lookup.getItemText(item) }],
            loadItems: query => lookup.loadItems(query, context),
            getValueText: candidate => Object.is(candidate, value) && context.text !== undefined
                ? context.text : lookup.getValueText(candidate, context)
        });
    }
    switch (DataViewFieldUtils.getDataType(field)) {
        case "number": return new NumberEditor(textOptions);
        case "boolean": return new CheckboxEditor(options);
        case "date": return new DateEditor(textOptions);
        case "datetime": return new DateTimeEditor(textOptions);
        case "object":
            if (!field.resolveText) throw new Error("Failed to create field editor. Object fields require resolveText or createEditor.");
            return new TextEditor(textOptions);
        // New domain rows may not yet have a value for a string field.
        // Keep that initial value intact while explicitly resolving typed text.
        default: return new TextEditor({ ...textOptions, resolveText: textOptions.resolveText ?? (text => text) });
    }
}
