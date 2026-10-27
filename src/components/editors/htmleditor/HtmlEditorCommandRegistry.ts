import type { LocalizedMessages } from "../../../localization/Messages";
import type { RemixIcon } from "../../../core/RemixIcon";
import type { HtmlEditorSelectionState } from "./HtmlEditorModel";
import type { HtmlEditorCommand, HtmlEditorMarkState } from "./HtmlEditorCommands";
import type { HtmlEditorSurface } from "./HtmlEditorSurface";
import type { HtmlEditorElement } from "./HtmlEditorModel";
import { ObservableEvent } from "../../../core/ElgoraUI";
import { getHtmlEditorStyle } from "./HtmlEditorStyles";
import { getHtmlEditorElementBehavior, isAtomic } from "./HtmlEditorStructure";
import { aggregateHtmlEditorInspectorValues, type HtmlEditorInspectionContext, type HtmlEditorInspectorCommandContext,
    type HtmlEditorInspectorField, type HtmlEditorInspectorValue, type HtmlEditorResolvedInspection,
    type HtmlEditorResolvedInspectorField } from "./HtmlEditorInspection";

/** Context supplied to every HTML editor command surface. */
export interface HtmlEditorCommandContext {
    /** The authoritative model-backed editing surface. */
    surface: HtmlEditorSurface;
    /** The inspector node currently under the command surface, when applicable. */
    targetId?: string;
    /** The remembered text selection at the time the command was requested. */
    selection?: HtmlEditorSelectionState;
    /** Resolved Basic property scope, when invoked through the inspector framework. */
    inspection?: HtmlEditorResolvedInspection;
}

/** One compact lookup choice exposed by a Basic Inspector command. */
export interface HtmlEditorCommandOption {
    /** Stable value used by the command; also suitable for persistence. */
    id: string;
    /** Localized text shown in the lookup editor. */
    text: string;
    /** Optional icon for menus and segmented choice buttons. */
    icon?: RemixIcon;
    /** Optional CSS color preview; empty string represents the default/inherited color. */
    color?: string;
    /** Retains the choice in the list while preventing it from being applied. */
    disabled?: boolean;
}

/** Legacy string lookup state used by the current Basic UI until its DataForm migration. */
export interface HtmlEditorCommandValueState {
    /** Current option ID, or undefined when the current value has no matching option. */
    value?: string;
    /** Whether compatible targets disagree; never persist this marker as an HTML value. */
    mixed?: boolean;
}

/** A command exposed by a toolbar, context menu, or node action overlay. */
export interface HtmlEditorUiCommand {
    /** Stable application-facing command identifier. */
    id: string;
    /** Localization key or literal label resolved by the registry. */
    label: string;
    /** Optional Remix Icon class. */
    icon?: string;
    /** Whether the command belongs in the current surface. */
    isVisible?: (context: HtmlEditorCommandContext) => boolean;
    /** Whether the command can currently be executed. */
    isEnabled?: (context: HtmlEditorCommandContext) => boolean;
    /** Aggregate visual state, independent from whether the command is executable. */
    getState?: (context: HtmlEditorCommandContext) => HtmlEditorMarkState;
    /** Optional compact lookup choices rendered by the Basic Inspector. */
    options?: readonly HtmlEditorCommandOption[];
    /** Current lookup value; mixed means compatible targets have different values. */
    getValue?: (context: HtmlEditorCommandContext) => HtmlEditorCommandValueState;
    /** Optional DataForm contribution; node roles and target resolution belong here, not in the view. */
    inspector?: HtmlEditorInspectorField;
    /** Executes the command against the shared editor context. */
    execute: (context: HtmlEditorCommandContext, value?: HtmlEditorInspectorValue) => boolean | void;
}

/** Shared command registry owned by HtmlEditor and consumed by all its UI surfaces. */
export class HtmlEditorCommandRegistry {
    /** Emitted when a requested command cannot be executed in its current context. */
    readonly commandFailed = new ObservableEvent<string>();
    private readonly commands = new Map<string, HtmlEditorUiCommand>();

    constructor(private readonly surface: HtmlEditorSurface, private readonly messages: LocalizedMessages,
        commands: HtmlEditorUiCommand[] = []) {
        this.registerBuiltIns();
        commands.forEach(command => this.register(command));
    }

