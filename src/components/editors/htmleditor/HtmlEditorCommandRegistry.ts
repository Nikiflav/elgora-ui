import type { LocalizedMessages } from "../../../localization/Messages";
import type { HtmlEditorSelectionState } from "./HtmlEditorModel";
import type { HtmlEditorCommand, HtmlEditorMarkState } from "./HtmlEditorCommands";
import type { HtmlEditorSurface } from "./HtmlEditorSurface";
import type { HtmlEditorElement } from "./HtmlEditorModel";
import { ObservableEvent } from "../../../core/ElgoraUI";

/** Context supplied to every HTML editor command surface. */
export interface HtmlEditorCommandContext {
    /** The authoritative model-backed editing surface. */
    surface: HtmlEditorSurface;
    /** The inspector node currently under the command surface, when applicable. */
    targetId?: string;
    /** The remembered text selection at the time the command was requested. */
    selection?: HtmlEditorSelectionState;
}

/** One compact lookup choice exposed by a Basic Inspector command. */
export interface HtmlEditorCommandOption {
    /** Stable value used by the command; also suitable for persistence. */
    id: string;
    /** Localized text shown in the lookup editor. */
    text: string;
    disabled?: boolean;
}

export interface HtmlEditorCommandValueState {
    value?: string;
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
    /** Executes the command against the shared editor context. */
    execute: (context: HtmlEditorCommandContext, value?: string) => boolean | void;
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
    /** Resolves visible commands and their current enabled state for a UI surface. */
    getCommands(context: HtmlEditorCommandContext = this.context()): HtmlEditorUiCommand[] {
        return [...this.commands.values()].filter(command => command.isVisible?.(context) ?? true);
    }
    /** Executes one command by id using the same registry as every menu surface. */
    execute(id: string, context: HtmlEditorCommandContext = this.context(), value?: string): boolean {
        const command = this.commands.get(id);
        if (!command || (command.isVisible && !command.isVisible(context))
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
        const edit = (type: Extract<HtmlEditorCommand["type"], "bold" | "italic">): HtmlEditorUiCommand => ({
            id: type, label: `htmlEditorToolbar.${type}`, icon: type === "bold" ? "ri-bold" : "ri-italic",
            isEnabled: context => context.surface.editable && !!context.selection,
            getState: context => context.surface.getMarkState(type, context.selection),
            execute: context => context.surface.execute({ type }, context.selection)
        });
        this.register(edit("bold")); this.register(edit("italic"));
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
            options: readonly HtmlEditorCommandOption[], values: Record<string, string>): HtmlEditorUiCommand => ({
            id, label, options,
            isVisible: context => !!target(context),
            isEnabled: context => context.surface.editable && !!target(context),
            getValue: context => {
                const item = target(context); const style = item?.styles.find(entry => entry.name === property);
                const value = Object.entries(values).find(([, css]) => css === style?.value)?.[0];
                return { value };
            },
            execute: (context, value) => {
                if (!value || !(value in values) || !context.targetId) return false;
                const item = target(context); if (!item) return false;
                const styles = item.styles.filter(entry => entry.name !== property);
                if (value !== "default") styles.push({ name: property, value: values[value] });
                return context.surface.updateElement(context.targetId, { styles });
            }
        });
        this.register({
            id: "block.heading", label: "htmlEditorBasic.heading", icon: "ri-heading",
            options: ["p", "h1", "h2", "h3"].map(tag => ({ id: tag, text: tag === "p" ? "Paragraph" : `Heading ${tag.slice(1)}` })),
            isVisible: context => !!target(context), isEnabled: context => context.surface.editable && !!target(context),
            getValue: context => ({ value: target(context)?.tag }),
            execute: (context, value) => !!value && !!context.targetId && !!target(context) && context.surface.updateElement(context.targetId, { tag: value })
        });
        this.register(styleCommand("text.color", "htmlEditorBasic.textColor", "color", [
            { id: "default", text: "Default" }, { id: "primary", text: "Primary" }, { id: "muted", text: "Muted" }
        ], { default: "", primary: "var(--elg-primary-color)", muted: "var(--elg-text-muted)" }));
        this.register(styleCommand("text.size", "htmlEditorBasic.textSize", "font-size", [
            { id: "default", text: "Default" }, { id: "small", text: "Small" }, { id: "large", text: "Large" }
        ], { default: "", small: "0.875em", large: "1.25em" }));
        this.register(styleCommand("block.align", "htmlEditorBasic.align", "text-align", [
            { id: "default", text: "Default" }, { id: "start", text: "Start" }, { id: "center", text: "Center" }, { id: "end", text: "End" }
        ], { default: "", start: "start", center: "center", end: "end" }));
    }
}
