import { getFieldDataType, type DataField } from "./DataField";
import { isPromiseLike, runSequential } from "./localProcessing";

/**
 * Aggregation kind applied to a group column's summary value.
 * `count` and `distinct` support all value types; `sum`, `avg`, `min`, and `max`
 * require a numeric column.
 */
export type SummaryType = "count" | "sum" | "avg" | "min" | "max" | "distinct" | string;

/** Context supplied to a custom summary lifecycle method. */
export interface SummaryContext<TRow> {
    /** Field being summarized. */
    field: string;
    /** Value of the group currently being accumulated. */
    groupValue: any;
    /** Current source row, when the lifecycle method is processing a row. */
    row?: TRow;
    /** Current field value, when the lifecycle method is processing a row. */
    value?: any;
}

/**
 * Defines a locally calculated summary identified by its serializable name.
 * Methods may return synchronously or asynchronously. Update only the accumulator,
 * not source rows: local queries may share a field read among several summaries.
 */
export interface SummaryDefinition<TRow, TState = any, TResult = any> {
    /** Name used in `SummaryType` requests. */
    name: string;
    /** Display text for summary selectors and documentation. */
    text: string;
    /** Whether the result can change when the input rows are sorted. Defaults to false. */
    dependsOnOrder?: boolean;
    /** Creates the accumulator state for one group and field. */
    start(context: SummaryContext<TRow>): TState | Promise<TState>;
    /** Adds one row value to the accumulator. Returning a value replaces the state. */
    accumulate(state: TState, value: any, row: TRow, context: SummaryContext<TRow>): void | TState | Promise<void | TState>;
    /** Converts the final accumulator state into the value displayed by the group row. */
    finalize(state: TState, context: SummaryContext<TRow>): TResult | Promise<TResult>;
}

/** @internal Working state for one requested summary. Shared by local data engines. */
type SummaryAccumulator = {
    request: SummaryRequest;
    definition: SummaryDefinition<any, any, any>;
    numeric: boolean;
    numericAllowed: boolean;
    fieldIndex: number;
    started: boolean;
    state: any;
};

/** @internal Identifies built-in summaries requiring numeric field values. */
export function isNumericSummary(summaryType: SummaryType): boolean {
    return summaryType === "sum" || summaryType === "avg"
        || summaryType === "min" || summaryType === "max";
}

/** A summary request for one field. Multiple summaries may target the same field. */
export type SummaryRequest = { field: string, summaryType: SummaryType };

/** A resolved summary value returned alongside the requested data. */
export type SummaryResult = { field: string, summaryType: SummaryType, value: any };

const averageSummary: SummaryDefinition<any, any, any> = {
    name: "avg",
    text: "Average",
    dependsOnOrder: false,
    start: () => ({ sum: 0, count: 0 }),
    accumulate: (state, value) => {
        state.sum += value;
        state.count++;
    },
    finalize: state => state.count ? state.sum / state.count : undefined
};

/** @internal Standard accumulator definitions; not a grid styling or rendering concern. */
export const standardSummaries: Record<string, SummaryDefinition<any, any, any>> = {
    count: {
        name: "count",
        text: "Count",
        dependsOnOrder: false,
        start: () => 0,
        accumulate: state => state + 1,
        finalize: state => state
    },
    distinct: {
        name: "distinct",
        text: "Distinct",
        dependsOnOrder: false,
        start: () => new Set<any>(),
        accumulate: (state, value) => state.add(value),
        finalize: state => state.size
    },
    sum: {
        name: "sum",
        text: "Sum",
        dependsOnOrder: false,
        start: () => ({ value: 0, hasValue: false }),
        accumulate: (state, value) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                state.value += value;
                state.hasValue = true;
            }
        },
        finalize: state => state.hasValue ? state.value : undefined
    },
    avg: averageSummary,
    min: {
        name: "min",
        text: "Minimum",
        dependsOnOrder: false,
        start: () => ({ value: Infinity, hasValue: false }),
        accumulate: (state, value) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                state.value = Math.min(state.value, value);
                state.hasValue = true;
            }
        },
        finalize: state => state.hasValue ? state.value : undefined
    },
    max: {
        name: "max",
        text: "Maximum",
        dependsOnOrder: false,
        start: () => ({ value: -Infinity, hasValue: false }),
        accumulate: (state, value) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                state.value = Math.max(state.value, value);
                state.hasValue = true;
            }
        },
        finalize: state => state.hasValue ? state.value : undefined
    }
};

