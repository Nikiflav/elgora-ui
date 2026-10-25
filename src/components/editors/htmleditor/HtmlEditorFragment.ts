import type { HtmlEditorDocument, HtmlEditorElement, HtmlEditorNode, HtmlEditorPositionState, HtmlEditorSelectionState } from "./HtmlEditorModel";
import { canJoin, caretAt, editingScope, getHtmlEditorElementBehavior as behavior, isAtomic, isPhrasing, locate, nodeSize,
    replaceScopeRange, sliceInline, type HtmlEditorParent, type HtmlEditorScope } from "./HtmlEditorStructure";

const restricted = new Set("li dt dd tr td th thead tbody tfoot caption colgroup col source summary figcaption".split(" "));
const phrasingHosts = new Set("p h1 h2 h3 h4 h5 h6 pre span strong b em i u s del sub sup a code".split(" "));
const plainParagraph = (node: HtmlEditorNode): boolean => node.type === "element" && node.tag === "p"
    && !node.classes.length && !node.styles.length && !Object.keys(node.attributes).length;

/** Child compatibility for supported fragment insertion; structural shells are never escaped implicitly. */
function accepts(parent: HtmlEditorParent, child: HtmlEditorNode): boolean {
    if (parent.type === "document") return child.type === "text" || !restricted.has(child.tag);
    if (child.type === "text" && !child.text.trim()) return true;
    const tag = child.type === "element" ? child.tag : "";
    if (parent.tag === "ul" || parent.tag === "ol") return tag === "li";
    if (parent.tag === "dl") return tag === "dt" || tag === "dd";
    if (parent.tag === "table") return ["caption", "colgroup", "thead", "tbody", "tfoot"].includes(tag);
    if (["thead", "tbody", "tfoot"].includes(parent.tag)) return tag === "tr";
    if (parent.tag === "tr") return tag === "td" || tag === "th";
    if (parent.tag === "colgroup") return tag === "col";
    if (parent.tag === "video") return tag === "source";
    if (["br", "img", "hr", "source", "col"].includes(parent.tag)) return false;
    if (phrasingHosts.has(parent.tag)) return isPhrasing(child);
    if (tag === "summary") return parent.tag === "details";
    if (tag === "figcaption") return parent.tag === "figure";
    if (tag === "caption") return false;
    return child.type === "text" || !restricted.has(tag);
}

