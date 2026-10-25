import { setElementProps } from "../../../core/e";
import { ValueEditor, type ValueEditorOptions } from "../ValueEditor";
import { HtmlEditorParser } from "./HtmlEditorParser";
import { HtmlEditorRenderer } from "./HtmlEditorRenderer";
import { ObservableEvent } from "../../../core/ElgoraUI";
import type { HtmlEditorDocument, HtmlEditorSelectionState } from "./HtmlEditorModel";
import { HtmlEditorDom } from "./HtmlEditorDom";
import { readHtmlEditorSelection, restoreHtmlEditorSelection } from "./HtmlEditorSelection";
import { applyHtmlEditorCommand, type HtmlEditorCommand, type HtmlEditorState } from "./HtmlEditorCommands";
import { normalizeHtmlEditorState } from "./HtmlEditorNormalize";
import { extractHtmlEditorRange } from "./HtmlEditorRange";
import { htmlEditorFragmentText } from "./HtmlEditorClipboard";
import "./HtmlEditor.css";

/** Configuration for the native rich-text editing surface. */
export interface HtmlEditorOptions extends ValueEditorOptions<string> {
    /** Empty document hint. */
    placeholder?: string;
    /** Minimum height in pixels or a CSS length. */
    minHeight?: string | number;
}

/** Rich-text editing through model commands, with scoped reconciliation for IME and noncancelable input. */
export class HtmlEditor extends ValueEditor<string> {
    readonly content: HTMLDivElement;
    /** A detached snapshot is emitted when the editor's remembered selection changes. */
    readonly selectionChanged = new ObservableEvent<HtmlEditorSelectionState | undefined>();
    private readonly domMap: HtmlEditorDom;
    private selectionState?: HtmlEditorSelectionState;
    private readonly parser = new HtmlEditorParser();
    private readonly renderer = new HtmlEditorRenderer();
    private documentModel: HtmlEditorDocument;
    private composing = false;
    private compositionPending = false;
    private observer?: MutationObserver;
    private undoStack: HtmlEditorState[] = [];
    private redoStack: HtmlEditorState[] = [];
    private nativeBefore?: HtmlEditorState;
    private nativeInputTimer?: ReturnType<typeof setTimeout>;
    private typingMarks?: HtmlEditorState["marks"];
    private baselineHtml = "";

    constructor(options: HtmlEditorOptions) {
        super(options);
        this.documentModel = this.parser.parse(options.value);
        this.content = document.createElement("div");
        this.domMap = new HtmlEditorDom(this.content);
        this.addCleanup(this.selectionChanged);
        this.addCleanup(() => this.clearNativeInputTimer());
        this.addCleanup(() => { this.domMap.reset(); this.selectionState = undefined; });
        this.content.className = "elg-html-editor-content";
        this.installControl(this.content);
        this.content.setAttribute("role", "textbox");
        this.content.setAttribute("aria-multiline", "true");
        if (options.placeholder) this.content.dataset.elgPlaceholder = options.placeholder;
        if (options.minHeight !== undefined) this.content.style.minHeight = typeof options.minHeight === "number" ? `${options.minHeight}px` : options.minHeight;
        this.listen(this.content, "beforeinput", event => this.beforeInput(event as InputEvent));
        this.listen(this.content, "keydown", event => this.keyDown(event as KeyboardEvent));
        this.listen(this.content, "input", () => {
            if (this.composing || this.compositionPending) return;
            if (this.nativeBefore && this.canEdit()) this.captureInput();
            else this.rejectNativeInput();
        });
        this.listen(this.content, "compositionstart", () => {
            if (!this.canEdit()) return;
            this.nativeBefore ??= this.snapshot();
            this.composing = true;
        });
        this.listen(this.content, "compositionend", () => {
            if (!this.composing) return;
            this.composing = false;
            this.compositionPending = true;
            // A task boundary allows the browser's default edit and final input to
            // finish; a microtask can run between native event listeners/default actions.
            this.scheduleNativeInput(() => {
                if (!this.compositionPending) return;
                this.compositionPending = false;
                if (this.canEdit()) this.captureInput();
                else this.rejectNativeInput();
            });
        });
        this.listen(this.content, "copy", event => this.copySelection(event as ClipboardEvent, false));
        this.listen(this.content, "cut", event => this.copySelection(event as ClipboardEvent, true));
        // Clipboard text enters the same model transaction/history as typed text.
        this.listen(this.content, "paste", event => {
            event.preventDefault();
            if (!this.canEdit()) return;
            const clipboard = (event as ClipboardEvent).clipboardData;
            const html = clipboard?.getData("text/html");
            if (!html || !this.execute({ type: "insertHtml", html })) {
                const text = clipboard?.getData("text/plain");
                // An empty fallback must never erase a selection after rejecting HTML.
                if (text) this.execute({ type: "insertText", text });
            }
        });
        this.listen(this.content, "drop", event => event.preventDefault());
        this.listen(this.content.ownerDocument, "selectionchange", () => {
            if (!this.composing && !this.compositionPending && !this.disposed.Value) this.captureSelection();
        });
        this.displayValue();
        this.observer = new MutationObserver(records => {
            if (this.composing || this.compositionPending || this.nativeBefore || this.disposed.Value) return;
            records = records.filter(record => !(record.type === "attributes" && record.target === this.content
                && ["contenteditable", "aria-readonly", "aria-invalid", "aria-disabled"].includes(record.attributeName ?? "")));
            if (!records.length) return;
            this.rejectNativeInput();
        });
        this.observeDom();
        this.addCleanup(() => this.observer?.disconnect());
    }

