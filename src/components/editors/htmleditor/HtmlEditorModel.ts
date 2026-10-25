/** Runtime identity used by selection and history; distinct from an HTML id attribute. */
export type HtmlEditorNodeId = string;

/** A text leaf has no element attributes, presentation or children. */
export interface HtmlEditorText {
    id: HtmlEditorNodeId;
    type: "text";
    text: string;
}

/** One inline CSS declaration. Array order, duplicates and !important are significant. */
export interface HtmlEditorStyle {
    /** CSS property name, e.g. background-color. Custom-property names retain their case. */
    name: string;
    /** CSS value without the trailing !important priority. */
    value: string;
    important?: true;
}

/** HTML element content, with a single canonical location for each authored property. */
export interface HtmlEditorElement {
    id: HtmlEditorNodeId;
    type: "element";
    tag: string;
    /** Unique class tokens in authored order. */
    classes: string[];
    styles: HtmlEditorStyle[];
    /** Other HTML attributes as strings. class/style are excluded; boolean presence uses an empty string. */
    attributes: Record<string, string>;
    children: HtmlEditorNode[];
}

export type HtmlEditorNode = HtmlEditorText | HtmlEditorElement;
export interface HtmlEditorDocument { type: "document"; children: HtmlEditorNode[]; }

/** Text offsets count UTF-16 units; element/root offsets count supported model children. */
export interface HtmlEditorPositionState { nodeId: HtmlEditorNodeId; offset: number; }
/** Directed range: anchor is the fixed endpoint and focus is the moving endpoint. */
export interface HtmlEditorSelectionState { anchor: HtmlEditorPositionState; focus: HtmlEditorPositionState; }
export function cloneHtmlEditorDocument(document: HtmlEditorDocument): HtmlEditorDocument { return structuredClone(document); }
export function cloneHtmlEditorSelection(selection?: HtmlEditorSelectionState): HtmlEditorSelectionState | undefined { return selection ? structuredClone(selection) : undefined; }

// Editing structure follows HTML semantics, independently of inline/computed CSS display.
const blockTags = new Set("address article aside blockquote div dl dt dd fieldset figure figcaption footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section table thead tbody tfoot tr td th caption colgroup col ul details summary".split(" "));
export function isHtmlEditorBlock(node: HtmlEditorNode): boolean { return node.type === "element" && blockTags.has(node.tag); }
export function normalizeHtmlEditorDocument(document: HtmlEditorDocument): HtmlEditorDocument {
    if (!document.children.length) document.children.push({ id: "node-1", type: "element", tag: "p", classes: [], attributes: {}, styles: [], children: [] });
    return document;
}
export function isSystemName(name: string): boolean { return name.toLowerCase().startsWith("elg-html-editor-") || name.toLowerCase().startsWith("data-elg-html-editor-"); }
