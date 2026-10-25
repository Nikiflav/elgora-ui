import { isHtmlEditorBlock, type HtmlEditorDocument, type HtmlEditorNode } from "./HtmlEditorModel";

/** Plain-text counterpart of a model clipboard fragment. Block/list boundaries
 * become newlines, table cells use tabs, and images contribute their alt text.
 * Text whitespace and authored hard breaks are preserved; CSS is not inspected.
 */
export function htmlEditorFragmentText(fragment: HtmlEditorDocument): string {
    const children = (nodes: HtmlEditorNode[]): string => {
        let result = "", previousBlock = false;
        nodes.forEach((node, index) => {
            const block = isHtmlEditorBlock(node);
            if (index && (block || previousBlock)) result += "\n";
            result += render(node);
            previousBlock = block;
        });
        return result;
    };
    const render = (node: HtmlEditorNode): string => {
        if (node.type === "text") return node.text;
        if (node.tag === "br") return "\n";
        if (node.tag === "img") return node.attributes.alt ?? "";
        if (["hr", "col", "source", "video"].includes(node.tag)) return "";
        if (node.tag === "tr") return node.children.filter(child => child.type === "element" && ["td", "th"].includes(child.tag)).map(render).join("\t");
        return children(node.children);
    };
    return children(fragment.children);
}
