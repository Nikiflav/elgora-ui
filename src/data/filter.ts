import { applyGroupInterval } from "./grouping";

type BinaryOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "startswith" | "endswith" | "contains" | "notcontains";
type GroupOperator = "and" | "or";

/** A field name or a serializable transformation applied to a field. */
export type FilterSelector = string | {
    /** Serializable transformation name, resolved through the source's filter-function registry. */
    function: string;
    /** Field whose value is passed to the transformation. */
    field: string;
    /** Additional transformation arguments; defaults to an empty array during local evaluation. */
    args?: unknown[];
};

/** Local implementations for structured filter selectors. */
export type FilterFunction = (value: any, args: unknown[], item: any) => any;
/** Local selector evaluators keyed by their serializable function names. */
export type FilterFunctionRegistry = Record<string, FilterFunction>;

/** [ "field", "op", value ] */
type BinaryFilter = [FilterSelector, BinaryOperator, any];

/** [ "!", [filter] ] */
type UnaryFilter = ["!", DataFilter];

/** * [ "or" | "and", ...DataFilter[] ] 
 * OR 
 * [ DataFilter, DataFilter, ... ] (Implicit AND)
 */
type GroupFilter =
    | [GroupOperator, ...DataFilter[]]
    | DataFilter[];

/**
 * A serializable filter condition, negation or group. Nested arrays combine conditions with AND.
 * Equality with null matches null or missing (undefined) values, never empty text.
 * Inequality with null is the inverse. Other equality comparisons are type-strict.
 * SQL adapters should translate = null / <> null to IS NULL / IS NOT NULL.
 * @example
 * const filter: DataFilter = ["and", ["quantity", ">=", 1], ["quantity", "<=", 100]];
 */
export type DataFilter = BinaryFilter | UnaryFilter | GroupFilter;

// Grouping and transformed filters share the same interval rules, including empties.
const DEFAULT_FILTER_FUNCTIONS: FilterFunctionRegistry = {
    firstChar: value => applyGroupInterval(value, "firstChar"),
    year: value => applyGroupInterval(value, "year"),
    yearQuarter: value => applyGroupInterval(value, "yearQuarter"),
    quarter: value => applyGroupInterval(value, "quarter"),
    month: value => applyGroupInterval(value, "month"),
    yearMonth: value => applyGroupInterval(value, "yearMonth"),
    week: value => applyGroupInterval(value, "week"),
    day: value => applyGroupInterval(value, "day"),
    dayOfWeek: value => applyGroupInterval(value, "dayOfWeek"),
    hour: value => applyGroupInterval(value, "hour"),
    minute: value => applyGroupInterval(value, "minute"),
    second: value => applyGroupInterval(value, "second")
};

function getFieldValue(item: Record<string, any>, field: string): any {
    return field.split(".").reduce((value, part) => value == null ? undefined : value[part], item);
}

function resolveSelector(item: Record<string, any>, selector: FilterSelector, functions: FilterFunctionRegistry): any {
    if (typeof selector === "string") return getFieldValue(item, selector);
    const fn = functions[selector.function];
    if (!fn) throw new Error(`Failed to evaluate filter. Unsupported filter function: "${selector.function}".`);
    return fn(getFieldValue(item, selector.field), selector.args ?? [], item);
}


/**
 * Evaluates a filter against one row. Empty filters match every row.
 * Supply custom functions to resolve selectors such as { function: "category", field: "code" }.
 * @example
 * rows.filter(row => evalFilter(row, ["quantity", ">=", 10]));
 */
