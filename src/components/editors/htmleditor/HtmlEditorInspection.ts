import type { DataViewButtonAppearance, DataViewField } from "../../../data/DataViewField";
import type { RemixIcon } from "../../../core/RemixIcon";
import type { HtmlEditorUiCommandContext, HtmlEditorUiCommand } from "./HtmlEditorCommandRegistry";
import type { HtmlEditorNodeId, HtmlEditorSelectionRange } from "./HtmlEditorModel";

/** Values accepted by a UI command field. Undefined means reset/inherit. */
export type HtmlEditorUiCommandValue = string | number | boolean | null;

/** Aggregated authored value of a command property. */
export type HtmlEditorUiCommandValueState =
    | { readonly kind: "value"; readonly value: HtmlEditorUiCommandValue }
    | { readonly kind: "unset" }
    | { readonly kind: "mixed" };

/** Presentation slots shared by inspector, toolbar and focused command surfaces. */
export type HtmlEditorUiCommandPresentationKind = "basic" | "advanced" | "toolbar" | "focused";

/** Read-only metadata for an inspected model node. The model remains the source of truth. */
export interface HtmlEditorUiCommandNodeInfo {
    readonly id: HtmlEditorNodeId;
    readonly parentId?: HtmlEditorNodeId;
    readonly pathIds: readonly HtmlEditorNodeId[];
    readonly nodeType: "element" | "text";
    readonly role: "block" | "inline" | "inlineBlock" | "atomic" | "container" | "table"
        | "tableRow" | "tableCell" | "grid" | "gridItem" | "list" | "listItem" | "text";
    readonly tag?: string;
}

/** Captured user intent: selected nodes and remembered text range coexist. */
export interface HtmlEditorUiCommandTargetContext extends HtmlEditorUiCommandContext {
    /** Surface model generation at capture time; later generations invalidate this context. */
    readonly modelVersion: number;
    /** Read-only node metadata captured in document order. */
    readonly nodeInfos: readonly HtmlEditorUiCommandNodeInfo[];
}

/** Command-specific application units resolved from the captured intent. */
export type HtmlEditorUiCommandTargets =
    | { readonly kind: "nodes"; readonly nodeInfos: readonly HtmlEditorUiCommandNodeInfo[]; readonly complete?: boolean }
    | { readonly kind: "text"; readonly ranges: readonly HtmlEditorSelectionRange[]; readonly complete?: boolean };

/** Resolved application scope for one command. */
export interface HtmlEditorUiCommandResolution {
    readonly context: HtmlEditorUiCommandTargetContext;
    readonly targets: HtmlEditorUiCommandTargets;
}

/** Context passed to command visibility, state and execution after target resolution. */
export interface HtmlEditorUiCommandExecutionContext extends HtmlEditorUiCommandTargetContext {
    readonly resolution: HtmlEditorUiCommandResolution;
}

/** Virtual row used by DataForm projections of command fields. */
export interface HtmlEditorUiCommandFormRow {
    readonly context: HtmlEditorUiCommandTargetContext;
    readonly fields: ReadonlyMap<string, HtmlEditorResolvedUiCommandField>;
}

/** DataForm metadata shared by every command presentation. */
export type HtmlEditorUiCommandFieldPresentation = Omit<DataViewField<HtmlEditorUiCommandFormRow>,
    "name" | "type" | "buttons" | "getValue" | "getText" | "showInRow" | "hideLabel" | "labelPosition">;

/** Surface-specific visual projection of one command field. */
export interface HtmlEditorUiCommandPresentation {
    readonly control?: "data" | "buttons";
    readonly density?: "full" | "compact";
    readonly appearance?: DataViewButtonAppearance;
    readonly icon?: RemixIcon;
    readonly showValue?: boolean;
    readonly showArrow?: boolean;
    readonly tooltip?: "caption" | string;
    /** Surface-owned visual label policy; command fields only provide captions. */
    readonly showLabel?: boolean;
}