/** @internal Incremental lifecycle shared by total and group summaries. One instance per bucket. */
export class SummaryCalculator<TRow> {
    private readonly states: SummaryAccumulator[] = [];

    constructor(
        summaries: SummaryRequest[],
        private readonly getValue: (row: TRow, field: string) => any | Promise<any>,
        getColumn?: (field: string) => DataField<TRow> | undefined,
        customSummaries?: SummaryDefinition<TRow, any, any>[],
        private readonly groupValue?: any
    ) {
        const fields = new Map<string, { index: number; numericAllowed: boolean }>();
        for (const request of summaries) {
            const definition = standardSummaries[request.summaryType]
                ?? customSummaries?.find(summary => summary.name === request.summaryType);
            if (!definition) continue;
            let field = fields.get(request.field);
            if (!field) {
                const column = getColumn?.(request.field);
                field = { index: fields.size,
                    numericAllowed: !column || !column.dataType || getFieldDataType(column) === "number" };
                fields.set(request.field, field);
            }
            // One state per request, even when several requests use the same field.
            this.states.push({ request, definition, numeric: isNumericSummary(request.summaryType),
                numericAllowed: field.numericAllowed, fieldIndex: field.index, started: false, state: undefined });
        }
    }

    /** Adds one row in source order. Values are resolved through the caller's field accessor. */
    accumulate(row: TRow, values?: Map<string, any>): void | Promise<void> {
        const resolved: any[] = [];
        return runSequential(this.states, state => {
            const field = state.request.field;
            // Optional cache belongs to exactly one row, shared by total/group calculators.
            // Cache promises too, and distinguish a cached undefined from a missing entry.
            let value: any;
            if (state.fieldIndex in resolved) value = resolved[state.fieldIndex];
            else {
                value = values?.has(field) ? values.get(field) : this.getValue(row, field);
                // Assimilate a custom thenable once, not once for every summary.
                if (isPromiseLike(value)) value = Promise.resolve(value);
                values?.set(field, value);
                resolved[state.fieldIndex] = value;
            }
            const consume = (value: any) => {
                const context = { field, groupValue: this.groupValue, row, value };
                const accumulate = () => {
                    if (state.numeric && (!state.numericAllowed || typeof value !== "number" || !Number.isFinite(value))) return;
                    const next = state.definition.accumulate(state.state, value, row, context);
                    const apply = (next: any) => { if (next !== undefined) state.state = next; };
                    if (isPromiseLike(next)) return Promise.resolve(next).then(apply);
                    apply(next);
                };
                if (!state.started) {
                    const initial = state.definition.start(context);
                    const start = (initial: any) => { state.state = initial; state.started = true; };
                    if (isPromiseLike(initial)) return Promise.resolve(initial).then(start).then(accumulate);
                    start(initial);
                }
                return accumulate();
            };
            return isPromiseLike(value) ? Promise.resolve(value).then(consume) : consume(value);
        });
    }

    /** Finishes started summaries; empty buckets and undefined results produce no entries. */
    async finalize(): Promise<SummaryResult[]> {
        const result: SummaryResult[] = [];
        for (const state of this.states) {
            if (!state.started) continue;
            const summary = state.request;
            const value = await state.definition.finalize(state.state, {
                field: summary.field,
                groupValue: this.groupValue
            });
            if (value !== undefined)
                result.push({ field: summary.field, summaryType: summary.summaryType, value });
        }
        return result;
    }
}

/** @internal Evaluates requested summaries over the complete supplied result, before paging. */
export async function calculateSummaryResults<TRow>(
    rows: TRow[],
    summaries: SummaryRequest[],
    getValue: (row: TRow, field: string) => any | Promise<any>,
    getColumn?: (field: string) => DataField<TRow> | undefined,
    customSummaries?: SummaryDefinition<TRow, any, any>[]
): Promise<SummaryResult[]> {
    const calculator = new SummaryCalculator(summaries, getValue, getColumn, customSummaries);
    for (const row of rows) {
        const pending = calculator.accumulate(row);
        if (isPromiseLike(pending)) await pending;
    }
    return calculator.finalize();
}
