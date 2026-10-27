import type { DataViewField } from "../../../data/DataViewField";
import type { HtmlEditorCommandContext, HtmlEditorUiCommand } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorNodeId, HtmlEditorSelectionState } from "./HtmlEditorModel";

/** Values accepted by Basic properties. Undefined requests reset; it is never the Mixed marker. */
export type HtmlEditorInspectorValue = string | number | boolean | null;

/**
 * Aggregated authored value of a property. Unset means every target uses its default;
 * Mixed means targets disagree. Neither state is a value to persist into HTML.
 * A concrete value outside a lookup's options remains a value, not Unset.
 */
export type HtmlEditorInspectorValueState =
    | { readonly kind: "value"; readonly value: HtmlEditorInspectorValue }
    | { readonly kind: "unset" }
    | { readonly kind: "mixed" };

/**
 * Captured inspected elements and remembered text range, independent of DOM focus.
 * Both scopes coexist. Tree navigation changes the elements without widening the
 * text range. A gesture in the surface updates both from its model selection.
 * Capture once when a field starts editing and retain it until commit/cancel.
 */
export interface HtmlEditorInspectionContext extends HtmlEditorCommandContext {
    /** Surface model generation at capture time; later generations invalidate this context. */
    readonly modelVersion: number;
    /** Inspected element IDs in document order; text selection is independently available. */
    readonly nodeIds: readonly HtmlEditorNodeId[];
}

/**
 * Command-specific application units. A resolver maps a selection to eligible
 * text fragments or element owners (e.g. paragraphs for alignment), deduplicates
 * them, and excludes structural shells that the command cannot safely change.
 * An empty list makes the field inapplicable. Resolve once and use the same units
 * for state, permissions and execution; never widen a range inside a UI adapter.
 */
export type HtmlEditorInspectorTargets =
    | { readonly kind: "elements"; readonly nodeIds: readonly HtmlEditorNodeId[] }
    | { readonly kind: "text"; readonly ranges: readonly HtmlEditorSelectionState[] };

/** A resolved scope passed to the shared command's enabled/state/execute callbacks. */
export interface HtmlEditorResolvedInspection {
    /** Original inspection intent and model generation. */
    readonly context: HtmlEditorInspectionContext;
    /** Eligible application units resolved by this particular command. */
    readonly targets: HtmlEditorInspectorTargets;
}

/** Command context after target resolution; shared by all entry points into an inspector command. */
export interface HtmlEditorInspectorCommandContext extends HtmlEditorInspectionContext {
    /** Captured targets; command handlers must use these rather than the current browser selection. */
    readonly inspection: HtmlEditorResolvedInspection;
}

/**
 * Virtual DataForm row. Its fields describe editor operations rather than node
 * members. A future DataFormAdapter reads each binding's state and submits through
 * executeInspectorField; mutating this row must never mutate the HTML model.
 */
export interface HtmlEditorInspectionRow {
    /** Context pinned for the currently displayed form. */
    readonly context: HtmlEditorInspectionContext;
    /** Fields keyed by command ID; Mixed/Unset metadata stays outside editor values. */
    readonly fields: ReadonlyMap<string, HtmlEditorResolvedInspectorField>;
}

/**
 * Existing DataViewField presentation reused by the inspector. The command ID
 * supplies name; the adapter owns reads and Mixed labels. Lookup uses the shared
 * field.lookup contract, so no second editor-type or allowed-values system exists.
 */
export type HtmlEditorInspectorFieldPresentation = Omit<DataViewField<HtmlEditorInspectionRow>,
    "name" | "type" | "buttons" | "getValue" | "getText" | "showInRow">;

/** Shared declaration for an inspector contribution attached to one registry command. */
interface HtmlEditorInspectorFieldBase {
    /** Explicit choice presentation. Defaults to lookup for data contributions. */
    readonly presentation?: "lookup" | "menu" | "buttons";
    /** Inspector area; element properties must apply to every inspected element. */
    readonly area?: "elements" | "text";
    /** Stable presentation group, e.g. typography or block; applications may define additional groups. */
    readonly group: string;
    /** Sort position within a group. Registration order breaks ties; defaults to zero. */
    readonly order?: number;
    /** Shared editor, lookup, validation and formatting metadata. */
    readonly field?: HtmlEditorInspectorFieldPresentation;
    /** Pure resolver; determine eligible targets without changing selection, DOM, model or history. */
    resolveTargets(context: HtmlEditorInspectionContext): HtmlEditorInspectorTargets;
}

/**
 * Optional Basic-tab declaration on a shared command. Register role-based commands
 * such as text.color or block.align; keep these declarations out of node instances.
 * A data contribution becomes a DataForm value field; a buttons contribution becomes
 * an action using the command's label/icon/state. Execution always stays in the registry.
 */
export type HtmlEditorInspectorField = HtmlEditorInspectorFieldBase & (
    | {
        /** Value control; values are read from all resolved targets. */
        readonly type: "data";
        /** Pure aggregate read, using the same target scope that execute receives. */
        getValue(context: HtmlEditorInspectorCommandContext): HtmlEditorInspectorValueState;
    }
    | {
        /** Action control, e.g. Bold/Italic; active/mixed state uses command.getState. */
        readonly type: "buttons";
    }
);

/**
 * One resolved field, identified by command.id. Reuse this binding during a field
 * edit; refreshing the form creates new bindings only after that edit has settled.
 * The declaration's group/order are presentation metadata, never HTML properties.
 */
export interface HtmlEditorResolvedInspectorField {
    /** Registered command; also the canonical identity of this inspector field. */
    readonly command: HtmlEditorUiCommand;
    /** UI declaration that supplied the field and its target resolver. */
    readonly definition: HtmlEditorInspectorField;
    /** Captured, command-specific target scope. */
    readonly context: HtmlEditorInspectorCommandContext;
    /** Aggregate value for data fields; absent for action fields. */
    readonly value?: HtmlEditorInspectorValueState;
    /** Availability at resolution time. Execution rechecks permissions before applying a change. */
    readonly enabled: boolean;
}

/**
 * Aggregates per-target authored values with Object.is. Undefined means unset;
 * empty text, zero, false and null remain real values. Empty input has no applicable
 * targets and returns undefined, so the caller can omit that field entirely.
 */
export function aggregateHtmlEditorInspectorValues(
    values: readonly (HtmlEditorInspectorValue | undefined)[]
): HtmlEditorInspectorValueState | undefined {
    if (!values.length) return undefined;
    const first = values[0];
    if (!values.every(value => Object.is(value, first))) return { kind: "mixed" };
    return first === undefined ? { kind: "unset" } : { kind: "value", value: first };
}
