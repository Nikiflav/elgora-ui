import type { DataFilter } from "../../data/filter";
import { DataColumnUtils } from "./DataColumn";
import type { DataColumn, DataType } from "./DataColumn";

export type DataFilterRowColumn<TRow = any> = Pick<DataColumn<TRow>, "name" | "caption" | "dataType" | "editorType">;

/** One text expression displayed by a filter-row column. */
export interface DataFilterRowValue {
    field: string;
    text: string;
}

export type DataFilterRowOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "contains" | "notcontains" | "startswith" | "endswith";

type BinaryFilter = [string, DataFilterRowOperator, any];

const operators = ["=", "<>", ">", ">=", "<", "<=", "contains", "notcontains", "startswith", "endswith"] as const;

function isOperator(value: unknown): value is DataFilterRowOperator {
    return typeof value === "string" && (operators as readonly string[]).includes(value);
}

/** Checks whether a value has the three-part shape of a field filter. */
function isBinaryFilter(value: unknown): value is BinaryFilter {
    return Array.isArray(value)
        && value.length === 3
        && typeof value[0] === "string"
        && isOperator(value[1]);
}

/** Chooses the implicit operator used when an expression has no prefix. */
function defaultOperator(dataType?: DataType): DataFilterRowOperator {
    return dataType === "string" || !dataType ? "contains" : "=";
}

/** Removes the escape prefix used to make an operator-looking value literal. */
function unescapeValue(value: string): string {
    if (value.startsWith("\\")) return value.slice(1);
    return value.replace(/\\([=<>!])/g, "$1");
}

/** Escapes a default value when its first characters would otherwise be syntax. */
function escapeDefaultValue(value: string): string {
    if (value.startsWith("\\")) return `\\${value}`;
    if (/^(?:!?=|[<>]=?|\d+\.\.\d+|today\.\.)/.test(value)) return `\\${value}`;
    return value;
}

