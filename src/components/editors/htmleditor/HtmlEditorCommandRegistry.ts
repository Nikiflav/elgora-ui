import type { LocalizedMessages } from "../../../localization/Messages";
import type { RemixIcon } from "../../../core/RemixIcon";
import type { HtmlEditorSelectionRange } from "./HtmlEditorModel";
import type { HtmlEditorCommand, HtmlEditorUiCommandState } from "./HtmlEditorCommands";
import type { HtmlEditorSurface } from "./HtmlEditorSurface";
import type { HtmlEditorElement } from "./HtmlEditorModel";
import { ObservableEvent } from "../../../core/ElgoraUI";
import { getHtmlEditorStyle } from "./HtmlEditorStyles";
import { getHtmlEditorElementBehavior, isAtomic } from "./HtmlEditorStructure";
import { aggregateHtmlEditorUiCommandValues, type HtmlEditorUiCommandTargetContext, type HtmlEditorUiCommandExecutionContext,
    type HtmlEditorUiCommandField, type HtmlEditorUiCommandValue, type HtmlEditorUiCommandValueState, type HtmlEditorUiCommandResolution,
    type HtmlEditorResolvedUiCommandField, type HtmlEditorUiCommandNodeInfo, type HtmlEditorUiCommandTargets } from "./HtmlEditorInspection";

/** Context supplied to every HTML editor command surface. */
export interface HtmlEditorUiCommandContext {
    /** The authoritative model-backed editing surface. */
    surface: HtmlEditorSurface;
    /** The node currently under the command surface, when applicable. */
    targetId?: string;
    /** The remembered text selection at the time the command was requested. */
    selection?: HtmlEditorSelectionRange;
    /** Resolved property scope, when invoked through a command field surface. */
    resolution?: HtmlEditorUiCommandResolution;
}