/** Shared field declaration owned by a UI command, not by a particular surface. */
interface HtmlEditorUiCommandFieldBase {
    readonly presentation?: "lookup" | "menu" | "buttons";
    readonly group: string;
    readonly order?: number;
    readonly field?: HtmlEditorUiCommandFieldPresentation;
    readonly presentations?: Partial<Record<HtmlEditorUiCommandPresentationKind, HtmlEditorUiCommandPresentation>>;
    readonly visibleIn?: readonly HtmlEditorUiCommandPresentationKind[];
    resolveTargets(context: HtmlEditorUiCommandTargetContext): HtmlEditorUiCommandTargets;
}

/** A value field or action field contributed by a UI command. */
export type HtmlEditorUiCommandField = HtmlEditorUiCommandFieldBase & (
    | {
        readonly type: "data";
        getValue(context: HtmlEditorUiCommandExecutionContext): HtmlEditorUiCommandValueState;
    }
    | {
        readonly type: "buttons";
    }
);

/** Field binding captured for one DataForm presentation. */
export interface HtmlEditorResolvedUiCommandField {
    readonly command: HtmlEditorUiCommand;
    readonly definition: HtmlEditorUiCommandField;
    readonly context: HtmlEditorUiCommandExecutionContext;
    readonly value?: HtmlEditorUiCommandValueState;
    readonly enabled: boolean;
}

/** Aggregates authored values while preserving empty strings, zero and false. */
export function aggregateHtmlEditorUiCommandValues(
    values: readonly (HtmlEditorUiCommandValue | undefined)[]
): HtmlEditorUiCommandValueState | undefined {
    if (!values.length) return undefined;
    const first = values[0];
    if (!values.every(value => Object.is(value, first))) return { kind: "mixed" };
    return first === undefined ? { kind: "unset" } : { kind: "value", value: first };
}

/* Compatibility aliases keep the public transition source-compatible for one release. */
/** @deprecated Use HtmlEditorUiCommandValue. */
export type HtmlEditorInspectorValue = HtmlEditorUiCommandValue;
/** @deprecated Use HtmlEditorUiCommandValueState. */
export type HtmlEditorInspectorValueState = HtmlEditorUiCommandValueState;
/** @deprecated Use HtmlEditorUiCommandTargetContext. */
export type HtmlEditorInspectionContext = HtmlEditorUiCommandTargetContext;
/** @deprecated Use HtmlEditorUiCommandTargets. */
export type HtmlEditorInspectorTargets = HtmlEditorUiCommandTargets;
/** @deprecated Use HtmlEditorUiCommandResolution. */
export type HtmlEditorResolvedInspection = HtmlEditorUiCommandResolution;
/** @deprecated Use HtmlEditorUiCommandExecutionContext. */
export type HtmlEditorInspectorCommandContext = HtmlEditorUiCommandExecutionContext;
/** @deprecated Use HtmlEditorUiCommandFormRow. */
export type HtmlEditorInspectionRow = HtmlEditorUiCommandFormRow;
/** @deprecated Use HtmlEditorUiCommandFieldPresentation. */
export type HtmlEditorInspectorFieldPresentation = HtmlEditorUiCommandFieldPresentation;
/** @deprecated Use HtmlEditorUiCommandPresentation. */
export type HtmlEditorInspectorSurfacePresentation = HtmlEditorUiCommandPresentation;
/** @deprecated Use HtmlEditorUiCommandField. */
export type HtmlEditorInspectorField = HtmlEditorUiCommandField;
/** @deprecated Use HtmlEditorResolvedUiCommandField. */
export type HtmlEditorResolvedInspectorField = HtmlEditorResolvedUiCommandField;

/** @deprecated Use aggregateHtmlEditorUiCommandValues. */
export const aggregateHtmlEditorInspectorValues = aggregateHtmlEditorUiCommandValues;

export type HtmlEditorUiCommandFieldDefinition = HtmlEditorUiCommandField;
