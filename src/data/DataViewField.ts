import { getFieldDataType, type DataField, type DataType } from "./DataField";
import type { GroupInterval } from "./grouping";
import { Utils } from "../core/Utils";
import { NumberFormatter } from "../formatting/NumberFormatter";
import { DateFormatter } from "../formatting/DateFormatter";
import { Localization } from "../localization/Localization";
import type { ValueEditor } from "../components/editors/ValueEditor";
import type { EditorButton } from "../components/editors/EditorButton";
import type { LookupEditorOptions, LookupQuery, LookupResult } from "../components/editors/LookupEditor";
import type { VNode } from "../core/e";
import type { UiStyle } from "../core/UiStyle";

/** Original source row and field supplied to value conversion and validation. */
export interface FieldEditContext<TRow> {
    /** Original domain row supplied by the hosting component. */
    row: TRow;
    /** Field whose value is being converted, displayed or validated. */
    field: DataViewField<TRow>;
    /** Current field value at the time the context was created. */
    value: any;
    /** Resolved locale supplied by the host; conversion callbacks may use it explicitly. */
    locale?: string;
    /** Host message context, forwarded to built-in/custom editors. Omission uses Localization.default. */
    localization?: Localization;
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

/** Context supplied to a field action callback or custom button renderer. */
export interface DataViewButtonContext<TRow> {
    /** Business row represented by the action; absent for synthetic/group rows. */
    row?: TRow;
    /** Field that owns the action buttons. */
    field: DataViewField<TRow>;
    /** Button definition currently being resolved or invoked. */
    button: DataViewButton<TRow>;
    /** Current raw field value when the host can resolve one. */
    value?: any;
    /** DataForm or DataGrid instance that owns the rendered button. */
    owner: unknown;
}

/** Visual order used when a data-view action has both an icon and a label. */
export type DataViewButtonAppearance = "iconOnly" | "textOnly" | "iconAndText" | "textAndIcon";

/** A semantic action rendered by a `type: "buttons"` field. */
export interface DataViewButton<TRow> {
    /** Stable action identifier, also used as the VNode key. */
    id: string;
    /** Optional visible label. */
    text?: string;
    /** Optional Remix Icon class, e.g. `ri-edit-line`. */
    icon?: string;
    /** Optional longer explanation used to build the fallback icon-only tooltip. */
    description?: string;
    /** Optional tooltip and accessible label. Falls back to `text`, `description`, then `id`. */
    tooltip?: string;
    /** Controls whether the action shows its icon, text, or both. Defaults to the available content. */
    appearance?: DataViewButtonAppearance;
    /** Optional typed UI styles; when omitted, action buttons use the `neutral` variant. */
    ui?: UiStyle | UiStyle[];
    /** Controls whether the button is rendered for this row. */
    visible?: boolean | ((context: DataViewButtonContext<TRow>) => boolean);
    /** Prevents invocation while retaining the button in the layout. */
    disabled?: boolean | ((context: DataViewButtonContext<TRow>) => boolean);
    /** Optional toggle state exposed through `aria-pressed`. */
    pressed?: boolean | "mixed" | ((context: DataViewButtonContext<TRow>) => boolean | "mixed");
    /** Invoked after the host has stopped the event from changing grid/form selection. */
    onClick?: (context: DataViewButtonContext<TRow>) => void | Promise<void>;
    /** Replaces the standard icon/text content while the host still owns the button element. */
    render?: (context: DataViewButtonContext<TRow>) => VNode<any>;
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
    /** Presentation role. `data` is the default value field; `buttons` renders row actions. */
    type?: "data" | "buttons";
    /** Display label; falls back to `name` when unset. */
    caption?: string;
    /** Field description, available to consumers as a tooltip or help text. */
    description?: string;
    /** Opaque, caller-defined presentation metadata (not used internally). */
    userState?: any;
    /** Prevents editing in consumers that honor this presentation flag. */
    readonly?: boolean;
    /** Controls picker trigger visibility in field consumers; forms default to always, grids to hover. */
    editorButtonVisibility?: "always" | "hover" | "never";
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
    /** Presentation pattern for number/date fields, e.g. N0, N2, P1, C2€ or dd.MM.yyyy. It affects display and the built-in editor text, never the stored value. */
    displayFormat?: string;
    /** Regional override for display and editor context. Falls back to the host locale, then Localization.default. Does not select a parser. */
    locale?: string;
    /** Lookup data, labels and optional multiple result columns. */
    lookup?: FieldLookup<TRow>;
    /** Optional picker trigger for a custom PopoverEditor; built-in editors supply their own defaults. */
    editorButton?: EditorButton;
    /** Actions rendered when `type` is `buttons`; action fields never enter value editing. */
    buttons?: readonly DataViewButton<TRow>[];
    /** Creates a specialized editor. Example: ctx => new ToggleEditor({ value: ctx.value, onCommit: ctx.onCommit }). */
    createEditor?(context: FieldEditorContext<TRow>): ValueEditor<any>;
}

export class DataViewFieldUtils {

