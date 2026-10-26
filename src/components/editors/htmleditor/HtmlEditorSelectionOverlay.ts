import { Component } from "../../../core/Component";
import { e } from "../../../core/e";
import type { HtmlEditorSelectionFlowRect, HtmlEditorSurface } from "./HtmlEditorSurface";

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
        this.listen(this.surface.content, "focusin", () => { this.editorFocused = true; this.schedule(); });
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
        const textRects = this.editorFocused ? [] : mergeTextRects(this.surface.selectionFlowRects());
        textRects.forEach(rect => textLayer.append(e("span", { class: "elg-html-editor-selection-rect", style: {
            left: `${rect.left - hostRect.left}px`,
            top: `${rect.top - hostRect.top}px`,
            width: `${rect.width}px`, height: `${rect.height}px`
        } })));
        const containerRects = this.surface.selectionContainerClientRects();
        containerRects.forEach(({ nodeId, rect, kind }) => containerLayer.append(e("span", {
            class: "elg-html-editor-container-selection-rect", "data-html-editor-node-id": nodeId,
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
    }
}
