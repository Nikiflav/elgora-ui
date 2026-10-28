import { isHtmlEditorBlock, type HtmlEditorDocument, type HtmlEditorElement, type HtmlEditorNode, type HtmlEditorPositionState, type HtmlEditorSelectionRange } from "./HtmlEditorModel";

/** Structural editing policy, independent of CSS display and of the DOM renderer. */
export type HtmlEditorElementKind = "inline" | "textBlock" | "container" | "list" | "listItem" | "cell" | "table" | "atomic";

/** Rules shared by keyboard commands, range replacement and structural navigation. */
export interface HtmlEditorElementBehavior {
    /** Determines legal child boundaries and whether text can be edited directly. */
    kind: HtmlEditorElementKind;
    /** Tag produced by splitting a text block. Omit to retain the original tag. */
    splitTag?: string;
    /** Collapsed Backspace/Delete cannot merge this area's outer edge with a sibling.
     * Explicit range deletion still follows coverage and may remove the whole element.
     */
    boundary?: true;
}

const rules = new Map<string, Readonly<HtmlEditorElementBehavior>>();
const define = (tags: string, behavior: HtmlEditorElementBehavior) => tags.split(" ").forEach(tag => rules.set(tag, Object.freeze({ ...behavior })));
define("p dt dd", { kind: "textBlock" });
define("pre figcaption summary", { kind: "textBlock", boundary: true });
define("h1 h2 h3 h4 h5 h6", { kind: "textBlock", splitTag: "p" });
define("ul ol", { kind: "list" });
define("li", { kind: "listItem" });
define("td th caption", { kind: "cell" });
define("table thead tbody tfoot tr colgroup", { kind: "table" });
define("br hr img video source col", { kind: "atomic" });
const inline = Object.freeze({ kind: "inline" } as const);
const container = Object.freeze({ kind: "container" } as const);

/** Central built-in behavior registry. Unknown block elements retain their container boundary. */
export function getHtmlEditorElementBehavior(node: Pick<HtmlEditorElement, "tag">): Readonly<HtmlEditorElementBehavior> {
    return rules.get(node.tag) ?? (isHtmlEditorBlock({ type: "element", tag: node.tag } as HtmlEditorElement) ? container : inline);
}

/** A model node that owns an ordered child list. */
export type HtmlEditorParent = HtmlEditorDocument | HtmlEditorElement;
/** Located node plus its immediate parent and outer-to-inner ancestor path. */
export interface HtmlEditorLocation { node: HtmlEditorNode; parent: HtmlEditorParent; ancestors: HtmlEditorElement[]; }
/** Inline editing area with a UTF-16/atomic-unit offset and its structural parent. */
export interface HtmlEditorScope { block: HtmlEditorElement; parent: HtmlEditorParent; offset: number; }
/** Media, hard breaks and structural void nodes have no editable descendants. */
export const isAtomic = (node: HtmlEditorNode): boolean => node.type === "element" && getHtmlEditorElementBehavior(node).kind === "atomic";
/** Whether a node can occur in a linear inline editing area. */
export const isInline = (node: HtmlEditorNode): boolean => node.type === "text" || isAtomic(node)
    || (getHtmlEditorElementBehavior(node).kind === "inline" && node.children.every(isInline));
/** Content that can be placed directly inside a paragraph or inline wrapper. */
export const isPhrasing = (node: HtmlEditorNode): boolean => node.type === "text" ||
    (!isHtmlEditorBlock(node) && node.tag !== "source" && node.tag !== "col"
        && (isAtomic(node) || node.children.every(isPhrasing)));
/** UTF-16 text units plus one unit per atomic node. */
export const nodeSize = (node: HtmlEditorNode): number => node.type === "text" ? node.text.length
    : isAtomic(node) ? 1 : node.children.reduce((sum, child) => sum + nodeSize(child), 0);

/** Locate an editing identity without traversing atomic descendants. */
export function locate(parent: HtmlEditorParent, id: string, ancestors: HtmlEditorElement[] = []): HtmlEditorLocation | undefined {
    for (const node of parent.children) {
        if (node.id === id) return { node, parent, ancestors };
        const found = node.type === "element" && !isAtomic(node) ? locate(node, id, [...ancestors, node]) : undefined;
        if (found) return found;
    }
}

