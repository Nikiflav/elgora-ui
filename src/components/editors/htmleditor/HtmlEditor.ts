import { e } from "../../../core/e";
import { ValueEditor, type ValueEditorOptions } from "../ValueEditor";
import { HtmlEditorSurface } from "./HtmlEditorSurface";
import { HtmlEditorToolbar } from "./HtmlEditorToolbar";
import { HtmlEditorInspector } from "./HtmlEditorInspector";
import type { HtmlEditorCommand } from "./HtmlEditorCommands";
import type { HtmlEditorSelectionState } from "./HtmlEditorModel";
import { HtmlEditorCommandRegistry, type HtmlEditorUiCommand } from "./HtmlEditorCommandRegistry";
import { HtmlEditorCommandMenu } from "./HtmlEditorCommandMenu";
import { HtmlEditorSelectionOverlay } from "./HtmlEditorSelectionOverlay";
import "./HtmlEditor.css";

/** Configuration for the HTML value editor and its optional surrounding tools. */
export interface HtmlEditorOptions extends ValueEditorOptions<string> {
    /** Empty document hint. */
    placeholder?: string;
    /** Minimum editing-area height in pixels or a CSS length. */
    minHeight?: string | number;
    /** Creates the built-in command toolbar. Defaults to false. */
    toolbar?: boolean;
    /** Creates the right-side inspector scaffold. Defaults to false. */
    inspector?: boolean;
    /** Additional commands exposed by the toolbar, context menu and inspector actions. */
    commands?: HtmlEditorUiCommand[];
}

/** Orchestrates one editing surface and optional tools; owns the sole commit/cancel lifecycle. */
export class HtmlEditor extends ValueEditor<string> {
    /** Sole owner of the editable model, DOM mapping, text selection and history. */
    readonly surface: HtmlEditorSurface;
    /** Native editing area, retained for compatibility with the compact editor API. */
    readonly content: HTMLDivElement;
    /** Same event as surface.selectionChanged; no second selection state is maintained. */
    readonly selectionChanged: HtmlEditorSurface["selectionChanged"];
    /** Owned toolbar, present only when enabled at construction. */
    readonly toolbar?: HtmlEditorToolbar;
    /** Owned inspector scaffold, present only when enabled at construction. */
    readonly inspector?: HtmlEditorInspector;
    /** Shared command source consumed by all optional editor tools. */
    readonly commandRegistry: HtmlEditorCommandRegistry;
    /** Context menu backed by the same registry as the toolbar and inspector. */
    private commandMenu?: HtmlEditorCommandMenu;
    private readonly selectionOverlay: HtmlEditorSelectionOverlay;
    private baselineHtml = "";
    private commandToast?: HTMLElement;
    private commandToastTimer?: ReturnType<typeof setTimeout>;

    /** Creates and connects the surface and requested tools. */
    constructor(options: HtmlEditorOptions) {
        const { toolbar, inspector, placeholder, minHeight, commands, ...valueOptions } = options;
        super(valueOptions);
        this.dom.classList.add("elg-html-editor");
        this.surface = new HtmlEditorSurface({ html: options.value, label: options.label,
            placeholder, minHeight, readOnly: options.readOnly, disabled: options.disabled });
        this.content = this.surface.content;
        this.selectionChanged = this.surface.selectionChanged;
        this.installControl(this.content);
        const body = e("div", { class: "elg-html-editor-body" });
        this.dom.insertBefore(body, this.content);
        const surfaceHost = e("div", { class: "elg-html-editor-surface-host" });
        body.append(surfaceHost);
        this.surface.mount(surfaceHost);
        this.selectionOverlay = new HtmlEditorSelectionOverlay(this.surface);
        this.selectionOverlay.attach(surfaceHost);
        this.addCleanup(this.selectionOverlay);
        this.commandRegistry = new HtmlEditorCommandRegistry(this.surface, this.messages, commands);
        this.subscribe(this.commandRegistry.commandFailed, () => this.showCommandFailure());
        this.listen(this.content, "contextmenu", event => {
            const menuEvent = event as MouseEvent;
            menuEvent.preventDefault();
            if (!this.commandMenu) {
                this.commandMenu = new HtmlEditorCommandMenu(this.commandRegistry);
                this.addCleanup(this.commandMenu);
            }
            this.commandMenu.showAt(menuEvent.clientX, menuEvent.clientY);
        });
        this.subscribe(this.surface.input, () => {
            const html = this.html;
            this.draft = html === this.baselineHtml ? this.accepted : html;
            this.notifyInput();
        });
        if (toolbar) {
            this.toolbar = new HtmlEditorToolbar(this.commandRegistry, this.messages);
            this.append(this.toolbar);
            this.dom.insertBefore(this.toolbar.dom, body);
        }
        if (inspector) {
            this.inspector = new HtmlEditorInspector(this.surface, this.messages, this.commandRegistry,
                { locale: this.locale, localization: options.localization });
            this.inspector.mount(body);
            body.classList.add("elg-html-editor-with-inspector");
        }
        this.baselineHtml = this.html;
        this.syncControl();
    }

