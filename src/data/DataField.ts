/** Semantic type of a stored value, independent of a particular UI component. */
export type DataType = "string" | "number" | "boolean" | "date" | "datetime" | "object";

/**
 * Describes how to read and process a field from any row type.
 * Independent of UI presentation and of DataSet/DataTable membership.
 * DataViewField adds presentation; DataGridColumn adds grid-specific behavior.
 * @example
 * const amount: DataField<Order> = {
 *     name: "amount", dataType: "number", getValue: async row => row.amount
 * };
 */
export interface DataField<TRow> {
    /** Data member name; local operations also use it as the field identifier. */
    name: string;
    /** Semantic value type. Independent of the editor used to display or edit the field. */
    dataType?: DataType;
    /** Reads the field value; when omitted, local operations read row[name]. */
    getValue?(row: TRow): Promise<any>;
    /** Built-in or source-defined grouping interval. */
    groupInterval?: import("./grouping").GroupInterval;
    /** Overrides local grouping for the resolved field value. */
    getGroupValue?(row: TRow, value: any): any | Promise<any>;
}

/** Returns the semantic data type. Unspecified fields default to string, without inspecting UI editors. */
export function getFieldDataType(field: Pick<DataField<any>, "dataType">): DataType {
    return field.dataType ?? "string";
}
