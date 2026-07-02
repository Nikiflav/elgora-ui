type BinaryOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "startswith" | "endswith" | "contains" | "notcontains";
type GroupOperator = "and" | "or";

/** [ "field", "op", value ] */
type BinaryFilter = [string, BinaryOperator, any];

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


export function evalFilter(item: Record<string, any>, filter: DataFilter): boolean {
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
                try { return evalFilter(item, f); }
                catch (e: any) { throw new Error(`Error in "and" group at index ${idx + 1}: ${e.message}`); }
            });
        } else {
            return operands.some((f, idx) => {
                try { return evalFilter(item, f); }
                catch (e: any) { throw new Error(`Error in "or" group at index ${idx + 1}: ${e.message}`); }
            });
        }
    }

    // 4. Handle Binary Filter: ["Field", "Op", Value]
    if (typeof first === "string" && filter.length === 3) {
        const validOps = ["=", "<>", ">", ">=", "<", "<=", "startswith", "endswith", "contains", "notcontains"];
        if (validOps.includes(second)) {
            return compare(item[first], second, third);
        }
        // If it looks like a binary filter but has a bad operator
        throw new Error(`Invalid Binary Operator: "${second}" is not supported.`);
    }

    // 5. Handle Implicit AND: [[...], [...]]
    if (Array.isArray(first)) {
        return filter.every((f, idx) => {
            try { return evalFilter(item, f); }
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