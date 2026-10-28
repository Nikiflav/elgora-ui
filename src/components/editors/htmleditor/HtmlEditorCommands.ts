import { isHtmlEditorBlock, type HtmlEditorDocument, type HtmlEditorElement, type HtmlEditorNode, type HtmlEditorText, type HtmlEditorPositionState, type HtmlEditorSelectionRange } from "./HtmlEditorModel";
import { getHtmlEditorElementBehavior as behavior, isAtomic, nodeSize as size, locate as find, editingScope as blockAt,
    caretAt as positionAt, resolveBoundary, canJoin, listEdge, deleteAtomicAtGap, splitScope, replaceScopeRange,
    validPosition, prepareEditingSelection, editableEdge, joinListBoundary, structuralNeighbor, isStructuralWhitespace, isInline, sliceInline as slice } from "./HtmlEditorStructure";
import { insertHtmlEditorFragment } from "./HtmlEditorFragment";
import { deleteHtmlEditorRange } from "./HtmlEditorRange";

/** Operations currently supported by the rich-text command layer. */
export type HtmlEditorCommand =
    | { type: "textStyle"; property: "color" | "background-color" | "font-size"; value: string; nodeIds?: readonly string[] }
    | { type: "insertText"; text: string }
    | { type: "insertHtml"; html: string }
    | { type: "link"; property: "href" | "target" | "title" | "remove"; value?: string }
    | { type: "link"; property: "update"; href: string; target: string; title: string }
    | { type: "deleteBackward" | "deleteForward" | "insertParagraph" | "insertLineBreak" | "indent" | "outdent" | "bold" | "italic" | "underline" | "strikethrough" | "clearFormatting" | "undo" | "redo" };

/** Semantic inline marks supported by the Basic inspector. */
export type HtmlEditorTextMark = "bold" | "italic" | "underline" | "strikethrough";

const markDefinition = (mark: HtmlEditorTextMark): { tag: string; aliases: readonly string[] } => {
    switch (mark) {
        case "bold": return { tag: "strong", aliases: ["strong", "b"] };
        case "italic": return { tag: "em", aliases: ["em", "i"] };
        case "underline": return { tag: "u", aliases: ["u"] };
        case "strikethrough": return { tag: "s", aliases: ["s", "del"] };
    }
};

/** A document and directed selection are committed/restored as one history entry. */
export interface HtmlEditorState {
    document: HtmlEditorDocument;
    selection?: HtmlEditorSelectionRange;
    /** Explicit typing-format overrides at a collapsed caret. */
    marks?: Partial<Record<HtmlEditorTextMark, boolean>> & {
        /** Explicit text styles for subsequent typing; empty values remove inline overrides. */
        styles?: Partial<Record<"color" | "background-color" | "font-size", string>> };
}

/** Aggregate formatting state used by toolbar and menu controls. */
export type HtmlEditorUiCommandState = "off" | "on" | "mixed";
/** @deprecated Use HtmlEditorUiCommandState. */
export type HtmlEditorMarkState = HtmlEditorUiCommandState;

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

interface FormattingRange { block: HtmlEditorElement; from: number; to: number; }
interface FormattingSelection {
    document: HtmlEditorDocument;
    selection: HtmlEditorSelectionRange;
    collapsed: boolean;
    ranges: FormattingRange[];
    reversed: boolean;
}

/** Result of splitting a live selection into independently editable fragments. */
export interface HtmlEditorFragmentSelectionResult {
    document: HtmlEditorDocument;
    selection: HtmlEditorSelectionRange;
    /** Outermost elements representing the selected fragments. */
    fragmentIds: readonly string[];
}

function formattingBlocks(document: HtmlEditorDocument): HtmlEditorElement[] {
    const result: HtmlEditorElement[] = [];
    const visit = (parent: HtmlEditorDocument | HtmlEditorElement): void => {
        parent.children.forEach(node => {
            if (node.type !== "element" || isAtomic(node)) return;
            const kind = behavior(node).kind;
            if (["textBlock", "listItem", "cell", "container"].includes(kind) && node.children.every(isInline)) result.push(node);
            visit(node);
        });
    };
    visit(document);
    return result;
}

