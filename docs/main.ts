import { BrowserRouter, RouterHandler } from '../src/components/browser-router/BrowserRouter';
import { c, cdiv } from '../src/core/c';
import { a, div, e, nav } from '../src/core/e';
import { ObservableValue } from '../src/core/ElgoraUI';
import { UiStyle } from '../src/core/UiStyle';
import { MarkdownTopicPage } from './app/MarkdownTopicPage';
import { TopicManifest } from './app/types';
import { TopicLoader } from './app/TopicLoader';
import { ApiLoader } from './app/ApiLoader';
import { ApiTopicPage } from './app/ApiTopicPage';
import { Scrollbars } from '../src/components/scrollbar/Scrollbars';
import { createDocsHeader } from './app/DocsNavigation';

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
    const toggleUi: UiStyle[] = ["elg", "d-flex", "items-center", "justify-between", "w-100", "p-1", "rounded-1", "text-start", "border-0", "hover", "focus", "cursor-pointer"];
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

function createSidebarSearch(sidebar: HTMLElement) {
    const search = e("input", {
        ui: ["elg"],
        type: "search",
        placeholder: "Search documentation…",
        ariaLabel: "Search documentation"
    });
    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        for (const link of sidebar.querySelectorAll<HTMLAnchorElement>(".docs-sidebar-topics a")) {
            link.style.display = !query || link.textContent?.toLowerCase().includes(query) ? "block" : "none";
        }
    });
    return e("div", { class: "docs-sidebar-search" },
        e("div", { class: "docs-search-control" },
            e("i", { class: "ri-search-line", ariaHidden: "true" }), search));
}

async function bootstrap(): Promise<void> {
    const [manifestResponse, apiManifestResponse] = await Promise.all([
        fetch("./content/topics-manifest.json"),
        fetch("./content/api/manifest.json")
    ]);
    if (!manifestResponse.ok || !apiManifestResponse.ok) {
        throw new Error("Documentation metadata could not be loaded.");
    }

    const manifest = await manifestResponse.json() as TopicManifest;
    const apiManifest = await apiManifestResponse.json() as import("./app/types-api").ApiManifest;
    const markdownTopics = manifest.topics;
    const currentPath = new ObservableValue(new URLSearchParams(window.location.search).get("!") || "/");
    const topicLoader = new TopicLoader();
    const apiLoader = new ApiLoader();
    let activePage: { dispose(): void } | undefined;
    let pageVersion = 0;
    const markdownRoutes: RouterHandler[] = markdownTopics.map(entry => ({
        path: entry.path,
        ...(entry.path === "/" ? { regex: /^\/$/ } : {}),
        createPage() {
            const version = ++pageVersion;
            activePage?.dispose(); activePage = undefined;
            const pageRoot = div({ ui: ["elg", "p-3", "text-muted"] }, "Loading documentation topic…");
            return {
                title: entry.title,
                description: entry.description || entry.title,
                dom: pageRoot,
                async init() {
                    try {
                        const topic = await topicLoader.load(entry);
                        if (version !== pageVersion) return;
                        const page = entry.path === "/"
                            ? new (await import("./app/LandingPage")).LandingPage(topic.demos, router.dom)
                            : new MarkdownTopicPage(topic, apiLoader, apiManifest.entries, router.dom);
                        if (version !== pageVersion) { page.dispose(); return; }
                        activePage = page;
                        pageRoot.className = entry.path === "/" ? "elg elg-min-w-0 elg-w-100" : "elg elg-p-3 elg-min-w-0 elg-w-100";
                        pageRoot.replaceChildren(page.dom);
                        router.dom.scrollTop = 0;
                    } catch (error) {
                        pageRoot.className = "elg elg-p-3 elg-text-danger";
                        pageRoot.textContent = error instanceof Error ? error.message : String(error);
                    }
                }
            };
        }
    }));

    const apiRoutes: RouterHandler[] = apiManifest.entries.map(entry => ({
        path: entry.path,
        createPage() {
            const version = ++pageVersion;
            activePage?.dispose(); activePage = undefined;
            const pageRoot = div({ ui: ["elg", "p-3", "text-muted"] }, "Loading API reference…");
            const revealMember = () => {
                if (!window.location.hash) return;
                try {
                    const id = decodeURIComponent(window.location.hash.slice(1));
                    pageRoot.querySelector("#" + CSS.escape(id))?.scrollIntoView({ block: "start" });
                } catch { /* An invalid fragment must not prevent the API page from loading. */ }
            };
            return {
                title: entry.name,
                description: entry.description || `${entry.kind} ${entry.name}`,
                dom: pageRoot,
                onUrlChanged: async () => { revealMember(); },
                async init() {
                    try {
                        const apiEntry = await apiLoader.load(entry);
                        if (version !== pageVersion) return;
                        const page = new ApiTopicPage(apiEntry, markdownTopics);
                        activePage = page;
                        pageRoot.className = "elg elg-p-3 elg-min-w-0 elg-w-100";
                        pageRoot.replaceChildren(page.dom);
                        router.dom.scrollTop = 0;
                        revealMember();
                    } catch (error) {
                        pageRoot.className = "elg elg-p-3 elg-text-danger";
                        pageRoot.textContent = error instanceof Error ? error.message : String(error);
                    }
                }
            };
        }
    }));

    const routes: RouterHandler[] = [
    ...markdownRoutes,
    ...apiRoutes,

    ];

    const router = new BrowserRouter(routes);
    router.dom.classList.add("docs-router");

    const gettingStartedLinks = buildSidebarTree(markdownTopics
        .filter(topic => topic.group === "getting-started")
        .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title })));

    const fundamentalLinks = buildSidebarTree(markdownTopics
        .filter(topic => topic.group === "fundamentals")
        .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title })));

