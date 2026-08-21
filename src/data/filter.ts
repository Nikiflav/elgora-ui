type BinaryOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "startswith" | "endswith" | "contains" | "notcontains";
type GroupOperator = "and" | "or";

/** A field name or a serializable transformation applied to a field. */
export type FilterSelector = string | {
    function: string;
    field: string;
    args?: unknown[];
};

/** Local implementations for structured filter selectors. */
export type FilterFunction = (value: any, args: unknown[], item: any) => any;
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

export type DataFilter = BinaryFilter | UnaryFilter | GroupFilter;

const DEFAULT_FILTER_FUNCTIONS: FilterFunctionRegistry = {
    firstChar: value => String(value ?? "").charAt(0),
    year: value => toDate(value)?.getFullYear(),
    yearQuarter: value => {
        const date = toDate(value);
        return date ? `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}` : value;
    },
    quarter: value => {
        const date = toDate(value);
        return date ? Math.floor(date.getMonth() / 3) + 1 : value;
    },
    month: value => toDate(value)?.getMonth()! + 1,
    yearMonth: value => {
        const date = toDate(value);
        return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : value;
    },
    week: value => {
        const date = toDate(value);
        if (!date) return value;
        const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = utc.getUTCDay() || 7;
        utc.setUTCDate(utc.getUTCDate() + 4 - day);
        const isoYear = utc.getUTCFullYear();
        const yearStart = new Date(Date.UTC(isoYear, 0, 1));
        const isoWeek = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
    },
    day: value => toDate(value)?.getDate(),
    dayOfWeek: value => {
        const date = toDate(value);
        return date ? (date.getDay() || 7) : value;
    },
    hour: value => toDate(value)?.getHours(),
    minute: value => toDate(value)?.getMinutes(),
    second: value => toDate(value)?.getSeconds()
};

function toDate(value: any): Date | undefined {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function getFieldValue(item: Record<string, any>, field: string): any {
    return field.split(".").reduce((value, part) => value == null ? undefined : value[part], item);
}

function resolveSelector(item: Record<string, any>, selector: FilterSelector, functions: FilterFunctionRegistry): any {
    if (typeof selector === "string") return getFieldValue(item, selector);
    const fn = functions[selector.function];
    if (!fn) throw new Error(`Unsupported filter function: "${selector.function}".`);
    return fn(getFieldValue(item, selector.field), selector.args ?? [], item);
}


export function evalFilter(item: Record<string, any>, filter: DataFilter, functions?: FilterFunctionRegistry): boolean {
    const filterFunctions = functions ? { ...DEFAULT_FILTER_FUNCTIONS, ...functions } : DEFAULT_FILTER_FUNCTIONS;
    // 1. Basic sanity check
    if (filter === undefined || filter === null) return true;
    if (!Array.isArray(filter)) {
        throw new Error(`Invalid filter: Expected an array, but received ${typeof filter}.`);
    }
    if (filter.length === 0) return true;

    const [first, second, third]: Array<any> = filter;

    // 2. Handle Unary Filter: ["!", [...]]
    if (first === "!") {
        if (filter.length !== 2) {
            throw new Error(`Invalid Unary Filter: Expected length 2, got ${filter.length}.`);
        }
        return !evalFilter(item, second);
    }

    // 3. Handle Explicit Group Filter: ["and" | "or", ...]
    if (first === "and" || first === "or") {
        const operands = filter.slice(1);
        if (first === "and") {
            return operands.every((f, idx) => {
                try { return evalFilter(item, f, filterFunctions); }
                catch (e: any) { throw new Error(`Error in "and" group at index ${idx + 1}: ${e.message}`); }
            });
        } else {
            return operands.some((f, idx) => {
                try { return evalFilter(item, f, filterFunctions); }
                catch (e: any) { throw new Error(`Error in "or" group at index ${idx + 1}: ${e.message}`); }
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
        throw new Error(`Invalid Binary Operator: "${second}" is not supported.`);
    }

    // 5. Handle Implicit AND: [[...], [...]]
    if (Array.isArray(first)) {
        return filter.every((f, idx) => {
                try { return evalFilter(item, f, filterFunctions); }
            catch (e: any) { throw new Error(`Error in implicit "and" group at index ${idx}: ${e.message}`); }
        });
    }

    // 6. Fallback for unrecognized structures
    throw new Error(`Malformed Filter: Structure at ${JSON.stringify(filter)} is not a valid Binary, Unary, or Group filter.`);
}

function compare(actual: any, op: string, target: any): boolean {
    // Defensive check for null/undefined field values for string operations
    const safeActual = actual ?? "";
    const safeTarget = target ?? "";

    switch (op) {
        case "=": return actual === target;
        case "<>": return actual !== target;
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
