import { getFieldDataType, type DataField, type DataType } from "./DataField";
import { getFieldGroupValue, applyGroupInterval, type GroupInterval, type GroupIntervalDefinition } from "./grouping";
import { Utils } from "../core/Utils";
import type { FilterSelector } from "./filter";

/** One selectable option for a column's allowed-value list (e.g. a dropdown item). */
export type DisplayValue = {
    value: any,
    text: string,
    color?: string;
    icon?: string;
    image?: string;
}

/** Input control used to edit a column's value. */
export type EditorType = "text" | "number" | "date" | "datetime-local" | "time" | "checkbox" | "file" | "password" | "textarea" | "color";

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
    /** UI editor type used when the value is edited. */
    editorType?: EditorType;
    readonly?: boolean;
    required?: boolean;
    /** Whether a card/form consumer should omit the field label. */
    hideLabel?: boolean,
    /** Whether a card/form consumer should display this field for the row. */
    showInRow?(row: TRow): boolean;
    /** Reads this column's display text for a row; defaults to stringifying getValue(). */
    getText?(row: TRow): Promise<string>;
    /** Writes this column's raw value onto a row; defaults to setting `row[name]`. */
    setValue?(row: TRow, value: any): Promise<any>;
    /** Parses and writes a display-text edit onto a row. */
    setText?(row: TRow, text: string): Promise<any>;
    /** Fetches the allowed-value list for dropdown-style editing/filtering. */
    getAllowedValues?(row?: TRow, search?: string, top?: number, skip?: number): Promise<DisplayValue[]>;
    /** Resolves display text for a given value, without loading the full allowed-value list. */
    getAllowedValueText?(row?: TRow): Promise<string | undefined>;
}

export class DataViewFieldUtils {

    /** Returns the semantic data type; unspecified fields default to string. */
    static getDataType<TRow>(col: Pick<DataField<TRow>, "dataType">): DataType {
        return getFieldDataType(col);
    }

    static isDateColumn<TRow>(col: DataViewField<TRow>): boolean {
        const dataType = DataViewFieldUtils.getDataType(col);
        return dataType === "date" || dataType === "datetime";
    }

    static getGroupFilterSelector<TRow>(col: DataViewField<TRow>): FilterSelector {
        if (!col.groupInterval) return col.name;
        return {
            function: col.groupInterval,
            field: col.name
        };
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

    /** Resolves the value used for a local group, including custom and built-in intervals. */
    static async getGroupValue<TRow>(col: DataViewField<TRow>, row: TRow, customIntervals?: GroupIntervalDefinition<TRow>[]): Promise<any> {
        return getFieldGroupValue(col, row, customIntervals);
    }

    static applyGroupInterval(value: any, interval?: GroupInterval): any {
        return applyGroupInterval(value, interval);
    }

    static hasDropdown<TRow>(col: DataViewField<TRow>) {
        return col.editorType == "date" || col.editorType == "datetime-local"
            || !!col.getAllowedValues;
    }

    static async toggleBooleanValue<TRow>(col: DataViewField<TRow>, row: any) {

        let val = await DataViewFieldUtils.getValue(col, row);
        await DataViewFieldUtils.setValue(col, row, val ? 0 : 1);
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
            return (await DataViewFieldUtils.getValue(col, row))?.toString();
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

    static async setText<TRow>(col: DataViewField<TRow>, row: TRow, text: string) {

        if (col.setText) {

            await col.setText(row, text);
        }
        else if (text == "" || text == null) {

            await DataViewFieldUtils.setValue(col, row, null);
        }
        else if (col.getAllowedValues) {

            let search = text;
            let values = await col.getAllowedValues(row, search, 10, 0);

            if (values.length == 0)
                throw new Error("The specified text not found amogst the allowed values.");

            if (values.length > 1) {

                const vt = values.find(v => v.text === text);
                if (vt)
                    await DataViewFieldUtils.setValue(col, row, vt.value);
                else
                    throw new RangeError("The specified text matches more than one allowed value.");
            }
            else
                await DataViewFieldUtils.setValue(col, row, values[0].value);
        }
        else {
            let value: any = text;
            switch (col.editorType ?? "text") {
                case "checkbox":
                    let lower = text.toLowerCase();
                    value = lower.startsWith("y") || lower.startsWith("t") || lower.startsWith("д");
                    break;
                case "date":
                case "datetime-local":
                    let dt = new Date(Date.parse(text));
                    value = dt.toISOString();
                    break;
                case "number":
                    text = text.replace(/,/, '.');
                    value = parseFloat(text);
                    break;
            }
            await DataViewFieldUtils.setValue(col, row, value);
        }
    }

    static async setValue<TRow>(col: DataViewField<TRow>, row: TRow, value: any) {

        if (col.setValue) {
            await col.setValue(row, value);
            return;
        }
        Utils.setMember(row as Record<string, any>, col.name, value);
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