function formattingSelection(document: HtmlEditorDocument, rootId: string, selection: HtmlEditorSelectionRange,
    id: () => string): FormattingSelection | undefined {
    if (!validPosition(document, rootId, selection.anchor) || !validPosition(document, rootId, selection.focus)) return;
    const prepared = structuredClone(document);
    const result = prepareEditingSelection(prepared, selection, id);
    const collapsed = result.anchor.nodeId === result.focus.nodeId && result.anchor.offset === result.focus.offset;
    if (collapsed) return { document: prepared, selection: result, collapsed, ranges: [], reversed: false };
    const anchor = blockAt(prepared, result.anchor) ? result.anchor : resolveBoundary(prepared, rootId, result.anchor, true);
    const focus = blockAt(prepared, result.focus) ? result.focus : resolveBoundary(prepared, rootId, result.focus, false);
    const anchorScope = blockAt(prepared, anchor), focusScope = blockAt(prepared, focus);
    if (!anchorScope || !focusScope) return;
    const blocks = formattingBlocks(prepared);
    const anchorIndex = blocks.indexOf(anchorScope.block), focusIndex = blocks.indexOf(focusScope.block);
    if (anchorIndex < 0 || focusIndex < 0) return;
    const reversed = anchorIndex > focusIndex || (anchorIndex === focusIndex && anchorScope.offset > focusScope.offset);
    const first = Math.min(anchorIndex, focusIndex), last = Math.max(anchorIndex, focusIndex);
    const ranges = blocks.slice(first, last + 1).map(block => ({
        block,
        from: block === (reversed ? focusScope.block : anchorScope.block) ? (reversed ? focusScope.offset : anchorScope.offset) : 0,
        to: block === (reversed ? anchorScope.block : focusScope.block) ? (reversed ? anchorScope.offset : focusScope.offset) : size(block)
    }));
    return { document: prepared, selection: { anchor, focus }, collapsed, ranges, reversed };
}

/**
 * Splits a prepared selection into editable fragments without applying any
 * attributes. Text leaves receive the requested wrapper tag; partially
 * selected elements are cloned by sliceInline and retained as fragment roots.
 * Preserved nodes are complete selection targets and are not recursively
 * fragmented. The returned selection points into the resulting document.
 */
export interface HtmlEditorFragmentSelectionOptions {
    preserveIds?: ReadonlySet<string>;
    /** Optional semantic transform used by mark commands before wrapping. */
    transform?: (nodes: HtmlEditorNode[]) => HtmlEditorNode[];
}

export function fragmentSelection(selection: FormattingSelection, tagName: string, id: () => string,
    options: HtmlEditorFragmentSelectionOptions = {}): HtmlEditorFragmentSelectionResult {
    const preserveIds = options.preserveIds ?? new Set<string>();
    const fragmentIds = new Set<string>();
    const structuralRanges: { block: HtmlEditorElement; from: number; to: number }[] = [];
    const addFragmentRoots = (nodes: readonly HtmlEditorNode[]): void => {
        nodes.forEach(node => { if (node.type === "element") fragmentIds.add(node.id); });
    };
    const wrapText = (node: HtmlEditorNode): HtmlEditorNode[] => {
        if (node.type === "text") {
            const wrapper = element(tagName, id, [node]);
            return [wrapper];
        }
        if (isAtomic(node) || preserveIds.has(node.id)) return [node];
        return [{ ...node, children: node.children.flatMap(wrapText) }];
    };
    const hasPreservedAncestor = (node: HtmlEditorElement): boolean => {
        const location = find(selection.document, node.id);
        return !!location?.ancestors.some(ancestor => preserveIds.has(ancestor.id));
    };
    preserveIds.forEach(nodeId => {
        const location = find(selection.document, nodeId);
        if (location?.node.type === "element"
            && !location.ancestors.some(ancestor => preserveIds.has(ancestor.id))) fragmentIds.add(nodeId);
    });
    for (const range of selection.ranges) {
        if (range.from >= range.to || preserveIds.has(range.block.id) || hasPreservedAncestor(range.block)) continue;
        const prefix = slice(range.block.children, 0, range.from, false, id);
        const middle = slice(range.block.children, range.from, range.to, true, id, preserveIds);
        const suffix = slice(range.block.children, range.to, size(range.block), true, id);
        const replacement = options.transform ? options.transform(middle) : middle.flatMap(wrapText);
        addFragmentRoots(replacement);
        range.block.children = [...prefix, ...replacement, ...suffix];
        structuralRanges.push({ block: range.block, from: prefix.length, to: prefix.length + replacement.length });
    }
    const first = structuralRanges[0], last = structuralRanges[structuralRanges.length - 1];
    const left = first ? { nodeId: first.block.id, offset: first.from } : selection.selection.anchor;
    const right = last ? { nodeId: last.block.id, offset: last.to } : selection.selection.focus;
    return { document: selection.document,
        selection: { anchor: selection.reversed ? right : left, focus: selection.reversed ? left : right },
        fragmentIds: [...fragmentIds] };
}

