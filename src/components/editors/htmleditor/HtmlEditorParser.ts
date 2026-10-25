import { isSystemName, normalizeHtmlEditorDocument, type HtmlEditorDocument, type HtmlEditorElement, type HtmlEditorNode, type HtmlEditorText } from "./HtmlEditorModel";
import { parseHtmlEditorStyles } from "./HtmlEditorStyles";

/** Imports supported HTML without duplicating attributes in specialized node fields. */
export class HtmlEditorParser {
    private readonly tags = new Set("address article aside blockquote div section main nav header footer h1 h2 h3 h4 h5 h6 p br hr strong b em i u s del sub sup span code pre ul ol li dl dt dd a img video source table thead tbody tfoot tr td th caption colgroup col figure figcaption details summary".split(" "));
    private sequence = 0;

    parse(html: string): HtmlEditorDocument {
        const body = new DOMParser().parseFromString(html, "text/html").body;
        return normalizeHtmlEditorDocument({ type: "document", children: Array.from(body.childNodes).flatMap(node => this.parseNode(node)) });
    }

    /** Parse an inert clipboard fragment, retaining inline roots and standalone table/list children. */
    parseFragment(html: string): HtmlEditorDocument {
        const template = document.createElement("template");
        template.innerHTML = html;
        return { type: "document", children: Array.from(template.content.childNodes).flatMap(node => this.parseNode(node)) };
    }

    parsePlainText(text: string): HtmlEditorDocument {
        const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\r\n?/g, "\n");
        return this.parse(safe.split(/\n{2,}/).map(line => `<p>${line.replace(/\n/g, "<br>")}</p>`).join(""));
    }

    /** Reads live DOM without replacing nodes; identities belong to the editor's DOM map. */
    readDom(root: HTMLElement, identify: (node: Node) => string): HtmlEditorDocument {
        return { type: "document", children: Array.from(root.childNodes).flatMap(node => this.parseNode(node, identify)) };
    }

    private parseNode(node: Node, identify?: (node: Node) => string): HtmlEditorNode[] {
        if (node.nodeType === Node.TEXT_NODE) {
            const text: HtmlEditorText = { id: identify?.(node) ?? this.id("text"), type: "text", text: node.textContent ?? "" };
            return [text];
        }
        if (node.nodeType !== Node.ELEMENT_NODE || (node as Element).namespaceURI !== "http://www.w3.org/1999/xhtml") return [];
        const source = node as HTMLElement;
        const tag = source.tagName.toLowerCase();
        if (tag === "br" && source.hasAttribute("data-elg-html-editor-placeholder")) return [];
        if (["script", "style", "object", "iframe", "embed", "link", "meta", "base"].includes(tag)) return [];
        if (!this.tags.has(tag)) return Array.from(node.childNodes).flatMap(child => this.parseNode(child, identify));
        return [this.element(source, identify)];
    }

    private element(source: HTMLElement, identify?: (node: Node) => string): HtmlEditorElement {
        const classes = [...new Set((source.getAttribute("class") ?? "").split(/[\t\n\f\r ]+/).filter(name => name && !isSystemName(name)))];
        const attributes: Record<string, string> = {};
        for (const attribute of Array.from(source.attributes)) {
            const name = attribute.name;
            if (name === "class" || name === "style" || isSystemName(name)) continue;
            const value = attribute.value.replace(/[\u0000-\u0020]/g, "");
            if (name.startsWith("on") || ["srcdoc", "contenteditable", "autofocus", "srcset"].includes(name)) continue;
            if (["href", "src", "poster", "action", "formaction"].includes(name) && /^[a-z][a-z0-9+.-]*:/i.test(value) && !/^(https?:|mailto:|tel:)/i.test(value)) continue;
            if (!["id", "title", "lang", "dir", "href", "target", "rel", "src", "alt", "width", "height", "poster", "controls", "muted", "loop", "preload", "colspan", "rowspan", "scope", "start", "reversed", "type", "open"].includes(name)
                && !name.startsWith("aria-") && !name.startsWith("data-")) continue;
            attributes[name] = ["controls", "muted", "loop", "reversed", "open"].includes(name) ? "" : attribute.value;
        }
        return {
            id: identify?.(source) ?? this.id("node"), type: "element", tag: source.tagName.toLowerCase(),
            classes, attributes, styles: parseHtmlEditorStyles(source.getAttribute("style") ?? ""),
            children: Array.from(source.childNodes).flatMap(node => this.parseNode(node, identify))
        };
    }

    private id(prefix: string): string { return `${prefix}-${++this.sequence}`; }
}
