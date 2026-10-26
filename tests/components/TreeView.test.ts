import { afterEach, describe, expect, it, vi } from "vitest";
import { TreeView, type TreeDataAdapter } from "../../src/components/tree-view/TreeView";

type Item = { id: string; text: string; children?: Item[]; expandable?: boolean };
const leaf = (id: string): Item => ({ id, text: id });
const deferred = <T>() => {
    let resolve!: (value: T) => void, reject!: (error: unknown) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

describe("TreeView", () => {
    let tree: TreeView<Item>;
    const create = (getChildren: TreeDataAdapter<Item>["getChildren"]) => {
        tree = new TreeView({ label: "Files", getText: item => item.text, data: {
            getKey: item => item.id, hasChildren: item => item.expandable ?? !!item.children?.length, getChildren
        } });
        tree.dom.style.height = "120px";
        tree.mount(document.body);
        Object.defineProperty(tree.dom.querySelector('[role="tree"]')!, "clientHeight", { value: 120 });
        return tree;
    };
    const items = () => [...tree.dom.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter(row => row.style.display !== "none");
    const key = (value: string) => {
        const root = tree.dom.querySelector<HTMLElement>('[role="tree"]')!;
        root.focus();
        const event = new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true });
        root.dispatchEvent(event);
        return event;
    };
    afterEach(async () => { tree?.dispose(); await frame(); document.body.replaceChildren(); });

    it("cancels activation keys before a host moves focus to another editor", async () => {
        create(() => [leaf("first")]); await tree.load(); await frame();
        const editor = document.createElement("input"); document.body.append(editor);
        const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        let canceledAtSelection = false;
        tree.selectionChanged.subscribe(() => { canceledAtSelection = event.defaultPrevented; editor.focus(); });
        const root = tree.dom.querySelector<HTMLElement>('[role="tree"]')!;
        root.focus(); root.dispatchEvent(event);
        expect(canceledAtSelection).toBe(true);
        expect(document.activeElement).toBe(editor);
    });

    it("keeps an icon across expansion changes and reserves its space for leaves", async () => {
        const folder: Item = { id: "folder", text: "Folder", children: [leaf("child")] };
        create(item => item ? item.children ?? [] : [folder]);
        await tree.load(); await frame();
        const icon = items()[0].querySelector<HTMLElement>(".elg-tree-disclosure")!;
        expect(icon.classList.contains("ri-arrow-right-s-line")).toBe(true);
        expect(icon.classList.contains("elg-rotate-on-open")).toBe(true);
        expect(icon.getAttribute("aria-hidden")).toBe("true");
        expect(icon.textContent).toBe("");
        await tree.expand(folder); await frame();
        expect(items()[0].querySelector(".elg-tree-disclosure")).toBe(icon);
        expect(items()[0].getAttribute("aria-expanded")).toBe("true");
        expect(items()[1].querySelector<HTMLElement>(".elg-tree-disclosure")!.style.visibility).toBe("hidden");
        tree.collapse(folder); await frame();
        expect(items()[0].querySelector(".elg-tree-disclosure")).toBe(icon);
        expect(items()[0].getAttribute("aria-expanded")).toBe("false");
    });

    it("loads synchronous roots and caches lazy children across collapse/reopen", async () => {
        const folder: Item = { id: "folder", text: "Folder", children: [leaf("child")] };
        const loader = vi.fn((item?: Item) => item ? item.children ?? [] : [folder]);
        create(loader);
        await tree.load(); await frame();
        expect(items().map(row => row.getAttribute("aria-label"))).toEqual(["Folder"]);
        await tree.expand(folder); await frame();
        expect(items()).toHaveLength(2);
        expect(items()[1].getAttribute("aria-level")).toBe("2");
        tree.collapse(folder);
        await tree.expand(folder); await frame();
        expect(loader).toHaveBeenCalledTimes(2);
    });

    it("deduplicates pending loads, shows local loading and caches results after collapse", async () => {
        const folder: Item = { id: "folder", text: "Folder", expandable: true }, pending = deferred<readonly Item[]>();
        const loader = vi.fn((item?: Item) => item ? pending.promise : [folder]);
        create(loader); await tree.load();
        const a = tree.expand(folder), b = tree.expand(folder);
        await frame();
        expect(tree.dom.textContent).toContain("Loading");
        tree.collapse(folder);
        pending.resolve([leaf("child")]); await Promise.all([a, b]); await frame();
        expect(items()).toHaveLength(1);
        await tree.expand(folder); await frame();
        expect(items()).toHaveLength(2);
        expect(loader).toHaveBeenCalledTimes(2);
    });

    it("shows branch errors and retries without disturbing other roots", async () => {
        const folder: Item = { id: "folder", text: "Folder", expandable: true };
        let fails = true;
        create(item => {
            if (!item) return [folder, leaf("other")];
            if (fails) throw new Error("Server error");
            return [leaf("child")];
        });
        await tree.load(); await tree.expand(folder); await frame();
        expect(items().map(row => row.getAttribute("aria-label"))).toEqual(["Folder", "other"]);
        expect(tree.dom.textContent).toContain("Could not load");
        fails = false;
        tree.dom.querySelector<HTMLButtonElement>("button")!.click();
        await frame();
        expect(items().map(row => row.getAttribute("aria-label"))).toEqual(["Folder", "child", "other"]);
    });

    it("ignores a root response after refresh even if its loader ignores abort", async () => {
        const first = deferred<readonly Item[]>(), second = deferred<readonly Item[]>();
        const signals: AbortSignal[] = [];
        create((_item, signal) => { signals.push(signal); return signals.length === 1 ? first.promise : second.promise; });
        const old = tree.load(); await Promise.resolve();
        const refreshed = tree.refresh(); await Promise.resolve();
        expect(signals[0].aborted).toBe(true);
        second.resolve([leaf("new")]); await refreshed;
        first.resolve([leaf("obsolete")]); await old; await frame();
        expect(items().map(row => row.getAttribute("aria-label"))).toEqual(["new"]);
    });

    it("ignores an obsolete child response after branch refresh", async () => {
        const folder: Item = { id: "folder", text: "Folder", expandable: true }, pending = deferred<readonly Item[]>();
        let calls = 0;
        create(item => !item ? [folder] : ++calls === 1 ? pending.promise : [leaf("fresh")]);
        await tree.load(); const old = tree.expand(folder); await Promise.resolve();
        await tree.refresh(folder);
        pending.resolve([leaf("stale")]); await old; await frame();
        expect(items().map(row => row.getAttribute("aria-label"))).toEqual(["Folder", "fresh"]);
    });

    it("aborts outstanding requests on disposal and never publishes their results", async () => {
        const pending = deferred<readonly Item[]>();
        let signal!: AbortSignal;
        create((_item, abort) => { signal = abort; return pending.promise; });
        const load = tree.load(); await Promise.resolve();
        const changed = vi.fn(); tree.selectionChanged.subscribe(changed);
        tree.dispose();
        expect(signal.aborted).toBe(true);
        pending.resolve([leaf("late")]); await load;
        expect(tree.selectedItem).toBeUndefined();
        expect(changed).not.toHaveBeenCalled();
    });

    it("separates keyboard focus from confirmed selection and supports type-ahead", async () => {
        const roots = [leaf("Alpha"), leaf("Beta"), leaf("Gamma")];
        create(() => roots); await tree.load(); await frame();
        expect(tree.focusedItem?.id).toBe("Alpha");
        key("ArrowDown");
        expect(tree.focusedItem?.id).toBe("Beta");
        expect(tree.selectedItem).toBeUndefined();
        key("Enter"); expect(tree.selectedItem?.id).toBe("Beta");
        key("End"); expect(tree.focusedItem?.id).toBe("Gamma");
        key("Home"); key("g"); expect(tree.focusedItem?.id).toBe("Gamma");
        await frame();
        const root = tree.dom.querySelector('[role="tree"]')!;
        expect(document.getElementById(root.getAttribute("aria-activedescendant")!)?.getAttribute("aria-label")).toBe("Gamma");
    });

    it("navigates into children and back to their parent and retains hidden selection", async () => {
        const child = leaf("child"), folder: Item = { id: "folder", text: "Folder", children: [child] };
        create(item => item ? item.children ?? [] : [folder]); await tree.load();
        key("ArrowRight"); await tree.expand(folder); key("ArrowRight"); key("Enter");
        expect(tree.selectedItem?.id).toBe("child");
        tree.collapse(folder);
        expect(tree.focusedItem?.id).toBe("folder");
        expect(tree.selectedItem?.id).toBe("child");
        expect(await tree.reveal(child)).toBe(true);
        expect(tree.focusedItem?.id).toBe("child");
        key("ArrowLeft"); expect(tree.focusedItem?.id).toBe("folder");
    });

    it("preserves stable selection/expansion across refresh and clears removed selection", async () => {
        const child = leaf("child"), folder: Item = { id: "folder", text: "Folder", children: [child] };
        let roots = [folder];
        create(item => item ? item.children ?? [] : roots); await tree.load(); await tree.expand(folder);
        tree.select(child);
        await tree.refresh();
        expect(tree.selectedItem?.id).toBe("child");
        expect(tree.isExpanded(folder)).toBe(true);
        roots = [];
        await tree.refresh();
        expect(tree.selectedItem).toBeUndefined();
        expect(tree.focusedItem).toBeUndefined();
    });

    it("rejects duplicate and cyclic keys locally without partially publishing children", async () => {
        const folder: Item = { id: "folder", text: "Folder", expandable: true };
        create(item => !item ? [folder] : [leaf("good"), folder]);
        await tree.load(); await tree.expand(folder); await frame();
        expect(items()).toHaveLength(1);
        expect(tree.dom.textContent).toContain("Could not load");
        expect(await tree.reveal(leaf("good"))).toBe(false);
    });

    it("virtualizes a wide root list and reveals its final item", async () => {
        const roots = Array.from({ length: 1000 }, (_, i) => leaf(`row-${i}`));
        create(() => roots); await tree.load(); await frame();
        expect(items().length).toBeLessThan(100);
        expect(await tree.reveal(roots[999])).toBe(true); await frame();
        expect(items().some(row => row.getAttribute("aria-label") === "row-999")).toBe(true);
        expect(items()[items().length - 1].getAttribute("aria-posinset")).toBe("1000");
    });
});