export function evalFilter(item: Record<string, any>, filter: DataFilter, functions?: FilterFunctionRegistry): boolean {
    const filterFunctions = functions ? { ...DEFAULT_FILTER_FUNCTIONS, ...functions } : DEFAULT_FILTER_FUNCTIONS;
    // 1. Basic sanity check
    if (filter === undefined || filter === null) return true;
    if (!Array.isArray(filter)) {
        throw new Error(`Failed to evaluate filter. Invalid filter: Expected an array, but received ${typeof filter}.`);
    }
    if (filter.length === 0) return true;

    const [first, second, third]: Array<any> = filter;

    // 2. Handle Unary Filter: ["!", [...]]
    if (first === "!") {
        if (filter.length !== 2) {
            throw new Error(`Failed to evaluate filter. Invalid Unary Filter: Expected length 2, got ${filter.length}.`);
        }
        return !evalFilter(item, second, filterFunctions);
    }

    // 3. Handle Explicit Group Filter: ["and" | "or", ...]
    if (first === "and" || first === "or") {
        const operands = filter.slice(1);
        if (first === "and") {
            return operands.every((f, idx) => {
                try { return evalFilter(item, f, filterFunctions); }
                catch (e: any) { throw new Error(`Failed to evaluate filter. Error in "and" group at index ${idx + 1}: ${e.message}`); }
            });
        } else {
            return operands.some((f, idx) => {
                try { return evalFilter(item, f, filterFunctions); }
                catch (e: any) { throw new Error(`Failed to evaluate filter. Error in "or" group at index ${idx + 1}: ${e.message}`); }
            });
        }
    }

    // 4. Handle Binary Filter: ["Field", "Op", Value]
    if ((typeof first === "string" || (first && typeof first === "object")) && filter.length === 3) {
        const validOps = ["=", "<>", ">", ">=", "<", "<=", "startswith", "endswith", "contains", "notcontains"];
        if (validOps.includes(second)) {
            return compare(resolveSelector(item, first, filterFunctions), second, third);
        }
        // If it looks like a binary filter but has a bad operator
        throw new Error(`Failed to evaluate filter. Invalid Binary Operator: "${second}" is not supported.`);
    }

    // 5. Handle Implicit AND: [[...], [...]]
    if (Array.isArray(first)) {
        return filter.every((f, idx) => {
                try { return evalFilter(item, f, filterFunctions); }
            catch (e: any) { throw new Error(`Failed to evaluate filter. Error in implicit "and" group at index ${idx}: ${e.message}`); }
        });
    }

    // 6. Fallback for unrecognized structures
    throw new Error(`Failed to evaluate filter. Malformed Filter: Structure at ${JSON.stringify(filter)} is not a valid Binary, Unary, or Group filter.`);
}

function compare(actual: any, op: string, target: any): boolean {
    // Defensive check for null/undefined field values for string operations
    const safeActual = actual ?? "";
    const safeTarget = target ?? "";

    switch (op) {
        case "=": return target == null ? actual == null : actual === target;
        case "<>": return target == null ? actual != null : actual !== target;
        case ">": return actual > target;
        case ">=": return actual >= target;
        case "<": return actual < target;
        case "<=": return actual <= target;
        case "contains":
            return String(safeActual).toLowerCase().includes(String(safeTarget).toLowerCase());
        case "startswith":
            return String(safeActual).toLowerCase().startsWith(String(safeTarget).toLowerCase());
        case "endswith":
            return String(safeActual).toLowerCase().endsWith(String(safeTarget).toLowerCase());
        case "notcontains":
            return !String(safeActual).toLowerCase().includes(String(safeTarget).toLowerCase());
        default: return false;
    }
}

/**
 * @internal Prepares one query predicate without generated code or a persistent cache.
 * Paths, function lookup and text needles are resolved once, outside the row loop.
 * Invalid branches stay lazy so AND/OR retain evalFilter's short-circuit behavior.
 */
