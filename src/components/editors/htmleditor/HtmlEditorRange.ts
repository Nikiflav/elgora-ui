import type { HtmlEditorDocument, HtmlEditorNode, HtmlEditorPositionState, HtmlEditorSelectionState } from "./HtmlEditorModel";
import { isAtomic, isStructuralWhitespace, locate, validPosition, type HtmlEditorParent } from "./HtmlEditorStructure";

/** A precomputed content interval. Empty elements and atoms occupy one unit so
 * selecting text beside them never accidentally selects their structural shell.
 * Element child gaps and text offsets map into the same ordered coordinate space.
 */
interface Interval { from: number; to: number; gaps?: number[]; }

/** Coverage of a model node by a non-collapsed text range; unselected nodes are omitted. */
export type HtmlEditorNodeCoverage = "full" | "partial";

/** Shared, read-only coverage analysis for extraction and deletion on one model snapshot. */
interface RangeAnalysis {
    intervals: Map<HtmlEditorParent | HtmlEditorNode, Interval>;
    from: number;
    to: number;
    start: HtmlEditorPositionState;
}

/** Index the snapshot once and normalize direction without changing either endpoint. */
function analyzeRange(document: HtmlEditorDocument, rootId: string,
    selection: HtmlEditorSelectionState): RangeAnalysis | undefined {
    if (!validPosition(document, rootId, selection.anchor) || !validPosition(document, rootId, selection.focus)) return;
    const intervals = new Map<HtmlEditorParent | HtmlEditorNode, Interval>();
    let cursor = 0;
    const measure = (node: HtmlEditorParent | HtmlEditorNode): void => {
        const from = cursor;
        if (node.type === "text") { cursor += node.text.length; intervals.set(node, { from, to: cursor }); return; }
        if (node.type === "element" && isAtomic(node)) { intervals.set(node, { from, to: ++cursor }); return; }
        const gaps = [cursor];
        for (const child of node.children) { measure(child); gaps.push(cursor); }
        // Only a parent range can cover an empty element: its sole internal gap
        // is before this token, whereas the following sibling starts after it.
        if (node.type === "element" && cursor === from) cursor++;
        intervals.set(node, { from, to: cursor, gaps });
    };
    measure(document);
    const nodeAt = (point: HtmlEditorPositionState) => point.nodeId === rootId ? document : locate(document, point.nodeId)?.node;
    const coordinate = (point: HtmlEditorPositionState): number | undefined => {
        const node = nodeAt(point), span = node && intervals.get(node);
        return !node || !span ? undefined : node.type === "text" ? span.from + point.offset : span.gaps?.[point.offset];
    };
    const a = coordinate(selection.anchor), b = coordinate(selection.focus);
    if (a === undefined || b === undefined || a === b) return;
    const from = Math.min(a, b), to = Math.max(a, b);
    const start = a < b ? selection.anchor : selection.focus;
    return { intervals, from, to, start };
}

/** Read-only coverage using exactly the intervals used by Copy/Delete, including atoms and empty shells.
 * Includes text leaves and elements; a collapsed or invalid range returns an empty map.
 */
export function getHtmlEditorRangeCoverage(document: HtmlEditorDocument, rootId: string,
    selection: HtmlEditorSelectionState): ReadonlyMap<string, HtmlEditorNodeCoverage> {
    const result = new Map<string, HtmlEditorNodeCoverage>();
    const range = analyzeRange(document, rootId, selection);
    if (!range) return result;
    for (const [node, span] of range.intervals) {
        if (node.type === "document" || span.to <= span.from || range.to <= span.from || range.from >= span.to) continue;
        result.set(node.id, range.from <= span.from && span.to <= range.to ? "full" : "partial");
    }
    return result;
}

/** Extract selected content without changing the source, selection or runtime identities.
 * Partial shells contain only selected descendants; whole subtrees are detached clones.
 * Table/list ancestor shells keep the result legal without extending the user's range.
 * Partial tables are compact fragments: spans are removed rather than extending
 * the selection to unselected cells. Complete tables retain their original spans.
 */