/** Resolve UTF-16 text offsets and child-index element boundaries into a scope offset. */
export function offsetWithin(node: HtmlEditorNode, point: HtmlEditorPositionState): number | undefined {
    if (node.id === point.nodeId) {
        if (!Number.isInteger(point.offset) || point.offset < 0) return;
        if (point.offset > (node.type === "text" ? node.text.length : node.children.length)) return;
        return node.type === "text" ? point.offset
            : node.children.slice(0, point.offset).reduce((sum, child) => sum + nodeSize(child), 0);
    }
    if (node.type === "text" || isAtomic(node)) return;
    let offset = 0;
    for (const child of node.children) {
        const inner = offsetWithin(child, point);
        if (inner !== undefined) return offset + inner;
        offset += nodeSize(child);
    }
}

/** Reject stale identities and invalid offsets before a command allocates or changes nodes. */
export function validPosition(document: HtmlEditorDocument, rootId: string, point: HtmlEditorPositionState): boolean {
    if (!Number.isInteger(point.offset) || point.offset < 0) return false;
    const node = point.nodeId === rootId ? document : locate(document, point.nodeId)?.node;
    return !!node && point.offset <= (node.type === "text" ? node.text.length : node.children.length)
        && !(node.type === "element" && isAtomic(node));
}

/** Materialize the inline run being edited inside mixed content, preserving its container.
 * For example, div(A, p(B), C) becomes div(p(A), p(B), C) when editing A.
 * Endpoint IDs remain stable; parent child-index boundaries are remapped together.
 */
export function prepareEditingSelection(document: HtmlEditorDocument, selection: HtmlEditorSelectionRange, id: () => string): HtmlEditorSelectionRange {
    const result = structuredClone(selection);
    for (const endpoint of ["anchor", "focus"] as const) {
        const point = result[endpoint], location = locate(document, point.nodeId);
        if (!location) continue;
        const path = [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])];
        const shell = [...path].reverse().find(node => getHtmlEditorElementBehavior(node).kind !== "inline");
        if (!shell || !["container", "cell", "listItem"].includes(getHtmlEditorElementBehavior(shell).kind) || shell.children.every(isInline)) continue;
        const direct = point.nodeId === shell.id ? shell.children[point.offset] ?? shell.children[point.offset - 1]
            : location.ancestors.includes(shell) ? path[path.indexOf(shell) + 1] ?? location.node : undefined;
        if (!direct || !isInline(direct)) continue;
        let start = shell.children.indexOf(direct), end = start + 1;
        while (start > 0 && isInline(shell.children[start - 1])) start--;
        while (end < shell.children.length && isInline(shell.children[end])) end++;
        const paragraph: HtmlEditorElement = { id: id(), type: "element", tag: "p", classes: [], styles: [], attributes: {}, children: shell.children.slice(start, end) };
        shell.children.splice(start, end - start, paragraph);
        for (const name of ["anchor", "focus"] as const) {
            const p = result[name];
            if (p.nodeId !== shell.id) continue;
            if (p.offset >= start && p.offset <= end) result[name] = { nodeId: paragraph.id, offset: p.offset - start };
            else if (p.offset > end) p.offset -= end - start - 1;
        }
    }
    return result;
}

/** The nearest text-bearing scope. Cells and containers keep their own structural identity. */
export function editingScope(document: HtmlEditorDocument, point: HtmlEditorPositionState): HtmlEditorScope | undefined {
    const location = locate(document, point.nodeId);
    if (!location || isAtomic(location.node)) return;
    const path = [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])];
    const block = path.reverse().find(node => getHtmlEditorElementBehavior(node).kind !== "inline" && !isAtomic(node));
    if (!block || !["textBlock", "listItem", "cell", "container"].includes(getHtmlEditorElementBehavior(block).kind)
        || !block.children.every(isInline)) return;
    const offset = offsetWithin(block, point);
    return offset === undefined ? undefined : { block, parent: locate(document, block.id)!.parent, offset };
}

/** Canonical caret for a linear inline offset; atoms always use a parent boundary. */
export function caretAt(node: HtmlEditorNode, offset: number): HtmlEditorPositionState {
    if (node.type === "text") return { nodeId: node.id, offset: Math.max(0, Math.min(offset, node.text.length)) };
    let cursor = 0;
    for (let index = 0; index < node.children.length; index++) {
        const child = node.children[index], end = cursor + nodeSize(child);
        if (offset <= end) {
            if (!isAtomic(child)) return caretAt(child, Math.max(0, offset - cursor));
            return { nodeId: node.id, offset: offset === cursor ? index : index + 1 };
        }
        cursor = end;
    }
    return { nodeId: node.id, offset: node.children.length };
}

