import { isHtmlEditorBlock, type HtmlEditorDocument, type HtmlEditorElement, type HtmlEditorNode, type HtmlEditorPositionState } from "./HtmlEditorModel";
import type { HtmlEditorState } from "./HtmlEditorCommands";
import { getHtmlEditorElementBehavior, isAtomic, isInline, isStructuralWhitespace } from "./HtmlEditorStructure";

const block = isHtmlEditorBlock;

/** Minimal rich-text structure policy shared by imported HTML and native fallback transactions. */
export function normalizeHtmlEditorState(state: HtmlEditorState, rootId: string, id: () => string): HtmlEditorState {
    const make = (tag: string, children: HtmlEditorNode[]): HtmlEditorElement => ({ id: id(), type: "element", tag,
        classes: [], attributes: {}, styles: [], children });
    const textPoints = new Map<string, HtmlEditorPositionState>();
    const elementRemaps = new Map<string, HtmlEditorPositionState>();
    const elementBoundaries = new Map<string, number[]>();
    const sameArray = <T>(left: T[], right: T[], equal: (a: T, b: T) => boolean): boolean => left.length === right.length
        && left.every((item, index) => equal(item, right[index]));
    const sameAttributes = (left: Record<string, string>, right: Record<string, string>): boolean => {
        const leftKeys = Object.keys(left), rightKeys = Object.keys(right);
        return leftKeys.length === rightKeys.length && leftKeys.every(key => Object.prototype.hasOwnProperty.call(right, key) && left[key] === right[key]);
    };
    const sameStyles = (left: HtmlEditorElement["styles"], right: HtmlEditorElement["styles"]): boolean => sameArray(left, right,
        (a, b) => a.name === b.name && a.value === b.value && a.important === b.important);
    const canMergeInline = (left: HtmlEditorElement, right: HtmlEditorElement): boolean =>
        !isAtomic(left) && !isAtomic(right)
        && getHtmlEditorElementBehavior(left).kind === "inline"
        && getHtmlEditorElementBehavior(right).kind === "inline"
        && left.children.every(isInline) && right.children.every(isInline)
        && left.tag === right.tag
        && sameArray(left.classes, right.classes, (a, b) => a === b)
        && sameStyles(left.styles, right.styles)
        && sameAttributes(left.attributes, right.attributes);
    const appendToInline = (parent: HtmlEditorElement, node: HtmlEditorNode): void => {
        const previous = parent.children[parent.children.length - 1];
        if (previous?.type === "text" && node.type === "text") {
            const offset = previous.text.length;
            previous.text += node.text;
            textPoints.set(node.id, { nodeId: previous.id, offset });
        } else parent.children.push(node);
    };
    const normalizeChildren = (parent: HtmlEditorDocument | HtmlEditorElement): void => {
        const original = parent.children, children: HtmlEditorNode[] = [], boundaries = [0];
        const hasStructuralChild = original.some(node => node.type === "element"
            && !isAtomic(node) && getHtmlEditorElementBehavior(node).kind !== "inline");
        original.forEach(node => {
            if (node.type === "element") normalizeChildren(node);
            if (node.type === "text" && (node.text.length === 0 || (hasStructuralChild && isStructuralWhitespace(node)))) {
                // Empty leaves and indentation between structural children have
                // no authored text position. Preserve a caret at the parent gap.
                textPoints.set(node.id, { nodeId: parent.type === "document" ? rootId : parent.id, offset: children.length });
            } else {
                const previous = children[children.length - 1];
                if (previous?.type === "text" && node.type === "text") {
                    const offset = previous.text.length;
                    previous.text += node.text;
                    textPoints.set(node.id, { nodeId: previous.id, offset });
                } else if (previous?.type === "element" && node.type === "element" && canMergeInline(previous, node)) {
                    const offset = previous.children.length;
                    elementRemaps.set(node.id, { nodeId: previous.id, offset });
                    node.children.forEach(child => appendToInline(previous, child));
                } else children.push(node);
            }
            boundaries.push(children.length);
        });
        parent.children = children;
        elementBoundaries.set(parent.type === "document" ? rootId : parent.id, boundaries);
    };
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
    normalizeChildren(state.document);
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
        const map = (point: HtmlEditorPositionState): HtmlEditorPositionState => {
            const textPoint = textPoints.get(point.nodeId);
            if (textPoint) return { nodeId: textPoint.nodeId, offset: textPoint.offset + point.offset };
            const elementRemap = elementRemaps.get(point.nodeId);
            if (elementRemap) {
                const mappedBoundaries = elementBoundaries.get(point.nodeId);
                const offset = mappedBoundaries?.[point.offset] ?? mappedBoundaries?.[mappedBoundaries.length - 1] ?? point.offset;
                // The destination element already contains the merged children;
                // do not apply its pre-merge boundary map a second time.
                return { nodeId: elementRemap.nodeId, offset: elementRemap.offset + offset };
            }
            const mappedBoundaries = elementBoundaries.get(point.nodeId);
            if (mappedBoundaries) return { nodeId: point.nodeId, offset: mappedBoundaries[point.offset] ?? mappedBoundaries[mappedBoundaries.length - 1] ?? 0 };
            return point;
        };
        const mapRoot = (point: HtmlEditorPositionState) => point.nodeId === rootId ? boundaries.get(point.offset) ?? point : point;
        const mapPoint = (point: HtmlEditorPositionState) => mapRoot(map(point));
        state.selection = { anchor: mapPoint(state.selection.anchor), focus: mapPoint(state.selection.focus) };
    }
    return state;
}