    /** Detached snapshot; mutating it does not modify the editor. */
    get document(): HtmlEditorDocument { return structuredClone(this.documentModel); }
    /** Last selection inside this editor, retained while focus moves to a toolbar or inspector. */
    get selection(): HtmlEditorSelectionState | undefined {
        const state = this.disposed.Value ? undefined : readHtmlEditorSelection(this.domMap) ?? this.selectionState;
        return state ? structuredClone(state) : undefined;
    }
    /** Live browser selection, only when both endpoints belong to this editor. */
    get nativeSelection(): Selection | null {
        if (this.disposed.Value) return null;
        const selection = this.content.ownerDocument.getSelection();
        return selection && this.content.contains(selection.anchorNode) && this.content.contains(selection.focusNode) ? selection : null;
    }
    /** Restores a saved selection. Returns false for removed nodes or a replaced document. */
    restoreSelection(state: HtmlEditorSelectionState | undefined = this.selection): boolean {
        if (this.disposed.Value || this.composing || this.compositionPending || !restoreHtmlEditorSelection(this.domMap, state)) return false;
        this.captureSelection();
        return true;
    }
    /** HTML suitable for persistence under the parser's supported-content policy. */
    get html(): string { return this.serialize(this.documentModel); }
    override resolveText(text: string): string | Promise<string> { return this.editorOptions.resolveText?.(text) ?? text; }
    /** Replaces the document and its accepted baseline. */
    setHtml(html: string): void { this.setValue(html); }
    getHtml(): string { return this.html; }
    /** Confirmation waits for the host to retry after native composition has finished. */
    override commit(): Promise<boolean> {
        return this.composing || this.compositionPending || this.nativeBefore ? Promise.resolve(false) : super.commit();
    }
    override cancel(): boolean {
        return !this.composing && !this.compositionPending && super.cancel();
    }
    /** Applies a supported operation to the model and selection in one undoable transaction. */
    execute(command: HtmlEditorCommand, selection: HtmlEditorSelectionState | undefined = this.selection): boolean {
        if (!this.canEdit() || this.composing || this.compositionPending || this.nativeBefore) return false;
        if (command.type === "undo" || command.type === "redo") return this.travel(command.type === "redo");
        if (!selection || !this.domMap.resolve(selection.anchor) || !this.domMap.resolve(selection.focus)) return false;
        const before = this.snapshot();
        before.selection = selection;
        const fragment = command.type === "insertHtml" ? this.parser.parseFragment(command.html) : undefined;
        const after = applyHtmlEditorCommand(before, this.domMap.rootId, command, this.domMap.createId, fragment);
        if (!after) return false;
        this.acceptTransaction(before, after, true);
        return true;
    }
    /** Whether the current document scope has an operation to undo. */
    get canUndo(): boolean { return this.undoStack.length > 0; }
    /** Whether the last undone operation can be reapplied. */
    get canRedo(): boolean { return this.redoStack.length > 0; }
    protected override async candidate(): Promise<string> { return this.html; }

    protected override displayValue(): void {
        this.documentModel = this.parser.parse(this.draft);
        this.domMap.reset();
        const rekey = (nodes: HtmlEditorDocument["children"]) => nodes.forEach(node => { node.id = this.domMap.createId(); if (node.type === "element") rekey(node.children); });
        rekey(this.documentModel.children);
        this.documentModel = normalizeHtmlEditorState({ document: this.documentModel }, this.domMap.rootId, this.domMap.createId).document;
        this.undoStack = [];
        this.redoStack = [];
        this.nativeBefore = undefined;
        this.clearNativeInputTimer();
        this.composing = false;
        this.compositionPending = false;
        this.typingMarks = undefined;
        this.renderModel();
        this.baselineHtml = this.html;
        // Explicit value replacement, commit and cancel establish a new document scope.
        this.updateSelection(undefined);
        this.syncControl();
    }

