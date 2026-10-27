import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import type { HtmlEditorSelectionFlowRect, HtmlEditorSurface } from "./HtmlEditorSurface";
import type { HtmlEditorInspectorTargets } from "./HtmlEditorInspection";

interface SelectionLine { rect: DOMRect; flowNode: Element; }

function mergeTextRects(fragments: HtmlEditorSelectionFlowRect[]): DOMRect[] {
    const lines: SelectionLine[] = [];
    fragments.filter(fragment => fragment.rect.width > 0 || fragment.rect.height > 0).forEach(({ rect, flowNode }) => {
        const line = lines[lines.length - 1];
        const lineCenter = line ? (line.rect.top + line.rect.bottom) / 2 : 0;
        const rectCenter = (rect.top + rect.bottom) / 2;
        const tolerance = line ? Math.max(1, Math.min(line.rect.height, rect.height) / 2) : 0;
        const sameLine = !!line && line.flowNode === flowNode && Math.abs(lineCenter - rectCenter) <= tolerance;
        if (!sameLine) {
            lines.push({ rect: new DOMRect(rect.left, rect.top, rect.width, rect.height), flowNode });
            return;
        }
        const left = Math.min(line.rect.left, rect.left);
        const top = Math.min(line.rect.top, rect.top);
        const right = Math.max(line.rect.right, rect.right);
        const bottom = Math.max(line.rect.bottom, rect.bottom);
        line.rect = new DOMRect(left, top, right - left, bottom - top);
    });
    return lines.map(line => line.rect);
}

/** Paints the current model selection without becoming part of the editable DOM. */
export class HtmlEditorSelectionOverlay extends Component {
    private frame?: number;
    private host?: HTMLElement;
    private editorFocused = false;
    private inspectorFocused = false;
    private commandSurfaceHovered = false;
    private commandSurfaceFocused = false;
    private activeCommandTargets?: HtmlEditorInspectorTargets;
    private inspectionTargets?: () => readonly string[];
    private commandPreviewTargets?: (commandId: string) => HtmlEditorInspectorTargets | undefined;
    private commandSurfaces: HTMLElement[] = [];

    /** Outlines property targets while controls edit a collapsed selection, without changing its range. */
    connectInspector(inspector: HTMLElement, targets: () => readonly string[], toolbar?: HTMLElement,
        commandPreviewTargets?: (commandId: string) => HtmlEditorInspectorTargets | undefined): void {
        this.inspectionTargets = targets;
        this.commandPreviewTargets = commandPreviewTargets;
        this.commandSurfaces = [toolbar, inspector].filter((item): item is HTMLElement => !!item);
        const isCommandSurface = (target: EventTarget | null): boolean => target instanceof Node
            && this.commandSurfaces.some(surface => surface.contains(target));
        const commandField = (target: EventTarget | null): HTMLElement | undefined => target instanceof Element
            ? target.closest<HTMLElement>("[data-field]") ?? undefined : undefined;
        const updateCommandTargets = (target: EventTarget | null): void => {
            const field = commandField(target);
            this.activeCommandTargets = field?.dataset.field ? this.commandPreviewTargets?.(field.dataset.field) : undefined;
        };
        // Action buttons preserve the native editor range with preventDefault,
        // so interaction must also be detected before their pointer handlers run.
        const interact = (event: Event) => {
            const target = event.target;
            this.inspectorFocused = target instanceof Element && (inspector.contains(target)
                || this.inspectorFocused && !!target.closest("[popover]"));
            updateCommandTargets(target);
            this.schedule();
        };
        this.listen(inspector.ownerDocument, "pointerdown", interact, { capture: true });
        this.listen(inspector, "click", event => { this.inspectorFocused = true; updateCommandTargets(event.target); this.schedule(); }, { capture: true });
        this.listen(inspector.ownerDocument, "focusin", event => {
            const target = event.target;
            this.commandSurfaceFocused = isCommandSurface(target);
            this.inspectorFocused = target instanceof Element && (inspector.contains(target)
                || this.inspectorFocused && !!target.closest("[popover]"));
            updateCommandTargets(target);
            this.schedule();
        });
        this.listen(inspector.ownerDocument, "focusout", event => {
            const relatedTarget = (event as FocusEvent).relatedTarget;
            if (isCommandSurface(relatedTarget)) {
                this.commandSurfaceFocused = true;
                updateCommandTargets(relatedTarget);
            } else {
                this.commandSurfaceFocused = false;
                if (!this.inspectorFocused) this.activeCommandTargets = undefined;
            }
            this.schedule();
        });
        this.listen(inspector.ownerDocument, "pointerover", event => {
            if (!isCommandSurface(event.target)) return;
            updateCommandTargets(event.target);
            this.commandSurfaceHovered = !!(event.target instanceof Element && event.target.closest("[data-field]"));
            this.schedule();
        }, { capture: true });
        this.listen(inspector.ownerDocument, "pointerout", event => {
            if (!isCommandSurface(event.target)) return;
            const relatedTarget = (event as PointerEvent).relatedTarget;
            const relatedField = relatedTarget instanceof Element ? relatedTarget.closest("[data-field]") : undefined;
            this.commandSurfaceHovered = isCommandSurface(relatedTarget) && !!relatedField;
            if (this.commandSurfaceHovered) updateCommandTargets(relatedTarget);
            else if (!this.commandSurfaceFocused) this.activeCommandTargets = undefined;
            this.schedule();
        }, { capture: true });
    }

