import { applyUi, Component } from "../../src/core/Component";
import { cdiv } from "../../src/core/c";
import { a, e } from "../../src/core/e";
import { ApiReference } from "./ApiReference";
import { ApiLoader } from "./ApiLoader";
import { EditableExample } from "./EditableExample";
import { ReadonlyExample } from "./ReadonlyExample";
import { MarkdownTopic } from "./types";
import { ApiManifestEntry } from "./types-api";

export class MarkdownTopicPage extends Component {
    constructor(topic: MarkdownTopic, apiLoader: ApiLoader, apiManifest: ApiManifestEntry[]) {
        const article = e("article", { ui: ["elg", "min-w-0"] });
        article.innerHTML = topic.html;
        const title = article.querySelector<HTMLHeadingElement>("h1");
        if (title) applyUi(title, ["elg", "mt-0"]);
        for (const table of article.querySelectorAll<HTMLTableElement>("table")) {
            applyUi(table, ["elg", "table", "table-row-borders"]);
        }

        const tocItems: HTMLElement[] = [];
        const usedIds = new Set<string>();
        for (const heading of article.querySelectorAll<HTMLHeadingElement>("h2, h3")) {
            const baseId = (heading.textContent || "section")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-") || "section";
            let id = baseId;
            let suffix = 2;
            while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
            usedIds.add(id);
            heading.id = id;

            const link = a({
                href: `#${id}`,
                ui: ["elg", "text-muted", "no-underline", "p-1"],
                onclick: event => {
                    event.preventDefault();
                    history.replaceState({}, "", `#${id}`);
                    heading.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, heading.textContent || id);
            tocItems.push(link);
        }

        const onThisPage = e("aside", {
            ui: ["elg", "surface", "box", "p-3", "d-flex", "flex-col", "gap-1", "flex-none", "overflow-y-auto"],
            style: {
                width: "200px",
                position: "sticky",
                top: "1rem",
                maxHeight: "calc(100vh - 2rem)",
                alignSelf: "flex-start"
            }
        },
            e("strong", { ui: ["elg", "fs-80", "fw-700"] }, "On this page"),
            ...tocItems
        );

        const content = cdiv({ ui: ["elg", "d-flex", "gap-4", "min-w-0", "w-100"] }, article, onThisPage);

        article.style.flex = "1 1 auto";
        article.style.minWidth = "0";

        super({
            ui: ["elg", "d-flex", "flex-col", "gap-4"],
            style: { width: "100%" },
            children: content
        });

        for (const demo of topic.demos) {
            const placeholder = article.querySelector<HTMLElement>(`[data-live-demo="${CSS.escape(demo.id)}"]`);
            if (placeholder) {
                const example = demo.mode === "readonly"
                    ? new ReadonlyExample(demo)
                    : new EditableExample(demo);
                placeholder.replaceWith(example.dom);
            }
        }

        for (const reference of article.querySelectorAll<HTMLElement>("[data-api-reference]")) {
            const rawNames = reference.getAttribute("data-api-reference");
            const names = (rawNames ? rawNames.split(",") : topic.api)
                .map(name => name.trim())
                .filter(Boolean);
            const api = new ApiReference();
            reference.replaceWith(api.dom);
            const selected = apiManifest.filter(entry => names.some(name =>
                name === entry.name || name.startsWith(`${entry.name}.`)));
            void Promise.all(selected.map(entry => apiLoader.load(entry)))
                .then(entries => api.setEntries(entries));
        }

        const navigation = cdiv({ ui: ["elg", "d-flex", "justify-between", "gap-2", "mt-3", "pt-3", "border-top"] });
        if (topic.prev) navigation.dom.append(e("a", { href: `?!=${topic.prev}`, ui: ["elg", "btn", "neutral", "no-underline"] }, "← Previous topic"));
        if (topic.next) navigation.dom.append(e("a", { href: `?!=${topic.next}`, ui: ["elg", "btn", "neutral", "no-underline"] }, "Next topic →"));
        this.dom.append(navigation.dom);
    }
}