/** Resolve a structural gap towards the block being edited, without crossing its parent. */
export function resolveBoundary(document: HtmlEditorDocument, rootId: string, point: HtmlEditorPositionState, backward: boolean): HtmlEditorPositionState {
    if (editingScope(document, point)) return point;
    const node = point.nodeId === rootId ? document : locate(document, point.nodeId)?.node;
    if (!node || node.type === "text" || (node.type === "element" && isAtomic(node))) return point;
    const child = backward ? node.children[point.offset] ?? node.children[point.offset - 1]
        : node.children[point.offset - 1] ?? node.children[point.offset];
    if (!child || isAtomic(child)) return point;
    if (child.type === "element" && ["container", "cell", "table"].includes(getHtmlEditorElementBehavior(child).kind)) return point;
    const result = caretAt(child, node.children.indexOf(child) < point.offset ? nodeSize(child) : 0);
    return editingScope(document, result) ? result : point;
}

/** Only siblings with compatible semantics can merge or form one replacement range. */
export function canJoin(left: HtmlEditorElement, right: HtmlEditorElement): boolean {
    if (getHtmlEditorElementBehavior(left).boundary || getHtmlEditorElementBehavior(right).boundary) return false;
    const a = getHtmlEditorElementBehavior(left).kind, b = getHtmlEditorElementBehavior(right).kind;
    return (a === "textBlock" && b === "textBlock") || (a === "listItem" && b === "listItem");
}

/** Formatting whitespace between structural siblings is not an editing area.
 * Only ASCII HTML whitespace is ignored; a nonbreaking space is authored content.
 * Never use this to skip text inside an inline run or preformatted content.
 */
export function isStructuralWhitespace(node: HtmlEditorNode): boolean {
    return node.type === "text" && /^[\t\n\f\r ]*$/.test(node.text);
}

/** Find the neighboring structural sibling without crossing its parent shell. */
export function structuralNeighbor(parent: HtmlEditorParent, node: HtmlEditorNode, backward: boolean): HtmlEditorNode | undefined {
    const direction = backward ? -1 : 1;
    for (let index = parent.children.indexOf(node) + direction; index >= 0 && index < parent.children.length; index += direction) {
        const candidate = parent.children[index];
        if (!isStructuralWhitespace(candidate)) return candidate;
    }
}

/** Find the first/last editable leaf without entering a table or layout container. */
export function editableEdge(document: HtmlEditorDocument, node: HtmlEditorElement, end: boolean, id: () => string): HtmlEditorScope | undefined {
    const kind = getHtmlEditorElementBehavior(node).kind;
    if (getHtmlEditorElementBehavior(node).boundary) return;
    if (!["list", "listItem", "textBlock"].includes(kind)) return;
    if (node.children.every(isInline) && kind !== "list")
        return { block: node, parent: locate(document, node.id)!.parent, offset: end ? nodeSize(node) : 0 };
    const children = node.children.filter(child => child.type !== "text" || child.text.trim() !== "");
    const child = end ? children[children.length - 1] : children[0];
    if (!child) return;
    if (isInline(child) && kind === "listItem") {
        const point = caretAt(child, end ? nodeSize(child) : 0);
        const selection = prepareEditingSelection(document, { anchor: point, focus: point }, id);
        return editingScope(document, selection.anchor);
    }
    return child.type === "element" ? editableEdge(document, child, end, id) : undefined;
}

/** Resolve a list edge structurally, including trailing empty blocks. Layout and cell shells are barriers. */
export function listEdge(document: HtmlEditorDocument, list: HtmlEditorElement, backward: boolean, id: () => string): HtmlEditorScope | undefined {
    return editableEdge(document, list, backward, id);
}

/** Join adjacent items from either keyboard direction, regardless of inline/block representation.
 * For example, li(A), li(h2(B), p(C)) becomes li(AB, p(C)). Only the touching
 * text scopes merge; following paragraphs and nested lists move intact. Never
 * descend through a layout/table shell or skip a nested list at the join edge.
 */
export function joinListBoundary(document: HtmlEditorDocument, scope: HtmlEditorScope, backward: boolean, id: () => string): HtmlEditorPositionState | undefined {
    const item = scope.block.tag === "li" ? scope.block : scope.parent.type === "element" && scope.parent.tag === "li" ? scope.parent : undefined;
    if (!item) return;
    const own = editableEdge(document, item, !backward, id);
    if (!own || own.block !== scope.block) return;
    const list = locate(document, item.id)?.parent;
    if (!list || list.type !== "element" || getHtmlEditorElementBehavior(list).kind !== "list") return;
    const siblings = list.children.filter(child => child.type !== "text" || child.text.trim() !== "");
    const neighbor = siblings[siblings.indexOf(item) + (backward ? -1 : 1)];
    if (!neighbor || neighbor.type !== "element" || neighbor.tag !== "li") return;
    const target = editableEdge(document, neighbor, backward, id);
    // Nested-list leaves are not the boundary of these two sibling items.
    if (!target || (target.block !== neighbor && target.parent !== neighbor)) return;
    const leftItem = backward ? neighbor : item, rightItem = backward ? item : neighbor;
    const left = backward ? target : scope, right = backward ? scope : target;
    const offset = nodeSize(left.block);
    left.block.children.push(...right.block.children);
    if (right.block !== rightItem) leftItem.children.push(...rightItem.children.filter(child => child !== right.block));
    list.children.splice(list.children.indexOf(rightItem), 1);
    return caretAt(left.block, offset);
}

