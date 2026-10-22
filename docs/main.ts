import { BrowserRouter, RouterHandler } from '../src/components/browser-router/BrowserRouter';
import { c, cdiv } from '../src/core/c';
import { div } from '../src/core/e';
import { ObservableValue } from '../src/core/ElgoraUI';
import { UiStyle } from '../src/core/UiStyle';
import { MarkdownTopicPage } from './app/MarkdownTopicPage';
import { TopicManifest } from './app/types';
import { TopicLoader } from './app/TopicLoader';
import { ApiLoader } from './app/ApiLoader';
import { ApiTopicPage } from './app/ApiTopicPage';
import { Scrollbars } from '../src/components/scrollbar/Scrollbars';
import { createDocsHeader } from './app/DocsNavigation';
import { docsSections, guideLinks, sectionDestination } from './app/DocsStructure';
import { DocsSearch } from './app/DocsSearch';

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

function createSidebarGroup(title: string, links: SidebarLink[], currentPath: ObservableValue<string>, expanded = true, depth = 0, key = title) {
    const initiallyExpanded = expanded || containsSidebarPath(links, currentPath.Value);
    const isExpanded = new ObservableValue(initiallyExpanded);
    const groupId = `docs-nav-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
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
        if (link.children?.length) return createSidebarGroup(link.title, link.children, currentPath, false, depth + 1, key + "-" + (link.id || link.title));
        const itemUi: UiStyle[] = ["elg", "d-flex", "items-center", "w-100", "p-1", "rounded-1", "text-muted", "no-underline", "hover", "focus", "cursor-pointer"];
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
    group.addCleanup(currentPath.subscribe(path => {
        if (containsSidebarPath(links, path)) isExpanded.Value = true;
    }));

    return group;
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
            const revealSection = () => {
                const destination = sectionDestination(entry, window.location.hash);
                if (destination) { BrowserRouter.navigate("?!=" + destination, true); return true; }
                if (window.location.hash) {
                    try {
                        pageRoot.querySelector("#" + CSS.escape(decodeURIComponent(window.location.hash.slice(1))))?.scrollIntoView({ block: "start" });
                    } catch { /* Malformed fragments must not break a guide. */ }
                }
                return false;
            };
            return {
                title: entry.title,
                description: entry.description || entry.title,
                dom: pageRoot,
                onUrlChanged: async () => { revealSection(); },
                async init() {
                    try {
                        if (sectionDestination(entry, window.location.hash)) { revealSection(); return; }
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
                        revealSection();
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
        href: "?!=/docs",
        ui: ["elg", "d-flex", "items-center", "w-100", "p-1", "rounded-1", "text-muted", "no-underline", "hover", "focus", "cursor-pointer"],
        onclick: () => currentPath.Value = "/docs"
    }, "Documentation");
    overviewLink.bindUiStyle("selected", currentPath, value => value === "/docs");
    window.addEventListener("popstate", () => {
        currentPath.Value = new URLSearchParams(window.location.search).get("!") || "/";
    });

    // Main layout container.
    const sidebarComponent = c("nav",
        {
            id: "docs-sidebar", className: "docs-sidebar",
            ui: ["elg", "flex-none", "h-100", "min-h-0",
                "border-end", "d-flex", "flex-col"],
            style: { width: "280px", minWidth: "280px" }
        },
    cdiv({ className: "docs-sidebar-topics", ui: ["elg", "grow-1", "min-h-0", "overflow-y-auto", "p-3", "d-flex", "flex-col", "gap-1"] },
    overviewLink,
            ...docsSections.map(section => createSidebarGroup(section.title, guideLinks(markdownTopics, section.group), currentPath, false)),
            createSidebarGroup("API Reference", apiLinks, currentPath, false))
    );
    const sidebar = sidebarComponent.dom;
    const search = new DocsSearch(markdownTopics, apiManifest.entries, sidebar.querySelector(".docs-sidebar-topics")!);
    sidebar.prepend(search.dom);

    const app = cdiv(
        { ui: ["elg", "d-flex", "h-100"] },
        sidebarComponent,
        cdiv({ className: "docs-main", ui: ["elg", "d-flex", "flex-col", "grow-1", "min-h-0", "min-w-0"] },
            createDocsHeader(sidebar),
            div({ class: "docs-content", ui: ["grow-1", "d-flex", "min-w-0", "min-h-0" ] }, router)
        )
    );
    app.bindClass("docs-site-home", currentPath, path => path === "/");

    app.mount(document.getElementById('app')!);
    app.addCleanup(search);
    app.addCleanup(Scrollbars.install(window));
}

void bootstrap().catch(error => {
    const app = document.getElementById("app");
    if (app) app.textContent = error instanceof Error ? error.message : String(error);
});
