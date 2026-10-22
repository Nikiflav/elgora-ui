import { getFieldDataType, type DataField, type DataType } from "./DataField";
import type { GroupInterval } from "./grouping";
import { Utils } from "../core/Utils";
import { NumberFormatter } from "../formatting/NumberFormatter";
import { DateFormatter } from "../formatting/DateFormatter";
import type { ValueEditor } from "../components/editors/ValueEditor";
import type { EditorButton } from "../components/editors/EditorButton";
import type { LookupEditorOptions, LookupQuery, LookupResult } from "../components/editors/LookupEditor";

/** Original source row and field supplied to value conversion and validation. */
export interface FieldEditContext<TRow> {
    /** Original domain row supplied by the hosting component. */
    row: TRow;
    /** Field whose value is being converted, displayed or validated. */
    field: DataViewField<TRow>;
    /** Current field value at the time the context was created. */
    value: any;
}

/** Context for custom editor creation. Pass onCommit to the editor to retain source-controlled saving. */
export interface FieldEditorContext<TRow> extends FieldEditContext<TRow> {
    /** Preloaded cell label, avoiding a second lookup request at the start of editing. */
    text?: string;
    /** Asynchronously submits a candidate value through the host's validation and saving pipeline. */
    onCommit(value: any): Promise<void>;
}

/** Shared lookup data and presentation. Items need not have a prescribed shape. */
export interface FieldLookup<TRow, TItem = any> extends Pick<LookupEditorOptions<any, TItem>,
    "getItemValue" | "getItemText" | "pageSize" | "searchDelay" | "popupWidth" | "popupHeight" | "resizable"> {
    /** Optional result columns; omit for a single label column. */
    columns?: import("../components/datagrid/DataGridColumn").DataGridColumn<TItem>[];
    /** Loads matching items with paging, using the edited row as business-rule context. */
    loadItems(query: LookupQuery, context: FieldEditContext<TRow>): Promise<LookupResult<TItem>>;
    /** Resolves a stored value's label even when its item is outside the loaded lookup page. */
    getValueText(value: any, context: FieldEditContext<TRow>): string | Promise<string>;
}

/** One selectable option for a column's allowed-value list (e.g. a dropdown item). */
export type DisplayValue = {
    /** Stored value represented by the option. */
    value: any,
    /** Human-readable label for the option. */
    text: string,
    /** Optional CSS color associated with the option. */
    color?: string;
    /** Optional icon class name for consumers that render option icons. */
    icon?: string;
    /** Optional image URL for consumers that render option images. */
    image?: string;
}

/** Contract for a component hosting data-bound UI (e.g. a grid) that can be told to reload. */
export interface DataComponent {
    supportsFilter?: boolean;
    /** Reloads the component's data, optionally preserving scroll position. */
    refreshData: (keepScrollPosition: boolean) => Promise<any>;

}

/** A single resolved (value, text) pair for one column on one row. */
export type DataCell<TRow> = {
    /** Column definition for this cell. */
    column: DataViewField<TRow>;
    /** Original row data. */
    rowData: TRow;
    /** Resolved raw cell value. */
    value: any;
    /** Resolved display text. */
    text: string;
};

/**
 * Presentation of a data field in a form, card, list or grid.
 * Extends data-access metadata with labels, formatting, editors and lookup options.
 * Grid layout and rendering belong to DataGridColumn.
 * @example
 * const product: DataViewField<Order> = {
 *     name: "product", dataType: "string", caption: "Product", required: true
 * };
 */
export interface DataViewField<TRow> extends DataField<TRow> {
    /** Display label; falls back to `name` when unset. */
    caption?: string;
    /** Field description, available to consumers as a tooltip or help text. */
    description?: string;
    /** Opaque, caller-defined presentation metadata (not used internally). */
    userState?: any;
    /** Prevents editing in consumers that honor this presentation flag. */
    readonly?: boolean;
    /** Rejects missing values in the default field editor. Custom consumers may add validation. */
    required?: boolean;
    /** Whether a card/form consumer should omit the field label. */
    hideLabel?: boolean,
    /** Whether a card/form consumer should display this field for the row. */
    showInRow?(row: TRow): boolean;
    /** Overrides the cell label; otherwise lookup.getValueText, displayFormat, formatValue or string conversion is used. */
    getText?(row: TRow): Promise<string>;
    /** Converts external text without mutating the row. Overrides the editor's default resolver. */
    resolveText?(text: string, context: FieldEditContext<TRow>): any | Promise<any>;
    /** Validates both typed and picked values. Return a message to retain the edit for correction. */
    validate?(value: any, context: FieldEditContext<TRow>): string | undefined | Promise<string | undefined>;
    /** Formats a value for editing and, absent getText/lookup, for display. */
    formatValue?(value: any, context: FieldEditContext<TRow>): string;
    /** Display-only pattern for number/date fields, e.g. N0, N2, P1, C2€ or dd.MM.yyyy. Does not alter editor text or stored values. */
    displayFormat?: string;
    /** Locale for displayFormat; defaults to the runtime locale. Independent of editor conversion callbacks. */
    displayLocale?: string;
    /** Lookup data, labels and optional multiple result columns. */
    lookup?: FieldLookup<TRow>;
    /** Optional picker trigger for a custom PopoverEditor; built-in editors supply their own defaults. */
    editorButton?: EditorButton;
    /** Creates a specialized editor. Example: ctx => new ToggleEditor({ value: ctx.value, onCommit: ctx.onCommit }). */
    createEditor?(context: FieldEditorContext<TRow>): ValueEditor<any>;
}

