import { Utils } from "../core/Utils";
import type { DataField } from "./DataField";
import type { DataFilter, FilterSelector } from "./filter";
import { isPromiseLike } from "./localProcessing";

/** Selects a field or its named, serializable grouping interval. */
export function getGroupFilterSelector<TRow>(field: DataField<TRow>): FilterSelector {
    return field.groupInterval ? { function: field.groupInterval, field: field.name } : field.name;
}

/** Builds a child query using the same field or interval as the parent group. */
export function getGroupFilter<TRow>(field: DataField<TRow>, value: any): DataFilter {
    // JSON-safe missing-value comparison: ["region", "=", null] maps to IS NULL
    // in SQL adapters; ["region", "=", ""] selects empty text separately.
    return [getGroupFilterSelector(field), "=", value ?? null];
}

/**
 * Missing values share the null bucket: null and undefined -> null.
 * Empty text remains a separate bucket: "" -> "".
 * Other values keep their type and identity: 1 stays numeric, "01" stays text,
 * and false/0 are not empty. Sources supply a consistent type per grouped field.
 */
export function normalizeGroupValue(value: any): any {
    return value ?? null;
}

/**
 * Escaped path segment; the parent determines the level, without field/type tags.
 * Examples: $/Bulgaria/ (empty text); $/Bulgaria/~ (missing value).
 * A literal "~" becomes %7E so it cannot collide with the missing-value marker.
 * "A/B" -> "A%2FB", whereas the literal "%2F" -> "%252F", preventing collisions.
 */
export function encodeGroupKeySegment(value: any): string {
    return value == null ? "~" : encodeURIComponent(String(value)).replace(/~/g, "%7E");
}

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
    return createGroupValueGetter(field, customIntervals)(row);
}

/** @internal Prepares interval lookup once; plain local values do not allocate promises. */
export function createGroupValueGetter<TRow>(field: DataField<TRow>,
    customIntervals?: GroupIntervalDefinition<TRow>[],
    readMember?: (row: TRow, field: string) => any): (row: TRow) => any | Promise<any> {
    const customInterval = customIntervals?.find(x => x.name === field.groupInterval);
    const resolve = (row: TRow, value: any) => {
        const grouped = customInterval ? customInterval.getGroupValue(row, value)
            : field.getGroupValue ? field.getGroupValue(row, value) : applyGroupInterval(value, field.groupInterval);
        return isPromiseLike(grouped) ? Promise.resolve(grouped).then(normalizeGroupValue) : normalizeGroupValue(grouped);
    };
    return row => {
        const value = field.getValue ? field.getValue(row) : readMember ? readMember(row, field.name)
            : Utils.getMember(row as Record<string, any>, field.name);
        return isPromiseLike(value) ? Promise.resolve(value).then(value => resolve(row, value)) : resolve(row, value);
    };
}

/** Evaluates a standard local grouping interval; unknown names leave the value unchanged. */
export function applyGroupInterval(value: any, interval?: GroupInterval): any {
    if (!interval || value === null || value === undefined || value === "") return normalizeGroupValue(value);
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
