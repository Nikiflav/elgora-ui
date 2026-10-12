import { Utils } from "../core/Utils";
import type { DataField } from "./DataField";

/** A sort instruction: either a bare field name, or a [field, direction] pair. */
export type OrderByToken = string | [string, "asc" | "desc"];

/** Built-in grouping buckets, plus names understood by a server DataSource. */
export type GroupInterval =
    | "year"
    | "yearQuarter"
    | "quarter"
    | "yearMonth"
    | "month"
    | "week"
    | "day"
    | "dayOfWeek"
    | "hour"
    | "minute"
    | "second"
    | "firstChar"
    | (string & {});

/** A custom grouping interval with a serializable name and local fallback evaluator. */
export type GroupIntervalDefinition<TRow> = {
    name: string;
    text: string;
    getGroupValue: (row: TRow, value: any) => any;
};

export function orderByTokenToString(tok: OrderByToken) {
    if (typeof tok == "string")
        return tok;
    return tok.join(" ");
}

/** Resolves custom, column-defined or standard grouping using value-access metadata only. */
export async function getFieldGroupValue<TRow>(field: DataField<TRow>, row: TRow,
    customIntervals?: GroupIntervalDefinition<TRow>[]): Promise<any> {
    const value = field.getValue ? await field.getValue(row)
        : Utils.getMember(row as Record<string, any>, field.name);
    const customInterval = customIntervals?.find(x => x.name === field.groupInterval);
    if (customInterval) return await customInterval.getGroupValue(row, value);
    if (field.getGroupValue) return await field.getGroupValue(row, value);
    return applyGroupInterval(value, field.groupInterval);
}

/** Evaluates a standard local grouping interval; unknown names leave the value unchanged. */
export function applyGroupInterval(value: any, interval?: GroupInterval): any {
    if (!interval || value === null || value === undefined || value === "") return value ?? "";
    if (interval === "firstChar") return String(value).charAt(0);

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    switch (interval) {
        case "year": return year;
        case "yearQuarter": return `${year}-Q${quarter}`;
        case "quarter": return quarter;
        case "yearMonth": return `${year}-${String(month).padStart(2, "0")}`;
        case "month": return month;
        case "week": {
            // ISO 8601 week: Monday-based, with the year's first Thursday in week 1.
            const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const day = utc.getUTCDay() || 7;
            utc.setUTCDate(utc.getUTCDate() + 4 - day);
            const isoYear = utc.getUTCFullYear();
            const yearStart = new Date(Date.UTC(isoYear, 0, 1));
            const isoWeek = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
        }
        case "day": return date.getDate();
        case "dayOfWeek": return date.getDay() || 7;
        case "hour": return date.getHours();
        case "minute": return date.getMinutes();
        case "second": return date.getSeconds();
        default: return value;
    }
}
