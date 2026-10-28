import { afterEach, describe, expect, it, vi } from "vitest";
import { HtmlEditorSurface } from "../../src/components/editors/htmleditor/HtmlEditorSurface";
import { HtmlEditorCommandRegistry, type HtmlEditorUiCommand } from "../../src/components/editors/htmleditor/HtmlEditorCommandRegistry";
import { aggregateHtmlEditorUiCommandValues, type HtmlEditorUiCommandTargetContext,
    type HtmlEditorUiCommandExecutionContext } from "../../src/components/editors/htmleditor/HtmlEditorInspection";
import { Localization } from "../../src/localization/Localization";

const surfaces: HtmlEditorSurface[] = [];
function setup(html = "<p>First</p><p>Second</p>") {
    const surface = new HtmlEditorSurface({ html });
    surfaces.push(surface); surface.mount(document.body);
    const registry = new HtmlEditorCommandRegistry(surface, Localization.resolveMessages());
    const ids = surface.document.children.map(node => node.id);
    return { surface, registry, ids };
}

function property(id: string, resolveTargets: (context: HtmlEditorUiCommandTargetContext) => readonly string[],
    execute: HtmlEditorUiCommand["execute"] = () => true): HtmlEditorUiCommand {
    return { id, label: id, execute,
        field: { type: "data", group: "block", field: { dataType: "string" },
            resolveTargets: context => ({ kind: "nodes", nodeInfos: context.nodeInfos.filter(info => resolveTargets(context).includes(info.id)) }),
            getValue: () => ({ kind: "unset" }) } };
}

afterEach(() => {
    surfaces.splice(0).forEach(surface => surface.dispose());
    document.body.replaceChildren(); vi.restoreAllMocks();
});