/** Parses `today`, `dd.mm.yy`, `dd.mm.yyyy`, and native date strings. */
function parseDate(value: string): Date | undefined {
    if (value.toLowerCase() === "today") {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const european = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(value);
    if (european) {
        const year = european[3].length === 2 ? 2000 + Number(european[3]) : Number(european[3]);
        const date = new Date(year, Number(european[2]) - 1, Number(european[1]));
        if (date.getFullYear() === year && date.getMonth() === Number(european[2]) - 1 && date.getDate() === Number(european[1]))
            return date;
        return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Converts an expression operand to the column's runtime value type. */
function parseScalar(value: string, dataType?: DataType): any {
    if (!value.trim()) return undefined;
    if (dataType === "number") {
        const result = Number(value);
        return Number.isFinite(result) ? result : undefined;
    }
    if (dataType === "date" || dataType === "datetime") return parseDate(value);
    return value;
}

/** Formats a Date value using the compact filter-row date notation. */
function formatDate(value: any): string {
    if (!(value instanceof Date)) return String(value);
    return `${String(value.getDate()).padStart(2, "0")}.${String(value.getMonth() + 1).padStart(2, "0")}.${String(value.getFullYear()).slice(-2)}`;
}

/** Formats a typed filter value for display in the filter row. */
function formatScalar(value: any, dataType?: DataType): string {
    if (dataType === "date" || dataType === "datetime") return formatDate(value);
    return String(value ?? "");
}

/**
 * Parses one expression such as `abc`, `=abc`, or a typed range.
 *
 * Numeric and date/datetime columns support closed and open-ended ranges:
 * `1..100`, `500..`, `..500`, `today..`, and `..10.12.26`.
 */
function parseExpression(text: string, column: DataFilterRowColumn): DataFilter | undefined {
    const value = text.trim();
    if (!value) return undefined;

    const forcedDefault = value.startsWith("\\");
    const expression = forcedDefault ? unescapeValue(value) : value;
    const type = DataColumnUtils.getDataType(column);

    if (!forcedDefault) {
        const range = /^(.*?)\.\.(.*?)$/.exec(expression);
        if (range && (type === "number" || type === "date" || type === "datetime")) {
            const startText = range[1].trim();
            const endText = range[2].trim();
            if (!startText && !endText) return undefined;

            const start = startText ? parseScalar(startText, type) : undefined;
            const end = endText ? parseScalar(endText, type) : undefined;
            if ((startText && start === undefined) || (endText && end === undefined)) return undefined;

            const filters: DataFilter[] = [];
            if (start !== undefined) filters.push([column.name, ">=", start] as DataFilter);
            if (end !== undefined) filters.push([column.name, "<=", end] as DataFilter);
            return filters.length === 1 ? filters[0] : ["and", ...filters] as DataFilter;
        }
    }

    let operator = defaultOperator(type);
    let operand = expression;
    if (!forcedDefault) {
        const match = /^(>=|<=|<>|!=|=|>|<)(.*)$/.exec(expression);
        if (match) {
            operator = match[1] === "!=" ? "<>" : match[1] as DataFilterRowOperator;
            operand = match[2].trim();
        } else {
            const named = /^(contains|notcontains|startswith|endswith):(.*)$/i.exec(expression);
            if (named) {
                operator = named[1].toLowerCase() as DataFilterRowOperator;
                operand = named[2].trim();
            }
        }
    }

    const parsed = parseScalar(operand, type);
    if (parsed === undefined) return undefined;
    return [column.name, operator, parsed] as DataFilter;
}

/** Extracts the binary children that can be represented by a filter row. */
function simpleAndChildren(filter: DataFilter): DataFilter[] | undefined {
    if (!Array.isArray(filter) || filter.length === 0) return [];
    if (isBinaryFilter(filter)) return [filter];
    if (filter[0] === "and") return filter.slice(1) as DataFilter[];
    if (Array.isArray(filter[0])) return filter as DataFilter[];
    return undefined;
}

/** Formats an operator, omitting it when it is the column default. */
function formatOperator(operator: DataFilterRowOperator, value: string, dataType?: DataType): string {
    if (operator === defaultOperator(dataType)) return escapeDefaultValue(value);
    if (operator === "<>") return `!=${value}`;
    if (operator === "contains") return `contains:${value}`;
    if (operator === "notcontains") return `notcontains:${value}`;
    if (operator === "startswith") return `startswith:${value}`;
    if (operator === "endswith") return `endswith:${value}`;
    return `${operator}${value}`;
}

/** Returns the human-readable label used by the filter summary. */
function readableOperator(operator: DataFilterRowOperator): string {
    switch (operator) {
        case "contains": return "contains";
        case "notcontains": return "does not contain";
        case "startswith": return "starts with";
        case "endswith": return "ends with";
        case "<>": return "!=";
        default: return operator;
    }
}

/** Formats a value for the readable filter summary. */
function readableValue(value: any, dataType?: DataType): string {
    const text = formatScalar(value, dataType);
    if (typeof value === "string") return `'${text.replace(/'/g, "\\'")}'`;
    return text;
}

/** Converts a DataFilter to the compact, per-column expressions used by a filter row. */
export class DataFilterRow<TRow = any> {
    readonly columns: DataFilterRowColumn<TRow>[];

    /**
     * Creates a filter-row converter for the supplied columns.
     *
     * @example
     * ```ts
     * const row = new DataFilterRow([
     *   { name: "name", dataType: "string" },
     *   { name: "price", dataType: "number" }
     * ]);
     * ```
     */
    constructor(columns: DataFilterRowColumn<TRow>[]) {
        this.columns = columns;
    }

    /**
     * Parses one column expression into a DataFilter.
     *
     * @example
     * ```ts
     * row.parse("price", "1..100");
     * // ["and", ["price", ">=", 1], ["price", "<=", 100]]
     *
     * row.parse("price", "500..");
     * // ["price", ">=", 500]
     *
     * row.parse("created", "..10.12.26");
     * // ["created", "<=", new Date(2026, 11, 10)]
     *
     * row.parse("name", "\\=abc");
     * // ["name", "contains", "=abc"]
     * ```
     */
    parse(field: string, text: string): DataFilter | undefined {
        const column = this.columns.find(item => item.name === field);
        return column ? parseExpression(text, column) : undefined;
    }

    /**
     * Combines the current filter-row values into an implicit AND filter.
     *
     * @example
     * ```ts
     * row.toFilter([
     *   { field: "name", text: "phone" },
     *   { field: "price", text: ">=100" }
     * ]);
     * // ["and", ["name", "contains", "phone"], ["price", ">=", 100]]
     * ```
     */
    toFilter(values: readonly DataFilterRowValue[]): DataFilter | undefined {
        const filters = values
            .map(value => this.parse(value.field, value.text))
            .filter((filter): filter is DataFilter => filter !== undefined);
        if (!filters.length) return undefined;
        return filters.length === 1 ? filters[0] : ["and", ...filters] as DataFilter;
    }

    /**
     * Formats a simple filter as one expression per column.
     * Returns `false` when OR, negation, selectors, or ambiguous conditions are present.
     *
     * @example
     * ```ts
     * row.fromFilter(["and", ["name", "contains", "phone"], ["price", ">=", 100]]);
     * // [{ field: "name", text: "phone" }, { field: "price", text: "100.." }]
     *
     * row.fromFilter(["or", ["name", "=", "phone"], ["name", "=", "tablet"]]);
     * // false
     */
    fromFilter(filter?: DataFilter): DataFilterRowValue[] | false {
        if (!filter || (Array.isArray(filter) && filter.length === 0)) return [];
        const children = simpleAndChildren(filter);
        if (!children) return false;

        const conditions = new Map<string, BinaryFilter[]>();
        for (const child of children) {
            if (!isBinaryFilter(child)) return false;
            const list = conditions.get(child[0]) ?? [];
            list.push(child);
            conditions.set(child[0], list);
        }

        const result: DataFilterRowValue[] = [];
        for (const [field, list] of conditions) {
            const column = this.columns.find(item => item.name === field);
            if (!column) return false;
            const range = list.length === 2
                && list.some(item => item[1] === ">=")
                && list.some(item => item[1] === "<=")
                && (DataColumnUtils.getDataType(column) === "number" || DataColumnUtils.isDateColumn(column));

            if (range) {
                const lower = list.find(item => item[1] === ">=")!;
                const upper = list.find(item => item[1] === "<=")!;
                const dataType = DataColumnUtils.getDataType(column);
                result.push({ field, text: `${formatScalar(lower[2], dataType)}..${formatScalar(upper[2], dataType)}` });
                continue;
            }
            if (list.length !== 1) return false;

            const [_, operator, rawValue] = list[0];
            const dataType = DataColumnUtils.getDataType(column);
            if ((operator === ">=" || operator === "<=")
                && (dataType === "number" || dataType === "date" || dataType === "datetime")) {
                const formatted = formatScalar(rawValue, dataType);
                result.push({ field, text: operator === ">=" ? `${formatted}..` : `..${formatted}` });
                continue;
            }
            result.push({
                field,
                text: formatOperator(operator, formatScalar(rawValue, dataType), dataType)
            });
        }
        return result;
    }

    /**
     * Formats any supported filter, including OR and nested groups, as readable text.
     *
     * @example
     * ```ts
     * row.toText(["or", ["region", "contains", "123"], ["product", "=", "567"]]);
     * // "Region contains '123' or Product = '567'"
     * ```
     */
    toText(filter?: DataFilter): string {
        if (!filter || (Array.isArray(filter) && filter.length === 0)) return "";
        return this.formatFilterText(filter, false);
    }

    /** Formats one filter node recursively for toText(). */
    private formatFilterText(filter: DataFilter, nested: boolean): string {
        if (Array.isArray(filter) && filter.length === 3 && typeof filter[1] === "string" && isOperator(filter[1])) {
            const selector = filter[0];
            const field = typeof selector === "string" ? selector : (selector as any)?.field;
            const column = this.columns.find(item => item.name === field);
            if (!field || !column) return "";
            return `${column.caption ?? field} ${readableOperator(filter[1])} ${readableValue(filter[2], DataColumnUtils.getDataType(column))}`;
        }

        if (Array.isArray(filter) && filter[0] === "!") {
            const child = filter[1] as DataFilter | undefined;
            return child ? `not (${this.formatFilterText(child, true)})` : "";
        }

        const explicitOperator = Array.isArray(filter) && (filter[0] === "and" || filter[0] === "or")
            ? filter[0]
            : "and";
        const children = (explicitOperator === "and" || explicitOperator === "or")
            ? (filter as any[]).slice(1) as DataFilter[]
            : filter as DataFilter[];
        const parts = children.map(child => this.formatFilterText(child, true)).filter(Boolean);
        if (!parts.length) return "";
        const text = parts.join(` ${explicitOperator} `);
        return nested && parts.length > 1 ? `(${text})` : text;
    }
}