/** Applies one authored style declaration to the fragment roots only. */
function applyFragmentStyle(document: HtmlEditorDocument, fragmentIds: readonly string[], property: string, value: string): void {
    for (const nodeId of fragmentIds) {
        const location = find(document, nodeId);
        if (location?.node.type !== "element") continue;
        location.node.styles = location.node.styles.filter(style => style.name !== property);
        if (value) location.node.styles.push({ name: property, value });
    }
}

/** Reads the same text fragments that textStyle modifies; undefined denotes inherited/default styling. */
export function getHtmlEditorTextStyleValues(document: HtmlEditorDocument, rootId: string,
    selection: HtmlEditorSelectionRange | undefined, property: string, marks?: HtmlEditorState["marks"]): (string | undefined)[] {
    if (!selection) return [];
    let next = 0;
    const prepared = formattingSelection(document, rootId, selection, () => `style-read-${next++}`);
    if (!prepared) return [];
    if (prepared.collapsed) {
        const override = marks?.styles?.[property as "color" | "background-color" | "font-size"];
        if (override !== undefined) return [override || undefined];
        const location = find(prepared.document, prepared.selection.anchor.nodeId);
        if (!location) return [];
        let value: string | undefined;
        for (const parent of [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])])
            value = [...parent.styles].reverse().find(style => style.name === property)?.value ?? value;
        return [value];
    }
    const values: (string | undefined)[] = [];
    const visit = (node: HtmlEditorNode, inherited?: string): void => {
        if (node.type === "text") { if (node.text) values.push(inherited); return; }
        const value = [...node.styles].reverse().find(style => style.name === property)?.value ?? inherited;
        node.children.forEach(child => visit(child, value));
    };
    for (const range of prepared.ranges) {
        const location = find(prepared.document, range.block.id);
        let inherited: string | undefined;
        for (const parent of [...location?.ancestors ?? [], range.block])
            inherited = [...parent.styles].reverse().find(style => style.name === property)?.value ?? inherited;
        slice(range.block.children, range.from, range.to, false, () => `style-piece-${next++}`)
            .forEach(node => visit(node, inherited));
    }
    return values;
}

/** Computes formatting state from the same selected inline fragments used by formatting commands. */
export function getHtmlEditorMarkState(document: HtmlEditorDocument, rootId: string,
    selection: HtmlEditorSelectionRange | undefined, mark: HtmlEditorTextMark,
    marks?: HtmlEditorState["marks"]): HtmlEditorMarkState {
    if (!selection) return "off";
    let nextId = 0;
    const prepared = formattingSelection(document, rootId, selection, () => `state-fragment-${nextId++}`);
    if (!prepared) return "off";
    const tags = markDefinition(mark).aliases;
    if (prepared.collapsed) {
        const location = find(prepared.document, prepared.selection.anchor.nodeId);
        const inherited = location && [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])]
            .some(node => tags.includes(node.tag));
        return (marks?.[mark] ?? inherited) ? "on" : "off";
    }
    const values: boolean[] = [];
    const visit = (node: HtmlEditorNode, active: boolean): void => {
        if (node.type === "text") {
            if (node.text.length) values.push(active);
            return;
        }
        const next = active || tags.includes(node.tag);
        node.children.forEach(child => visit(child, next));
    };
    for (const range of prepared.ranges) {
        if (range.from < range.to) slice(range.block.children, range.from, range.to, false, () => `state-piece-${nextId++}`)
            .forEach(node => visit(node, false));
    }
    if (!values.length || values.every(value => value === values[0])) return values[0] ? "on" : "off";
    return "mixed";
}