    private static readonly displayFormatters = new WeakMap<object, {
        pattern: string; locale?: string; type: DataType; formatter: NumberFormatter | DateFormatter;
    }>();

    /** Resolves the visible action label used when a button has no explicit text. */
    static getButtonText<TRow>(button: DataViewButton<TRow>): string {
        return button.text ?? button.id;
    }

    /**
     * Resolves the accessible label and icon-only tooltip for an action.
     * When a description exists, it is presented as `text: description`.
     */
    static getButtonLabel<TRow>(button: DataViewButton<TRow>): string {
        if (button.tooltip) return button.tooltip;
        const text = DataViewFieldUtils.getButtonText(button);
        return button.description ? `${text}: ${button.description}` : text;
    }

    /** Uses the explicit appearance, otherwise applies the host's requested default. */
    static getButtonAppearance<TRow>(button: DataViewButton<TRow>, defaultAppearance: DataViewButtonAppearance = "iconAndText"): DataViewButtonAppearance {
        if (button.appearance) return button.appearance;
        return defaultAppearance;
    }

    /** Formats a raw display value without row-dependent labels. Null/undefined become empty text. */
    static formatDisplayValue<TRow>(field: DataViewField<TRow>, value: any, inheritedLocale?: string): string {
        if (value == null) return "";
        if (field.displayFormat === undefined) return String(value);
        const type = DataViewFieldUtils.getDataType(field);
        const locale = Localization.resolveLocale({ locale: field.locale ?? inheritedLocale });
        if (type !== "number" && type !== "date")
            throw new Error("displayFormat supports number and date fields. Use getText for other types.");
        let cached = this.displayFormatters.get(field);
        if (!cached || cached.pattern !== field.displayFormat || cached.locale !== locale || cached.type !== type) {
            cached = { pattern: field.displayFormat, locale, type,
                formatter: type === "number" ? new NumberFormatter(field.displayFormat, locale)
                    : new DateFormatter(field.displayFormat, locale) };
            this.displayFormatters.set(field, cached);
        }
        return type === "number" ? (cached.formatter as NumberFormatter).format(value)
            : (cached.formatter as DateFormatter).format(value);
    }

    /** Reuses field formatting for aggregates; counts/distinct counts remain plain integer quantities, never currency/percent/date labels. */
    static formatSummaryValue<TRow>(field: DataViewField<TRow>, value: any, summaryType: string, inheritedLocale?: string): string {
        if (summaryType === "count" || summaryType === "distinct") return String(value ?? "");
        // Custom aggregates may return labels or structured results instead of the field's numeric type.
        if (field.dataType === "number" && value != null && typeof value !== "number") return String(value);
        return this.formatDisplayValue(field, value, inheritedLocale);
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

        if (col.type === "buttons") return undefined;

        if (col.getValue)
            return await col.getValue(row);

        return Utils.getMember(row as Record<string, any>, col.name);
    }

    static async getText<TRow>(col: DataViewField<TRow>, row: TRow, inheritedLocale?: string): Promise<string> {

        try {
            if (col.type === "buttons") return "";
            if (col.getText)
                return await col.getText(row);
            const value = await DataViewFieldUtils.getValue(col, row);
            const context = { row, field: col, value, locale: Localization.resolveLocale({ locale: col.locale ?? inheritedLocale }) };
            if (col.lookup) return await col.lookup.getValueText(value, context);
            if (col.displayFormat !== undefined) return this.formatDisplayValue(col, value, context.locale);
            return col.formatValue?.(value, context) ?? String(value ?? "");
        }
        catch (ex) {
            console.error(ex);
            return `ERROR: ` + Utils.getErrorText(ex);
        }
    }

    static async getDataCell<TRow>(col: DataViewField<TRow>, row: TRow, inheritedLocale?: string): Promise<DataCell<TRow>> {
        const value = await DataViewFieldUtils.getValue(col, row);
        const text = await DataViewFieldUtils.getText(col, row, inheritedLocale);

        return {
            column: col,
            rowData: row,
            value,
            text,
        };
    }

    static async getDataCells<TRow>(columns: DataViewField<TRow>[], row: TRow, inheritedLocale?: string): Promise<Record<string, DataCell<TRow>>> {
        const cells: Record<string, DataCell<TRow>> = {};
        for (let col of columns) {
            cells[col.name] = await DataViewFieldUtils.getDataCell(col, row, inheritedLocale);
        }
        return cells;
    }

    /** Waits until all values and display texts are loaded for the specified columns */
    static async loadRowValues<TRow>(data: any[], columns: DataViewField<TRow>[], inheritedLocale?: string): Promise<Map<any, Map<string, { value: any, text: string }>>> {
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
                        text: await DataViewFieldUtils.getText(col, dr, inheritedLocale)
                    });
            }
            map.set(dr, values);
        }

        return map;
    }

}
