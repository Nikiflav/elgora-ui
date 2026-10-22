import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { docsSections, guideLinks, searchGuides, sectionDestination } from "../../docs/app/DocsStructure";
import type { MarkdownTopic, TopicManifest, TopicManifestEntry, TopicSearchEntry } from "../../docs/app/types";

const manifest = JSON.parse(readFileSync("docs/content/topics-manifest.json", "utf8")) as TopicManifest;
const topics = manifest.topics;
const index = JSON.parse(readFileSync("docs/content/search-index.json", "utf8")) as TopicSearchEntry[];
const modules = topics.map(entry => JSON.parse(readFileSync("docs/" + entry.module, "utf8").replace(/^export default /, "").replace(/;\s*$/, "")) as MarkdownTopic);
const byPath = new Map(topics.map(t => [t.path, t]));
const api = JSON.parse(readFileSync("docs/content/api/manifest.json", "utf8")).entries as { path: string }[];

describe("documentation information architecture", () => {
    it("keeps Docs home focused on getting started and tasks", () => {
        const home = modules.find(topic => topic.path === "/docs")!;
        const article = document.createElement("article"); article.innerHTML = home.html;
        expect([...article.querySelectorAll("h2")].map(h => h.textContent)).toEqual(["Start here", "What are you building?"]);
        expect(article.querySelectorAll("table")).toHaveLength(1);
        const steps = [...article.querySelectorAll("ol > li")];
        expect(steps).toHaveLength(3);
        expect(steps.map(step => step.classList.contains("elg-mb-2"))).toEqual([true, true, false]);
        expect(home.html).not.toContain("Choose a data model");
        expect(sectionDestination(byPath.get("/docs")!, "#choose-a-data-model")).toBe("/data/overview");
    });
    it("places every guide exactly once in an accessible sidebar leaf", () => {
        const paths: string[] = [];
        function visit(nodes: ReturnType<typeof guideLinks>) {
            for (const node of nodes) {
                if (node.children?.length) visit(node.children);
                else paths.push(node.href);
            }
        }
        for (const section of docsSections) visit(guideLinks(topics, section.group));
        expect(paths.sort()).toEqual(topics.filter(t => !["/", "/docs"].includes(t.path)).map(t => t.path).sort());
        expect(new Set(paths).size).toBe(paths.length);
        expect(topics.filter(t => t.path.startsWith("/components/datagrid/")).every(t => t.group === "datagrid")).toBe(true);
        expect(topics.find(t => t.id === "scroll-spy")?.parent).toBe("navigation");
        expect(topics.find(t => t.id === "undo-coordinator")?.group).toBe("fundamentals");
    });

    it("keeps parent guides accessible and child order deterministic", () => {
        const editing = guideLinks(topics, "datagrid").find(t => t.id === "datagrid-editing")!;
        expect(editing.title).toBe("Editing");
        expect(editing.children?.map(t => t.href)).toEqual([
            "/components/datagrid/editing", "/components/datagrid/editing/validation",
            "/components/datagrid/editing/new-rows", "/components/datagrid/editing/change-tracking"
        ]);
    });

    it("preserves moved sections and ignores unknown or malformed fragments", () => {
        const html = byPath.get("/styles/html-elements")!;
        expect(sectionDestination(html, "#buttons")).toBe("/styles/buttons#buttons");
        expect(sectionDestination(byPath.get("/data/dataset")!, "#transactions")).toBe("/data/dataset/rules#transactions");
        expect(sectionDestination(html, "#unknown")).toBeUndefined();
        expect(sectionDestination(html, "#%E0%A4%A")).toBeUndefined();
    });

    it("keeps all 193 pre-reorganization section links reachable", () => {
        const legacy = JSON.parse(readFileSync("tests/fixtures/docs-legacy-sections.json", "utf8")) as [string, string][];
        for (const [path, anchors] of legacy) {
            const topic = byPath.get(path)!;
            expect(topic, path).toBeDefined();
            for (const anchor of anchors.split(" ")) {
                expect(!!topic.headings?.some(h => h.id === anchor) || !!sectionDestination(topic, "#" + anchor), path + "#" + anchor).toBe(true);
            }
        }
    });

    it("ranks task titles first and locates prose inside a contextual section", () => {
        expect(searchGuides("copy paste", topics, index)[0].href).toBe("/components/datagrid/clipboard");
        const match = searchGuides("invalid pending", topics, index).find(t => t.title === "New rows and pending sessions")!;
        expect(match.context).toContain("DataGrid");
        const cache = searchGuides("captured external", topics, index).find(t => t.title === "Local processing and cache invalidation")!;
        expect(cache.href).toContain("#");
        expect(searchGuides("  ", topics, index)).toEqual([]);
        expect(searchGuides("not-a-real-word-79463", topics, index)).toEqual([]);
    });

    it("validates all guide links, legacy redirects, navigation links and live demo sources", () => {
        const failures: string[] = [];
        const apiPaths = new Set(api.map(entry => entry.path));
        function check(url: string, origin: TopicManifestEntry) {
            const [path, fragment] = url.split("#");
            const target = byPath.get(path || origin.path);
            if (!target) { if (!apiPaths.has(path)) failures.push(`${origin.path}: unknown route ${url}`); return; }
            if (fragment && !target.headings?.some(h => h.id === decodeURIComponent(fragment)) && !sectionDestination(target, "#" + fragment))
                failures.push(`${origin.path}: missing section ${url}`);
        }
        for (const entry of topics) {
            const topic = modules.find(m => m.path === entry.path)!;
            const page = document.createElement("article"); page.innerHTML = topic.html;
            expect([...page.querySelectorAll("h2, h3")].every(h => !!h.id)).toBe(true);
            for (const a of page.querySelectorAll<HTMLAnchorElement>("a[href]")) {
                const href = a.getAttribute("href")!;
                if (href.startsWith("?!=")) check(href.slice(3), entry);
                else if (href.startsWith("#")) check(entry.path + href, entry);
            }
            for (const redirect of entry.sectionRedirects || []) check(redirect.slice(redirect.indexOf("|") + 1), entry);
            if (topic.prev) check(topic.prev, entry);
            if (topic.next) check(topic.next, entry);
            for (const demo of topic.demos) if (demo.module) expect(existsSync("docs/" + demo.module), demo.module).toBe(true);
            expect(page.querySelector("[data-api-reference]"), `${entry.path} duplicates API reference`).toBeNull();
        }
        expect(failures).toEqual([]);
    });
});
