import type { HtmlEditorDocument, HtmlEditorNode, HtmlEditorPositionState } from "./HtmlEditorModel";
import { HtmlEditorParser } from "./HtmlEditorParser";

let nextScope = 0;

/** Editor-local identities for real DOM nodes, including unwrapped Text nodes. */
export class HtmlEditorDom {
    private identities = new WeakMap<Node, string>();
    private nodes = new Map<string, Node>();
    private sequence = 0;
    private readonly scope = ++nextScope;

    constructor(readonly root: HTMLElement) {}

    createId = (): string => `html-${this.scope}-${++this.sequence}`;
    get rootId(): string { return this.identities.get(this.root)!; }

    /** Rebinds the patched DOM to the authoritative model, without markup or VNode changes. */
    bind(model: HtmlEditorDocument): void {
        const rootId = this.rootId ?? this.createId();
        this.identities = new WeakMap([[this.root, rootId]]);
        this.nodes = new Map([[rootId, this.root]]);
        const visit = (parent: Node, children: HtmlEditorNode[]) => children.forEach((child, index) => {
            const node = parent.childNodes[index];
            if (!node) throw new Error("HtmlEditor DOM does not match its model.");
            this.identities.set(node, child.id);
            this.nodes.set(child.id, node);
            if (child.type === "element") visit(node, child.children);
        });
        visit(this.root, model.children);
    }

    /** Reuses identities for surviving nodes and releases removed nodes from the reverse map. */
    synchronize(parser: HtmlEditorParser): HtmlEditorDocument {
        const active = new Map<string, Node>();
        const identify = (node: Node) => {
            let id = this.identities.get(node);
            if (!id) this.identities.set(node, id = this.createId());
            active.set(id, node);
            return id;
        };
        identify(this.root);
        const model = parser.readDom(this.root, identify);
        this.nodes = active;
        return model;
    }

    /** Starts a new identity scope after replacing the document. IDs are never recycled. */
    reset(): void {
        this.identities = new WeakMap();
        this.nodes.clear();
    }

    position(node: Node, offset: number): HtmlEditorPositionState | undefined {
        const nodeId = this.identities.get(node);
        if (!nodeId || this.nodes.get(nodeId) !== node || !this.root.contains(node)) return undefined;
        // Element offsets count model children; filtered comments/elements have no identity.
        const modelOffset = node.nodeType === Node.TEXT_NODE ? offset
            : Array.from(node.childNodes).slice(0, offset).filter(child => this.mapped(child)).length;
        return { nodeId, offset: modelOffset };
    }

    resolve(position: HtmlEditorPositionState): { node: Node; offset: number } | undefined {
        const node = this.nodes.get(position.nodeId);
        if (!node || !this.root.contains(node) || !Number.isInteger(position.offset) || position.offset < 0) return undefined;
        if (node.nodeType === Node.TEXT_NODE)
            return { node, offset: Math.min(position.offset, node.textContent?.length ?? 0) };
        const children = Array.from(node.childNodes);
        const mapped = children.filter(child => this.mapped(child));
        const next = mapped[position.offset];
        return { node, offset: next ? children.indexOf(next) : mapped.length ? children.indexOf(mapped[mapped.length - 1]) + 1 : 0 };
    }

    private mapped(node: Node): boolean {
        const id = this.identities.get(node);
        return !!id && this.nodes.get(id) === node;
    }
}
