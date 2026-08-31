import { BrowserRouter, RouterHandler } from '../src/components/browser-router/BrowserRouter';
import { c, cbutton, cdiv } from '../src/core/c';
import { a, div, e, nav } from '../src/core/e';
import { ObservableValue } from '../src/core/ElgoraUI';
import { UiStyle } from '../src/core/UiStyle';
import { overviewRouterHandler } from './overview-demo';
import { MarkdownTopicPage } from './app/MarkdownTopicPage';
import { ApiDocsFile, TopicManifest } from './app/types';
import { TopicLoader } from './app/TopicLoader';
import { ApiLoader } from './app/ApiLoader';
import { ApiTopicPage } from './app/ApiTopicPage';

function topicPlaceholder(path: string, title: string, description: string): RouterHandler {
    return {
        path,
        createPage() {
            return {
                title,
                description,
                dom: div({ ui: ["elg", "box", "p-4", "d-flex", "flex-col", "gap-2"] },
                    e("h2", title),
                    e("p", description),
                    e("p", { ui: ["elg", "text-muted"] }, "This documentation topic will be expanded with API reference, live examples, and editable code.")
                )
            };
        }
    };
}

type SidebarLink = {
    id?: string;
    parent?: string;
    href: string;
    title: string;
    children?: SidebarLink[];
};

function buildSidebarTree(items: SidebarLink[]): SidebarLink[] {
    const nodes = items.map(item => ({ ...item, children: [...(item.children || [])] }));
    const byId = new Map(nodes.filter(node => node.id).map(node => [node.id!, node]));
    const roots: SidebarLink[] = [];

    for (const node of nodes) {
        const parent = node.parent ? byId.get(node.parent) : undefined;
        if (parent) parent.children!.push(node);
        else roots.push(node);
    }

    return roots;
}

function containsSidebarPath(links: SidebarLink[], path: string): boolean {
    return links.some(link => link.href === path || (link.children && containsSidebarPath(link.children, path)));
}

