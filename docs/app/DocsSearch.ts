import { Component } from "../../src/core/Component";
import { e } from "../../src/core/e";
import { searchGuides } from "./DocsStructure";
import type { TopicManifestEntry, TopicSearchEntry } from "./types";
import type { ApiManifestEntry } from "./types-api";

/** Owned, frame-batched sidebar search. Guide prose loads only on the first query. */
export class DocsSearch extends Component {
    constructor(topics: TopicManifestEntry[], api: ApiManifestEntry[], topicTree: HTMLElement) {
        const input = e("input", { ui: ["elg"], type: "search", placeholder: "Search documentation…", ariaLabel: "Search documentation" });
        const results = e("div", { class: "docs-search-results", role: "region", ariaLabel: "Search results" });
        const status = e("p", { class: "docs-search-status", role: "status", ariaLive: "polite" });
        results.hidden = true;
        super({ className: "docs-sidebar-search", children: [
            e("div", { class: "docs-search-control" }, e("i", { class: "ri-search-line", ariaHidden: "true" }), input), results
        ] });
        const query = this.observable("");
        const controller = new AbortController();
        let index: TopicSearchEntry[] | undefined;
        let loading: Promise<void> | undefined;
        let failed = false;
        const render = () => {
            const text = query.Value.trim();
            this.dom.toggleAttribute("data-active", !!text);
            topicTree.hidden = !!text;
            results.hidden = !text;
            results.replaceChildren();
            if (!text) return;
            if (!index) {
                status.textContent = failed ? "Search is unavailable. Clear the field and try again." : "Loading search…";
                results.append(status);
                if (!loading && !failed) {
                    loading = fetch("./content/search-index.json", { signal: controller.signal })
                        .then(async response => {
                            if (!response.ok) throw new Error("Search index unavailable");
                            index = await response.json() as TopicSearchEntry[];
                        }).catch(() => { failed = true; })
                        .finally(() => { loading = undefined; if (!this.disposed.Value) this.render(render); });
                }
                return;
            }
            const matches = searchGuides(text, topics, index);
            const words = text.toLocaleLowerCase().split(/\s+/);
            const apiMatches = api.filter(entry => words.every(word => (entry.name + " " + (entry.description || "")).toLocaleLowerCase().includes(word))).slice(0, 10);
            status.textContent = matches.length + apiMatches.length ? `${matches.length} guides · ${apiMatches.length} API results` : "No results. Try a field, component or behavior name.";
            results.append(status);
            for (const match of matches) results.append(e("a", { href: "?!=" + match.href, class: "docs-search-result" },
                e("small", {}, match.context), e("strong", {}, match.title), ...(match.section ? [e("span", {}, match.section)] : [])));
            for (const entry of apiMatches) results.append(e("a", { href: "?!=" + entry.path, class: "docs-search-result" },
                e("small", {}, "API Reference → " + entry.namespace), e("strong", {}, entry.name)));
        };
        this.renderOnChange(query, render);
        this.listen(input, "input", () => {
            if (!input.value.trim()) failed = false;
            query.Value = input.value;
        });
        this.listen(input, "keydown", event => {
            const key = (event as KeyboardEvent).key;
            if (key === "Escape" && input.value) {
                event.preventDefault(); event.stopPropagation(); input.value = ""; query.Value = ""; failed = false;
            } else if (key === "ArrowDown") {
                const first = results.querySelector<HTMLAnchorElement>("a");
                if (first) { event.preventDefault(); first.focus(); }
            }
        });
        this.listen(results, "keydown", event => {
            const key = (event as KeyboardEvent).key;
            if (key === "Escape") { event.preventDefault(); event.stopPropagation(); input.focus(); return; }
            if (key !== "ArrowDown" && key !== "ArrowUp") return;
            const links = [...results.querySelectorAll<HTMLAnchorElement>("a")];
            const at = links.indexOf(document.activeElement as HTMLAnchorElement);
            if (at < 0) return;
            event.preventDefault();
            if (key === "ArrowUp" && at === 0) input.focus();
            else links[Math.max(0, Math.min(links.length - 1, at + (key === "ArrowDown" ? 1 : -1)))].focus();
        });
        this.listen(results, "click", event => {
            if ((event.target as Element).closest("a")) { input.value = ""; query.Value = ""; }
        });
        this.addCleanup(() => { controller.abort(); topicTree.hidden = false; });
    }
}