const componentLinks = buildSidebarTree([
        { id: "datagrid", href: "/components/datagrid/overview", title: "DataGrid" },
        { id: "editors", href: "/components/value-editors", title: "Value editors" },
        { id: "menus", href: "/popover", title: "Menus & popovers" },
        { id: "scrolling", href: "/components/scrollbars", title: "Scrolling" },
        ...markdownTopics
            .filter(topic => topic.group === "components" && topic.path !== "/components")
            .map(topic => ({ id: topic.id,
                parent: ["popover", "popup-menu", "tooltip"].includes(topic.id) ? "menus"
                    : ["scroll-engine", "scrollbars", "virtual-list", "scroll-spy"].includes(topic.id) ? "scrolling" : topic.parent,
                href: topic.path, title: topic.title }))
]);

const styleLinks = buildSidebarTree(markdownTopics
    .filter(topic => topic.group === "styles")
    .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title })));

    const dataLinks = buildSidebarTree([
        { id: "datasource", href: "/data/data-source/overview", title: "DataSource" },
        ...markdownTopics
            .filter(topic => topic.group === "data")
            .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title }))
    ]);
    const coreLinks = buildSidebarTree(markdownTopics
        .filter(topic => topic.group === "core")
        .map(topic => ({ id: topic.id, parent: topic.parent, href: topic.path, title: topic.title })));

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
    }, "Home");
    overviewLink.bindUiStyle("selected", currentPath, value => value === "/");
    window.addEventListener("popstate", () => {
        currentPath.Value = new URLSearchParams(window.location.search).get("!") || "/";
    });

    // Main layout container.
    const sidebar = nav(
        {
            id: "docs-sidebar", class: "docs-sidebar",
            ui: ["elg", "flex-none", "h-100", "min-h-0",
                "border-end", "d-flex", "flex-col"],
            style: { width: "280px", minWidth: "280px" }
        },
    div({ class: "docs-sidebar-topics", ui: ["elg", "grow-1", "min-h-0", "overflow-y-auto", "p-3", "d-flex", "flex-col", "gap-1"] },
    overviewLink,
    createSidebarGroup("Getting started", gettingStartedLinks, currentPath),
    createSidebarGroup("Fundamentals", fundamentalLinks, currentPath),
    createSidebarGroup("Styles & layout", styleLinks, currentPath),
            createSidebarGroup("Components", componentLinks, currentPath),
            createSidebarGroup("Data", dataLinks, currentPath),
            createSidebarGroup("Core utilities", coreLinks, currentPath, false),
            createSidebarGroup("API Reference", apiLinks, currentPath, false))
    );
    sidebar.prepend(createSidebarSearch(sidebar));

    const app = cdiv(
        { ui: ["elg", "d-flex", "h-100"] },
        sidebar,
        cdiv({ className: "docs-main", ui: ["elg", "d-flex", "flex-col", "grow-1", "min-h-0", "min-w-0"] },
            createDocsHeader(sidebar),
            div({ class: "docs-content", ui: ["grow-1", "d-flex", "min-w-0", "min-h-0" ] }, router)
        )
    );
    app.bindClass("docs-site-home", currentPath, path => path === "/");

    app.mount(document.getElementById('app')!);
    app.addCleanup(Scrollbars.install(window));
}

void bootstrap().catch(error => {
    const app = document.getElementById("app");
    if (app) app.textContent = error instanceof Error ? error.message : String(error);
});