/** One compact lookup choice exposed by a UI command. */
export interface HtmlEditorUiCommandOption {
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

/** @deprecated Use HtmlEditorUiCommandContext. */
export type HtmlEditorCommandContext = HtmlEditorUiCommandContext;

/** A URL is accepted when it has no scheme (relative/anchor) or uses an explicit safe scheme. */
export function isSafeHtmlEditorHref(value: string): boolean {
    return !/^[a-z][a-z0-9+.-]*:/i.test(value) || /^(https?:|mailto:|tel:)/i.test(value);
}

/** A command exposed by a toolbar, context menu, or node action overlay. */
export interface HtmlEditorUiCommand {
    /** Stable application-facing command identifier. */
    id: string;
    /** Localization key or literal label resolved by the registry. */
    label: string;
    /** Optional localization key or literal tooltip; defaults to the label. */
    tooltip?: string;
    /** Optional Remix Icon class. */
    icon?: string;
    /** Whether the command belongs in the current surface. */
    isVisible?: (context: HtmlEditorUiCommandContext) => boolean;
    /** Whether the command can currently be executed. */
    isEnabled?: (context: HtmlEditorUiCommandContext) => boolean;
    /** Aggregate visual state, independent from whether the command is executable. */
    getState?: (context: HtmlEditorUiCommandContext) => HtmlEditorUiCommandState;
    /** Optional lookup choices rendered by a command field. */
    options?: readonly HtmlEditorUiCommandOption[];
    /** Current lookup value; mixed means compatible targets have different values. */
    getValue?: (context: HtmlEditorUiCommandContext) => HtmlEditorUiCommandValueState | undefined;
    /** Optional DataForm contribution; node roles and target resolution belong here, not in the view. */
    field?: HtmlEditorUiCommandField;
    /** Executes the command against the shared editor context. */
    execute: (context: HtmlEditorUiCommandContext, value?: HtmlEditorUiCommandValue) => boolean | void;
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
    context(targetId?: string): HtmlEditorUiCommandContext {
        return { surface: this.surface, targetId, selection: this.surface.selection };
    }
    /**
     * Captures inspection intent without cloning the document or changing focus.
     * Inspected element IDs and the remembered text range coexist. Tree navigation
     * can change the inspected elements without widening the remembered range.
     * @example
     * const context = registry.uiCommandTargetContext([imageId]);
     * const fields = registry.getUiCommandFields(context);
     * // A DataForm adapter retains a field binding until commit/cancel, then
     * // submits a user-chosen value with registry.executeUiCommandField(binding, value).
     */
    uiCommandTargetContext(nodeInfos: readonly (string | HtmlEditorUiCommandNodeInfo)[] = []): HtmlEditorUiCommandTargetContext {
        const infos = [...new Map(nodeInfos.map(value => {
            const id = typeof value === "string" ? value : value.id;
            return [id, typeof value === "string" ? this.nodeInfo(id) : value] as const;
        }))].map(([, info]) => info).filter((info): info is HtmlEditorUiCommandNodeInfo => !!info);
        return { ...this.context(infos[0]?.id), nodeInfos: infos, modelVersion: this.surface.modelVersion };
    }
    /** @deprecated Use uiCommandTargetContext. */
    inspectionContext(nodeInfos: readonly (string | HtmlEditorUiCommandNodeInfo)[] = []): HtmlEditorUiCommandTargetContext {
        return this.uiCommandTargetContext(nodeInfos);
    }
    private nodeInfo(id: string): HtmlEditorUiCommandNodeInfo | undefined {
        const item = this.surface.findElement(id);
        const path = this.surface.findElementPath(id);
        if (!item || !path) return undefined;
        const behavior = getHtmlEditorElementBehavior(item).kind;
        const role = behavior === "textBlock" ? "block" : behavior === "cell" ? "tableCell"
            : behavior === "listItem" ? "listItem" : behavior === "list" ? "list"
                : behavior === "table" ? "table" : behavior === "atomic" ? "atomic"
                    : behavior === "container" ? "container" : "inline";
        return { id, parentId: path.length > 1 ? path[path.length - 2].id : undefined,
            pathIds: path.map(node => node.id), nodeType: "element", role, tag: item.tag };
    }
    /**
     * Resolves registered command fields. Each resolver declares its own
     * application units, so alignment may bind blocks while Bold binds text
     * fragments. Incomplete target sets are omitted; disabled fields stay visible.
     * No built-in contributions are migrated automatically by this scaffold.
     * Capture fresh bindings after an accepted model change; do not recreate them
     * halfway through an active property edit or read them as mutable node objects.
     */
    getUiCommandFields(context: HtmlEditorUiCommandTargetContext = this.uiCommandTargetContext()): HtmlEditorResolvedUiCommandField[] {
        if (!this.validInspectionContext(context)) return [];
        const fields: HtmlEditorResolvedUiCommandField[] = [];
        for (const command of this.commands.values()) {
            const definition = command.field;
            if (!definition || definition.visibleIn && !definition.visibleIn.includes("basic")) continue;
            const targets = structuredClone(definition.resolveTargets(context));
            if (targets.kind === "nodes" ? !targets.nodeInfos.length : !targets.ranges.length) continue;
            if (targets.complete === false) continue;
            const resolved: HtmlEditorUiCommandExecutionContext = {
                ...context, resolution: { context, targets }
            };
            if (!(command.isVisible?.(resolved) ?? true)) continue;
            fields.push({ command, definition, context: resolved,
                value: definition.type === "data" ? definition.getValue(resolved) : undefined,
                enabled: this.surface.editable && !definition.field?.readonly && this.enabled(command, resolved) });
        }
        // Preserve group registration order and then sort fields within each group.
        const groups = new Map<string, HtmlEditorResolvedUiCommandField[]>();
        for (const field of fields) {
            const group = groups.get(field.definition.group) ?? [];
            group.push(field); groups.set(field.definition.group, group);
        }
        return [...groups.values()].flatMap(group => group.sort((a, b) => (a.definition.order ?? 0) - (b.definition.order ?? 0)));
    }
    /**
     * Resolves preview targets for any command surface, independently of the
     * presentation slot in which the command field is visible. This is used
     * by overlays so a toolbar command previews its own targets rather than
     * falling back to the enclosing inspected node.
     */
    resolveUiCommandTargets(commandId: string,
        context: HtmlEditorUiCommandTargetContext = this.uiCommandTargetContext()): HtmlEditorUiCommandTargets | undefined {
        if (!this.validInspectionContext(context)) return undefined;
        const command = this.commands.get(commandId), definition = command?.field;
        if (!command || !definition) return undefined;
        const targets = structuredClone(definition.resolveTargets(context));
        if (targets.complete === false || targets.kind === "nodes" && !targets.nodeInfos.length
            || targets.kind === "text" && !targets.ranges.length) return undefined;
        const resolved: HtmlEditorUiCommandExecutionContext = { ...context, resolution: { context, targets } };
        return command.isVisible?.(resolved) === false ? undefined : targets;
    }
    /** @deprecated Use getUiCommandFields. */
    getInspectorFields(context: HtmlEditorUiCommandTargetContext = this.uiCommandTargetContext()): HtmlEditorResolvedUiCommandField[] {
        return this.getUiCommandFields(context);
    }
    /**
     * Submits a captured binding through the same command dispatcher as menus and
     * toolbar. Rejects replaced definitions, stale documents and lost edit permission.
     * One command must apply all captured targets in one model transaction; never
     * implement a multi-target command as repeated calls to updateElement().
     */
    executeUiCommandField(field: HtmlEditorResolvedUiCommandField, value?: HtmlEditorUiCommandValue): boolean {
        const option = typeof value === "string" ? field.command.options?.find(item => item.id === value) : undefined;
        if (!this.validInspectionContext(field.context) || !this.surface.editable
            || field.definition.field?.readonly || this.commands.get(field.command.id) !== field.command
            || field.command.field !== field.definition || option?.disabled) {
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
    /** @deprecated Use executeUiCommandField. */
    executeInspectorField(field: HtmlEditorResolvedUiCommandField, value?: HtmlEditorUiCommandValue): boolean {
        return this.executeUiCommandField(field, value);
    }
    /** A document edit/Undo/setHtml invalidates pinned targets; moving focus or selection does not. */
    private validInspectionContext(context: HtmlEditorUiCommandTargetContext): boolean {
        return context.surface === this.surface && !this.surface.disposed.Value
            && context.modelVersion === this.surface.modelVersion;
    }
    /** Resolves visible commands and their current enabled state for a UI surface. */
    getCommands(context: HtmlEditorUiCommandContext = this.context(), includeHidden = false): HtmlEditorUiCommand[] {
        return [...this.commands.values()].filter(command => includeHidden || (command.isVisible?.(context) ?? true));
    }
    /** Executes one command by id using the same registry as every menu surface. */
    execute(id: string, context: HtmlEditorUiCommandContext = this.context(), value?: HtmlEditorUiCommandValue): boolean {
        const command = this.commands.get(id);
        // A menu/toolbar may forward a resolved field context directly. Enforce
        // its generation/permission checks here as well as in the form entry point.
        const resolution = context.resolution;
        if ((resolution && (!this.validInspectionContext(resolution.context)
            || !this.surface.editable || command?.field?.field?.readonly))
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
    /** Returns the command tooltip, falling back to its visible label. */
    tooltip(command: HtmlEditorUiCommand): string {
        return command.tooltip
            ? command.tooltip.startsWith("htmlEditor") ? this.messages.text(command.tooltip as never) : command.tooltip
            : this.label(command);
    }
    /** Returns whether a command is currently enabled in a context. */
    enabled(command: HtmlEditorUiCommand, context: HtmlEditorUiCommandContext): boolean {
        return command.isEnabled?.(context) ?? true;
    }
    /** Returns the command's aggregate visual state. */
    state(command: HtmlEditorUiCommand, context: HtmlEditorUiCommandContext): HtmlEditorUiCommandState | undefined {
        return command.getState?.(context);
    }

    private registerBuiltIns(): void {
        const selectionTargets = (context: HtmlEditorUiCommandTargetContext) => context.selection
            ? { kind: "text" as const, ranges: [context.selection] } : { kind: "text" as const, ranges: [] };
        const clearFormattingTargets = (context: HtmlEditorUiCommandTargetContext) => {
            const textTargets = selectionTargets(context);
            if (!textTargets.ranges.length || !context.nodeInfos.length) return textTargets;
            const coverage = this.surface.getSelectionCoverage(context.selection);
            if (!context.nodeInfos.every(info => coverage.get(info.id) === "full")) return textTargets;
            return { kind: "nodes" as const, complete: true, nodeInfos: context.nodeInfos };
        };
        const linkIds = (context: HtmlEditorUiCommandContext): string[] => {
            const ids = new Set<string>();
            const addPath = (nodeId?: string) => this.surface.findElementPath(nodeId)?.filter(node => node.tag === "a")
                .forEach(node => ids.add(node.id));
            for (const nodeId of this.surface.getSelectionCoverage(context.selection).keys()) addPath(nodeId);
            addPath(context.selection?.anchor.nodeId); addPath(context.selection?.focus.nodeId);
            context.resolution?.context.nodeInfos.forEach(info => addPath(info.id));
            return [...ids];
        };
        const hasTextRange = (selection?: HtmlEditorSelectionRange) => !!selection
            && (selection.anchor.nodeId !== selection.focus.nodeId || selection.anchor.offset !== selection.focus.offset);
        const linkValue = (context: HtmlEditorUiCommandContext, property: "href" | "target" | "title") =>
            aggregateHtmlEditorUiCommandValues(linkIds(context).map(id => this.surface.findElement(id)?.attributes[property]));
        const linkAttribute = (id: string, property: "href" | "target" | "title", label: string, order: number,
            options?: readonly HtmlEditorUiCommandOption[]): HtmlEditorUiCommand => ({
            id, label, options,
            isVisible: context => !!context.selection,
            isEnabled: context => context.surface.editable
                && (hasTextRange(context.selection) || linkIds(context).length > 0),
            getValue: context => linkValue(context, property) ?? { kind: "unset" },
            execute: (context, value) => typeof value === "string" && (property !== "href" || (!!value && isSafeHtmlEditorHref(value)))
                && (!options || options.some(option => option.id === value))
                && context.surface.execute({ type: "link", property, value }, context.selection),
            field: { type: "data", group: "link", order, visibleIn: ["basic", "focused"],
                presentation: options ? "menu" : undefined,
                field: { dataType: "string", caption: label,
                    validate: property === "href" ? value => !value || isSafeHtmlEditorHref(String(value))
                        ? undefined : this.messages.text("htmlEditorBasic.invalidUrl") : undefined },
                resolveTargets: selectionTargets,
                getValue: context => linkValue(context, property) ?? { kind: "unset" } }
        });
        this.register({
            id: "link", label: "htmlEditorToolbar.link", icon: "ri-link",
            // A text range creates a link; a collapsed caret inside an existing
            // link still opens the editor so its attributes can be changed.
            isEnabled: context => context.surface.editable
                && (hasTextRange(context.selection) || linkIds(context).length > 0),
            execute: context => context.surface.restoreSelection(context.selection),
            field: { type: "buttons", group: "link", order: -10,
                visibleIn: ["toolbar"], resolveTargets: selectionTargets }
        });
        this.register(linkAttribute("link.href", "href", "htmlEditorBasic.linkUrl", 0));
        this.register(linkAttribute("link.target", "target", "htmlEditorBasic.linkTarget", 10, [
            { id: "_self", text: this.messages.text("htmlEditorBasic.linkTargetSelf") },
            { id: "_blank", text: this.messages.text("htmlEditorBasic.linkTargetBlank") }
        ]));
        this.register(linkAttribute("link.title", "title", "htmlEditorBasic.linkTitle", 20));
        this.register({
            id: "link.remove", label: "htmlEditorBasic.unlink", tooltip: "htmlEditorBasic.unlinkTooltip", icon: "ri-link-unlink",
            isVisible: context => linkIds(context).length > 0,
            isEnabled: context => context.surface.editable,
            execute: context => context.surface.execute({ type: "link", property: "remove" }, context.selection),
            field: { type: "buttons", group: "link", order: 30,
                visibleIn: ["basic", "focused"], resolveTargets: selectionTargets }
        });
        const elementTargets = (context: HtmlEditorUiCommandTargetContext, allowed?: (item: HtmlEditorElement) => boolean) => ({
            kind: "nodes" as const,
            complete: context.nodeInfos.every(info => {
                const item = this.surface.findElement(info.id); return !!item && (!allowed || allowed(item));
            }),
            nodeInfos: context.nodeInfos.filter(info => {
                const item = this.surface.findElement(info.id); return !!item && (!allowed || allowed(item));
            })
        });
        /**
         * Text color/size normally operate on text fragments. A complete
         * element selection, such as a table cell selected from the inspector,
         * instead edits the element's inherited text presentation.
         */
        const textStyleTargets = (context: HtmlEditorUiCommandTargetContext) => {
            const textTargets = selectionTargets(context);
            if (!textTargets.ranges.length || !context.nodeInfos.length) return textTargets;
            const coverage = this.surface.getSelectionCoverage(context.selection);
            if (!context.nodeInfos.every(info => coverage.get(info.id) === "full")) return textTargets;
            return elementTargets(context, item => item.tag !== "img");
        };
        const fullySelectedStyleNodeIds = (context: HtmlEditorUiCommandTargetContext): string[] => {
            const coverage = this.surface.getSelectionCoverage(context.selection);
            return context.nodeInfos.filter(info => coverage.get(info.id) === "full").map(info => info.id);
        };
        /**
         * Resolves inline inspection targets to their nearest editable block owner.
         * Block commands must not create authored styles on a span/strong merely
         * because the caret currently lives inside that inline element.
         */
        const blockTargets = (context: HtmlEditorUiCommandTargetContext, allowed?: (item: HtmlEditorElement) => boolean) => {
            const ids = new Set<string>();
            for (const info of context.nodeInfos) {
                const id = info.id;
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
            return { kind: "nodes" as const, complete: ids.size === context.nodeInfos.length,
                nodeInfos: [...ids].map(id => this.nodeInfo(id)).filter((info): info is HtmlEditorUiCommandNodeInfo => !!info) };
        };
        const textAction = (type: Extract<HtmlEditorCommand["type"], "bold" | "italic" | "underline" | "strikethrough">): Partial<HtmlEditorUiCommand> => ({
            field: { type: "buttons", group: "text", order: ({ bold: 10, italic: 20, underline: 30, strikethrough: 40 })[type], resolveTargets: selectionTargets }
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
            execute: context => context.surface.execute({ type: "clearFormatting",
                nodeIds: context.resolution?.targets.kind === "nodes"
                    ? context.resolution.targets.nodeInfos.map(info => info.id) : [] }, context.selection),
            field: { type: "buttons", group: "text", order: 50, resolveTargets: clearFormattingTargets }
        });
        for (const type of ["undo", "redo"] as const) this.register({
            id: type, label: `htmlEditorToolbar.${type}`, icon: type === "undo" ? "ri-arrow-go-back-line" : "ri-arrow-go-forward-line",
            isEnabled: context => type === "undo" ? context.surface.canUndo : context.surface.canRedo,
            execute: context => context.surface.execute({ type }),
            field: { type: "buttons", group: "history", order: type === "undo" ? 10 : 20,
                visibleIn: ["toolbar"], resolveTargets: selectionTargets }
        });
        this.register({
            id: "select-node", label: "htmlEditorInspector.selectElement", icon: "ri-focus-3-line",
            isVisible: context => !!context.targetId,
            isEnabled: context => !!context.targetId,
            execute: context => context.surface.selectNode(context.targetId)
        });
        const target = (context: HtmlEditorUiCommandContext): HtmlEditorElement | undefined => {
            return context.surface.findElement(context.targetId);
        };
        const styleCommand = (id: string, label: string, property: string,
            options: readonly HtmlEditorUiCommandOption[], values: Record<string, string>): HtmlEditorUiCommand => {
            const textStyle = property !== "text-align";
            const readState = (context: HtmlEditorUiCommandContext) => {
                if (textStyle && context.resolution?.targets.kind !== "nodes") return aggregateHtmlEditorUiCommandValues(context.surface.getTextStyleValues(property, context.selection)
                    .map(value => value === undefined ? undefined : Object.entries(values).find(([, css]) => css === value)?.[0] ?? value));
                const ids = context.resolution?.targets.kind === "nodes"
                    ? context.resolution.targets.nodeInfos.map(info => info.id) : context.targetId ? [context.targetId] : [];
                const states = ids.map(nodeId => {
                    const item = context.surface.findElement(nodeId);
                    const style = item && getHtmlEditorStyle(item.styles, property);
                    return style ? Object.entries(values).find(([, css]) => css === style.value)?.[0] ?? style.value : undefined;
                });
                return aggregateHtmlEditorUiCommandValues(states);
            };
            return {
                id, label, options,
                isVisible: context => context.resolution ? !!context.resolution.targets : !!target(context),
                isEnabled: context => context.surface.editable && (textStyle && context.resolution?.targets.kind !== "nodes"
                    ? context.surface.getTextStyleValues(property, context.selection).length > 0 : context.resolution
                    ? context.resolution.targets.kind === "nodes" && context.resolution.targets.nodeInfos.length > 0
                    : !!target(context)),
                getValue: context => readState(context) ?? { kind: "unset" },
                execute: (context, value) => {
                    if (textStyle && context.resolution?.targets.kind !== "nodes") {
                        if (typeof value !== "string" || !(value in values)) return false;
                        const current = readState(context);
                        const nextValue = current?.kind === "value" && current.value === value ? "" : values[value];
                        return context.surface.execute({ type: "textStyle", property: property as "color" | "font-size" | "background-color", value: nextValue,
                            nodeIds: context.resolution ? fullySelectedStyleNodeIds(context.resolution.context) : [] }, context.selection);
                    }
                    if (value === undefined && property === "text-align") {
                        const ids = context.resolution?.targets.kind === "nodes"
                            ? context.resolution.targets.nodeInfos.map(info => info.id) : context.targetId ? [context.targetId] : [];
                        return ids.length > 0 && context.surface.updateElements(ids.map(nodeId => ({ nodeId, patch: {
                            styles: (context.surface.findElement(nodeId)?.styles ?? []).filter(entry => entry.name !== property)
                        } })));
                    }
                    if (typeof value !== "string" || !value || !(value in values) || !context.targetId) return false;
                    const ids = context.resolution?.targets.kind === "nodes"
                        ? context.resolution.targets.nodeInfos.map(info => info.id) : [context.targetId];
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
                field: { type: "data", group: property === "text-align" ? "block" : property === "font-size" ? "format" : "appearance",
                    presentation: property === "text-align" ? "buttons" : "menu",
                    presentations: ["text.color", "text.size", "element.backgroundColor"].includes(id) ? {
                        toolbar: { appearance: "iconOnly", showValue: false, showArrow: false, tooltip: "caption",
                            icon: id === "element.backgroundColor" ? "ri-paint-fill"
                                : id === "text.color" ? "ri-font-color" : undefined }
                    } : undefined,
                    order: property === "text-align" ? 10 : property === "color" ? 30 : 40,
                    field: { dataType: "string" },
                    resolveTargets: context => textStyle ? textStyleTargets(context)
                        : property === "text-align" ? blockTargets(context) : elementTargets(context, item => item.tag !== "img"),
                    getValue: context => readState(context) ?? { kind: "unset" } }
            };
        };
        const headingState = (context: HtmlEditorUiCommandContext) => {
            const ids = context.resolution?.targets.kind === "nodes" ? context.resolution.targets.nodeInfos.map(info => info.id)
                : context.targetId ? [context.targetId] : [];
            return aggregateHtmlEditorUiCommandValues(ids.map(id => target({ ...context, targetId: id })?.tag));
        };
        this.register({
            id: "block.heading", label: "htmlEditorBasic.heading", icon: "ri-heading",
            options: ["p", "h1", "h2", "h3", "h4", "h5", "h6"].map(tag => ({ id: tag, text: tag === "p" ? "Paragraph" : `Heading ${tag.slice(1)}`,
                icon: tag === "p" ? "ri-paragraph" as const : "ri-heading" as const })),
            isVisible: context => context.resolution ? !!context.resolution.targets : !!target(context),
            isEnabled: context => context.surface.editable && (context.resolution ? context.resolution.targets.kind === "nodes" && !!context.resolution.targets.nodeInfos.length : !!target(context)),
            getValue: context => headingState(context) ?? { kind: "unset" },
            execute: (context, value) => {
                if (typeof value !== "string" || !["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(value) || !context.targetId) return false;
                const ids = context.resolution?.targets.kind === "nodes" ? context.resolution.targets.nodeInfos.map(info => info.id) : [context.targetId];
                return context.surface.updateElements(ids.map(nodeId => ({ nodeId, patch: { tag: value } })));
            },
                field: { type: "data", group: "block", order: 0, field: { dataType: "string" },
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