    protected override syncControl(): void {
        super.syncControl();
        if (!this.content) return;
        this.content.contentEditable = this.canEdit() ? "true" : "false";
        this.content.setAttribute("aria-readonly", String(!!this.editorOptions.readOnly));
    }

    private captureInput(): void {
        const before = this.nativeBefore;
        if (!before) return;
        this.nativeBefore = undefined;
        this.clearNativeInputTimer();
        const document = this.domMap.synchronize(this.parser);
        const selection = readHtmlEditorSelection(this.domMap);
        this.acceptTransaction(before, { document, selection });
    }

    /** Unannounced DOM changes are not user commands and must never enter history. */
    private rejectNativeInput(): void {
        this.nativeBefore = undefined;
        this.clearNativeInputTimer();
        this.renderModel(this.selectionState);
    }

    private clearNativeInputTimer(): void {
        if (this.nativeInputTimer !== undefined) clearTimeout(this.nativeInputTimer);
        this.nativeInputTimer = undefined;
    }

    private scheduleNativeInput(settle: () => void): void {
        this.clearNativeInputTimer();
        this.nativeInputTimer = setTimeout(() => {
            this.nativeInputTimer = undefined;
            if (!this.disposed.Value) settle();
        }, 0);
    }

    /** Permission lasts only through this native edit, not until some later unrelated input. */
    private allowNativeInput(selection?: HtmlEditorSelectionState): void {
        const before = this.nativeBefore ?? this.snapshot();
        if (selection) before.selection = selection;
        this.nativeBefore = before;
        this.scheduleNativeInput(() => {
            if (this.nativeBefore !== before || this.composing || this.compositionPending) return;
            // Also settle browsers that mutate without emitting the matching input event.
            if (this.canEdit()) this.captureInput();
            else this.rejectNativeInput();
        });
    }

    private snapshot(): HtmlEditorState { return { document: structuredClone(this.documentModel), selection: this.selection, marks: this.typingMarks ? { ...this.typingMarks } : undefined }; }

    private acceptTransaction(before: HtmlEditorState, after: HtmlEditorState, focusEditor = this.content.ownerDocument.activeElement === this.content): void {
        after = normalizeHtmlEditorState(after, this.domMap.rootId, this.domMap.createId);
        const changed = this.serialize(before.document) !== this.serialize(after.document);
        if (changed) {
            this.undoStack.push(before);
            if (this.undoStack.length > 100) this.undoStack.shift();
            this.redoStack = [];
        }
        this.documentModel = after.document;
        this.draft = this.html === this.baselineHtml ? this.accepted : this.html;
        this.renderModel(after.selection, focusEditor);
        this.typingMarks = after.marks;
        if (changed) this.notifyInput();
    }

    private travel(redo: boolean): boolean {
        const from = redo ? this.redoStack : this.undoStack;
        const state = from.pop();
        if (!state) return false;
        (redo ? this.undoStack : this.redoStack).push(this.snapshot());
        this.documentModel = state.document;
        this.draft = this.html === this.baselineHtml ? this.accepted : this.html;
        this.renderModel(state.selection, true);
        this.typingMarks = state.marks;
        this.notifyInput();
        return true;
    }

    private observeDom(): void {
        this.observer?.observe(this.content, { childList: true, characterData: true, attributes: true, subtree: true });
    }

    private renderModel(selection?: HtmlEditorSelectionState, focusEditor = this.content.ownerDocument.activeElement === this.content): void {
        this.observer?.disconnect();
        try {
            setElementProps(this.content, { vnodes: this.renderer.render(this.documentModel, false, true) });
            this.renderer.applyAttributes(this.content, this.documentModel);
            this.domMap.bind(this.documentModel);
            if (selection && restoreHtmlEditorSelection(this.domMap, selection, focusEditor))
                this.updateSelection(readHtmlEditorSelection(this.domMap));
            else this.updateSelection(undefined);
        } finally { this.observeDom(); }
    }

