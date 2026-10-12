import { getFieldDataType, type DataType } from "../../data/DataField";
import { getFieldGroupValue, applyGroupInterval, type GroupInterval, type GroupIntervalDefinition } from "../../data/grouping";
import type { SummaryType } from "../../data/summary";
import { Utils } from "../../core/Utils";
import type { StyleObject } from "../../core/e";
import type { GridContextMenuItems } from "./DataGridContextMenu";
import type { FilterSelector } from "../../data/filter";

/** One selectable option for a column's allowed-value list (e.g. a dropdown item). */
export type DisplayValue = {
    value: any,
    text: string,
    color?: string;
    icon?: string;
    image?: string;
}

/** Lightweight per-column override, e.g. for persisted layout/visible-column state. */
export type DataColumnLayoutInfo = {
    name: string,
    width?: number;
    summaryType?: SummaryType;
    userState?: any;
}

/** Input control used to edit a column's value. */
export type EditorType = "text" | "number" | "date" | "datetime-local" | "time" | "checkbox" | "file" | "password" | "textarea" | "color";

/** Contract for a component hosting data-bound UI (e.g. a grid) that can be told to reload. */
export interface DataComponent {
    supportsFilter?: boolean;
    /** Reloads the component's data, optionally preserving scroll position. */
    refreshData: (keepScrollPosition: boolean) => Promise<any>;

    //getActiveEditor?: () => DataEditor | undefined;
}

/** A single resolved (value, text) pair for one column on one row. */
export type DataCell<TRow> = {
    /** Column definition for this cell. */
    column: DataColumn<TRow>;
    /** Original row data. */
    rowData: TRow;
    /** Resolved raw cell value. */
    value: any;
    /** Resolved display text. */
    text: string;
};

/** Per-cell visual overrides applied to the outer grid cell. */
export type DataCellStyle = {
    /** Additional classes for the outer grid cell. */
    className?: string;
    /** Inline styles, including CSS custom properties such as --elg-grid-cell-bg. */
    style?: StyleObject;
};

/** Defines one grid/view column: its data access, display, editing and layout behavior. */
export type DataColumn<TRow> = {
    /** Field name; also used as the column's unique identifier. */
    name: string;
    /** Display label; falls back to `name` when unset. */
    caption?: string;
    /** Column description, shown as a tooltip. */
    description?: string;
    /** The fixed width of the column, in pixels. If not specified the column will be auto-sized. */
    width?: number;
    /** Opaque, caller-defined data attached to the column (not used internally). */
    userState?: any;
    textAlign?: "start" | "center" | "end";
    /** Semantic value type used by filtering, grouping, sorting, summaries, and formatting. */
    dataType?: DataType;
    /** UI editor type used when the value is edited. */
    editorType?: EditorType;
    readonly?: boolean;
    required?: boolean;
    resizable?: boolean;
    reorderable?: boolean;
    /** Relative ordering hint among columns. */
    logicalOrder?: number;
    /** True to skip the cell label in DataView. */
    hideLabel?: boolean,
    /** Provides visibility by row. Used in DataView. */
    showInRow?(row: any): boolean;
    /** Reads this column's raw value from a row; defaults to reading `row[name]`. */
    getValue?(row: TRow): Promise<any>;
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
    /** List of data cell actions displayed as popup menu for data cell. */
    //rowCellActions?: (row: any, component: DataComponent) => Promise<ActionButton[]>;
    /** Produces context-menu items for cells in this column. */
    contextMenuItems?: GridContextMenuItems<TRow>;
    /** Produces context-menu items for this column's header. */
    headerContextMenuItems?: GridContextMenuItems<TRow>;
    /** Groups this column into a built-in or server-defined interval. */
    groupInterval?: GroupInterval;
    /** Computes a local grouping value. When present, grouping for this column is client-side. */
    getGroupValue?(row: TRow, value: any): any | Promise<any>;
}

export class DataColumnUtils {

    /** Returns the declared data type, or infers it from the legacy editorType. */
    static getDataType<TRow>(col: Pick<DataColumn<TRow>, "dataType" | "editorType">): DataType {
        return getFieldDataType(col);
    }

    static isDateColumn<TRow>(col: DataColumn<TRow>): boolean {
        const dataType = DataColumnUtils.getDataType(col);
        return dataType === "date" || dataType === "datetime";
    }

