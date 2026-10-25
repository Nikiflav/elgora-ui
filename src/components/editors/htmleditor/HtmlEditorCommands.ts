import { isHtmlEditorBlock, type HtmlEditorDocument, type HtmlEditorElement, type HtmlEditorNode, type HtmlEditorText, type HtmlEditorPositionState, type HtmlEditorSelectionState } from "./HtmlEditorModel";
import { getHtmlEditorElementBehavior as behavior, isAtomic, nodeSize as size, locate as find, editingScope as blockAt,
    caretAt as positionAt, resolveBoundary, canJoin, listEdge, deleteAtomicAtGap, splitScope, replaceScopeRange,
    validPosition, prepareEditingSelection, editableEdge, joinListBoundary, structuralNeighbor, isStructuralWhitespace, sliceInline as slice } from "./HtmlEditorStructure";
import { insertHtmlEditorFragment } from "./HtmlEditorFragment";
import { deleteHtmlEditorRange } from "./HtmlEditorRange";

/** Operations currently supported by the rich-text command layer. */
export type HtmlEditorCommand =
    | { type: "insertText"; text: string }
    | { type: "insertHtml"; html: string }
    | { type: "deleteBackward" | "deleteForward" | "insertParagraph" | "insertLineBreak" | "indent" | "outdent" | "bold" | "italic" | "undo" | "redo" };

/** A document and directed selection are committed/restored as one history entry. */
export interface HtmlEditorState {
    document: HtmlEditorDocument;
    selection?: HtmlEditorSelectionState;
    /** Explicit typing-format overrides at a collapsed caret. */
    marks?: { bold?: boolean; italic?: boolean };
}

const blocks = { has: (tag: string) => ["textBlock", "listItem"].includes(behavior({ tag }).kind) };
const atoms = { has: (tag: string) => behavior({ tag }).kind === "atomic" };
const length = (children: HtmlEditorNode[]) => children.reduce((n, child) => n + size(child), 0);

function element(tag: string, id: () => string, children: HtmlEditorNode[] = []): HtmlEditorElement {
    return { id: id(), type: "element", tag, classes: [], attributes: {}, styles: [], children };
}
function text(value: string, id: () => string): HtmlEditorText {
    return { id: id(), type: "text", text: value };
}
function textContent(value: string, id: () => string): HtmlEditorNode[] {
    return value.replace(/\r\n?/g, "\n").split("\n").flatMap((line, i) => [...(i ? [element("br", id)] : []), ...(line ? [text(line, id)] : [])]);
}

/** Delete whole graphemes even at a programmatically restored interior offset.
 * Inline formatting does not split a grapheme, but each atom is its own unit:
 * img + combining accent must never be segmented as a single text character.
 */
function characterRange(block: HtmlEditorElement, offset: number, backward: boolean): [number, number] {
    const value = plain(block), barriers = [0];
    let cursor = 0;
    const visit = (node: HtmlEditorNode): void => {
        if (node.type === "text") cursor += node.text.length;
        else if (isAtomic(node)) { barriers.push(cursor, ++cursor); }
        else node.children.forEach(visit);
    };
    visit(block);
    barriers.push(cursor);
    const Segmenter = (Intl as unknown as { Segmenter?: new (...args: unknown[]) => { segment(value: string): Iterable<{ index: number }> } }).Segmenter;
    const segmenter = Segmenter ? new Segmenter(undefined, { granularity: "grapheme" }) : undefined;
    const boundaries = new Set<number>([0, value.length]);
    for (let i = 1; i < barriers.length; i++) {
        const from = barriers[i - 1], to = barriers[i];
        if (from === to) continue;
        const run = value.slice(from, to);
        if (segmenter) for (const part of segmenter.segment(run)) boundaries.add(from + part.index);
        else {
            let index = from;
            for (const codepoint of run) { boundaries.add(index); index += codepoint.length; }
        }
        boundaries.add(to);
    }
    const ordered = [...boundaries].sort((a, b) => a - b);
    const right = ordered.findIndex(boundary => boundary >= offset);
    if (ordered[right] === offset) return backward ? [ordered[Math.max(0, right - 1)], offset]
        : [offset, ordered[Math.min(ordered.length - 1, right + 1)]];
    return [ordered[right - 1], ordered[right]];
}
function plain(node: HtmlEditorNode): string { return node.type === "text" ? node.text ?? "" : atoms.has(node.tag) ? "\ufffc" : node.children.map(plain).join(""); }

