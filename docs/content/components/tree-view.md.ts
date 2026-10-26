import { TreeView, cdiv, e } from "../../../src/index";

type Item = { id: string; name: string; folder?: boolean };

export default function demo(): void {
    const roots: Item[] = [
        { id: "pages", name: "Pages", folder: true },
        { id: "media", name: "Media", folder: true },
        { id: "retry", name: "Retry example", folder: true },
        { id: "readme", name: "README" }
    ];
    // Mixed branches and leaves make alignment visible at every nesting level.
    const guides: Item = { id: "pages/guides", name: "Guides", folder: true };
    const gettingStarted: Item = { id: "pages/guides/start", name: "Getting started", folder: true };
    const tutorials: Item = { id: "pages/guides/start/tutorials", name: "Tutorials", folder: true };
    const firstProject: Item = { id: "pages/guides/start/tutorials/first", name: "Your first project" };
    const children: Record<string, Item[]> = {
        pages: [guides, { id: "pages/home", name: "Home" },
            ...Array.from({ length: 98 }, (_, index) => ({ id: `pages/${index}`, name: `Page ${index + 1}` }))],
        [guides.id]: [gettingStarted, { id: "pages/guides/about", name: "About these guides" }],
        [gettingStarted.id]: [
            tutorials,
            { id: "pages/guides/start/install", name: "Installation" },
            { id: "pages/guides/start/reference", name: "Configuration reference with a deliberately long title to check single-line truncation in narrow trees" }
        ],
        [tutorials.id]: [firstProject, { id: "pages/guides/start/tutorials/next", name: "Next steps" }]
    };
    let requests = 0, failOnce = true;
    const status = e("div", { role: "status", ui: ["text-muted"] }, "No selection");
    const counter = e("small", {}, "Requests: 0");
    const tree = new TreeView<Item>({
        label: "Site content",
        getText: item => item.name,
        renderItem: ({ item, element, expanded }) => {
            // Decorative icons are separate from the disclosure arrow and accessible label.
            const icon = item.folder ? expanded ? "ri-folder-open-line" : "ri-folder-line"
                : item.id.startsWith("media/") ? "ri-image-line"
                : item.id === "readme" ? "ri-file-text-line" : "ri-article-line";
            Object.assign(element.style, { display: "flex", alignItems: "center", gap: "6px" });
            element.append(
                e("i", { class: `elg-icon ${icon}`, ariaHidden: "true", style: { flex: "0 0 18px", textAlign: "center" } }),
                e("span", { style: { minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" } }, item.name)
            );
        },
        data: {
            getKey: item => item.id,
            hasChildren: item => !!item.folder,
            getChildren: async (item, signal) => {
                counter.textContent = `Requests: ${++requests}`;
                await new Promise<void>((resolve, reject) => {
                    const abort = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
                    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 400);
                    if (signal.aborted) abort();
                    else signal.addEventListener("abort", abort, { once: true });
                });
                if (!item) return roots;
                if (item.id === "retry" && failOnce) { failOnce = false; throw new Error("Demo request failure"); }
                if (children[item.id]) return children[item.id];
                return Array.from({ length: 8 }, (_, index) => ({
                    id: `${item.id}/${index}`, name: `${item.name} ${index + 1}`
                }));
            }
        }
    });
    tree.dom.style.height = "290px";
    tree.selectionChanged.subscribe(item => { status.textContent = item ? `Selected: ${item.name}` : "No selection"; });
    tree.itemActivated.subscribe(item => { status.textContent = `Activated: ${item.name}`; });
    const showNested = e("button", { type: "button", ui: ["elg", "btn", "neutral"], onclick: async () => {
        showNested.disabled = true;
        try {
            await tree.load();
            for (const item of [roots[0], guides, gettingStarted, tutorials]) await tree.expand(item);
            await tree.reveal(firstProject);
        } finally { showNested.disabled = false; }
    } }, "Show nested example");
    cdiv({ ui: ["p-1", "d-flex", "flex-col", "gap-1"] },
        e("div", { ui: ["d-flex", "gap-1", "items-center"] },
            e("button", { type: "button", ui: ["elg", "btn", "neutral"], onclick: () => { void tree.refresh(); } }, "Reload tree"), showNested, counter),
        tree, status,
        e("small", { ui: ["text-muted"] }, "Arrows navigate · Space selects · Enter activates · Type to find")
    ).mount(document.body);
}