    private beforeInput(event: InputEvent): void {
        if (event.defaultPrevented) return;
        if (!this.canEdit()) { event.preventDefault(); return; }
        if (this.composing || this.compositionPending) return;
        if (event.isComposing) {
            // Some platforms omit compositionstart. Scope this edit without leaving
            // the editor stuck in a composition that may never emit compositionend.
            this.allowNativeInput();
            return;
        }
        const types: Record<string, HtmlEditorCommand> = {
            insertText: { type: "insertText", text: event.data ?? "" },
            insertReplacementText: { type: "insertText", text: event.data ?? "" },
            deleteContentBackward: { type: "deleteBackward" }, deleteContentForward: { type: "deleteForward" },
            insertParagraph: { type: "insertParagraph" }, insertLineBreak: { type: "insertLineBreak" },
            formatBold: { type: "bold" }, formatItalic: { type: "italic" },
            historyUndo: { type: "undo" }, historyRedo: { type: "redo" }
        };
        // Autocorrect and word deletions may supply a range different from the visible selection.
        const target = event.getTargetRanges?.()[0];
        let targetSelection: HtmlEditorSelectionState | undefined;
        if (target) {
            const anchor = this.domMap.position(target.startContainer, target.startOffset);
            const focus = this.domMap.position(target.endContainer, target.endOffset);
            if (anchor && focus) targetSelection = { anchor, focus };
        }
        if (!event.cancelable) {
            this.allowNativeInput(targetSelection);
            return;
        }
        // Always cancel before executing: unsupported commands/structures must not
        // silently fall through to a browser-specific DOM editing implementation.
        event.preventDefault();
        const command = types[event.inputType];
        const visible = this.selection;
        const caretDeletion = ["deleteContentBackward", "deleteContentForward"].includes(event.inputType)
            && visible && visible.anchor.nodeId === visible.focus.nodeId && visible.anchor.offset === visible.focus.offset;
        // At block boundaries browsers may report a target range spanning different
        // structural parents. Our deletion commands already compute the character
        // or block join from the caret, including paragraph-to-list joins.
        if (command) this.execute(command, caretDeletion ? visible : targetSelection ?? visible);
    }

    private keyDown(event: KeyboardEvent): void {
        if (event.defaultPrevented || event.isComposing || this.composing || this.compositionPending || event.altKey) return;
        if (event.key === "Tab" && !event.ctrlKey && !event.metaKey) {
            if (this.execute({ type: event.shiftKey ? "outdent" : "indent" })) event.preventDefault();
            return;
        }
        if (!(event.ctrlKey || event.metaKey)) return;
        const key = event.key.toLowerCase();
        const type = key === "z" ? (event.shiftKey ? "redo" : "undo") : key === "y" ? "redo" : key === "b" ? "bold" : key === "i" ? "italic" : undefined;
        if (type) {
            event.preventDefault();
            this.execute({ type });
        }
    }

    private captureSelection(): void {
        const current = readHtmlEditorSelection(this.domMap);
        if (current) this.updateSelection(current);
        else if (this.selectionState) {
            const anchor = this.domMap.resolve(this.selectionState.anchor);
            const focus = this.domMap.resolve(this.selectionState.focus);
            this.updateSelection(anchor && focus ? {
                anchor: this.domMap.position(anchor.node, anchor.offset)!,
                focus: this.domMap.position(focus.node, focus.offset)!
            } : undefined);
        }
    }

    private updateSelection(state?: HtmlEditorSelectionState): void {
        if (JSON.stringify(state) === JSON.stringify(this.selectionState)) return;
        this.typingMarks = undefined;
        this.selectionState = state ? structuredClone(state) : undefined;
        this.selectionChanged.invoke(state ? structuredClone(state) : undefined);
    }

    /** Clipboard export uses only a live in-editor selection, never a stale toolbar bookmark.
     * Prevent native export even on failure, so view fillers/runtime attributes cannot leak.
     * Cut changes the model only after both synchronous clipboard representations are accepted.
     */
    private copySelection(event: ClipboardEvent, cut: boolean): void {
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (this.disposed.Value || this.composing || this.compositionPending || this.nativeBefore || (cut && !this.canEdit())) return;
        const selection = this.nativeSelection && readHtmlEditorSelection(this.domMap);
        if (!selection || !event.clipboardData) return;
        const fragment = extractHtmlEditorRange(this.documentModel, this.domMap.rootId, selection);
        if (!fragment?.children.length) return;
        try {
            event.clipboardData.setData("text/html", this.serialize(fragment));
            event.clipboardData.setData("text/plain", htmlEditorFragmentText(fragment));
        } catch {
            // Clipboard access is not guaranteed (including synthetic/restricted events).
            // Retain the original model, selection and history if either write fails.
            return;
        }
        if (cut) this.execute({ type: "deleteBackward" }, selection);
    }

    private serialize(model: HtmlEditorDocument): string {
        const host = this.content.ownerDocument.createElement("div");
        setElementProps(host, { vnodes: this.renderer.render(model, false) });
        this.renderer.applyAttributes(host, model);
        // HTML parsing consumes one LF immediately after a pre start tag. Add
        // that syntactic LF only to export DOM, so save/paste round trips retain
        // an authored leading newline without changing the editable model.
        for (const pre of host.querySelectorAll("pre")) {
            if (pre.firstChild?.nodeType === 3 && pre.firstChild.textContent?.startsWith("\n"))
                pre.insertBefore(host.ownerDocument.createTextNode("\n"), pre.firstChild);
        }
        return host.innerHTML;
    }
}