function applyFormatting(selection: FormattingSelection, command: HtmlEditorTextMark, id: () => string): HtmlEditorState {
    const document = selection.document;
    const { tag, aliases } = markDefinition(command);
    const sameMark = (left: HtmlEditorElement, right: HtmlEditorElement): boolean =>
        left.tag === right.tag && JSON.stringify(left.classes) === JSON.stringify(right.classes)
        && JSON.stringify(left.attributes) === JSON.stringify(right.attributes)
        && JSON.stringify(left.styles) === JSON.stringify(right.styles);
    const normalizeMarks = (nodes: HtmlEditorNode[]): HtmlEditorNode[] => {
        const normalized: HtmlEditorNode[] = [];
        for (const node of nodes) {
            const next = node.type === "element" ? { ...node, children: normalizeMarks(node.children) } : node;
            const previous = normalized[normalized.length - 1];
            if (previous?.type === "text" && next.type === "text") previous.text += next.text;
            else if (previous?.type === "element" && next.type === "element"
                && aliases.includes(previous.tag) && aliases.includes(next.tag)
                && sameMark(previous, next)) previous.children.push(...next.children);
            else normalized.push(next);
        }
        return normalized;
    };
    const formatted = (node: HtmlEditorNode): boolean => node.type === "element"
        && (aliases.includes(node.tag) || (node.children.length > 0 && node.children.every(formatted)));
    const unwrap = (node: HtmlEditorNode): HtmlEditorNode[] => node.type === "text" ? [node]
        : aliases.includes(node.tag) ? node.children.flatMap(unwrap)
            : [{ ...node, children: node.children.flatMap(unwrap) }];
    const apply = (node: HtmlEditorNode): HtmlEditorNode[] => node.type === "text" ? [node]
        : aliases.includes(node.tag) ? node.children.flatMap(apply)
            : [{ ...node, children: normalizeMarks(node.children.flatMap(apply)) }];
    const pieces = selection.ranges.filter(range => range.from < range.to)
        .map(range => ({ range, nodes: slice(range.block.children, range.from, range.to, true, id) }));
    const remove = pieces.length > 0 && pieces.every(piece => piece.nodes.length > 0 && piece.nodes.every(formatted));
    if (remove) {
        pieces.forEach(({ range, nodes }) => {
            const prefix = slice(range.block.children, 0, range.from, false, id);
            const suffix = slice(range.block.children, range.to, size(range.block), true, id);
            range.block.children = normalizeMarks([...prefix, ...nodes.flatMap(unwrap), ...suffix]);
        });
        const first = selection.ranges[0], last = selection.ranges[selection.ranges.length - 1];
        const left = positionAt(first.block, first.from), right = positionAt(last.block, last.to);
        return { document, selection: { anchor: selection.reversed ? right : left, focus: selection.reversed ? left : right } };
    }
    return fragmentSelection(selection, tag, id, {
        transform: nodes => [element(tag, id, normalizeMarks(nodes.flatMap(apply)))]
    });
}