/** Preformatted input edits literal text while retaining the pre/code shells.
 * Apply line edits backwards so original offsets and inline slices stay valid.
 */
function editPre(document: HtmlEditorDocument, selection: HtmlEditorSelectionState, command: HtmlEditorCommand,
    id: () => string): HtmlEditorState | undefined {
    const anchor = blockAt(document, selection.anchor), focus = blockAt(document, selection.focus);
    if (!anchor || !focus || anchor.block !== focus.block || anchor.block.tag !== "pre") return;
    const block = anchor.block, from = Math.min(anchor.offset, focus.offset), to = Math.max(anchor.offset, focus.offset);
    const replace = (offset: number, count: number, value: string) => {
        const point = positionAt(block, offset), location = find(document, point.nodeId);
        if (location?.node.type === "text" && point.offset + count <= location.node.text.length) {
            location.node.text = location.node.text.slice(0, point.offset) + value + location.node.text.slice(point.offset + count);
            return;
        }
        if (!count && value && location?.node.type === "element" && behavior(location.node).kind === "inline") {
            location.node.children.splice(point.offset, 0, text(value, id));
            return;
        }
        block.children = [...slice(block.children, 0, offset, false, id), ...(value ? [text(value, id)] : []),
            ...slice(block.children, offset + count, size(block), true, id)];
    };
    if (["indent", "outdent"].includes(command.type)) {
        const value = plain(block), edits: { offset: number; count: number; value: string }[] = [];
        let offset = value.lastIndexOf("\n", from - 1) + 1;
        // lastIndexOf with -1 still searches offset zero; a leading newline
        // must not move the first selected line past a caret at offset zero.
        if (from === 0) offset = 0;
        do {
            const count = command.type === "outdent" ? (/^(\t| {1,4})/.exec(value.slice(offset))?.[0].length ?? 0) : 0;
            if (command.type === "indent" || count) edits.push({ offset, count, value: command.type === "indent" ? "\t" : "" });
            const next = value.indexOf("\n", offset);
            if (next < 0 || next + 1 >= to) break;
            offset = next + 1;
        } while (true);
        for (const edit of [...edits].reverse()) replace(edit.offset, edit.count, edit.value);
        const map = (original: number) => original + edits.reduce((delta, edit) => delta + (original < edit.offset ? 0
            : edit.value.length - Math.min(edit.count, original - edit.offset)), 0);
        const a = positionAt(block, map(anchor.offset)), f = positionAt(block, map(focus.offset));
        return { document, selection: { anchor: a, focus: f } };
    }
    if (command.type !== "insertText" && command.type !== "insertParagraph" && command.type !== "insertLineBreak") return;
    const value = command.type === "insertText" ? command.text.replace(/\r\n?/g, "\n") : "\n";
    // Insert inside the existing code/formatting wrappers when possible.
    const point = positionAt(block, from), location = find(document, point.nodeId);
    if (from === to && location?.node.type === "text") {
        location.node.text = location.node.text.slice(0, point.offset) + value + location.node.text.slice(point.offset);
    } else replace(from, to - from, value);
    const caret = positionAt(block, from + value.length);
    return { document, selection: { anchor: caret, focus: caret } };
}

/** Lift one direct text block out of its quote, splitting the quote if needed.
 * Nested quotes lift one level. Layout/cell/list descendants never escape here.
 */