export class DataViewFieldUtils {

    private static readonly displayFormatters = new WeakMap<object, {
        pattern: string; locale?: string; type: DataType; formatter: NumberFormatter | DateFormatter;
    }>();

    /** Formats a raw display value without row-dependent labels. Null/undefined become empty text. */
    static formatDisplayValue<TRow>(field: DataViewField<TRow>, value: any): string {
        if (value == null) return "";
        if (field.displayFormat === undefined) return String(value);
        const type = DataViewFieldUtils.getDataType(field);
        if (type !== "number" && type !== "date")
            throw new Error("displayFormat supports number and date fields. Use getText for other types.");
        let cached = this.displayFormatters.get(field);
        if (!cached || cached.pattern !== field.displayFormat || cached.locale !== field.displayLocale || cached.type !== type) {
            cached = { pattern: field.displayFormat, locale: field.displayLocale, type,
                formatter: type === "number" ? new NumberFormatter(field.displayFormat, field.displayLocale)
                    : new DateFormatter(field.displayFormat, field.displayLocale) };
            this.displayFormatters.set(field, cached);
        }
        return type === "number" ? (cached.formatter as NumberFormatter).format(value)
            : (cached.formatter as DateFormatter).format(value);
    }

    /** Reuses field formatting for aggregates; counts/distinct counts remain plain integer quantities, never currency/percent/date labels. */
    static formatSummaryValue<TRow>(field: DataViewField<TRow>, value: any, summaryType: string): string {
        if (summaryType === "count" || summaryType === "distinct") return String(value ?? "");
        // Custom aggregates may return labels or structured results instead of the field's numeric type.
        if (field.dataType === "number" && value != null && typeof value !== "number") return String(value);
        return this.formatDisplayValue(field, value);
    }

    /** Returns the semantic data type; unspecified fields default to string. */
    static getDataType<TRow>(col: Pick<DataField<TRow>, "dataType">): DataType {
        return getFieldDataType(col);
    }

    static isDateColumn<TRow>(col: DataViewField<TRow>): boolean {
        const dataType = DataViewFieldUtils.getDataType(col);
        return dataType === "date" || dataType === "datetime";
    }

    static getSupportedGroupIntervals<TRow>(col: DataViewField<TRow>): GroupInterval[] {
        if (DataViewFieldUtils.isDateColumn(col)) {
            return [
                "year", "yearQuarter", "quarter", "yearMonth", "month",
                "week", "day", "dayOfWeek", "hour", "minute", "second"
            ];
        }
        if (DataViewFieldUtils.getDataType(col) === "string") return ["firstChar"];
        return [];
    }

    static hasDropdown<TRow>(col: DataViewField<TRow>) {
        return DataViewFieldUtils.isDateColumn(col) || !!col.lookup;
    }

    static async getValue<TRow>(col: DataViewField<TRow>, row: TRow): Promise<any> {

        if (col.getValue)
            return await col.getValue(row);

        return Utils.getMember(row as Record<string, any>, col.name);
    }

    static async getText<TRow>(col: DataViewField<TRow>, row: TRow): Promise<string> {

        try {
            if (col.getText)
                return await col.getText(row);
            const value = await DataViewFieldUtils.getValue(col, row);
            const context = { row, field: col, value };
            if (col.lookup) return await col.lookup.getValueText(value, context);
            if (col.displayFormat !== undefined) return this.formatDisplayValue(col, value);
            return col.formatValue?.(value, context) ?? String(value ?? "");
        }
        catch (ex) {
            console.error(ex);
            return `ERROR: ` + Utils.getErrorText(ex);
        }
    }

    static async getDataCell<TRow>(col: DataViewField<TRow>, row: TRow): Promise<DataCell<TRow>> {
        const value = await DataViewFieldUtils.getValue(col, row);
        const text = await DataViewFieldUtils.getText(col, row);

        return {
            column: col,
            rowData: row,
            value,
            text,
        };
    }

    static async getDataCells<TRow>(columns: DataViewField<TRow>[], row: TRow): Promise<Record<string, DataCell<TRow>>> {
        const cells: Record<string, DataCell<TRow>> = {};
        for (let col of columns) {
            cells[col.name] = await DataViewFieldUtils.getDataCell(col, row);
        }
        return cells;
    }

    /** Waits until all values and display texts are loaded for the specified columns */
    static async loadRowValues<TRow>(data: any[], columns: DataViewField<TRow>[]): Promise<Map<any, Map<string, { value: any, text: string }>>> {
        const map = new Map();
        if (columns.length == 0)
            return map;

        for (let dr of data) {
            let values = new Map();
            for (let col of columns) {
                values.set(
                    col.name,
                    {
                        value: await DataViewFieldUtils.getValue(col, dr),
                        text: await DataViewFieldUtils.getText(col, dr)
                    });
            }
            map.set(dr, values);
        }

        return map;
    }

}
