import type { HtmlEditorSelectionState } from "./HtmlEditorModel";
import type { HtmlEditorDom } from "./HtmlEditorDom";

/** Converts both native endpoints, retaining the direction of the selection. */
export function readHtmlEditorSelection(dom: HtmlEditorDom): HtmlEditorSelectionState | undefined {
    const selection = dom.root.ownerDocument.getSelection();
    if (!selection?.rangeCount || !selection.anchorNode || !selection.focusNode) return undefined;
    const anchor = dom.position(selection.anchorNode, selection.anchorOffset);
    const focus = dom.position(selection.focusNode, selection.focusOffset);
    return anchor && focus ? { anchor, focus } : undefined;
}

/** Restores text or child-boundary endpoints, including backward ranges and empty blocks. */
export function restoreHtmlEditorSelection(dom: HtmlEditorDom, state?: HtmlEditorSelectionState, focusEditor = true): boolean {
    if (!state) return false;
    const anchor = dom.resolve(state.anchor);
    const focus = dom.resolve(state.focus);
    const selection = dom.root.ownerDocument.getSelection();
    if (!anchor || !focus || !selection) return false;
    if (focusEditor) dom.root.focus({ preventScroll: true });
    selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
    return true;
}