/** Removes inline marks and authored text styles while preserving document structure. */
function clearFormatting(selection: FormattingSelection, id: () => string): HtmlEditorState {
    const document = selection.document;
    const marks = new Set(["strong", "b", "em", "i", "u", "s", "del"]);
    const textStyles = new Set(["color", "background-color", "font-size"]);
    const normalize = (nodes: HtmlEditorNode[]): HtmlEditorNode[] => {
        const result: HtmlEditorNode[] = [];
        for (const node of nodes) {
            const next = node.type === "element" ? { ...node, children: normalize(node.children) } : node;
            const previous = result[result.length - 1];
            if (previous?.type === "text" && next.type === "text") previous.text += next.text;
            else result.push(next);
        }
        return result;
    };
    const strip = (node: HtmlEditorNode): HtmlEditorNode[] => {
        if (node.type === "text" || isAtomic(node)) return [node];
        const children = node.children.flatMap(strip);
        if (marks.has(node.tag)) return children;
        const styles = node.styles.filter(style => !textStyles.has(style.name));
        if (node.tag === "span" && !styles.length && !node.classes.length && !Object.keys(node.attributes).length)
            return children;
        return [{ ...node, styles, children }];
    };
    for (const range of selection.ranges) {
        if (range.from >= range.to) continue;
        const prefix = slice(range.block.children, 0, range.from, false, id);
        const middle = slice(range.block.children, range.from, range.to, true, id).flatMap(strip);
        const suffix = slice(range.block.children, range.to, size(range.block), true, id);
        range.block.children = normalize([...prefix, ...middle, ...suffix]);
    }
    const first = selection.ranges[0], last = selection.ranges[selection.ranges.length - 1];
    const left = positionAt(first.block, first.from), right = positionAt(last.block, last.to);
    return { document, selection: { anchor: selection.reversed ? right : left, focus: selection.reversed ? left : right } };
}

const linkInteractiveTags = new Set(["a", "button", "input", "select", "textarea", "option", "details", "iframe", "object", "embed"]);
const linkStructuralParents = new Set(["ul", "ol", "dl", "table", "thead", "tbody", "tfoot", "tr", "colgroup"]);

/** Interactive descendants cannot be placed inside another link. */
function isLinkInteractive(node: HtmlEditorElement): boolean {
    return linkInteractiveTags.has(node.tag) || Object.prototype.hasOwnProperty.call(node.attributes, "tabindex");
}

function containsLink(node: HtmlEditorNode): boolean {
    return node.type === "element" && (node.tag === "a" || node.children.some(containsLink));
}

function containsInteractive(node: HtmlEditorNode): boolean {
    return node.type === "element" && (isLinkInteractive(node) || node.children.some(containsInteractive));
}

/** Structural nodes which cannot accept an anchor as a direct child. */
function canParentContainLink(parent: HtmlEditorDocument | HtmlEditorElement): boolean {
    return parent.type === "document" || !linkStructuralParents.has(parent.tag);
}