    /** Adds or replaces an application command by its stable identifier. */
    register(command: HtmlEditorUiCommand): void { this.commands.set(command.id, command); }
    /** Returns the current command context without copying the document. */
    context(targetId?: string): HtmlEditorCommandContext {
        return { surface: this.surface, targetId, selection: this.surface.selection };
    }
    /**
     * Captures inspection intent without cloning the document or changing focus.
     * Inspected element IDs and the remembered text range coexist. Tree navigation
     * can change the inspected elements without widening the remembered range.
     * @example
     * const context = registry.inspectionContext([imageId]);
     * const fields = registry.getInspectorFields(context);
     * // A DataForm adapter retains a field binding until commit/cancel, then
     * // submits a user-chosen value with registry.executeInspectorField(binding, value).
     */
    inspectionContext(nodeIds: readonly string[] = []): HtmlEditorInspectionContext {
        const ids = [...new Set(nodeIds)];
        return { ...this.context(ids[0]), nodeIds: ids, modelVersion: this.surface.modelVersion };
    }
    /**
     * Resolves registered contributions. Element-area fields must cover every
     * inspected node directly or through an ancestor owner; text-area fields use
     * the independent range. Every command
     * chooses its own eligible targets, so alignment may bind blocks while Bold
     * binds text fragments. Empty scopes are omitted; disabled fields stay visible.
     * No built-in contributions are migrated automatically by this scaffold.
     * Capture fresh bindings after an accepted model change; do not recreate them
     * halfway through an active property edit or read them as mutable node objects.
     */
    getInspectorFields(context: HtmlEditorInspectionContext = this.inspectionContext()): HtmlEditorResolvedInspectorField[] {
        if (!this.validInspectionContext(context)) return [];
        const fields: HtmlEditorResolvedInspectorField[] = [];
        for (const command of this.commands.values()) {
            const definition = command.inspector;
            if (!definition) continue;
            const targets = structuredClone(definition.resolveTargets(context));
            if (targets.kind === "elements" ? !targets.nodeIds.length : !targets.ranges.length) continue;
            if (definition.area === "elements" && (targets.kind !== "elements"
                || context.nodeIds.some(id => !targets.nodeIds.includes(id)
                    && !targets.nodeIds.some(targetId => this.surface.findElementPath(id)?.some(node => node.id === targetId))))) continue;
            const resolved: HtmlEditorInspectorCommandContext = {
                ...context, inspection: { context, targets }
            };
            if (!(command.isVisible?.(resolved) ?? true)) continue;
            fields.push({ command, definition, context: resolved,
                value: definition.type === "data" ? definition.getValue(resolved) : undefined,
                enabled: this.surface.editable && !definition.field?.readonly && this.enabled(command, resolved) });
        }
        // Preserve group registration order and then sort fields within each group.
        const groups = new Map<string, HtmlEditorResolvedInspectorField[]>();
        for (const field of fields) {
            const group = groups.get(field.definition.group) ?? [];
            group.push(field); groups.set(field.definition.group, group);
        }
        return [...groups.values()].flatMap(group => group.sort((a, b) => (a.definition.order ?? 0) - (b.definition.order ?? 0)));
    }
    /**
     * Submits a captured binding through the same command dispatcher as menus and
     * toolbar. Rejects replaced definitions, stale documents and lost edit permission.
     * One command must apply all captured targets in one model transaction; never
     * implement a multi-target command as repeated calls to updateElement().
     */
    executeInspectorField(field: HtmlEditorResolvedInspectorField, value?: HtmlEditorInspectorValue): boolean {
        const option = typeof value === "string" ? field.command.options?.find(item => item.id === value) : undefined;
        if (!this.validInspectionContext(field.context) || !this.surface.editable
            || field.definition.field?.readonly || this.commands.get(field.command.id) !== field.command
            || field.command.inspector !== field.definition || option?.disabled) {
            this.commandFailed.invoke(field.command.id);
            return false;
        }
        // Formatting may replace nodes and restore the native range, both of
        // which can scroll the surface. Inspector edits retain the user's viewport.
        const { scrollTop, scrollLeft } = this.surface.content;
        try { return this.execute(field.command.id, field.context, value); }
        finally {
            this.surface.content.scrollTop = scrollTop;
            this.surface.content.scrollLeft = scrollLeft;
        }
    }
    /** A document edit/Undo/setHtml invalidates pinned targets; moving focus or selection does not. */
    private validInspectionContext(context: HtmlEditorInspectionContext): boolean {
        return context.surface === this.surface && !this.surface.disposed.Value
            && context.modelVersion === this.surface.modelVersion;
    }
    /** Resolves visible commands and their current enabled state for a UI surface. */
    getCommands(context: HtmlEditorCommandContext = this.context(), includeHidden = false): HtmlEditorUiCommand[] {
        return [...this.commands.values()].filter(command => includeHidden || (command.isVisible?.(context) ?? true));
    }
    /** Executes one command by id using the same registry as every menu surface. */
    execute(id: string, context: HtmlEditorCommandContext = this.context(), value?: HtmlEditorInspectorValue): boolean {
        const command = this.commands.get(id);
        // A menu/toolbar may forward a resolved field context directly. Enforce
        // its generation/permission checks here as well as in the form entry point.
        const inspection = context.inspection;
        if ((inspection && (!this.validInspectionContext(inspection.context)
            || !this.surface.editable || command?.inspector?.field?.readonly))
            || !command || (command.isVisible && !command.isVisible(context))
            || (command.isEnabled && !command.isEnabled(context))) {
            this.commandFailed.invoke(id);
            return false;
        }
        try {
            const succeeded = command.execute(context, value) !== false;
            if (!succeeded) this.commandFailed.invoke(id);
            return succeeded;
        } catch {
            this.commandFailed.invoke(id);
            return false;
        }
    }
    /** Returns the localized display label for a command. */
    label(command: HtmlEditorUiCommand): string {
        return command.label.startsWith("htmlEditor") ? this.messages.text(command.label as never) : command.label;
    }
    /** Returns whether a command is currently enabled in a context. */
    enabled(command: HtmlEditorUiCommand, context: HtmlEditorCommandContext): boolean {
        return command.isEnabled?.(context) ?? true;
    }
    /** Returns the command's aggregate visual state. */
    state(command: HtmlEditorUiCommand, context: HtmlEditorCommandContext): HtmlEditorMarkState | undefined {
        return command.getState?.(context);
    }

