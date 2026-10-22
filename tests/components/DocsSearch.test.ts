import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { DocsSearch } from "../../docs/app/DocsSearch";
import type { TopicManifest, TopicSearchEntry } from "../../docs/app/types";

const topics = (JSON.parse(readFileSync("docs/content/topics-manifest.json", "utf8")) as TopicManifest).topics;
const index = JSON.parse(readFileSync("docs/content/search-index.json", "utf8")) as TopicSearchEntry[];
const settle = () => new Promise(resolve => setTimeout(resolve, 40));
let search: DocsSearch | undefined;
afterEach(() => { search?.dispose(); search = undefined; document.body.replaceChildren(); vi.unstubAllGlobals(); });

function fixture() {
    const tree = document.createElement("nav"); document.body.append(tree);
    search = new DocsSearch(topics, [], tree); search.mount(document.body);
    const input = search.dom.querySelector("input")!;
    const enter = async (text: string) => { input.value = text; input.dispatchEvent(new Event("input")); await settle(); await settle(); };
    return { tree, input, enter, dom: search.dom };
}

describe("sidebar documentation search", () => {
    it("loads prose lazily, searches collapsed topics, and clears without hiding the brand", async () => {
        const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => index }); vi.stubGlobal("fetch", fetch);
        const { tree, input, enter, dom } = fixture(); await settle(); expect(fetch).not.toHaveBeenCalled();
        await enter("copy paste");
        expect(fetch).toHaveBeenCalledTimes(1); expect(tree.hidden).toBe(true);
        const first = dom.querySelector<HTMLAnchorElement>(".docs-search-result")!;
        expect(first.getAttribute("href")).toBe("?!=/components/datagrid/clipboard");
        expect(first.textContent).toContain("DataGrid");
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(document.activeElement).toBe(first);
        first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
        expect(document.activeElement).toBe(input);
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await settle();
        expect(input.value).toBe(""); expect(tree.hidden).toBe(false);
        await enter("DateFormatter"); expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("uses the latest query when the index arrives and aborts on disposal", async () => {
        let resolve!: (value: unknown) => void;
        const fetch = vi.fn((_url: string, _options: RequestInit) => new Promise(done => { resolve = done; })); vi.stubGlobal("fetch", fetch);
        const { enter, dom, tree } = fixture(); await enter("paste"); await enter("cache");
        resolve({ ok: true, json: async () => index }); await settle(); await settle();
        expect(dom.querySelector(".docs-search-result")?.textContent).toContain("cache");
        const signal = fetch.mock.calls[0][1].signal!;
        search!.dispose(); expect(signal.aborted).toBe(true); expect(tree.hidden).toBe(false);
    });

    it("reports fetch failure and retries after clearing", async () => {
        const fetch = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ok: true, json: async () => index }); vi.stubGlobal("fetch", fetch);
        const { enter, dom } = fixture(); await enter("paste");
        expect(dom.textContent).toContain("Search is unavailable");
        await enter(""); await enter("paste");
        expect(fetch).toHaveBeenCalledTimes(2); expect(dom.querySelector(".docs-search-result")).not.toBeNull();
    });
});