    /** Detached model snapshot; use commands rather than mutating it. */
    get document() { return this.surface.document; }
    /** Remembered text selection, retained while surrounding controls have focus. */
    get selection() { return this.surface.selection; }
    /** Live selection only when both endpoints belong to the surface. */
    get nativeSelection() { return this.surface.nativeSelection; }
    /** Restores a valid runtime text bookmark and focuses the surface. */
    restoreSelection(state: HtmlEditorSelectionState | undefined = this.selection): boolean { return this.surface.restoreSelection(state); }
    /** Current serialized HTML, excluding surrounding editor UI. */
    get html(): string { return this.surface.html; }
    /** Returns the current serialized draft. */
    getHtml(): string { return this.html; }
    /** Replaces content and establishes a new accepted baseline. */
    setHtml(html: string): void { this.setValue(html); }
    /** Resolves external text without editing or saving. */
    override resolveText(text: string): string | Promise<string> { return this.editorOptions.resolveText?.(text) ?? text; }
    /** Applies a command to the surface's single model/history. */
    execute(command: HtmlEditorCommand, selection: HtmlEditorSelectionState | undefined = this.selection): boolean { return this.surface.execute(command, selection); }
    /** Whether an operation can be undone in this document scope. */
    get canUndo(): boolean { return this.surface.canUndo; }
    /** Whether an undone operation can be reapplied. */
    get canRedo(): boolean { return this.surface.canRedo; }
    /** Waits for composition/native reconciliation to settle before external acceptance. */
    override commit(): Promise<boolean> { return this.surface.settled ? super.commit() : Promise.resolve(false); }
    /** Restores the accepted value unless native composition is still active. */
    override cancel(): boolean { return this.surface.settled ? super.cancel() : false; }
    protected override async candidate(): Promise<string> { return this.html; }

    protected override displayValue(): void {
        this.surface.setHtml(this.draft);
        this.baselineHtml = this.html;
        this.syncControl();
    }

    protected override syncControl(): void {
        super.syncControl();
        this.surface?.setInteractionState(!!this.editorOptions.readOnly, !!this.editorOptions.disabled || this.busy);
        this.toolbar?.update();
        this.inspector?.update();
    }

    /** Shows a short, localized, non-blocking explanation when a command cannot run. */
    private showCommandFailure(): void {
        this.commandToast ??= e("div", { class: "elg-html-editor-command-toast", role: "status" });
        this.commandToast.textContent = this.messages.text("htmlEditorCommand.failed");
        this.commandToast.setAttribute("aria-live", "polite");
        if (!this.commandToast.isConnected) this.dom.append(this.commandToast);
        this.commandToast.dataset.visible = "true";
        if (this.commandToastTimer !== undefined) clearTimeout(this.commandToastTimer);
        this.commandToastTimer = setTimeout(() => {
            if (this.commandToast) delete this.commandToast.dataset.visible;
            this.commandToastTimer = undefined;
        }, 2400);
    }
}