/** Applies one link attribute to selected node fragments without nesting anchors. */
function applyLink(selection: FormattingSelection, command: Extract<HtmlEditorCommand, { type: "link" }>, id: () => string): HtmlEditorState | undefined {
    if (command.property === "href" && !command.value)
        return applyLink(selection, { type: "link", property: "remove" }, id);
    const document = selection.document;
    const update = (node: HtmlEditorElement): HtmlEditorElement => {
        const attributes = { ...node.attributes };
        if (command.property === "remove") delete attributes.href;
        else if (command.property === "update") {
            if (command.href) attributes.href = command.href;
            else delete attributes.href;
            if (command.target) attributes.target = command.target;
            else delete attributes.target;
            if (command.title) attributes.title = command.title;
            else delete attributes.title;
        } else if (command.value) attributes[command.property] = command.value;
        else delete attributes[command.property];
        return { ...node, attributes };
    };
    const canCreate = command.property === "href" || command.property === "update";
    const href = command.property === "update" ? command.href : command.value;
    const canWrap = (node: HtmlEditorNode, insideLink: boolean): boolean => {
        if (insideLink || node.type !== "element" || node.tag === "a" || containsLink(node) || containsInteractive(node)) return false;
        // source/col belong to media/table structures and must not become link content.
        if (isAtomic(node) && ["source", "col"].includes(node.tag)) return false;
        return true;
    };
    const visitRange = (nodes: HtmlEditorNode[], from: number, to: number, insideLink = false): HtmlEditorNode[] => {
        const result: HtmlEditorNode[] = [];
        let cursor = 0;
        for (const source of nodes) {
            const end = cursor + size(source);
            if (end <= from || cursor >= to) { result.push(source); cursor = end; continue; }
            const selectedFrom = Math.max(from, cursor), selectedTo = Math.min(to, end);
            const full = selectedFrom === cursor && selectedTo === end;
            if (source.type === "text") {
                const left = source.text.slice(0, selectedFrom - cursor), selected = source.text.slice(selectedFrom - cursor, selectedTo - cursor);
                const right = source.text.slice(selectedTo - cursor);
                if (command.property === "remove" || !href || insideLink) {
                    result.push(source);
                } else {
                    if (left) result.push(text(left, id));
                    if (selected) result.push(update(element("a", id, [text(selected, id)])));
                    if (right) result.push(text(right, id));
                }
                cursor = end;
                continue;
            }
            if (source.tag === "a") {
                if (command.property === "remove") result.push(...visitRange(source.children, 0, size(source), false));
                else {
                    const link = update(source);
                    link.children = link.children.flatMap(child => visitRange([child], 0, size(child), true));
                    result.push(link);
                }
            } else if (isLinkInteractive(source)) result.push(source);
            else if (full && canWrap(source, insideLink)) {
                result.push(update(element("a", id, [source])));
            } else if (isAtomic(source)) result.push(source);
            else {
                const next = { ...source, children: visitRange(source.children, selectedFrom - cursor, selectedTo - cursor, insideLink) };
                result.push(next);
            }
            cursor = end;
        }
        return result;
    };
    const updateCollapsed = (): boolean => {
        if (!selection.collapsed) return false;
        const location = find(document, selection.selection.anchor.nodeId);
        const link = location && [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])]
            .reverse().find(node => node.tag === "a");
        if (!link) return false;
        if (command.property === "remove") {
            const parent = find(document, link.id)?.parent;
            if (parent) parent.children = parent.children.flatMap(child => child.id === link.id ? link.children : [child]);
        } else Object.assign(link, update(link));
        return true;
    };
    if (updateCollapsed()) return { document, selection: structuredClone(selection.selection) };
    if (selection.collapsed) return;
    for (const range of selection.ranges) {
        if (range.from >= range.to) continue;
        const location = find(document, range.block.id);
        const enclosingLink = location?.ancestors.slice().reverse().find(node => node.tag === "a");
        if (enclosingLink) {
            const linkLocation = find(document, enclosingLink.id);
            if (command.property === "remove") {
                if (linkLocation) linkLocation.parent.children.splice(linkLocation.parent.children.indexOf(enclosingLink), 1, ...enclosingLink.children);
            } else Object.assign(enclosingLink, update(enclosingLink));
            continue;
        }
        const fullNode = range.from === 0 && range.to === size(range.block);
        const canWrapBlock = canCreate && !!href && fullNode && !containsLink(range.block)
            && !containsInteractive(range.block) && canParentContainLink(location?.parent ?? document)
            && !["li", "td", "th", "tr", "table", "thead", "tbody", "tfoot", "caption", "colgroup"].includes(range.block.tag);
        if (canWrapBlock && location) {
            const link = update(element("a", id, [range.block]));
            location.parent.children.splice(location.parent.children.indexOf(range.block), 1, link);
            continue;
        }
        const prefix = slice(range.block.children, 0, range.from, false, id);
        const middle = visitRange(slice(range.block.children, range.from, range.to, true, id), 0, range.to - range.from);
        const suffix = slice(range.block.children, range.to, size(range.block), true, id);
        range.block.children = [...prefix, ...middle, ...suffix];
    }
    const first = selection.ranges[0], last = selection.ranges[selection.ranges.length - 1];
    const left = positionAt(first.block, first.from), right = positionAt(last.block, last.to);
    return { document, selection: { anchor: selection.reversed ? right : left, focus: selection.reversed ? left : right } };
}

/** Preformatted input edits literal text while retaining the pre/code shells.
 * Apply line edits backwards so original offsets and inline slices stay valid.
 */