    private registerBuiltIns(): void {
        const selectionTargets = (context: HtmlEditorInspectionContext) => context.selection
            ? { kind: "text" as const, ranges: [context.selection] } : { kind: "text" as const, ranges: [] };
        const elementTargets = (context: HtmlEditorInspectionContext, allowed?: (item: HtmlEditorElement) => boolean) => ({
            kind: "elements" as const,
            nodeIds: context.nodeIds.filter(id => {
                const item = this.surface.findElement(id); return !!item && (!allowed || allowed(item));
            })
        });
        /**
         * Resolves inline inspection targets to their nearest editable block owner.
         * Block commands must not create authored styles on a span/strong merely
         * because the caret currently lives inside that inline element.
         */
        const blockTargets = (context: HtmlEditorInspectionContext, allowed?: (item: HtmlEditorElement) => boolean) => {
            const ids = new Set<string>();
            for (const id of context.nodeIds) {
                const path = this.surface.findElementPath(id);
                const inspected = path?.[path.length - 1];
                if (!inspected || isAtomic(inspected)) continue;
                const owner = [...path ?? []].reverse().find(item => {
                    const kind = getHtmlEditorElementBehavior(item).kind;
                    return ["textBlock", "listItem", "cell", "container"].includes(kind)
                        && (!allowed || allowed(item));
                });
                if (owner) ids.add(owner.id);
            }
            return { kind: "elements" as const, nodeIds: [...ids] };
        };
        const textAction = (type: Extract<HtmlEditorCommand["type"], "bold" | "italic" | "underline" | "strikethrough">): Partial<HtmlEditorUiCommand> => ({
            inspector: { type: "buttons", area: "text", group: "text", order: ({ bold: 10, italic: 20, underline: 30, strikethrough: 40 })[type], resolveTargets: selectionTargets }
        });
        const edit = (type: Extract<HtmlEditorCommand["type"], "bold" | "italic" | "underline" | "strikethrough">): HtmlEditorUiCommand => ({
            id: type, label: `htmlEditorToolbar.${type}`, icon: ({ bold: "ri-bold", italic: "ri-italic", underline: "ri-underline", strikethrough: "ri-strikethrough" })[type],
            isEnabled: context => context.surface.editable && !!context.selection,
            getState: context => context.surface.getMarkState(type, context.selection),
            execute: context => context.surface.execute({ type }, context.selection), ...textAction(type)
        });
        this.register(edit("bold")); this.register(edit("italic"));
        this.register(edit("underline")); this.register(edit("strikethrough"));
        this.register({
            id: "clear-formatting", label: "htmlEditorToolbar.clearFormatting", icon: "ri-eraser-fill",
            isEnabled: context => context.surface.editable && !!context.selection,
            execute: context => context.surface.execute({ type: "clearFormatting" }, context.selection),
            inspector: { type: "buttons", area: "text", group: "text", order: 50, resolveTargets: selectionTargets }
        });
        for (const type of ["undo", "redo"] as const) this.register({
            id: type, label: `htmlEditorToolbar.${type}`, icon: type === "undo" ? "ri-arrow-go-back-line" : "ri-arrow-go-forward-line",
            isEnabled: context => type === "undo" ? context.surface.canUndo : context.surface.canRedo,
            execute: context => context.surface.execute({ type })
        });
        this.register({
            id: "select-node", label: "htmlEditorInspector.selectElement", icon: "ri-focus-3-line",
            isVisible: context => !!context.targetId,
            isEnabled: context => !!context.targetId,
            execute: context => context.surface.selectNode(context.targetId)
        });
        const target = (context: HtmlEditorCommandContext): HtmlEditorElement | undefined => {
            return context.surface.findElement(context.targetId);
        };
        const styleCommand = (id: string, label: string, property: string,
            options: readonly HtmlEditorCommandOption[], values: Record<string, string>): HtmlEditorUiCommand => {
            const textStyle = property !== "text-align";
            const readState = (context: HtmlEditorCommandContext) => {
                if (textStyle) return aggregateHtmlEditorInspectorValues(context.surface.getTextStyleValues(property, context.selection)
                    .map(value => value === undefined ? undefined : Object.entries(values).find(([, css]) => css === value)?.[0] ?? value));
                const ids = context.inspection?.targets.kind === "elements"
                    ? context.inspection.targets.nodeIds : context.targetId ? [context.targetId] : [];
                const states = ids.map(nodeId => {
                    const item = context.surface.findElement(nodeId);
                    const style = item && getHtmlEditorStyle(item.styles, property);
                    return style ? Object.entries(values).find(([, css]) => css === style.value)?.[0] ?? style.value : undefined;
                });
                return aggregateHtmlEditorInspectorValues(states);
            };
            const readLegacy = (context: HtmlEditorCommandContext): HtmlEditorCommandValueState => {
                const state = readState(context);
                return state?.kind === "mixed" ? { mixed: true }
                    : state?.kind === "value" && typeof state.value === "string" ? { value: state.value } : {};
            };
            return {
                id, label, options,
                isVisible: context => context.inspection ? !!context.inspection.targets : !!target(context),
                isEnabled: context => context.surface.editable && (textStyle ? context.surface.getTextStyleValues(property, context.selection).length > 0 : context.inspection
                    ? context.inspection.targets.kind === "elements" && context.inspection.targets.nodeIds.length > 0
                    : !!target(context)),
                getValue: readLegacy,
                execute: (context, value) => {
                    if (textStyle) {
                        if (typeof value !== "string" || !(value in values)) return false;
                        const current = readState(context);
                        const nextValue = current?.kind === "value" && current.value === value ? "" : values[value];
                        return context.surface.execute({ type: "textStyle", property: property as "color" | "font-size" | "background-color", value: nextValue }, context.selection);
                    }
                    if (value === undefined && property === "text-align") {
                        const ids = context.inspection?.targets.kind === "elements"
                            ? context.inspection.targets.nodeIds : context.targetId ? [context.targetId] : [];
                        return ids.length > 0 && context.surface.updateElements(ids.map(nodeId => ({ nodeId, patch: {
                            styles: (context.surface.findElement(nodeId)?.styles ?? []).filter(entry => entry.name !== property)
                        } })));
                    }
                    if (typeof value !== "string" || !value || !(value in values) || !context.targetId) return false;
                    const ids = context.inspection?.targets.kind === "elements"
                        ? context.inspection.targets.nodeIds : [context.targetId];
                    const clear = ids.length > 0 && ids.every(nodeId => {
                        const item = context.surface.findElement(nodeId);
                        return !!item && getHtmlEditorStyle(item.styles, property)?.value === values[value];
                    });
                    const updates: { nodeId: string; patch: { styles: { name: string; value: string }[] } }[] = [];
                    ids.forEach(nodeId => {
                        const item = context.surface.findElement(nodeId); if (!item) return;
                        const styles = item.styles.filter(entry => entry.name !== property);
                        if (!clear) styles.push({ name: property, value: values[value] });
                        updates.push({ nodeId, patch: { styles } });
                    });
                    return updates.length > 0 && context.surface.updateElements(updates);
                },
                inspector: { type: "data", area: textStyle ? "text" : "elements", group: property === "text-align" ? "block" : property === "font-size" ? "format" : "appearance",
                    presentation: property === "text-align" ? "buttons" : "menu",
                    presentations: ["text.color", "text.size", "element.backgroundColor"].includes(id) ? {
                        toolbar: { appearance: "iconOnly", showValue: false, showArrow: false, tooltip: "caption",
                            icon: id === "element.backgroundColor" ? "ri-paint-fill"
                                : id === "text.color" ? "ri-font-color" : undefined }
                    } : undefined,
                    order: property === "text-align" ? 10 : property === "color" ? 30 : 40,
                    field: { dataType: "string" },
                    resolveTargets: context => textStyle ? selectionTargets(context)
                        : property === "text-align" ? blockTargets(context) : elementTargets(context, item => item.tag !== "img"),
                    getValue: context => readState(context) ?? { kind: "unset" } }
            };
        };
        const headingState = (context: HtmlEditorCommandContext) => {
            const ids = context.inspection?.targets.kind === "elements" ? context.inspection.targets.nodeIds
                : context.targetId ? [context.targetId] : [];
            return aggregateHtmlEditorInspectorValues(ids.map(id => target({ ...context, targetId: id })?.tag));
        };
        const headingLegacy = (context: HtmlEditorCommandContext): HtmlEditorCommandValueState => {
            const state = headingState(context);
            return state?.kind === "mixed" ? { mixed: true }
                : state?.kind === "value" && typeof state.value === "string" ? { value: state.value } : {};
        };
        this.register({
            id: "block.heading", label: "htmlEditorBasic.heading", icon: "ri-heading",
            options: ["p", "h1", "h2", "h3", "h4", "h5", "h6"].map(tag => ({ id: tag, text: tag === "p" ? "Paragraph" : `Heading ${tag.slice(1)}`,
                icon: tag === "p" ? "ri-paragraph" as const : "ri-heading" as const })),
            isVisible: context => context.inspection ? !!context.inspection.targets : !!target(context),
            isEnabled: context => context.surface.editable && (context.inspection ? context.inspection.targets.kind === "elements" && !!context.inspection.targets.nodeIds.length : !!target(context)),
            getValue: headingLegacy,
            execute: (context, value) => {
                if (typeof value !== "string" || !["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(value) || !context.targetId) return false;
                const ids = context.inspection?.targets.kind === "elements" ? context.inspection.targets.nodeIds : [context.targetId];
                return context.surface.updateElements(ids.map(nodeId => ({ nodeId, patch: { tag: value } })));
            },
                inspector: { type: "data", area: "elements", group: "block", order: 0, field: { dataType: "string" },
                presentation: "menu",
                resolveTargets: context => blockTargets(context, item => ["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(item.tag)),
                getValue: context => headingState(context) ?? { kind: "unset" } }
        });
        const colors = ["primary", "accent", "neutral", "success", "warning", "danger", "muted"];
        this.register(styleCommand("text.color", "htmlEditorBasic.textColor", "color", [
            ...colors.map(id => ({ id, text: id[0].toUpperCase() + id.slice(1), icon: "ri-palette-line" as const,
                color: id === "muted" ? "var(--elg-text-muted)" : `var(--elg-${id}-color)` }))
        ], Object.fromEntries(colors.map(id => [id,
            id === "muted" ? "var(--elg-text-muted)" : `var(--elg-${id}-color)`]))));
        const sizes = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 200];
        this.register(styleCommand("element.backgroundColor", "htmlEditorBasic.backgroundColor", "background-color", [
            ...colors.map(id => ({ id, text: id[0].toUpperCase() + id.slice(1), icon: "ri-palette-line" as const,
                color: id === "muted" ? "var(--elg-text-muted)" : `var(--elg-${id}-color)` }))
        ], Object.fromEntries(colors.map(id => [id,
            id === "muted" ? "var(--elg-text-muted)" : `var(--elg-${id}-color)`]))));
        this.register(styleCommand("text.size", "htmlEditorBasic.textSize", "font-size", [
            { id: "small", text: "Small (87.5%)", icon: "ri-font-size" },
            { id: "large", text: "Large (125%)", icon: "ri-font-size" },
            ...sizes.map(size => ({ id: `fs-${size}`, text: `${size}%`, icon: "ri-font-size" as const }))
        ], { small: "0.875em", large: "1.25em",
            ...Object.fromEntries(sizes.map(size => [`fs-${size}`, `${size}%`])) }));
        this.register(styleCommand("block.align", "htmlEditorBasic.align", "text-align", [
            { id: "start", text: "Start" }, { id: "center", text: "Center" }, { id: "end", text: "End" }
        ], { start: "start", center: "center", end: "end" }));
    }
}