function leaveQuote(document: HtmlEditorDocument, selection: HtmlEditorSelectionState, command: HtmlEditorCommand,
    id: () => string): HtmlEditorState | undefined {
    let scope = blockAt(document, selection.anchor);
    // Direct inline quote content is a text area too. Materialize a paragraph
    // only for an actual exit, keeping unrelated typing/commands untouched.
    if (scope?.block.tag === "blockquote" && ((command.type === "deleteBackward" && scope.offset === 0)
        || (command.type === "insertParagraph" && emptyListItem(scope.block)))) {
        const quote = scope.block, paragraph = element("p", id, quote.children);
        quote.children = [paragraph];
        scope = blockAt(document, positionAt(paragraph, scope.offset));
    }
    if (!scope || scope.parent.type !== "element" || scope.parent.tag !== "blockquote"
        || behavior(scope.block).kind !== "textBlock" || behavior(scope.block).boundary) return;
    const quote = scope.parent, location = find(document, quote.id)!;
    const previous = structuralNeighbor(quote, scope.block, true), next = structuralNeighbor(quote, scope.block, false);
    const backspace = command.type === "deleteBackward" && scope.offset === 0 && !previous;
    const enter = command.type === "insertParagraph" && scope.block.tag === "p" && emptyListItem(scope.block) && !next;
    if (!backspace && !enter) return;
    const index = quote.children.indexOf(scope.block), before = quote.children.slice(0, index), after = quote.children.slice(index + 1);
    const parts: HtmlEditorNode[] = [];
    if (previous) { quote.children = before; parts.push(quote); }
    parts.push(scope.block);
    if (next) {
        if (!previous) { quote.children = after; parts.push(quote); }
        else {
            const trailing = { ...structuredClone(quote), id: id(), children: after };
            delete trailing.attributes.id;
            parts.push(trailing);
        }
    }
    location.parent.children.splice(location.parent.children.indexOf(quote), 1, ...parts);
    const caret = positionAt(scope.block, backspace ? 0 : scope.offset);
    return { document, selection: { anchor: caret, focus: caret } };
}

/** Empty list items may contain inline wrappers, an empty paragraph or one authored break. */
function emptyListItem(item: HtmlEditorElement): boolean {
    let breaks = 0;
    const empty = (node: HtmlEditorNode): boolean => node.type === "text" ? node.text === ""
        : node.tag === "br" ? ++breaks <= 1
        : (node.tag === "p" || !isHtmlEditorBlock(node)) && !atoms.has(node.tag) && node.children.every(empty);
    return item.children.every(empty);
}

/** Exit a list, or lift an item one level, without losing following items/content. */
function exitList(document: HtmlEditorDocument, item: HtmlEditorElement, id: () => string, preserveContent = false): HtmlEditorPositionState | undefined {
    const list = find(document, item.id)?.parent;
    if (!list || list.type !== "element" || !["ul", "ol"].includes(list.tag)) return;
    const location = find(document, list.id)!;
    const owner = location.parent;
    const outerList = owner.type === "element" && owner.tag === "li" ? find(document, owner.id)?.parent : undefined;
    if (owner.type === "element" && owner.tag === "li"
        && (!outerList || outerList.type !== "element" || !["ul", "ol"].includes(outerList.tag))) return;

    const index = list.children.indexOf(item);
    const preceding = list.children.slice(0, index), followingItems = list.children.slice(index + 1);
    const prefix = preceding.some(node => node.type === "element" && node.tag === "li") ? preceding : [];
    const suffix = followingItems.some(node => node.type === "element" && node.tag === "li") ? followingItems : [];
    const trailing = suffix.length ? { ...list, id: id(), attributes: { ...list.attributes }, children: suffix } : undefined;
    if (trailing) {
        delete trailing.attributes.id;
    }
    // Splitting an ordered list must not restart its remaining items at 1;
    // shortening an implicitly numbered reversed list must not renumber its prefix.
    if (list.tag === "ol") {
        const reversed = "reversed" in list.attributes;
        const initial = Number.parseInt(list.attributes.start ?? "", 10);
        const countItems = (nodes: HtmlEditorNode[]) => nodes.filter(node => node.type === "element" && node.tag === "li").length;
        const start = Number.isNaN(initial) ? (reversed ? countItems(list.children) : 1) : initial;
        if (trailing) trailing.attributes.start = String(start + (reversed ? -1 : 1) * (countItems(prefix) + 1));
        if (reversed && prefix.length && !("start" in list.attributes)) list.attributes.start = String(start);
    }
    const listIndex = owner.children.indexOf(list);
    list.children = prefix;
    if (outerList && outerList.type === "element" && owner.type === "element") {
        // <li>A<ul><li>B</li><li>|</li><li>C</li></ul>D</li>
        // becomes <li>A<ul><li>B</li></ul></li><li>|<ul><li>C</li></ul>D</li>.
        const following = owner.children.splice(listIndex + 1);
        if (!prefix.length) owner.children.splice(listIndex, 1);
        const paragraph = !preserveContent && (trailing || following.length) ? element("p", id) : undefined;
        item.children = [...(preserveContent ? item.children : paragraph ? [paragraph] : []), ...(trailing ? [trailing] : []), ...following];
        outerList.children.splice(outerList.children.indexOf(owner) + 1, 0, item);
        return { nodeId: paragraph?.id ?? item.id, offset: 0 };
    }
    // Retain the former item's identity/presentation. Inline items become a
    // paragraph; a structured item needs a flow shell for its nested blocks.
    const paragraph = preserveContent ? item : element("p", id);
    if (preserveContent) {
        paragraph.tag = paragraph.children.every(node => node.type === "text" || !isHtmlEditorBlock(node)) ? "p" : "div";
        delete paragraph.attributes.type;
        delete paragraph.attributes.value;
    }
    owner.children.splice(listIndex, 1, ...(prefix.length ? [list] : []), paragraph, ...(trailing ? [trailing] : []));
    return { nodeId: paragraph.id, offset: 0 };
}