/** Clone the incoming tree, giving runtime identities and conflicting HTML IDs local ownership. */
function importNodes(document: HtmlEditorDocument, fragment: HtmlEditorDocument, id: () => string): HtmlEditorNode[] {
    const used = new Set<string>(), renamed = new Map<string, string>();
    const collect = (nodes: HtmlEditorNode[]) => nodes.forEach(node => {
        if (node.type !== "element") return;
        if (node.attributes.id) used.add(node.attributes.id);
        collect(node.children);
    });
    collect(document.children);
    const nodes = structuredClone(fragment.children);
    const visit = (children: HtmlEditorNode[]) => children.forEach(node => {
        node.id = id();
        if (node.type !== "element") return;
        const authored = node.attributes.id;
        if (authored) {
            let unique = authored, index = 2;
            while (used.has(unique)) unique = `${authored}-${index++}`;
            used.add(unique);
            node.attributes.id = unique;
            if (!renamed.has(authored)) renamed.set(authored, unique);
        }
        visit(node.children);
    });
    visit(nodes);
    const references = (children: HtmlEditorNode[]) => children.forEach(node => {
        if (node.type !== "element") return;
        const href = node.attributes.href;
        if (href?.startsWith("#") && renamed.has(href.slice(1))) node.attributes.href = `#${renamed.get(href.slice(1))}`;
        for (const name of ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns"])
            if (node.attributes[name]) node.attributes[name] = node.attributes[name].split(/\s+/).map(value => renamed.get(value) ?? value).join(" ");
        references(node.children);
    });
    references(nodes);
    return nodes;
}

/** Insert a supported fragment into a model range. The caller owns an isolated working tree.
 * Inline fragments remain inline. Structural fragments split text blocks and stay
 * inside the current cell, list item or layout container. Invalid placements fail
 * before the caller publishes the working tree.
 */
export function insertHtmlEditorFragment(document: HtmlEditorDocument, rootId: string, selection: HtmlEditorSelectionState,
    fragment: HtmlEditorDocument | undefined, id: () => string): HtmlEditorSelectionState | undefined {
    if (!fragment?.children.length) return;
    const make = (tag: string, children: HtmlEditorNode[] = []): HtmlEditorElement => ({ id: id(), type: "element", tag, classes: [], styles: [], attributes: {}, children });
    const incoming = importNodes(document, fragment, id);

    // Repair orphan fragment roots using the nearest legal HTML wrapper. For
    // example, standalone td/th content at a flow position becomes a table.
    const adapt = (parent: HtmlEditorParent, children: HtmlEditorNode[]): HtmlEditorNode[] | undefined => {
        const result: HtmlEditorNode[] = [];
        let group: { family: string; sink: HtmlEditorElement } | undefined;
        for (const node of children) {
            if (parent.type === "element" && ["ul", "ol"].includes(parent.tag) && isPhrasing(node)
                && !(node.type === "text" && !node.text.trim() && group?.family !== "inline")) {
                if (group?.family === "inline") group.sink.children.push(node);
                else { const item = make("li", [node]); result.push(item); group = { family: "inline", sink: item }; }
                continue;
            }
            if (accepts(parent, node)) { result.push(node); group = undefined; continue; }
            if (parent.type === "element" && ["ul", "ol"].includes(parent.tag)) {
                if (node.type === "element" && node.tag === parent.tag && !node.classes.length && !node.styles.length && !Object.keys(node.attributes).length)
                    result.push(...node.children);
                else result.push(make("li", [node]));
                group = undefined;
                continue;
            }
            const tag = node.type === "element" ? node.tag : "";
            const family = ["td", "th"].includes(tag) ? "cells" : ["dt", "dd"].includes(tag) ? "definitions" : tag;
            if (group && group.family === family) { group.sink.children.push(node); continue; }
            group = undefined;
            let wrapped: HtmlEditorNode | undefined;
            let sink: HtmlEditorElement | undefined;
            if (tag === "li") wrapped = sink = make("ul", [node]);
            else if (["dt", "dd"].includes(tag)) wrapped = sink = make("dl", [node]);
            else if (["td", "th"].includes(tag)) {
                const row = make("tr", [node]);
                sink = row;
                wrapped = parent.type === "element" && ["thead", "tbody", "tfoot"].includes(parent.tag) ? row
                    : parent.type === "element" && parent.tag === "table" ? make("tbody", [row]) : make("table", [make("tbody", [row])]);
            } else if (tag === "tr") { sink = make("tbody", [node]); wrapped = parent.type === "element" && parent.tag === "table" ? sink : make("table", [sink]); }
            else if (["thead", "tbody", "tfoot", "caption", "colgroup"].includes(tag)) wrapped = make("table", [node]);
            else if (tag === "col") wrapped = parent.type === "element" && parent.tag === "table" ? make("colgroup", [node]) : make("table", [make("colgroup", [node])]);
            else if (tag === "summary") wrapped = make("details", [node]);
            else if (tag === "figcaption") wrapped = make("figure", [node]);
            if (!wrapped || !accepts(parent, wrapped)) return;
            result.push(wrapped);
            if (sink) group = { family, sink };
        }
        return result.every(node => accepts(parent, node)) ? result : undefined;
    };
    const repair = (nodes: HtmlEditorNode[]): boolean => nodes.every(node => {
        if (node.type === "text") return true;
        const children = adapt(node, node.children);
        if (!children) return false;
        node.children = children;
        return repair(children);
    });
    if (!repair(incoming)) return;
    const selected = (point: HtmlEditorPositionState) => point.nodeId === rootId ? document : locate(document, point.nodeId)?.node;
    const a = selected(selection.anchor), b = selected(selection.focus);
    const startScope = editingScope(document, selection.anchor), endScope = editingScope(document, selection.focus);
    // Explicit structural gaps/ranges include root positions, list gaps and legal
    // table row/cell boundaries. Preserve those exact insertion positions.
    if (a === b && a && a.type !== "text" && !startScope) {
        const children = adapt(a, incoming);
        if (!children || !repair(children)) return;
        const start = Math.min(selection.anchor.offset, selection.focus.offset), end = Math.max(selection.anchor.offset, selection.focus.offset);
        a.children.splice(start, end - start, ...children);
        let point = { nodeId: selection.anchor.nodeId, offset: start + children.length };
        if (a.type === "element" && behavior(a).kind === "table") {
            // A tr/tbody gap cannot accept ordinary typing. After inserting cells
            // or rows there, continue at the last inserted editable cell instead.
            // For col-only fragments, use the flow gap after the enclosing table.
            const lastEditable = (nodes: HtmlEditorNode[]): HtmlEditorPositionState | undefined => {
                for (let i = nodes.length - 1; i >= 0; i--) {
                    const node = nodes[i];
                    if (isAtomic(node)) continue;
                    const caret = caretAt(node, nodeSize(node));
                    if (editingScope(document, caret)) return caret;
                    const nested = node.type === "element" ? lastEditable(node.children) : undefined;
                    if (nested) return nested;
                }
            };
            const caret = lastEditable(children);
            if (caret) point = caret;
            else while (point.nodeId !== rootId) {
                const location = locate(document, point.nodeId);
                if (!location || location.node.type !== "element" || behavior(location.node).kind !== "table") break;
                point = { nodeId: location.parent.type === "document" ? rootId : location.parent.id,
                    offset: location.parent.children.indexOf(location.node) + 1 };
            }
        }
        return { anchor: point, focus: point };
    }
    let start = startScope, end = endScope;
    if (!start || !end || start.parent !== end.parent) return;
    const siblings = start.parent.children;
    if (siblings.indexOf(start.block) > siblings.indexOf(end.block) || (start.block === end.block && start.offset > end.offset)) [start, end] = [end, start];
    if (start.block !== end.block && !siblings.slice(siblings.indexOf(start.block), siblings.indexOf(end.block) + 1)
        .every(node => node.type === "element" && canJoin(start!.block, node) && editingScope(document, caretAt(node, 0)))) return;
    const before = sliceInline(start.block.children, 0, start.offset, false, id);
    const after = sliceInline(end.block.children, end.offset, nodeSize(end.block), true, id);
    // An ordinary single paragraph from a clipboard is its text fragment, while
    // a styled/id-bearing paragraph retains its authored block presentation.
    const inline = incoming.every(isPhrasing) ? incoming
        : incoming.length === 1 && incoming[0].type === "element" && plainParagraph(incoming[0]) && incoming[0].children.every(isPhrasing) ? incoming[0].children : undefined;
    if (inline) {
        const point = replaceScopeRange(start, end, before, inline, after);
        return { anchor: point, focus: point };
    }

    const shell = ["container", "cell", "listItem"].includes(behavior(start.block).kind);
    const host = shell ? start.block : start.parent;
    const fitted = adapt(host, incoming);
    if (!fitted || !repair(fitted)) return;
    const blocks: HtmlEditorNode[] = [];
    let run: HtmlEditorNode[] = [];
    const flush = () => { if (run.length && !run.every(node => node.type === "text" && !node.text.trim())) blocks.push(make("p", run)); run = []; };
    for (const node of fitted) { if (isPhrasing(node)) run.push(node); else { flush(); blocks.push(node); } }
    flush();
    if (!blocks.length) return;
    const part = (scope: HtmlEditorScope, children: HtmlEditorNode[], fresh: boolean): HtmlEditorElement => {
        if (shell) return make("p", children);
        const block = { ...structuredClone(scope.block), children };
        if (fresh) { block.id = id(); delete block.attributes.id; }
        return block;
    };
    if (before.length) {
        const first = blocks[0];
        if (first.type === "element" && plainParagraph(first)) blocks.splice(0, 1, part(start, [...before, ...first.children], false));
        else blocks.unshift(part(start, before, false));
    }
    const last = blocks[blocks.length - 1];
    let point: HtmlEditorPositionState;
    if (last.type === "element" && plainParagraph(last)) {
        const offset = nodeSize(last);
        last.children.push(...after);
        point = caretAt(last, offset);
    } else if (after.length || last.type !== "element" || behavior(last).kind !== "textBlock") {
        const following = !shell && !after.length ? siblings[siblings.indexOf(end.block) + 1] : undefined;
        if (following?.type === "element" && behavior(following).kind === "textBlock" && following.children.every(isPhrasing))
            point = caretAt(following, 0);
        else {
            const right = part(end, after, start.block === end.block && before.length > 0);
            blocks.push(right);
            point = caretAt(right, 0);
        }
    } else point = caretAt(last, nodeSize(last));
    if (!blocks.every(node => accepts(host, node))) return;
    if (shell) start.block.children = blocks;
    else siblings.splice(siblings.indexOf(start.block), siblings.indexOf(end.block) - siblings.indexOf(start.block) + 1, ...blocks);
    return { anchor: point, focus: point };
}
