import { setElementProps } from "../../../core/e";
import { Component, type ComponentOptions } from "../../../core/Component";
import { HtmlEditorParser } from "./HtmlEditorParser";
import { HtmlEditorRenderer } from "./HtmlEditorRenderer";
import { ObservableEvent } from "../../../core/ElgoraUI";
import type { HtmlEditorDocument, HtmlEditorElement, HtmlEditorNode, HtmlEditorSelectionState, HtmlEditorStyle } from "./HtmlEditorModel";
import { HtmlEditorDom } from "./HtmlEditorDom";
import { readHtmlEditorSelection, restoreHtmlEditorSelection } from "./HtmlEditorSelection";
import { applyHtmlEditorCommand, getHtmlEditorMarkState, type HtmlEditorCommand, type HtmlEditorMarkState, type HtmlEditorState } from "./HtmlEditorCommands";
import { normalizeHtmlEditorState } from "./HtmlEditorNormalize";
import { extractHtmlEditorRange, getHtmlEditorRangeCoverage, type HtmlEditorNodeCoverage } from "./HtmlEditorRange";
import { htmlEditorFragmentText } from "./HtmlEditorClipboard";
import "./HtmlEditor.css";

/** Options for the standalone model-backed editing surface, without saving or surrounding tools. */
export interface HtmlEditorSurfaceOptions extends Omit<ComponentOptions, "tag" | "children"> {
    /** Initial HTML, parsed through the supported-content policy. */
    html: string;
    /** Accessible name of the editing area. */
    label?: string;
    /** Hint shown for empty content. */
    placeholder?: string;
    /** Minimum editing-area height, in pixels or a CSS length. */
    minHeight?: string | number;
    /** Prevents edits while allowing selection and copying. */
    readOnly?: boolean;
    /** Prevents user edits while the host is disabled or busy. */
    disabled?: boolean;
}

/** A visual selection fragment with its owning block-flow element. */
export interface HtmlEditorSelectionFlowRect {
    rect: DOMRect;
    flowNode: Element;
}

/** Geometry for a structural container intersected by the current selection. */
export interface HtmlEditorSelectionContainerRect {
    nodeId: string;
    rect: DOMRect;
    kind: "table" | "cell" | "grid-cell" | "flex" | "grid" | "selected";
}

/** Owns contenteditable, model, selection, input handling and history; never commits or cancels values. */
export class HtmlEditorSurface extends Component {
    /** Native editing area; identical to this component's dom. */
    readonly content: HTMLDivElement;
    /** User document changes only; selection and baseline replacement do not emit input. */
    readonly input = new ObservableEvent<void>();
    /** Document/history replacement or editing; lets views refresh without treating replacement as user input. */
    readonly documentChanged = new ObservableEvent<void>();
    /** Interaction/composition availability changed, without a document edit. */
    readonly interactionChanged = new ObservableEvent<void>();
    /** Detached remembered text selection, retained while surrounding controls have focus. */
    readonly selectionChanged = new ObservableEvent<HtmlEditorSelectionState | undefined>();
    /** Structural HTML nodes selected independently from the text-flow selection. */
    readonly selectedNodesChanged = new ObservableEvent<readonly string[]>();
    private readOnly: boolean;
    private disabled: boolean;
    private readonly domMap: HtmlEditorDom;
    private selectionState?: HtmlEditorSelectionState;
    private selectedNodeIds: string[] = [];
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

