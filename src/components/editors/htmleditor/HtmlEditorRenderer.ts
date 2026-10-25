import { v, type VNodeChild } from "../../../core/e";
import type { HtmlEditorDocument, HtmlEditorNode } from "./HtmlEditorModel";
import { serializeHtmlEditorStyles } from "./HtmlEditorStyles";
import { getHtmlEditorElementBehavior } from "./HtmlEditorStructure";

/** Renders model nodes using the existing VNode contract. Editing fillers never enter saved HTML. */
export class HtmlEditorRenderer {
    render(document: HtmlEditorDocument, runtime = true, editing = false): VNodeChild[] {
        return document.children.map(node => this.node(node, runtime, editing));
    }

    private node(node: HtmlEditorNode, runtime: boolean, editing: boolean): VNodeChild {
        if (node.type === "text") return node.text ?? "";
        // Attribute strings are applied below through setAttribute, avoiding property coercion
        // (e.g. muted="", rowspan="2") and collisions with VNode props such as key.
        const props: any = { key: node.id, class: node.classes.join(" "), style: serializeHtmlEditorStyles(node.styles) || undefined };
        if (runtime) props["data-elg-html-editor-node"] = node.id;
        const children = node.children.map(child => this.node(child, runtime, editing));
        const last = node.children[node.children.length - 1];
        if (editing && ["textBlock", "listItem", "cell", "container"].includes(getHtmlEditorElementBehavior(node).kind)
            && (!children.length || (last?.type === "element" && last.tag === "br")))
            children.push(v("br", { "data-elg-html-editor-placeholder": "" }));
        return v(node.tag as any, props, ...children);
    }

    /** Applies authored HTML attributes exactly, including boolean presence and ordered CSS text. */
    applyAttributes(root: HTMLElement, document: HtmlEditorDocument, runtime = false): void {
        const visit = (parent: Node, children: HtmlEditorNode[]) => children.forEach((model, index) => {
            if (model.type === "text") return;
            const element = parent.childNodes[index] as HTMLElement;
            const attributes = { ...model.attributes };
            delete attributes.class;
            delete attributes.style;
            if (model.classes.length) attributes.class = model.classes.join(" ");
            if (model.styles.length) attributes.style = serializeHtmlEditorStyles(model.styles);
            if (runtime) attributes["data-elg-html-editor-node"] = model.id;
            for (const attribute of Array.from(element.attributes))
                if (!(attribute.name in attributes)) element.removeAttribute(attribute.name);
            for (const [name, value] of Object.entries(attributes))
                if (element.getAttribute(name) !== value) element.setAttribute(name, value);
            visit(element, model.children);
        });
        visit(root, document.children);
    }
}