/** Remove an atomic sibling from an explicit parent gap. Never removes a structural container. */
export function deleteAtomicAtGap(document: HtmlEditorDocument, rootId: string, point: HtmlEditorPositionState, backward: boolean): HtmlEditorPositionState | undefined {
    const parent = point.nodeId === rootId ? document : locate(document, point.nodeId)?.node;
    if (!parent || parent.type === "text" || (parent.type === "element" && isAtomic(parent))) return;
    const index = backward ? point.offset - 1 : point.offset;
    if (!parent.children[index] || !isAtomic(parent.children[index])) return;
    parent.children.splice(index, 1);
    return { nodeId: point.nodeId, offset: index };
}

/** Split only text structure; layout containers/cells instead receive paragraphs inside them. */
export function splitScope(document: HtmlEditorDocument, scope: HtmlEditorScope, before: HtmlEditorNode[], after: HtmlEditorNode[], id: () => string): HtmlEditorPositionState {
    const kind = getHtmlEditorElementBehavior(scope.block).kind;
    const make = (children: HtmlEditorNode[]): HtmlEditorElement => ({ id: id(), type: "element", tag: "p", classes: [], styles: [], attributes: {}, children });
    if (kind === "container" || kind === "cell") {
        const left = make(before), right = make(after);
        scope.block.children = [left, right];
        return caretAt(right, 0);
    }
    const next = { ...structuredClone(scope.block), id: id(), tag: getHtmlEditorElementBehavior(scope.block).splitTag ?? scope.block.tag, children: after };
    delete next.attributes.id;
    scope.block.children = before;
    if (scope.parent.type === "element" && getHtmlEditorElementBehavior(scope.parent).kind === "listItem") {
        const owner = scope.parent, list = locate(document, owner.id)?.parent;
        if (list?.type === "element" && getHtmlEditorElementBehavior(list).kind === "list") {
            const following = owner.children.splice(owner.children.indexOf(scope.block) + 1);
            const item = { ...structuredClone(owner), id: id(), children: [next, ...following] };
            delete item.attributes.id;
            list.children.splice(list.children.indexOf(owner) + 1, 0, item);
            return caretAt(next, 0);
        }
    }
    scope.parent.children.splice(scope.parent.children.indexOf(scope.block) + 1, 0, next);
    return caretAt(next, 0);
}

/** Replace an ordered range of compatible inline scopes, retaining the starting block. */
export function replaceScopeRange(start: HtmlEditorScope, end: HtmlEditorScope, before: HtmlEditorNode[], inserted: HtmlEditorNode[], after: HtmlEditorNode[]): HtmlEditorPositionState {
    const offset = before.reduce((sum, child) => sum + nodeSize(child), 0) + inserted.reduce((sum, child) => sum + nodeSize(child), 0);
    start.block.children = [...before, ...inserted, ...after];
    const siblings = start.parent.children;
    siblings.splice(siblings.indexOf(start.block) + 1, siblings.indexOf(end.block) - siblings.indexOf(start.block));
    return caretAt(start.block, offset);
}

/** Slice inline content while retaining formatting; split suffixes receive fresh identities. */
export function sliceInline(children: HtmlEditorNode[], from: number, to: number, fresh: boolean, id: () => string,
    preserveIds?: ReadonlySet<string>): HtmlEditorNode[] {
    const result: HtmlEditorNode[] = [];
    let cursor = 0;
    for (const source of children) {
        const end = cursor + nodeSize(source);
        if (end > from && cursor < to) {
            const node = structuredClone(source);
            if (fresh && !preserveIds?.has(source.id)) {
                node.id = id();
                if (node.type === "element" && (cursor < from || end > to)) delete node.attributes.id;
            }
            if (node.type === "text") node.text = node.text.slice(Math.max(0, from - cursor), Math.min(nodeSize(source), to - cursor));
            else if (!isAtomic(node)) node.children = sliceInline((source as HtmlEditorElement).children,
                Math.max(0, from - cursor), to - cursor, fresh, id, preserveIds);
            result.push(node);
        }
        cursor = end;
    }
    return result;
}