export function extractHtmlEditorRange(document: HtmlEditorDocument, rootId: string,
    selection: HtmlEditorSelectionState): HtmlEditorDocument | undefined {
    const range = analyzeRange(document, rootId, selection);
    if (!range) return;
    const { intervals, from, to } = range;
    const clip = (node: HtmlEditorNode): HtmlEditorNode | undefined => {
        const span = intervals.get(node)!;
        if (to <= span.from || from >= span.to) return;
        if (from <= span.from && span.to <= to) return structuredClone(node);
        if (node.type === "text") return { ...node, text: node.text.slice(Math.max(0, from - span.from), Math.min(node.text.length, to - span.from)) };
        const children = node.children.flatMap(child => { const copy = clip(child); return copy ? [copy] : []; });
        if (!children.length) return;
        const copy = { ...node, attributes: { ...node.attributes }, classes: [...node.classes], styles: structuredClone(node.styles), children };
        if (node.tag === "ol") {
            const items = node.children.filter(child => child.type === "element" && child.tag === "li");
            const first = items.findIndex(item => children.some(child => child.id === item.id));
            const reversed = "reversed" in node.attributes;
            const explicit = Number.parseInt(node.attributes.start ?? "", 10);
            const initial = Number.isNaN(explicit) ? (reversed ? items.length : 1) : explicit;
            if (first >= 0) copy.attributes.start = String(initial + first * (reversed ? -1 : 1));
        }
        if (node.tag === "table") {
            const compact = (nodes: HtmlEditorNode[]) => nodes.forEach(child => {
                if (child.type !== "element" || child.tag === "table") return;
                if (child.tag === "td" || child.tag === "th") { delete child.attributes.rowspan; delete child.attributes.colspan; }
                compact(child.children);
            });
            compact(copy.children);
        }
        return copy;
    };
    return { type: "document", children: document.children.flatMap(node => { const copy = clip(node); return copy ? [copy] : []; }) };
}

/** Remove a directed range using the same coverage as clipboard extraction.
 * Fully covered subtrees disappear; partially covered shells retain their IDs,
 * attributes and unselected children. For example, selecting B through E in
 * table(td(ABC)), ul(li(DEF)) retains table(td(A)), ul(li(F)).
 * Returns the surviving start bookmark. Empty/invalid ranges make no changes.
 */
export function deleteHtmlEditorRange(document: HtmlEditorDocument, rootId: string,
    selection: HtmlEditorSelectionState): HtmlEditorPositionState | undefined {
    const range = analyzeRange(document, rootId, selection);
    if (!range) return;
    const { intervals, from, to, start } = range;
    const location = start.nodeId === rootId ? undefined : locate(document, start.nodeId);
    const path: (HtmlEditorParent | HtmlEditorNode)[] = [document, ...(location?.ancestors ?? []), ...(location ? [location.node] : [])];
    const surviving = new Set<HtmlEditorParent | HtmlEditorNode>([document]);
    const mappedGaps = new Map<HtmlEditorParent, number[]>();
    const tableShells = new Set(["table", "thead", "tbody", "tfoot", "tr"]);
    const prune = (parent: HtmlEditorParent): void => {
        const kept: HtmlEditorNode[] = [], gaps = [0];
        for (const child of parent.children) {
            const span = intervals.get(child)!;
            const full = span.to > span.from && from <= span.from && span.to <= to;
            if (!full) {
                surviving.add(child);
                if (child.type === "text") {
                    if (from < span.to && to > span.from)
                        child.text = child.text.slice(0, Math.max(0, from - span.from)) + child.text.slice(Math.min(child.text.length, to - span.from));
                } else if (!isAtomic(child)) prune(child);
                // Source indentation can keep a row/section's interval partially
                // selected even after its last cell disappeared. Remove only
                // shells emptied by this operation, never pre-existing empty
                // structures, cells, captions or unselected authored children.
                const emptied = child.type === "element" && tableShells.has(child.tag)
                    && child.children.every(isStructuralWhitespace)
                    && child.children.length < intervals.get(child)!.gaps!.length - 1;
                if (emptied) {
                    surviving.delete(child);
                    child.children.forEach(node => surviving.delete(node));
                } else kept.push(child);
            }
            gaps.push(kept.length);
        }
        mappedGaps.set(parent, gaps);
        parent.children = kept;
    };
    // Capture original child indices before pruning changes parent child lists.
    const pathIndices = path.slice(0, -1).map((node, index) => (node as HtmlEditorParent).children.indexOf(path[index + 1] as HtmlEditorNode));
    prune(document);
    for (let index = path.length - 1; index >= 0; index--) {
        const node = path[index];
        if (!surviving.has(node)) continue;
        const nodeId = node.type === "document" ? rootId : node.id;
        if (node.type === "text") return { nodeId, offset: Math.min(start.offset, node.text.length) };
        const originalOffset = index === path.length - 1 ? start.offset : pathIndices[index];
        return { nodeId, offset: mappedGaps.get(node)?.[originalOffset] ?? 0 };
    }
}