describe("HtmlEditor inspector framework", () => {
    it("restores both surface scroll offsets after an inspector formatting command", () => {
        const { surface, registry, ids } = setup();
        const text = surface.content.querySelector("p")!.firstChild!;
        document.getSelection()!.setBaseAndExtent(text, 0, text, 3);
        document.dispatchEvent(new Event("selectionchange"));
        const field = registry.getInspectorFields(registry.inspectionContext(ids.slice(0, 1)))
            .find(field => field.command.id === "text.color")!;
        surface.content.scrollTop = 210; surface.content.scrollLeft = 35;
        const focus = surface.content.focus.bind(surface.content);
        vi.spyOn(surface.content, "focus").mockImplementation(options => {
            focus(options);
            // Model the browser scrolling during native focus/selection restoration.
            surface.content.scrollTop = 0; surface.content.scrollLeft = 0;
        });
        expect(registry.executeInspectorField(field, "primary")).toBe(true);
        expect(surface.content.scrollTop).toBe(210);
        expect(surface.content.scrollLeft).toBe(35);
        expect(surface.html).toContain("var(--elg-primary-color)");
    });
    it("exposes element properties and text actions together and applies a common value with one Undo", () => {
        const { surface, registry, ids } = setup();
        const paragraphs = surface.content.querySelectorAll("p");
        document.getSelection()!.setBaseAndExtent(paragraphs[0].firstChild!, 1, paragraphs[1].firstChild!, 3);
        document.dispatchEvent(new Event("selectionchange"));
        const context = registry.inspectionContext(ids);
        const fields = registry.getInspectorFields(context);
        expect(fields.map(field => field.command.id)).toEqual(expect.arrayContaining(["bold", "italic", "underline", "strikethrough", "block.heading", "block.align"]));
        expect(fields.map(field => field.command.id).filter(id => ["bold", "italic", "underline", "strikethrough"].includes(id)))
            .toEqual(["bold", "italic", "underline", "strikethrough"]);
        const alignment = fields.find(field => field.command.id === "block.align")!;
        const saved = surface.html;
        expect(registry.executeInspectorField(alignment, "center")).toBe(true);
        expect([...surface.content.querySelectorAll("p")].every(p => p.style.textAlign === "center")).toBe(true);
        expect(surface.execute({ type: "undo" })).toBe(true);
        expect(surface.html).toBe(saved);
        expect(surface.canUndo).toBe(false);
    });

    it("resolves block commands to the enclosing block instead of an inline caret element", () => {
        const { surface, registry } = setup("<p>Before <span><strong>inside</strong></span> after</p>");
        const strongText = surface.content.querySelector("strong")!.firstChild!;
        document.getSelection()!.setBaseAndExtent(strongText, 2, strongText, 2);
        document.dispatchEvent(new Event("selectionchange"));
        const paragraphId = surface.document.children[0].id;
        const strongId = (surface.document.children[0].type === "element"
            && surface.document.children[0].children[1].type === "element"
            && surface.document.children[0].children[1].children[0].type === "element")
            ? surface.document.children[0].children[1].children[0].id : "";
        const context = registry.inspectionContext([strongId]);
        const fields = registry.getInspectorFields(context);
        const alignment = fields.find(field => field.command.id === "block.align")!;
        const heading = fields.find(field => field.command.id === "block.heading")!;
        expect(alignment.context.resolution.targets).toEqual({ kind: "nodes", complete: true, nodeInfos: [expect.objectContaining({ id: paragraphId })] });
        expect(heading.context.resolution.targets).toEqual({ kind: "nodes", complete: true, nodeInfos: [expect.objectContaining({ id: paragraphId })] });
        expect(registry.executeInspectorField(alignment, "center")).toBe(true);
        expect(surface.content.querySelector("p")!.style.textAlign).toBe("center");
        expect(surface.content.querySelector("strong")!.style.textAlign).toBe("");
    });

    it("omits element fields unsupported by any inspected target and preserves a remembered text range", () => {
        const { surface, registry } = setup();
        surface.setHtml('<p>Text</p><img src="test.png" alt="Image">');
        const text = surface.content.querySelector("p")!.firstChild!;
        document.getSelection()!.setBaseAndExtent(text, 0, text, 3);
        document.dispatchEvent(new Event("selectionchange"));
        const image = (() => {
            const visit = (nodes: typeof surface.document.children): string | undefined => {
                for (const node of nodes) if (node.type === "element") {
                    if (node.tag === "img") return node.id;
                    const found = visit(node.children); if (found) return found;
                }
            };
            return visit(surface.document.children)!;
        })();
        const context = registry.inspectionContext([surface.document.children[0].id, image]);
        const fields = registry.getInspectorFields(context);
        expect(fields.some(field => field.command.id === "block.heading")).toBe(false);
        expect(fields.some(field => field.command.id === "text.color")).toBe(true);
        expect(fields.some(field => field.command.id === "bold")).toBe(true);
        expect(context.selection).toEqual(surface.selection);
    });

    it("aggregates mixed alignment and accepts an unchanged property without adding history", () => {
        const { surface, registry, ids } = setup();
        surface.updateElements([{ nodeId: ids[0], patch: { styles: [{ name: "text-align", value: "center" }] } }]);
        const fields = registry.getInspectorFields(registry.inspectionContext(ids));
        expect(fields.find(field => field.command.id === "block.align")!.value).toEqual({ kind: "mixed" });
        const version = surface.modelVersion;
        expect(surface.updateElement(ids[0], { styles: [{ name: "text-align", value: "center" }] })).toBe(true);
        expect(surface.modelVersion).toBe(version);
        const html = surface.html;
        expect(surface.updateElements([{ nodeId: ids[0], patch: { tag: "h1" } },
            { nodeId: "missing", patch: { tag: "h1" } }])).toBe(false);
        expect(surface.html).toBe(html);
    });

    it("keeps unset, mixed, empty text, zero, false and null distinct", () => {
        expect(aggregateHtmlEditorUiCommandValues([])).toBeUndefined();
        expect(aggregateHtmlEditorUiCommandValues([undefined, undefined])).toEqual({ kind: "unset" });
        expect(aggregateHtmlEditorUiCommandValues([undefined, ""])).toEqual({ kind: "mixed" });
        expect(aggregateHtmlEditorUiCommandValues(["left", "right"])).toEqual({ kind: "mixed" });
        for (const value of ["", 0, false, null])
            expect(aggregateHtmlEditorUiCommandValues([value, value])).toEqual({ kind: "value", value });
    });

    it("captures explicit inspection intent without changing the remembered text selection", () => {
        const { surface, registry, ids } = setup();
        const text = surface.content.querySelector("p")!.firstChild!;
        document.getSelection()!.setBaseAndExtent(text, 0, text, 2);
        document.dispatchEvent(new Event("selectionchange"));
        const saved = surface.selection;
        const snapshot = vi.spyOn(surface, "document", "get");
        const context = registry.inspectionContext([ids[1], ids[1]]);
        expect(context.nodeInfos.map(info => info.id)).toEqual([ids[1]]);
        expect(context.targetId).toBe(ids[1]);
        expect(context.selection).toEqual(saved);
        expect(surface.selection).toEqual(saved);
        expect(snapshot).not.toHaveBeenCalled();
        expect(surface.canUndo).toBe(false);
        expect(registry.inspectionContext().nodeInfos).toEqual([]);
    });

    it("resolves a union of fields with distinct target sets and omits inapplicable fields", () => {
        const { registry, ids } = setup();
        registry.register(property("first-only", () => [ids[0]]));
        registry.register(property("both", () => ids));
        registry.register(property("inapplicable", () => []));
        const fields = registry.getInspectorFields(registry.inspectionContext(ids))
            .filter(field => ["first-only", "both"].includes(field.command.id));
        expect(fields.map(field => field.command.id)).toEqual(["first-only", "both"]);
        expect(fields[0].context.resolution.targets).toEqual({ kind: "nodes", nodeInfos: [expect.objectContaining({ id: ids[0] })] });
        expect(fields[1].context.resolution.targets).toEqual({ kind: "nodes", nodeInfos: ids.map(id => expect.objectContaining({ id })) });
    });

    it("uses identical captured targets for aggregate reads, permissions and execution", () => {
        const { registry, ids } = setup();
        const contexts: HtmlEditorUiCommandExecutionContext[] = [];
        registry.register({ id: "captured", label: "Captured",
            field: { type: "data", group: "block", resolveTargets: context => ({ kind: "nodes", nodeInfos: context.nodeInfos.filter(info => ids.includes(info.id)) }),
                getValue: context => { contexts.push(context); return { kind: "mixed" }; } },
            isEnabled: context => { contexts.push(context as HtmlEditorUiCommandExecutionContext); return true; },
            execute: (context, value) => {
                contexts.push(context as HtmlEditorUiCommandExecutionContext);
                expect(value).toBe(12); return true;
            } });
        const field = registry.getInspectorFields(registry.inspectionContext(ids)).find(item => item.command.id === "captured")!;
        expect(field.value).toEqual({ kind: "mixed" });
        expect(registry.executeInspectorField(field, 12)).toBe(true);
        expect(contexts.every(context => context === field.context)).toBe(true);
    });

    it("supports text fragment actions without value metadata and orders fields within groups", () => {
        const { surface, registry } = setup();
        const text = surface.document.children[0];
        if (text.type !== "element") throw new Error("Expected paragraph");
        const range = { anchor: { nodeId: text.children[0].id, offset: 0 }, focus: { nodeId: text.children[0].id, offset: 2 } };
        const action = (id: string, group: string, order: number): HtmlEditorUiCommand => ({
            id, label: id, execute: () => true,
            field: { type: "buttons", group, order, resolveTargets: () => ({ kind: "text", ranges: [range] }) }
        });
        registry.register(action("late", "text", 2)); registry.register(action("other", "block", 0));
        registry.register(action("early", "text", 1));
        const fields = registry.getInspectorFields().filter(field => ["early", "late", "other"].includes(field.command.id));
        expect(fields.map(field => field.command.id)).toEqual(["early", "late", "other"]);
        expect(fields[0].value).toBeUndefined();
        expect(fields[0].context.resolution.targets).toEqual({ kind: "text", ranges: [range] });
    });

    it("rejects a pinned field after document replacement even if runtime IDs are reused", () => {
        const { surface, registry, ids } = setup();
        const execute = vi.fn(() => true), failed = vi.fn();
        registry.commandFailed.subscribe(failed);
        registry.register(property("pinned", () => ids, execute));
        const context = registry.inspectionContext(ids), field = registry.getInspectorFields(context).find(item => item.command.id === "pinned")!;
        surface.setHtml("<p>Replacement</p>");
        expect(surface.modelVersion).toBeGreaterThan(context.modelVersion);
        expect(registry.getInspectorFields(context)).toEqual([]);
        expect(registry.executeInspectorField(field, "center")).toBe(false);
        expect(registry.execute("pinned", field.context, "center")).toBe(false);
        expect(execute).not.toHaveBeenCalled(); expect(failed).toHaveBeenCalledWith("pinned");
    });

    it("rejects contexts from a different or disposed surface", () => {
        const first = setup(), second = setup();
        first.registry.register(property("pinned", () => first.ids));
        expect(first.registry.getInspectorFields(second.registry.inspectionContext())).toEqual([]);
        const field = first.registry.getInspectorFields(first.registry.inspectionContext(first.ids)).find(item => item.command.id === "pinned")!;
        first.surface.dispose();
        expect(first.registry.getInspectorFields(field.context)).toEqual([]);
        expect(first.registry.executeInspectorField(field, "center")).toBe(false);
    });

    it("keeps captured context valid on focus/selection changes but rejects changed permissions and registrations", () => {
        const { surface, registry, ids } = setup();
        const execute = vi.fn(() => true);
        registry.register(property("pinned", () => ids, execute));
        const field = registry.getInspectorFields(registry.inspectionContext(ids)).find(item => item.command.id === "pinned")!, version = surface.modelVersion;
        document.dispatchEvent(new Event("selectionchange"));
        expect(surface.modelVersion).toBe(version);
        expect(registry.executeInspectorField(field, "center")).toBe(true);
        surface.setInteractionState(true, false);
        expect(registry.getInspectorFields(registry.inspectionContext(ids))[0].enabled).toBe(false);
        expect(registry.executeInspectorField(field, "center")).toBe(false);
        surface.setInteractionState(false, false);
        registry.register(property("pinned", () => ids));
        expect(registry.executeInspectorField(field, "center")).toBe(false);
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("advances model generation before transaction and Undo/Redo notifications", () => {
        const { surface, ids } = setup();
        const versions: number[] = [], start = surface.modelVersion;
        surface.documentChanged.subscribe(() => versions.push(surface.modelVersion));
        expect(surface.updateElement(ids[0], { attributes: { title: "Changed" } })).toBe(true);
        expect(surface.execute({ type: "undo" })).toBe(true);
        expect(surface.execute({ type: "redo" })).toBe(true);
        expect(versions).toEqual([start + 1, start + 2, start + 3]);
    });
});
