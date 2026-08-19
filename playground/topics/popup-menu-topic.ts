import { MenuItem, PopupMenu } from "../../src/components/popup/PopupMenu";
import { button, div, e } from "../../src/core/e";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const menuCode = `const menu = new PopupMenu();

button.addEventListener("click", () => {
    menu.toggle({
        anchor: button,
        items: [
            { text: "Edit", icon: "ri-edit-line", action: edit },
            {
                text: "Share",
                icon: "ri-share-line",
                subItems: async () => [
                    { text: "Copy link", action: copyLink }
                ]
            }
        ]
    });
});`;

const contextMenuCode = `target.addEventListener("contextmenu", event => {
    event.preventDefault();
    menu.show({
        point: { x: event.clientX, y: event.clientY },
        items: createItems()
    });
});`;

export const popupMenuTopic: DocumentationTopic = {
    path: "/popup",
    title: "PopupMenu",
    description: "Dynamic action menus with icons, checked state, async nested submenus, links, and context-menu positioning.",
    api: ["PopupMenu", "PopupMenuOptions", "PopupMenuShowOptions", "MenuItem", "RemixIcon"],
    examples: [
        {
            title: "Dynamic nested menu",
            description: "Menu items are supplied when the menu opens, and submenus can be loaded asynchronously.",
            code: menuCode,
            createDemo(root) {
                const anchor = button({ className: "elg elg-btn elg-primary" }, "Open menu");
                const menu = new PopupMenu();
                const items: MenuItem[] = [
                    { key: "edit", text: "Edit", icon: "ri-edit-line", action: () => alert("Edit selected") },
                    {
                        key: "share",
                        text: "Share",
                        icon: "ri-share-line",
                        subItems: async () => [
                            { key: "copy", text: "Copy link", icon: "ri-link", action: () => alert("Link copied") },
                            { key: "email", text: "Send by email", icon: "ri-mail-line", action: () => alert("Email selected") }
                        ]
                    },
                    { isDivider: true },
                    { key: "delete", text: "Delete", icon: "ri-delete-bin-line", action: () => alert("Delete selected") }
                ];
                anchor.addEventListener("click", () => menu.toggle({ anchor, items }));
                root.appendChild(anchor);
                menu.mount(root);
            }
        },
        {
            title: "Context menu",
            description: "The same PopupMenu can be positioned at the pointer for a context-menu interaction.",
            code: contextMenuCode,
            createDemo(root) {
                const target = div({
                    ui: ["p-4", "border", "border-dashed", "rounded-1", "user-select-none"]
                }, "Right-click for actions");
                const menu = new PopupMenu();
                target.addEventListener("contextmenu", event => {
                    event.preventDefault();
                    menu.show({
                        point: { x: event.clientX, y: event.clientY },
                        items: [
                            { text: "Refresh", icon: "ri-refresh-line", action: () => alert("Refresh selected") },
                            { text: "Inspect", icon: "ri-search-line", action: () => alert("Inspect selected") }
                        ]
                    });
                });
                root.appendChild(target);
                menu.mount(root);
            }
        }
    ]
};

export const popupMenuRouterHandler = {
    path: popupMenuTopic.path,
    createPage() {
        const page = new TopicPage(popupMenuTopic);
        return {
            title: popupMenuTopic.title,
            description: popupMenuTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
