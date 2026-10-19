import type { DataFilter, FilterSelector } from "./filter";
import type { QueryArgs } from "./DataSource";

/** @internal Small per-owner LRU. Entries hold complete results, never individual pages. */
export class LocalQueryCache<T> {
    private readonly entries = new Map<string, T>();
    constructor(private readonly capacity = 8) {}

    get(key: string | undefined): T | undefined {
        if (key === undefined) return undefined;
        const value = this.entries.get(key);
        if (value !== undefined) {
            this.entries.delete(key);
            this.entries.set(key, value);
        }
        return value;
    }

    set(key: string | undefined, value: T): void {
        if (key === undefined) return;
        this.entries.delete(key);
        this.entries.set(key, value);
        if (this.entries.size > this.capacity) this.entries.delete(this.entries.keys().next().value!);
    }

    clear(): void { this.entries.clear(); }
}

/**
 * @internal Content keys for query structure, identity keys for opaque values.
 * JSON encodes our tagged tokens, not application objects: null/undefined/NaN,
 * dates, object equality and strings such as "1" retain distinct identities.
 */
export class LocalQueryKeys {
    private readonly identities = new WeakMap<object, number>();
    private cacheable = true;
    private nextId = 0;

    value(value: any): unknown {
        if (value === null) return ["null"];
        switch (typeof value) {
            case "undefined": return ["undefined"];
            case "number": return ["number", String(value)];
            case "bigint": return ["bigint", String(value)];
            case "string": return ["string", value];
            case "boolean": return ["boolean", value];
            case "symbol": {
                // Do not retain an unbounded symbol registry just to cache queries.
                this.cacheable = false;
                return ["symbol"];
            }
            default:
                if (!this.identities.has(value)) this.identities.set(value, ++this.nextId);
                return value instanceof Date ? ["date", this.identities.get(value), String(value.getTime())]
                    : ["reference", this.identities.get(value)];
        }
    }

    private selector(selector: FilterSelector): unknown {
        return typeof selector === "string" ? selector : [selector.function, selector.field,
            selector.args?.map(value => this.value(value))];
    }

    private filter(filter?: DataFilter): unknown {
        if (!Array.isArray(filter)) return this.value(filter);
        if (filter[0] === "!") return ["!", this.filter(filter[1] as DataFilter)];
        if (filter[0] === "and" || filter[0] === "or")
            return [filter[0], ...filter.slice(1).map(part => this.filter(part as DataFilter))];
        if (filter.length === 3 && typeof filter[1] === "string")
            return [this.selector(filter[0] as FilterSelector), filter[1], this.value(filter[2])];
        return filter.map(part => this.filter(part as DataFilter));
    }

    /** Paging, count requests and AbortSignal do not change the complete result. */
    query(args: QueryArgs, extra?: unknown): string | undefined {
        this.cacheable = true;
        const key = JSON.stringify([this.filter(args.filter), args.orderby, this.value(args.parentId),
            args.groupBy?.map(group => [group.field, group.interval]), args.groupSummary, args.totalSummary, args.select, extra]);
        return this.cacheable ? key : undefined;
    }
}