/** Pure model transformation. Unsupported structural edits return undefined and are blocked by the host. */
export function applyHtmlEditorCommand(state: HtmlEditorState, rootId: string, command: HtmlEditorCommand, id: () => string, fragment?: HtmlEditorDocument): HtmlEditorState | undefined {
    if (!state.selection || command.type === "undo" || command.type === "redo") return;
    if (!validPosition(state.document, rootId, state.selection.anchor) || !validPosition(state.document, rootId, state.selection.focus)) return;
    const document = structuredClone(state.document);
    let selection = prepareEditingSelection(document, state.selection, id);
    const pre = editPre(document, selection, command, id);
    if (pre) return { ...pre, marks: state.marks };
    // Indentation is currently defined only inside one preformatted area.
    if (command.type === "indent" || command.type === "outdent") return;
    const originallyCollapsed = selection.anchor.nodeId === selection.focus.nodeId && selection.anchor.offset === selection.focus.offset;
    if (originallyCollapsed && (command.type === "deleteBackward" || command.type === "deleteForward")) {
        const caret = deleteAtomicAtGap(document, rootId, selection.anchor, command.type === "deleteBackward");
        if (caret) return { document, selection: { anchor: caret, focus: caret } };
    }
    if (originallyCollapsed && (command.type === "deleteBackward" || command.type === "deleteForward")) {
        const point = resolveBoundary(document, rootId, selection.anchor, command.type === "deleteBackward");
        selection = { anchor: point, focus: point };
    }
    const anchorScope = blockAt(document, selection.anchor), focusScope = blockAt(document, selection.focus);
    const collapsed = originallyCollapsed || !!(anchorScope && focusScope && anchorScope.block === focusScope.block && anchorScope.offset === focusScope.offset);
    if (collapsed) {
        const quote = leaveQuote(document, selection, command, id);
        if (quote) return { ...quote, marks: state.marks };
    }
    if (!originallyCollapsed && !["bold", "italic"].includes(command.type)) {
        if (command.type === "insertHtml" && !fragment?.children.length) return;
        const point = deleteHtmlEditorRange(document, rootId, selection);
        if (point) {
            const removed: HtmlEditorState = { document, selection: { anchor: point, focus: point }, marks: state.marks };
            if (command.type === "deleteBackward" || command.type === "deleteForward"
                || (command.type === "insertText" && !command.text)) {
                // A deleted cell may leave a bookmark between td/tr nodes. A
                // text caret there cannot accept the next keystroke: lift it
                // after the enclosing table, without changing the table itself.
                let caret = point;
                while (caret.nodeId !== rootId && !blockAt(document, caret)) {
                    const location = find(document, caret.nodeId);
                    if (!location || location.node.type !== "element" || behavior(location.node).kind !== "table") break;
                    caret = { nodeId: location.parent.type === "document" ? rootId : location.parent.id,
                        offset: location.parent.children.indexOf(location.node) + 1 };
                }
                return { ...removed, selection: { anchor: caret, focus: caret } };
            }
            // Replacement is one transaction: recursive insertion works on a
            // clone, so failed placement cannot publish a partially deleted tree.
            let insertion = point;
            while (true) {
                const result = applyHtmlEditorCommand({ ...removed, selection: { anchor: insertion, focus: insertion } }, rootId, command, id, fragment);
                if (result) return result;
                if (insertion.nodeId === rootId) return;
                const location = find(document, insertion.nodeId);
                if (!location) return;
                insertion = { nodeId: location.parent.type === "document" ? rootId : location.parent.id,
                    offset: location.parent.children.indexOf(location.node) + 1 };
            }
        }
    }
    if (collapsed && !originallyCollapsed && anchorScope) {
        const point = positionAt(anchorScope.block, anchorScope.offset);
        selection = { anchor: point, focus: point };
    }
    if (command.type === "insertHtml") {
        const result = insertHtmlEditorFragment(document, rootId, selection, fragment, id);
        return result ? { document, selection: result } : undefined;
    }
    if (collapsed && (command.type === "insertParagraph" || command.type === "deleteBackward")) {
        const location = find(document, selection.anchor.nodeId);
        const item = location && [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])]
            .reverse().find(node => node.tag === "li");
        if (item && emptyListItem(item)) {
            if (command.type === "deleteBackward") {
                const parent = find(document, item.id)!.parent;
                if (parent.type !== "element" || !["ul", "ol"].includes(parent.tag)) return;
                const index = parent.children.indexOf(item);
                const previous = parent.children.slice(0, index).reverse()
                    .find(node => node.type !== "text" || node.text.trim() !== "");
                if (previous?.type === "element" && previous.tag === "li") {
                    const target = editableEdge(document, previous, true, id);
                    if (!target) return;
                    const caret = positionAt(target.block, size(target.block));
                    parent.children.splice(index, 1);
                    return { document, selection: { anchor: caret, focus: caret } };
                }
            }
            const caret = exitList(document, item, id);
            if (!caret) return;
            return { document, selection: { anchor: caret, focus: caret } };
        }
        if (item && command.type === "deleteBackward" && anchorScope?.offset === 0) {
            const edge = editableEdge(document, item, false, id);
            const parent = find(document, item.id)?.parent;
            const previous = parent && structuralNeighbor(parent, item, true);
            // Only the first editable edge of the first item may leave its list.
            // Internal paragraphs and protected layout/table edges keep their scope.
            if (edge?.block === anchorScope.block && !previous) {
                const caret = exitList(document, item, id, true);
                if (caret) return { document, selection, marks: state.marks };
            }
        }
    }
    if (collapsed && (command.type === "bold" || command.type === "italic")) {
        const location = find(document, selection.anchor.nodeId);
        const aliases = command.type === "bold" ? ["strong", "b"] : ["em", "i"];
        const inherited = location && [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])].some(node => aliases.includes(node.tag));
        return { document, selection: structuredClone(selection), marks: { ...state.marks, [command.type]: !(state.marks?.[command.type] ?? inherited) } };
    }
    // Ordinary typing/replacement updates one existing text node, preserving its
    // identity and wrappers rather than producing a new node for each character.
    if (command.type === "insertText" && !/[\r\n]/.test(command.text) && selection.anchor.nodeId === selection.focus.nodeId) {
        const location = find(document, selection.anchor.nodeId);
        if (location?.node.type === "text") {
            const tags = location.ancestors.map(node => node.tag);
            const matches = (state.marks?.bold === undefined || state.marks.bold === tags.some(tag => ["strong", "b"].includes(tag)))
                && (state.marks?.italic === undefined || state.marks.italic === tags.some(tag => ["em", "i"].includes(tag)));
            if (matches) {
                const from = Math.min(selection.anchor.offset, selection.focus.offset), to = Math.max(selection.anchor.offset, selection.focus.offset);
                location.node.text = (location.node.text ?? "").slice(0, from) + command.text + (location.node.text ?? "").slice(to);
                const caret = { nodeId: location.node.id, offset: from + command.text.length };
                return { document, selection: { anchor: caret, focus: caret }, marks: state.marks };
            }
        }
    }
    // Root boundaries support selecting/replacing whole top-level blocks, including an empty document.
    if (selection.anchor.nodeId === rootId && selection.focus.nodeId === rootId) {
        const start = Math.min(selection.anchor.offset, selection.focus.offset);
        const end = Math.max(selection.anchor.offset, selection.focus.offset);
        if (start < 0 || end > document.children.length || !["insertText", "insertHtml", "deleteBackward", "deleteForward", "insertParagraph", "insertLineBreak"].includes(command.type)) return;
        if (collapsed && !["insertText", "insertHtml", "insertParagraph", "insertLineBreak"].includes(command.type)) return;
        const block = element("p", id, command.type === "insertText" ? textContent(command.text, id) : command.type === "insertLineBreak" ? [element("br", id)] : []);
        document.children.splice(start, end - start, block);
        const caret = positionAt(block, length(block.children));
        return { document, selection: { anchor: caret, focus: caret } };
    }
    if (collapsed && !blockAt(document, selection.anchor) && ["insertText", "insertHtml", "insertParagraph", "insertLineBreak"].includes(command.type)) {
        const location = find(document, selection.anchor.nodeId);
        if (location?.node.type === "element" && ["container", "cell", "listItem", "list"].includes(behavior(location.node).kind)) {
            const parent = location.node;
            const block = element(behavior(parent).kind === "list" ? "li" : "p", id);
            parent.children.splice(selection.anchor.offset, 0, block);
            const point = { nodeId: block.id, offset: 0 };
            if (command.type === "insertParagraph") return { document, selection: { anchor: point, focus: point } };
            selection = { anchor: point, focus: point };
        }
    }
    let start = blockAt(document, selection.anchor), end = blockAt(document, selection.focus);
    if (!start || !end || start.parent !== end.parent) return;
    const siblings = start.parent.children;
    if (collapsed && command.type === "insertParagraph" && start.block.tag === "p" && start.offset === size(start.block)) {
        const location = find(document, selection.anchor.nodeId)!;
        const protectedContent = (node: HtmlEditorNode): boolean => node.type === "element"
            && (node.tag === "code" || node.children.some(protectedContent));
        const inListOrCode = location.ancestors.some(node => ["li", "ul", "ol", "pre", "code"].includes(node.tag));
        // Recognize a marker only at the beginning of a paragraph, on Enter at
        // its end. Slice model content so inline formatting survives marker removal.
        const marker = /^([*-]|\d{1,9}\.)[ \t]+/.exec(plain(start.block));
        if (marker && !inListOrCode && !start.block.children.some(protectedContent)) {
            const item = start.block;
            item.children = slice(item.children, marker[0].length, size(item), false, id);
            item.tag = "li";
            const hasContent = size(item) > 0;
            const next = hasContent ? element("li", id) : item;
            const list = element(marker[1].endsWith(".") ? "ol" : "ul", id, hasContent ? [item, next] : [item]);
            if (list.tag === "ol" && Number(marker[1].slice(0, -1)) !== 1)
                list.attributes.start = String(Number(marker[1].slice(0, -1)));
            siblings.splice(siblings.indexOf(item), 1, list);
            const caret = positionAt(next, 0);
            return { document, selection: { anchor: caret, focus: caret } };
        }
    }
    const reversed = siblings.indexOf(start.block) > siblings.indexOf(end.block) || (start.block === end.block && start.offset > end.offset);
    if (reversed) [start, end] = [end, start];
    if (start.block !== end.block) {
        const range = siblings.slice(siblings.indexOf(start.block), siblings.indexOf(end.block) + 1);
        if (!range.every(node => isStructuralWhitespace(node) || node.type === "element" && canJoin(start!.block, node) && blockAt(document, positionAt(node, 0)))) return;
    }
    if (collapsed && (command.type === "deleteBackward" || command.type === "deleteForward")) {
        const backward = command.type === "deleteBackward";
        if ((backward && start.offset === 0) || (!backward && start.offset === size(start.block))) {
            // Captions, summaries and preformatted areas own their outer boundary.
            // Paragraph joins inside cells/layout items remain local to their parent.
            if (behavior(start.block).boundary) return;
            const joined = joinListBoundary(document, start, backward, id);
            if (joined) return { document, selection: { anchor: joined, focus: joined } };
            const neighbor = structuralNeighbor(start.parent, start.block, backward);
            if (neighbor?.type === "element" && behavior(neighbor).boundary) return;
            if (blocks.has(start.block.tag) && start.block.tag !== "li" && neighbor?.type === "element" && behavior(neighbor).kind === "list") {
                const target = listEdge(document, neighbor, backward, id);
                if (!target) return;
                // Join at the last editable list boundary, preserving inline nodes
                // and their identities. Resolve the caret before appending the paragraph.
                const joinOffset = backward ? size(target.block) : size(start.block);
                if (backward) target.block.children.push(...start.block.children);
                else target.block.children.unshift(...start.block.children);
                const caret = positionAt(target.block, joinOffset);
                siblings.splice(siblings.indexOf(start.block), 1);
                return { document, selection: { anchor: caret, focus: caret } };
            }
            if (neighbor && isAtomic(neighbor)) {
                siblings.splice(siblings.indexOf(neighbor), 1);
                const caret = positionAt(start.block, start.offset);
                return { document, selection: { anchor: caret, focus: caret } };
            }
            if (!neighbor || neighbor.type !== "element" || !canJoin(start.block, neighbor)
                || blockAt(document, positionAt(neighbor, 0))?.block !== neighbor) return;
            if (backward) start = { block: neighbor, parent: start.parent, offset: size(neighbor) };
            else end = { block: neighbor, parent: start.parent, offset: 0 };
        } else {
            const [from, to] = characterRange(start.block, start.offset, backward);
            start = { ...start, offset: from };
            end = { ...end, offset: to };
        }
    }
    const before = slice(start.block.children, 0, start.offset, false, id);
    const after = slice(end.block.children, end.offset, size(end.block), true, id);
    const startIndex = siblings.indexOf(start.block), endIndex = siblings.indexOf(end.block);
    if (command.type === "bold" || command.type === "italic") {
        if (collapsed) return;
        const tag = command.type === "bold" ? "strong" : "em";
        const alias = command.type === "bold" ? "b" : "i";
        const formatted = (node: HtmlEditorNode): boolean => node.type === "element" && (node.tag === tag || node.tag === alias || (node.children.length > 0 && node.children.every(formatted)));
        const unwrap = (node: HtmlEditorNode): HtmlEditorNode[] => node.type === "text" ? [node] : node.tag === tag || node.tag === alias ? node.children.flatMap(unwrap) : [{ ...node, children: node.children.flatMap(unwrap) }];
        const scopes = siblings.slice(startIndex, endIndex + 1);
        if (!scopes.every((node): node is HtmlEditorElement => node.type === "element" && blockAt(document, positionAt(node, 0))?.block === node)) return;
        const ranges = scopes.map(block => ({ block, from: block === start!.block ? start!.offset : 0, to: block === end!.block ? end!.offset : size(block) }));
        const pieces = ranges.map(range => slice(range.block.children, range.from, range.to, true, id));
        const remove = pieces.flat().every(formatted);
        ranges.forEach((range, i) => {
            if (range.from === range.to) return;
            const prefix = slice(range.block.children, 0, range.from, false, id);
            const suffix = slice(range.block.children, range.to, size(range.block), true, id);
            const replacement = remove ? pieces[i].flatMap(unwrap) : [element(tag, id, pieces[i])];
            range.block.children = [...prefix, ...replacement, ...suffix];
        });
        const left = positionAt(start.block, start.offset), right = positionAt(end.block, end.offset);
        return { document, selection: { anchor: reversed ? right : left, focus: reversed ? left : right } };
    }
    if (command.type === "insertParagraph") {
        siblings.splice(startIndex + 1, endIndex - startIndex);
        const caret = splitScope(document, start, before, after, id);
        return { document, selection: { anchor: caret, focus: caret } };
    }
    let inserted: HtmlEditorNode[] = [];
    if (command.type === "insertText") {
        inserted = textContent(command.text, id);
        // Preserve the inline formatting at the insertion point.
        const insertionPoint = reversed ? selection.focus : selection.anchor;
        const location = find(document, insertionPoint.nodeId);
        const inline = location ? [...location.ancestors, ...(location.node.type === "text" ? [] : [location.node])] : [];
        const blockIndex = inline.findIndex(node => node.id === start.block.id);
        const wrappers = inline.slice(blockIndex + 1).filter(node => !(state.marks?.bold === false && ["strong", "b"].includes(node.tag)) && !(state.marks?.italic === false && ["em", "i"].includes(node.tag)));
        for (const wrapper of wrappers.reverse()) {
            const copy = { ...structuredClone(wrapper), id: id(), children: inserted };
            delete copy.attributes.id;
            inserted = [copy];
        }
        if (state.marks?.bold && !wrappers.some(node => ["strong", "b"].includes(node.tag))) inserted = [element("strong", id, inserted)];
        if (state.marks?.italic && !wrappers.some(node => ["em", "i"].includes(node.tag))) inserted = [element("em", id, inserted)];
    } else if (command.type === "insertLineBreak") inserted = [element("br", id)];
    const caret = replaceScopeRange(start, end, before, inserted, after);
    return { document, selection: { anchor: caret, focus: caret }, marks: state.marks };
}