    constructor(private readonly surface: HtmlEditorSurface) {
        super({ class: "elg-html-editor-selection-overlay", ariaHidden: "true" });
        this.addCleanup(surface.selectionChanged.subscribe(() => this.schedule()));
        this.addCleanup(surface.selectedNodesChanged.subscribe(() => this.schedule()));
        this.addCleanup(surface.documentChanged.subscribe(() => this.schedule()));
    }

    /** Mounts the overlay in the same scrolling coordinate system as the surface. */
    attach(host: HTMLElement): void {
        this.host = host;
        host.append(this.dom);
        this.listen(this.surface.content, "focusin", () => { this.editorFocused = true; this.inspectorFocused = false; this.schedule(); });
        this.listen(this.surface.content, "focusout", () => { this.editorFocused = false; this.schedule(); });
        this.listen(this.surface.content, "scroll", () => this.schedule(), { passive: true });
        this.listen(host.ownerDocument.defaultView!, "resize", () => this.schedule(), { passive: true });
        this.schedule();
    }

    private schedule(): void {
        if (this.frame !== undefined || this.disposed.Value) return;
        this.frame = requestAnimationFrame(() => {
            this.frame = undefined;
            this.paint();
        });
    }

    private paint(): void {
        const host = this.host;
        this.dom.replaceChildren();
        if (!host) return;
        const hostRect = host.getBoundingClientRect();
        const textLayer = e("div", { class: "elg-html-editor-text-selection-layer" });
        const containerLayer = e("div", { class: "elg-html-editor-container-selection-layer" });
        const inspectionActive = this.inspectorFocused || this.commandSurfaceHovered || this.commandSurfaceFocused;
        const textCommand = inspectionActive && this.activeCommandTargets?.kind === "text";
        const elementTargets = inspectionActive && this.activeCommandTargets?.kind === "elements" ? this.activeCommandTargets : undefined;
        const elementCommand = !!elementTargets;
        const textRects = this.editorFocused && !inspectionActive || elementCommand
            ? [] : mergeTextRects(this.surface.selectionFlowRects());
        textRects.forEach(rect => textLayer.append(e("span", { class: "elg-html-editor-selection-rect", style: {
            left: `${rect.left - hostRect.left}px`,
            top: `${rect.top - hostRect.top}px`,
            width: `${rect.width}px`, height: `${rect.height}px`
        } })));
        const containerRects = textCommand ? [] : elementCommand
            ? this.surface.selectedNodeClientRects(elementTargets.nodeIds).map(target => ({ ...target, kind: "selected" as const }))
            : this.surface.selectionContainerClientRects();
        const inspectionIds = new Set(elementCommand ? elementTargets.nodeIds
            : inspectionActive ? this.inspectionTargets?.() ?? [] : []);
        const selection = this.surface.selection;
        if (!textCommand && !elementCommand && inspectionActive && selection && selection.anchor.nodeId === selection.focus.nodeId
            && selection.anchor.offset === selection.focus.offset) {
            for (const target of this.surface.selectedNodeClientRects(this.inspectionTargets?.() ?? [])) {
                if (!containerRects.some(existing => existing.nodeId === target.nodeId))
                    containerRects.push({ ...target, kind: "selected" });
            }
        }
        containerRects.forEach(({ nodeId, rect, kind }) => containerLayer.append(e("span", {
            class: "elg-html-editor-container-selection-rect", "data-html-editor-node-id": nodeId,
            "data-inspection-target": inspectionIds.has(nodeId) ? "true" : undefined,
            "data-html-editor-container-kind": kind,
            style: { left: `${rect.left - hostRect.left}px`, top: `${rect.top - hostRect.top}px`,
                width: `${rect.width}px`, height: `${rect.height}px` }
        })));
        this.dom.append(containerLayer, textLayer);
        this.dom.hidden = textRects.length === 0 && containerRects.length === 0;
    }

    protected override onUnmount(): void {
        if (this.frame !== undefined) cancelAnimationFrame(this.frame);
        this.frame = undefined;
        this.host = undefined;
        this.editorFocused = false;
        this.inspectorFocused = false;
        this.commandSurfaceHovered = false;
        this.commandSurfaceFocused = false;
        this.activeCommandTargets = undefined;
        this.commandPreviewTargets = undefined;
        this.commandSurfaces = [];
    }
}
