/** Semantic type of a stored value, independent of a particular UI component. */
export type DataType = "string" | "number" | "boolean" | "date" | "datetime" | "object";

/**
 * Minimal field metadata required for local data operations.
 * UI column definitions can implement this structurally without coupling data engines to a grid.
 */
export interface DataField<TRow> {
    name: string;
    dataType?: DataType;
    /** Legacy editor hint used only when no semantic dataType was provided. */
    editorType?: string;
    getValue?(row: TRow): Promise<any>;
    groupInterval?: import("./grouping").GroupInterval;
    getGroupValue?(row: TRow, value: any): any | Promise<any>;
}

/** Returns dataType when supplied; otherwise derives the type from editorType, defaulting to string. */
export function getFieldDataType(field: Pick<DataField<any>, "dataType" | "editorType">): DataType {
    if (field.dataType) return field.dataType;
    switch (field.editorType) {
        case "number": return "number";
        case "checkbox": return "boolean";
        case "date": return "date";
        case "datetime-local": return "datetime";
        default: return "string";
    }
}
