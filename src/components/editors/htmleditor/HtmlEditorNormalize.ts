import { isHtmlEditorBlock, type HtmlEditorElement, type HtmlEditorNode, type HtmlEditorPositionState } from "./HtmlEditorModel";
import type { HtmlEditorState } from "./HtmlEditorCommands";
import { getHtmlEditorElementBehavior, isAtomic } from "./HtmlEditorStructure";

const block = isHtmlEditorBlock;

/** Minimal rich-text structure policy shared by imported HTML and native fallback transactions. */
export function normalizeHtmlEditorState(state: HtmlEditorState, rootId: string, id: () => string): HtmlEditorState {
    const make = (tag: string, children: HtmlEditorNode[]): HtmlEditorElement => ({ id: id(), type: "element", tag,
        classes: [], attributes: {}, styles: [], children });
    const visit = (node: HtmlEditorNode) => {
        if (node.type === "text") return;
        node.children.forEach(visit);
        if (getHtmlEditorElementBehavior(node).kind === "textBlock") {
            // Repair plain browser-created text wrappers, without stripping an
            // authored layout/list/table or its classes, styles and attributes.
            const flattenable = (child: HtmlEditorNode): child is HtmlEditorElement => child.type === "element"
                && (child.tag === "div" || getHtmlEditorElementBehavior(child).kind === "textBlock")
                && !isAtomic(child) && !child.classes.length && !child.styles.length && !Object.keys(child.attributes).length;
            const flatten = (children: HtmlEditorNode[]): HtmlEditorNode[] => children.flatMap((child, index) => flattenable(child)
                ? [...(index ? [make("br", [])] : []), ...flatten(child.children)] : [child]);
            node.children = flatten(node.children);
        }
    };
    state.document.children.forEach(visit);
    const children: HtmlEditorNode[] = [];
    const boundaries = new Map<number, HtmlEditorPositionState>();
    const old = state.document.children;
    for (let i = 0; i < old.length;) {
        if (block(old[i])) {
            boundaries.set(i, { nodeId: rootId, offset: children.length });
            children.push(old[i++]);
        } else {
            const start = i;
            const run: HtmlEditorNode[] = [];
            while (i < old.length && !block(old[i])) run.push(old[i++]);
            if (run.every(node => node.type === "text" && !node.text?.trim())) {
                for (let j = start; j <= i; j++) boundaries.set(j, { nodeId: rootId, offset: children.length });
                continue;
            }
            const paragraph = make("p", run);
            for (let j = start; j <= i; j++) boundaries.set(j, { nodeId: paragraph.id, offset: j - start });
            children.push(paragraph);
        }
    }
    boundaries.set(old.length, { nodeId: rootId, offset: children.length });
    if (!children.length) children.push(make("p", []));
    state.document.children = children;
    if (state.selection) {
        const map = (point: HtmlEditorPositionState) => point.nodeId === rootId ? boundaries.get(point.offset) ?? point : point;
        state.selection = { anchor: map(state.selection.anchor), focus: map(state.selection.focus) };
    }
    return state;
}