    static getGroupFilterSelector<TRow>(col: DataColumn<TRow>): FilterSelector {
        if (!col.groupInterval) return col.name;
        return {
            function: col.groupInterval,
            field: col.name
        };
    }

    static getSupportedGroupIntervals<TRow>(col: DataColumn<TRow>): GroupInterval[] {
        if (DataColumnUtils.isDateColumn(col)) {
            return [
                "year", "yearQuarter", "quarter", "yearMonth", "month",
                "week", "day", "dayOfWeek", "hour", "minute", "second"
            ];
        }
        if (DataColumnUtils.getDataType(col) === "string") return ["firstChar"];
        return [];
    }

    /** Resolves the value used for a local group, including custom and built-in intervals. */
    static async getGroupValue<TRow>(col: DataColumn<TRow>, row: TRow, customIntervals?: GroupIntervalDefinition<TRow>[]): Promise<any> {
        return getFieldGroupValue(col, row, customIntervals);
    }

    static applyGroupInterval(value: any, interval?: GroupInterval): any {
        return applyGroupInterval(value, interval);
    }

    static hasDropdown<TRow>(col: DataColumn<TRow>) {
        return col.editorType == "date" || col.editorType == "datetime-local"
            || !!col.getAllowedValues;
    }

    static async toggleBooleanValue<TRow>(col: DataColumn<TRow>, row: any) {

        let val = await DataColumnUtils.getValue(col, row);
        await DataColumnUtils.setValue(col, row, val ? 0 : 1);
    }

    static async getValue<TRow>(col: DataColumn<TRow>, row: TRow): Promise<any> {

        if (col.getValue)
            return await col.getValue(row);

        return Utils.getMember(row as Record<string, any>, col.name);
    }

    static async getText<TRow>(col: DataColumn<TRow>, row: TRow): Promise<string> {

        try {
            if (col.getText)
                return await col.getText(row);
            return (await DataColumnUtils.getValue(col, row))?.toString();
        }
        catch (ex) {
            console.error(ex);
            return `ERROR: ` + Utils.getErrorText(ex);
        }
    }

    static async getDataCell<TRow>(col: DataColumn<TRow>, row: TRow): Promise<DataCell<TRow>> {
        const value = await DataColumnUtils.getValue(col, row);
        const text = await DataColumnUtils.getText(col, row);

        return {
            column: col,
            rowData: row,
            value,
            text,
        };
    }

    static async getDataCells<TRow>(columns: DataColumn<TRow>[], row: TRow): Promise<Record<string, DataCell<TRow>>> {
        const cells: Record<string, DataCell<TRow>> = {};
        for (let col of columns) {
            cells[col.name] = await DataColumnUtils.getDataCell(col, row);
        }
        return cells;
    }

    static async setText<TRow>(col: DataColumn<TRow>, row: TRow, text: string) {

        if (col.setText) {

            await col.setText(row, text);
        }
        else if (text == "" || text == null) {

            await DataColumnUtils.setValue(col, row, null);
        }
        else if (col.getAllowedValues) {

            let search = text;
            let values = await col.getAllowedValues(row, search, 10, 0);

            if (values.length == 0)
                throw new Error("The specified text not found amogst the allowed values.");

            if (values.length > 1) {

                const vt = values.find(v => v.text === text);
                if (vt)
                    await DataColumnUtils.setValue(col, row, vt.value);
                else
                    throw new RangeError("The specified text matches more than one allowed value.");
            }
            else
                await DataColumnUtils.setValue(col, row, values[0].value);
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
            await DataColumnUtils.setValue(col, row, value);
        }
    }

    static async setValue<TRow>(col: DataColumn<TRow>, row: TRow, value: any) {

        if (col.setValue) {
            await col.setValue(row, value);
            return;
        }
        Utils.setMember(row as Record<string, any>, col.name, value);
    }

    /** Waits until all values and display texts are loaded for the specified columns */
    static async loadRowValues<TRow>(data: any[], columns: DataColumn<TRow>[]): Promise<Map<any, Map<string, { value: any, text: string }>>> {
        const map = new Map();
        if (columns.length == 0)
            return map;

        for (let dr of data) {
            let values = new Map();
            for (let col of columns) {
                values.set(
                    col.name,
                    {
                        value: await DataColumnUtils.getValue(col, dr),
                        text: await DataColumnUtils.getText(col, dr)
                    });
            }
            map.set(dr, values);
        }

        return map;
    }

}