function createSidebarGroup(title: string, links: SidebarLink[], currentPath: ObservableValue<string>, expanded = true, depth = 0) {
    const initiallyExpanded = expanded || containsSidebarPath(links, currentPath.Value);
    const isExpanded = new ObservableValue(initiallyExpanded);
    const groupId = `docs-nav-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const chevron = c("i", {
        className: "ri-arrow-down-s-line elg-doc-nav-chevron"
    });
    chevron.dom.setAttribute("aria-hidden", "true");
    const toggleUi: UiStyle[] = ["elg", "d-flex", "items-center", "justify-between", "w-100", "p-1", "rounded-1", "text-start", "border-0", "surface", "hover", "focus", "cursor-pointer"];
    if (depth === 0) toggleUi.push("fs-110");
    const toggle = c("button", {
        ui: toggleUi,
        type: "button",
        ariaExpanded: String(initiallyExpanded),
        onclick: () => isExpanded.Value = !isExpanded.Value
    }, title, chevron);
    toggle.dom.setAttribute("aria-controls", groupId);
    const itemsUi: UiStyle[] = ["elg", "d-flex", "flex-col", "gap-1", "p-1"];
    if (depth > 0) itemsUi.push("ms-1", "ps-1", "border-start");
    const items = cdiv({
        id: groupId,
        ui: itemsUi
    }, ...links.map(link => {
        if (link.children?.length) return createSidebarGroup(link.title, link.children, currentPath, false, depth + 1);
        const itemUi: UiStyle[] = ["elg", "d-flex", "items-center", "w-100", "p-1", "rounded-1", "text-muted", "text-nowrap", "no-underline", "hover", "focus", "cursor-pointer"];
        const item = c("a", {
            href: `?!=${link.href}`,
            ui: itemUi,
            onclick: () => currentPath.Value = link.href
        }, link.title);
        item.bindUiStyle("selected", currentPath, value => value === link.href);
        return item;
    }));
    const group = cdiv({ ui: ["elg", "d-flex", "flex-col", "gap-1"] }, toggle, items);

    toggle.bindAttribute("aria-expanded", isExpanded, value => String(value));
    chevron.bindClass("ri-arrow-right-s-line", isExpanded, value => !value);
    items.bindStyle("display", isExpanded, value => value ? "flex" : "none");
    currentPath.subscribe(path => {
        if (containsSidebarPath(links, path)) isExpanded.Value = true;
    });

    return group;
}

function createDocsHeader(sidebar: HTMLElement) {
    const theme = new ObservableValue(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const search = e("input", {
        ui: ["elg"],
        type: "search",
        placeholder: "Search documentation…",
        ariaLabel: "Search documentation"
    });
    const themeButton = cbutton({
        ui: ["elg", "btn", "neutral"],
        type: "button",
        ariaLabel: "Toggle theme"
    }, "Theme");

    themeButton.bindProperty("textContent", theme, value => value === "dark" ? "☀ Light" : "☾ Dark");
    themeButton.dom.addEventListener("click", () => {
        const next = theme.Value === "dark" ? "light" : "dark";
        theme.Value = next;
        if (next === "dark") document.documentElement.dataset.theme = "dark";
        else delete document.documentElement.dataset.theme;
    });

    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        for (const link of sidebar.querySelectorAll<HTMLAnchorElement>("a")) {
            link.style.display = !query || link.textContent?.toLowerCase().includes(query) ? "block" : "none";
        }
    });

    return e("header", { ui: ["elg", "box", "d-flex", "items-center", "gap-3", "px-4", "py-2"] },
        e("a", { href: "?!=/", ui: ["elg", "fw-700", "no-underline"] }, "ELGORA UI"),
        search,
        e("span", { ui: ["elg", "text-muted"] }, "Docs"),
        themeButton
    );
}

async function bootstrap(): Promise<void> {
    const [manifestResponse, apiResponse, apiManifestResponse] = await Promise.all([
        fetch("./content/topics-manifest.json"),
        fetch("./content/api-docs.json"),
        fetch("./content/api/manifest.json")
    ]);
    if (!manifestResponse.ok || !apiResponse.ok || !apiManifestResponse.ok) {
        throw new Error("Documentation metadata could not be loaded.");
    }

    const manifest = await manifestResponse.json() as TopicManifest;
    const apiDocs = await apiResponse.json() as ApiDocsFile;
    const apiManifest = await apiManifestResponse.json() as import("./app/types-api").ApiManifest;
    const markdownTopics = manifest.topics;
    const currentPath = new ObservableValue(new URLSearchParams(window.location.search).get("!") || "/");
    const topicLoader = new TopicLoader();
    const apiLoader = new ApiLoader();
    const markdownRoutes: RouterHandler[] = markdownTopics.map(entry => ({
        path: entry.path,
        createPage() {
            const pageRoot = div({ ui: ["elg", "p-4", "text-muted"] }, "Loading documentation topic…");
            return {
                title: entry.title,
                description: entry.description || entry.title,
                dom: pageRoot,
                async init() {
                    try {
                        const topic = await topicLoader.load(entry);
                        const page = new MarkdownTopicPage(topic, apiDocs.exports);
                        pageRoot.replaceChildren(page.dom);
                    } catch (error) {
                        pageRoot.className = "elg p-4 text-danger";
                        pageRoot.textContent = error instanceof Error ? error.message : String(error);
                    }
                }
            };
        }
    }));

    const apiRoutes: RouterHandler[] = apiManifest.entries.map(entry => ({
        path: entry.path,
        createPage() {
            const pageRoot = div({ ui: ["elg", "p-4", "text-muted"] }, "Loading API reference…");
            return {
                title: entry.name,
                description: entry.description || `${entry.kind} ${entry.name}`,
                dom: pageRoot,
                async init() {
                    try {
                        const apiEntry = await apiLoader.load(entry);
                        const page = new ApiTopicPage(apiEntry, markdownTopics);
                        pageRoot.replaceChildren(page.dom);
                    } catch (error) {
                        pageRoot.className = "elg p-4 text-danger";
                        pageRoot.textContent = error instanceof Error ? error.message : String(error);
                    }
                }
            };
        }
    }));

    const routes: RouterHandler[] = [
    ...markdownRoutes,
    ...apiRoutes,

    // Documentation overview / fallback
    overviewRouterHandler,
    ];

    const router = new BrowserRouter(routes);

    const gettingStartedLinks = buildSidebarTree(markdownTopics
        .filter(topic => topic.group === "getting-started")
        .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title })));

const componentLinks = buildSidebarTree([
        { href: "/components", title: "Component overview" },
        { id: "datagrid", href: "/components/datagrid/overview", title: "DataGrid" },
        ...markdownTopics
            .filter(topic => topic.group === "components" && topic.path !== "/components")
            .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title }))
]);

const styleLinks = buildSidebarTree(markdownTopics
    .filter(topic => topic.group === "styles")
    .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title })));

    const featureLinks = buildSidebarTree([
        { href: "/getting-started/framework-overview", title: "Framework fundamentals" },
        ...markdownTopics
            .filter(topic => topic.group === "features")
            .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title }))
    ]);

    const apiNamespaceLinks: SidebarLink[] = [];
    const namespaceIds = new Map<string, string>();
    const namespaceTitle = (value: string) => value;
    for (const entry of apiManifest.entries) {
        const parts = entry.namespace.split(".");
        let parent: string | undefined;
        let namespace = "";
        for (const part of parts) {
            namespace = namespace ? `${namespace}.${part}` : part;
            const id = `api-${namespace.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            if (!namespaceIds.has(namespace)) {
                apiNamespaceLinks.push({
                    id,
                    parent,
                    href: `/api-reference/${namespace.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    title: namespaceTitle(part)
                });
                namespaceIds.set(namespace, id);
            }
            parent = id;
        }
        apiNamespaceLinks.push({
            id: `api-entry-${entry.name}`,
            parent,
            href: entry.path,
            title: entry.name
        });
    }
    const apiLinks = buildSidebarTree(apiNamespaceLinks);

    const overviewLink = c("a", {
        href: "?!=/",
        ui: ["elg", "d-flex", "items-center", "w-100", "p-1", "rounded-1", "text-muted", "no-underline", "hover", "focus", "cursor-pointer"],
        onclick: () => currentPath.Value = "/"
    }, "Overview");
    overviewLink.bindUiStyle("selected", currentPath, value => value === "/");
    window.addEventListener("popstate", () => {
        currentPath.Value = new URLSearchParams(window.location.search).get("!") || "/";
    });

    // Main layout container.
    const sidebar = nav(
        {
            ui: ["elg", "surface", "flex-none", "h-100", "min-h-0", "overflow-y-auto", "p-3",
                "border-end", "d-flex", "flex-col", "gap-1"],
            style: { width: "280px", minWidth: "280px" }
        },
    overviewLink,
    createSidebarGroup("Getting started", gettingStartedLinks, currentPath),
    createSidebarGroup("Styles", styleLinks, currentPath),
            createSidebarGroup("Components", componentLinks, currentPath),
            createSidebarGroup("Features", featureLinks, currentPath),
            createSidebarGroup("API Reference", apiLinks, currentPath)
    );

    const app = cdiv(
        { ui: ["elg", "d-flex", "flex-col", "h-100"] },
        createDocsHeader(sidebar),
        cdiv({ ui: ["elg", "d-flex", "grow-1", "min-h-0"] },
            sidebar,
            div({ ui: ["grow-1", "d-flex", "p-4", "min-w-0" ] }, router)
        )
    );

    app.mount(document.getElementById('app')!);
}

void bootstrap().catch(error => {
    const app = document.getElementById("app");
    if (app) app.textContent = error instanceof Error ? error.message : String(error);
});
