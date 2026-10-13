import { getFieldDataType, type DataField } from "./DataField";

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

/** Defines a locally calculated summary identified by its serializable name. */
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
export type SummaryAccumulator = {
    definition: SummaryDefinition<any, any, any>;
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

/** @internal Evaluates requested summaries over the complete supplied result, before paging. */
export async function calculateSummaryResults<TRow>(
    rows: TRow[],
    summaries: SummaryRequest[],
    getValue: (row: TRow, field: string) => Promise<any>,
    getColumn?: (field: string) => DataField<TRow> | undefined,
    customSummaries?: SummaryDefinition<TRow, any, any>[]
): Promise<SummaryResult[]> {
    const states = new Map<number, SummaryAccumulator>();

    for (const row of rows) {
        for (const [index, summary] of summaries.entries()) {
            const value = await getValue(row, summary.field);
            let state = states.get(index);
            if (!state) {
                const definition = standardSummaries[summary.summaryType]
                    ?? customSummaries?.find(x => x.name === summary.summaryType);
                if (!definition) continue;
                state = {
                    definition,
                    state: await definition.start({ field: summary.field, groupValue: undefined, row, value })
                };
                states.set(index, state);
            }

            if (isNumericSummary(summary.summaryType)) {
                const summaryColumn = getColumn?.(summary.field);
                const numericColumn = !summaryColumn
                    || getFieldDataType(summaryColumn) === "number"
                    || (!summaryColumn.dataType && typeof value === "number");
                if (!numericColumn || typeof value !== "number" || !Number.isFinite(value))
                    continue;
            }

            const context = { field: summary.field, groupValue: undefined, row, value };
            const nextState = await state.definition.accumulate(state.state, value, row, context);
            if (nextState !== undefined) state.state = nextState;
        }
    }

    const result: SummaryResult[] = [];
    for (const [index, state] of states) {
        const summary = summaries[index];
        const value = await state.definition.finalize(state.state, {
            field: summary.field,
            groupValue: undefined
        });
        if (value !== undefined)
            result.push({ field: summary.field, summaryType: summary.summaryType, value });
    }
    return result;
}