export function prepareFilter(filter: DataFilter, functions?: FilterFunctionRegistry,
    readMember?: (row: any, field: string) => any): (item: Record<string, any>) => boolean {
    const registry = functions ? { ...DEFAULT_FILTER_FUNCTIONS, ...functions } : DEFAULT_FILTER_FUNCTIONS;
    const accessor = (selector: FilterSelector) => {
        const field = typeof selector === "string" ? selector : selector.field;
        if (typeof field !== "string") return undefined;
        const path = field.split(".");
        const read = path.length === 1 ? (row: any) => readMember ? readMember(row, field) : row == null ? undefined : row[field] : (row: any) => {
            let value = readMember ? readMember(row, path[0]) : row == null ? undefined : row[path[0]];
            for (let index = 1; index < path.length; index++) value = value == null ? undefined : value[path[index]];
            return value;
        };
        if (typeof selector === "string") return read;
        const fn = registry[selector.function];
        if (!fn) return undefined;
        const args = selector.args ?? [];
        return (row: any) => fn(read(row), args, row);
    };
    const compile = (filter: DataFilter): ((row: Record<string, any>) => boolean) => {
        if (filter == null || (Array.isArray(filter) && filter.length === 0)) return () => true;
        if (Array.isArray(filter)) {
            const [first, op, target] = filter as any[];
            if (first === "!" && filter.length === 2) {
                const predicate = compile(op);
                return row => !predicate(row);
            }
            if (first === "and" || first === "or" || (Array.isArray(first) && filter.length !== 3)) {
                const explicit = first === "and" || first === "or";
                const predicates = (explicit ? filter.slice(1) : filter).map(part => compile(part as DataFilter));
                const or = first === "or";
                return row => {
                    for (let index = 0; index < predicates.length; index++) {
                        let matches: boolean;
                        try { matches = predicates[index](row); }
                        catch (error: any) {
                            const group = explicit ? `"${first}" group at index ${index + 1}` : `implicit "and" group at index ${index}`;
                            throw new Error(`Failed to evaluate filter. Error in ${group}: ${error.message}`);
                        }
                        if (matches === or) return or;
                    }
                    return !or;
                };
            }
            if (filter.length === 3 && (typeof first === "string" || (first && typeof first === "object"))) {
                const read = accessor(first);
                if (read) {
                    // The query's needle is constant; lowercase it once, not for every row.
                    if (["contains", "notcontains", "startswith", "endswith"].includes(op)) {
                        const needle = String(target ?? "").toLowerCase();
                        return row => {
                            const text = String(read(row) ?? "").toLowerCase();
                            switch (op) {
                                case "contains": return text.includes(needle);
                                case "notcontains": return !text.includes(needle);
                                case "startswith": return text.startsWith(needle);
                                default: return text.endsWith(needle);
                            }
                        };
                    }
                    if (["=", "<>", ">", ">=", "<", "<="].includes(op))
                        return row => compare(read(row), op, target);
                }
            }
        }
        // Reuse the interpreter's diagnostics, only if this branch is reached.
        return row => evalFilter(row, filter, registry);
    };
    return compile(filter);
}

/** Combines provided filters in AND group filter */
export function filterAnd(...filters: (DataFilter | undefined)[]): DataFilter {
    // 1. Clean out undefined and empty arrays/filters
    const validFilters = filters.filter((f): f is DataFilter => {
        if (f === undefined || f === null) return false;
        if (Array.isArray(f) && f.length === 0) return false;
        return true;
    });

    // 2. Normalize and flatten
    const flattened: DataFilter[] = [];
    for (let f of validFilters) {
        // Unwrap single-item groups: ["and", item] or ["or", item] -> item
        while ((f[0] === "and" || f[0] === "or") && f.length === 2) {
            f = f[1] as DataFilter;
        }

        // Flatten identical operators to avoid nested depth
        if (f[0] === "and") {
            flattened.push(...(f.slice(1) as DataFilter[]));
        } else {
            flattened.push(f);
        }
    }

    // 3. Base Cases after optimization
    if (flattened.length === 0) return [];
    if (flattened.length === 1) return flattened[0];

    return ["and", ...flattened] as DataFilter;
}

/** Combines provided filters in OR group filter */
export function filterOr(...filters: (DataFilter | undefined)[]): DataFilter {
    // 1. Clean out undefined and empty arrays/filters
    const validFilters = filters.filter((f): f is DataFilter => {
        if (f === undefined || f === null) return false;
        if (Array.isArray(f) && f.length === 0) return false;
        return true;
    });

    // 2. Normalize and flatten
    const flattened: DataFilter[] = [];
    for (let f of validFilters) {
        // Unwrap single-item groups: ["and", item] or ["or", item] -> item
        while ((f[0] === "and" || f[0] === "or") && f.length === 2) {
            f = f[1] as DataFilter;
        }

        // Flatten identical operators to avoid nested depth
        if (f[0] === "or") {
            flattened.push(...(f.slice(1) as DataFilter[]));
        } else {
            flattened.push(f);
        }
    }

    // 3. Base Cases after optimization
    if (flattened.length === 0) return [];
    if (flattened.length === 1) return flattened[0];

    return ["or", ...flattened] as DataFilter;
}