    /** Creates a standalone surface; the host owns persistence and any accepted baseline. */
    constructor(options: HtmlEditorSurfaceOptions) {
        const { html, label, placeholder, minHeight, readOnly = false, disabled = false, ...domOptions } = options;
        super({ ...domOptions, tag: "div" });
        this.readOnly = readOnly;
        this.disabled = disabled;
        this.documentModel = this.parser.parse(html);
        this.content = this.dom as HTMLDivElement;
        this.addCleanup(this.input);
        this.addCleanup(this.documentChanged);
        this.addCleanup(this.interactionChanged);
        this.domMap = new HtmlEditorDom(this.content);
        this.addCleanup(this.selectionChanged);
        this.addCleanup(this.selectedNodesChanged);
        this.addCleanup(() => this.clearNativeInputTimer());
        this.addCleanup(() => { this.domMap.reset(); this.selectionState = undefined; this.selectedNodeIds = []; });
        this.content.classList.add("elg-html-editor-content");
        if (label) this.content.setAttribute("aria-label", label);
        this.setInteractionState(readOnly, disabled);
        this.content.setAttribute("role", "textbox");
        this.content.setAttribute("aria-multiline", "true");
        if (options.placeholder) this.content.dataset.elgPlaceholder = options.placeholder;
        if (options.minHeight !== undefined) this.content.style.minHeight = typeof options.minHeight === "number" ? `${options.minHeight}px` : options.minHeight;
        this.listen(this.content, "beforeinput", event => this.beforeInput(event as InputEvent));
        this.listen(this.content, "keydown", event => this.keyDown(event as KeyboardEvent));
        this.listen(this.content, "click", event => {
            const target = event.target as HTMLElement | null;
            if (target?.tagName.toLowerCase() !== "img") return;
            const nodeId = this.domMap.position(target, 0)?.nodeId;
            if (nodeId) {
                event.preventDefault();
                this.selectNode(nodeId);
            }
        });
        this.listen(this.content, "input", () => {
            if (this.composing || this.compositionPending) return;
            if (this.nativeBefore && this.canEdit()) this.captureInput();
            else this.rejectNativeInput();
        });
        this.listen(this.content, "compositionstart", () => {
            if (!this.canEdit()) return;
            this.nativeBefore ??= this.snapshot();
            this.composing = true;
            this.interactionChanged.invoke(undefined);
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
        this.setHtml(html);
        this.observer = new MutationObserver(records => {
            if (this.composing || this.compositionPending || this.nativeBefore || this.disposed.Value) return;
            // Root attributes belong to the host control (ARIA, geometry, permissions),
            // not to authored HTML. Only descendant attributes enter reconciliation.
            records = records.filter(record => !(record.type === "attributes" && record.target === this.content));
            if (!records.length) return;
            this.rejectNativeInput();
        });
        this.observeDom();
        this.addCleanup(() => this.observer?.disconnect());
    }

    /** Detached snapshot; mutating it does not modify the editor. */
    get document(): HtmlEditorDocument { return structuredClone(this.documentModel); }
    /** Finds an authored element without cloning the document; callers must not mutate it. */
    findElement(nodeId: string | undefined): HtmlEditorElement | undefined {
        if (!nodeId) return;
        const visit = (nodes: readonly HtmlEditorNode[]): HtmlEditorElement | undefined => {
            for (const node of nodes) {
                if (node.type === "element" && node.id === nodeId) return node;
                if (node.type === "element") { const found = visit(node.children); if (found) return found; }
            }
        };
        return visit(this.documentModel.children);
    }
    /** Structural node selection, independent from the remembered text range. */
    get selectedNodes(): readonly string[] { return [...this.selectedNodeIds]; }
    /** Detached node coverage for a range, sharing Copy/Delete rules without cloning the document. */
    getSelectionCoverage(selection: HtmlEditorSelectionState | undefined = this.selection): ReadonlyMap<string, HtmlEditorNodeCoverage> {
        return selection ? getHtmlEditorRangeCoverage(this.documentModel, this.domMap.rootId, selection) : new Map();
    }
    /** Returns the aggregate Bold/Italic state for the current selected fragments. */
    getMarkState(mark: "bold" | "italic", selection: HtmlEditorSelectionState | undefined = this.selection): HtmlEditorMarkState {
        return getHtmlEditorMarkState(this.documentModel, this.domMap.rootId, selection, mark, this.typingMarks);
    }
    /** Selects a complete model node while retaining the same model/history contract as text selection. */
    selectNode(nodeId: string | undefined): boolean {
        if (!nodeId || this.disposed.Value) return false;
        let result: HtmlEditorSelectionState | undefined;
        const visit = (children: HtmlEditorDocument["children"], parentId: string): boolean => {
            const index = children.findIndex(child => child.id === nodeId);
            if (index >= 0) result = { anchor: { nodeId: parentId, offset: index }, focus: { nodeId: parentId, offset: index + 1 } };
            return !!result || children.some(child => child.type === "element" && visit(child.children, child.id));
        };
        visit(this.documentModel.children, this.domMap.rootId);
        if (!result) return false;
        this.setSelectedNodes([nodeId]);
        // Keep the established atomic-node contract: image selection is also
        // represented as a complete model range for coverage and commands.
        return this.restoreSelection(result);
    }
    /** Selects structural nodes without moving the browser caret or text range. */
    setSelectedNodes(nodeIds: readonly string[]): void {
        if (this.disposed.Value) return;
        const valid = new Set<string>();
        const visit = (nodes: HtmlEditorNode[]): void => nodes.forEach(node => {
            if (nodeIds.includes(node.id)) valid.add(node.id);
            if (node.type === "element") visit(node.children);
        });
        visit(this.documentModel.children);
        const next = [...valid];
        if (next.length === this.selectedNodeIds.length && next.every((id, index) => id === this.selectedNodeIds[index])) return;
        this.selectedNodeIds = next;
        this.selectedNodesChanged.invoke([...next]);
    }
    /** Applies authored element properties as one undoable inspector transaction. */
    updateElement(nodeId: string, patch: Partial<Pick<HtmlEditorElement, "tag" | "classes" | "styles" | "attributes">>): boolean {
        if (!this.editable) return false;
        const before = this.snapshot();
        const document = structuredClone(before.document);
        let changed = false;
        const visit = (nodes: HtmlEditorNode[]): void => nodes.forEach(node => {
            if (node.id === nodeId && node.type === "element") {
                if (patch.tag !== undefined && patch.tag !== node.tag) { node.tag = patch.tag; changed = true; }
                if (patch.classes !== undefined && JSON.stringify(patch.classes) !== JSON.stringify(node.classes)) { node.classes = [...patch.classes]; changed = true; }
                if (patch.styles !== undefined && JSON.stringify(patch.styles) !== JSON.stringify(node.styles)) { node.styles = structuredClone(patch.styles); changed = true; }
                if (patch.attributes !== undefined && JSON.stringify(patch.attributes) !== JSON.stringify(node.attributes)) { node.attributes = { ...patch.attributes }; changed = true; }
            }
            if (node.type === "element") visit(node.children);
        });
        visit(document.children);
        if (!changed) return false;
        this.acceptTransaction(before, { document, selection: before.selection });
        return true;
    }
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
    /** Returns live client rectangles for the remembered model selection. */
    selectionClientRects(): DOMRect[] {
        return this.selectionFlowRects().map(fragment => fragment.rect);
    }
    /** Returns selection fragments in DOM order with their owning block flow. */
    selectionFlowRects(): HtmlEditorSelectionFlowRect[] {
        const range = this.visualSelectionRange();
        if (!range) return [];
        const result: HtmlEditorSelectionFlowRect[] = [];
        const walker = this.content.ownerDocument.createTreeWalker(this.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        let current: Node | null = walker.nextNode();
        while (current) {
            try {
                if (range.intersectsNode(current)) {
                    if (current.nodeType === Node.TEXT_NODE) {
                        const text = current.textContent ?? "";
                        const start = current === range.startContainer ? range.startOffset : 0;
                        const end = current === range.endContainer ? range.endOffset : text.length;
                        if (end > start) {
                            const fragment = this.content.ownerDocument.createRange();
                            fragment.setStart(current, start); fragment.setEnd(current, end);
                            [...fragment.getClientRects()].forEach(rect => {
                                if (rect.width || rect.height) result.push({ rect, flowNode: this.blockFlowNode(current!) });
                            });
                        }
                    } else if (current instanceof Element && /^(img|br|hr|video|audio|iframe|canvas|svg)$/i.test(current.tagName)) {
                        const rect = current.getBoundingClientRect();
                        if (rect.width || rect.height) result.push({ rect, flowNode: this.blockFlowNode(current) });
                    }
                }
            } catch { /* A stale DOM node is ignored until the next render. */ }
            current = walker.nextNode();
        }
        return result;
    }
    private visualSelectionRange(): Range | undefined {
        const selection = this.selectionState;
        if (!selection) return;
        const anchor = this.domMap.resolve(selection.anchor), focus = this.domMap.resolve(selection.focus);
        if (!anchor || !focus) return;
        const range = this.content.ownerDocument.createRange();
        try {
            const first = this.content.ownerDocument.createRange();
            const second = this.content.ownerDocument.createRange();
            first.setStart(anchor.node, anchor.offset); first.collapse(true);
            second.setStart(focus.node, focus.offset); second.collapse(true);
            const anchorFirst = first.compareBoundaryPoints(Range.START_TO_START, second) <= 0;
            const start = anchorFirst ? anchor : focus;
            const end = anchorFirst ? focus : anchor;
            range.setStart(start.node, start.offset); range.setEnd(end.node, end.offset);
            return range;
        } catch { return; }
    }
    private blockFlowNode(node: Node): Element {
        const blockTags = /^(address|article|blockquote|caption|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)$/i;
        let element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
        while (element && element !== this.content) {
            if (blockTags.test(element.tagName)) return element;
            element = element.parentElement;
        }
        return this.content;
    }
    /** Returns viewport rectangles for independently selected structural nodes. */
    selectedNodeClientRects(): { nodeId: string; rect: DOMRect }[] {
        return this.selectedNodeIds.flatMap(nodeId => {
            const node = this.domMap.resolve({ nodeId, offset: 0 })?.node;
            if (!(node instanceof Element)) return [];
            const rect = node.getBoundingClientRect();
            return rect.width || rect.height ? [{ nodeId, rect }] : [];
        });
    }
    /** Returns outlines for tables, cells and flex/grid containers touched by the text selection. */
    selectionContainerClientRects(): HtmlEditorSelectionContainerRect[] {
        const result = new Map<string, HtmlEditorSelectionContainerRect>();
        const add = (element: Element, kind: HtmlEditorSelectionContainerRect["kind"]) => {
            const nodeId = this.domMap.position(element, 0)?.nodeId;
            if (!nodeId || result.has(nodeId)) return;
            const rect = element.getBoundingClientRect();
            if (rect.width || rect.height) result.set(nodeId, { nodeId, rect, kind });
        };
        const addGridItems = (grid: Element) => {
            for (const child of Array.from(grid.children)) add(child, "grid-cell");
        };
        this.selectedNodeIds.forEach(nodeId => {
            const node = this.domMap.resolve({ nodeId, offset: 0 })?.node;
            if (node instanceof Element) {
                add(node, "selected");
                const display = this.content.ownerDocument.defaultView?.getComputedStyle(node).display;
                if (display === "grid" || display === "inline-grid") addGridItems(node);
            }
        });
        const range = this.visualSelectionRange();
        if (!range) return [...result.values()];
        const walker = this.content.ownerDocument.createTreeWalker(this.content, NodeFilter.SHOW_ELEMENT);
        let current: Node | null = walker.nextNode();
        while (current) {
            const element = current as Element;
            try {
                if (range.intersectsNode(element)) {
                    const tag = element.tagName.toLowerCase();
                    const display = this.content.ownerDocument.defaultView?.getComputedStyle(element).display;
                    const parent = element.parentElement;
                    const parentDisplay = parent ? this.content.ownerDocument.defaultView?.getComputedStyle(parent).display : undefined;
                    const kind = tag === "table" ? "table" : tag === "td" || tag === "th" ? "cell"
                        : display === "flex" || display === "inline-flex" ? "flex"
                            : display === "grid" || display === "inline-grid" ? "grid"
                                : parentDisplay === "grid" || parentDisplay === "inline-grid" ? "grid-cell" : undefined;
                    if (kind) {
                        add(element, kind);
                        if (kind === "grid") addGridItems(element);
                    }
                }
            } catch { /* A stale DOM node is ignored until the next render. */ }
            current = walker.nextNode();
        }
        return [...result.values()];
    }
    /** Restores a saved selection. Returns false for removed nodes or a replaced document. */
    restoreSelection(state: HtmlEditorSelectionState | undefined = this.selection): boolean {
        if (this.disposed.Value || this.composing || this.compositionPending || !restoreHtmlEditorSelection(this.domMap, state)) return false;
        this.captureSelection();
        return true;
    }
    /** HTML suitable for persistence under the parser's supported-content policy. */
    get html(): string { return this.serialize(this.documentModel); }
    /** True when native composition/reconciliation has finished and a host may accept or replace content. */
    get settled(): boolean { return !this.composing && !this.compositionPending && !this.nativeBefore; }
    /** Whether commands may edit the document now, including composition and host interaction state. */
    get editable(): boolean { return this.canEdit() && this.settled; }
    /** Returns serialized draft HTML. */
    getHtml(): string { return this.html; }
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
    /** Replaces content and resets history/runtime bookmarks without emitting user input. */
    setHtml(html: string): void {
        if (this.disposed.Value) return;
        this.documentModel = this.parser.parse(html);
        this.setSelectedNodes([]);
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
        // The orchestrator uses this for setValue/commit/cancel; the surface has no accepted value.
        this.updateSelection(undefined);
        this.documentChanged.invoke(undefined);
        this.interactionChanged.invoke(undefined);
    }

    /** Updates host permissions without replacing content, selection or history. */
    setInteractionState(readOnly: boolean, disabled: boolean): void {
        this.readOnly = readOnly;
        this.disabled = disabled;
        this.content.contentEditable = this.canEdit() ? "true" : "false";
        this.content.setAttribute("aria-readonly", String(readOnly));
        this.content.setAttribute("aria-disabled", String(disabled));
        this.interactionChanged.invoke(undefined);
    }

    private canEdit(): boolean { return !this.disposed.Value && !this.readOnly && !this.disabled; }

    private notifyInput(): void {
        this.documentChanged.invoke(undefined);
        this.input.invoke(undefined);
        this.interactionChanged.invoke(undefined);
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
        this.interactionChanged.invoke(undefined);
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
        this.interactionChanged.invoke(undefined);
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
        this.renderModel(after.selection, focusEditor);
        this.typingMarks = after.marks;
        if (changed) this.notifyInput();
        else this.interactionChanged.invoke(undefined);
    }

    private travel(redo: boolean): boolean {
        const from = redo ? this.redoStack : this.undoStack;
        const state = from.pop();
        if (!state) return false;
        (redo ? this.undoStack : this.redoStack).push(this.snapshot());
        this.documentModel = state.document;
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