function editPre(document: HtmlEditorDocument, selection: HtmlEditorSelectionRange, command: HtmlEditorCommand,
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
function leaveQuote(document: HtmlEditorDocument, selection: HtmlEditorSelectionRange, command: HtmlEditorCommand,
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
    if (command.type === "textStyle") {
        const formatting = formattingSelection(document, rootId, selection, id);
        if (!formatting) return;
        if (formatting.collapsed) return { document, selection, marks: { ...state.marks,
            styles: { ...state.marks?.styles, [command.property]: command.value } } };
        if (!formatting.ranges.some(range => range.to > range.from)) return;
        const fullStyleNodes = new Set(command.nodeIds ?? []);
        const fragmented = fragmentSelection(formatting, "span", id, { preserveIds: fullStyleNodes });
        applyFragmentStyle(fragmented.document, fragmented.fragmentIds, command.property, command.value);
        return { document: fragmented.document, selection: fragmented.selection, marks: state.marks };
    }
    if (command.type === "clearFormatting") {
        const formatting = formattingSelection(document, rootId, selection, id);
        if (!formatting) return;
        if (formatting.collapsed) return { document, selection,
            marks: { ...state.marks, bold: false, italic: false, underline: false, strikethrough: false,
                styles: { ...state.marks?.styles, color: "", "background-color": "", "font-size": "" } } };
        if (!formatting.ranges.some(range => range.to > range.from)) return;
        return clearFormatting(formatting, id);
    }
    if (command.type === "link") {
        const formatting = formattingSelection(document, rootId, selection, id);
        if (!formatting) return;
        return applyLink(formatting, command, id);
    }
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
    // A browser may report a visible text selection with endpoints on an
    // enclosing element (for example, root offset 2 -> root offset 3 for one
    // whole paragraph). Formatting operates on text-bearing blocks, so map
    // those structural boundaries to the corresponding block edges. Deletion
    // deliberately keeps its original structural range semantics.
    if (!originallyCollapsed && ["bold", "italic", "underline", "strikethrough"].includes(command.type)) {
        const formatting = formattingSelection(document, rootId, selection, id);
        if (!formatting || !formatting.ranges.length) return;
        return applyFormatting(formatting, command.type as HtmlEditorTextMark, id);
    }
    const anchorScope = blockAt(document, selection.anchor), focusScope = blockAt(document, selection.focus);
    const collapsed = originallyCollapsed || !!(anchorScope && focusScope && anchorScope.block === focusScope.block && anchorScope.offset === focusScope.offset);
    if (collapsed) {
        const quote = leaveQuote(document, selection, command, id);
        if (quote) return { ...quote, marks: state.marks };
    }
    if (!originallyCollapsed && !["bold", "italic", "underline", "strikethrough"].includes(command.type)) {
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
    if (collapsed && ["bold", "italic", "underline", "strikethrough"].includes(command.type)) {
        const mark = command.type as HtmlEditorTextMark;
        const location = find(document, selection.anchor.nodeId);
        const aliases = markDefinition(mark).aliases;
        const inherited = location && [...location.ancestors, ...(location.node.type === "element" ? [location.node] : [])].some(node => aliases.includes(node.tag));
        return { document, selection: structuredClone(selection), marks: { ...state.marks, [mark]: !(state.marks?.[mark] ?? inherited) } };
    }
    // Ordinary typing/replacement updates one existing text node, preserving its
    // identity and wrappers rather than producing a new node for each character.
    if (command.type === "insertText" && !/[\r\n]/.test(command.text) && selection.anchor.nodeId === selection.focus.nodeId) {
        const location = find(document, selection.anchor.nodeId);
        if (location?.node.type === "text") {
            const tags = location.ancestors.map(node => node.tag);
            const matches = (["bold", "italic", "underline", "strikethrough"] as HtmlEditorTextMark[]).every(mark => {
                const requested = state.marks?.[mark];
                return requested === undefined || requested === tags.some(tag => markDefinition(mark).aliases.includes(tag));
            })
                && Object.entries(state.marks?.styles ?? {}).every(([property, value]) => {
                    let inherited: string | undefined;
                    for (const parent of location.ancestors)
                        inherited = [...parent.styles].reverse().find(style => style.name === property)?.value ?? inherited;
                    return (inherited ?? "") === value;
                });
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
    if (["bold", "italic", "underline", "strikethrough"].includes(command.type)) {
        if (collapsed) return;
        const { tag, aliases } = markDefinition(command.type as HtmlEditorTextMark);
        const sameMark = (left: HtmlEditorElement, right: HtmlEditorElement): boolean =>
            left.tag === right.tag && JSON.stringify(left.classes) === JSON.stringify(right.classes)
            && JSON.stringify(left.attributes) === JSON.stringify(right.attributes)
            && JSON.stringify(left.styles) === JSON.stringify(right.styles);
        const normalizeMarks = (nodes: HtmlEditorNode[]): HtmlEditorNode[] => {
            const normalized: HtmlEditorNode[] = [];
            for (const node of nodes) {
                const next = node.type === "element"
                    ? { ...node, children: normalizeMarks(node.children) } : node;
                const previous = normalized[normalized.length - 1];
                if (previous?.type === "text" && next.type === "text") previous.text += next.text;
                else if (previous?.type === "element" && next.type === "element"
                    && aliases.includes(previous.tag) && aliases.includes(next.tag) && sameMark(previous, next)) {
                    previous.children.push(...next.children);
                } else normalized.push(next);
            }
            return normalized;
        };
        const formatted = (node: HtmlEditorNode): boolean => node.type === "element" && (aliases.includes(node.tag) || (node.children.length > 0 && node.children.every(formatted)));
        const unwrap = (node: HtmlEditorNode): HtmlEditorNode[] => node.type === "text" ? [node] : aliases.includes(node.tag) ? node.children.flatMap(unwrap) : [{ ...node, children: node.children.flatMap(unwrap) }];
        const apply = (node: HtmlEditorNode): HtmlEditorNode[] => node.type === "text" ? [node]
            : aliases.includes(node.tag) ? node.children.flatMap(apply)
                : [{ ...node, children: normalizeMarks(node.children.flatMap(apply)) }];
        const scopes = siblings.slice(startIndex, endIndex + 1);
        if (!scopes.every((node): node is HtmlEditorElement => node.type === "element" && blockAt(document, positionAt(node, 0))?.block === node)) return;
        const ranges = scopes.map(block => ({ block, from: block === start!.block ? start!.offset : 0, to: block === end!.block ? end!.offset : size(block) }));
        const pieces = ranges.map(range => slice(range.block.children, range.from, range.to, true, id));
        const remove = pieces.flat().every(formatted);
        ranges.forEach((range, i) => {
            if (range.from === range.to) return;
            const prefix = slice(range.block.children, 0, range.from, false, id);
            const suffix = slice(range.block.children, range.to, size(range.block), true, id);
            const replacement = remove ? pieces[i].flatMap(unwrap) : [element(tag, id, pieces[i].flatMap(apply))];
            range.block.children = normalizeMarks([...prefix, ...replacement, ...suffix]);
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
        const marks: HtmlEditorTextMark[] = ["bold", "italic", "underline", "strikethrough"];
        const wrappers = inline.slice(blockIndex + 1).filter(node => !marks.some(mark =>
            state.marks?.[mark] === false && markDefinition(mark).aliases.includes(node.tag)));
        for (const wrapper of wrappers.reverse()) {
            const copy = { ...structuredClone(wrapper), id: id(), children: inserted };
            copy.styles = copy.styles.filter(style => state.marks?.styles?.[style.name as "color" | "background-color" | "font-size"] === undefined);
            delete copy.attributes.id;
            inserted = [copy];
        }
        if (state.marks?.bold && !wrappers.some(node => ["strong", "b"].includes(node.tag))) inserted = [element("strong", id, inserted)];
        if (state.marks?.italic && !wrappers.some(node => ["em", "i"].includes(node.tag))) inserted = [element("em", id, inserted)];
        for (const mark of ["underline", "strikethrough"] as const) {
            const definition = markDefinition(mark);
            if (state.marks?.[mark] && !wrappers.some(node => definition.aliases.includes(node.tag)))
                inserted = [element(definition.tag, id, inserted)];
        }
        const styles = Object.entries(state.marks?.styles ?? {}).filter(([, value]) => !!value)
            .map(([name, value]) => ({ name, value: value! }));
        if (styles.length) {
            const wrapper = element("span", id, inserted);
            wrapper.styles = styles;
            inserted = [wrapper];
        }
    } else if (command.type === "insertLineBreak") inserted = [element("br", id)];
    const caret = replaceScopeRange(start, end, before, inserted, after);
    return { document, selection: { anchor: caret, focus: caret }, marks: state.marks };
}


