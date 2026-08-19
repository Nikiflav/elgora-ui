import { Popup, PopupPlacement } from "../src/components/popup/popup";
import { MenuItem, PopupMenu } from "../src/components/popup/PopupMenu";
import { div, e } from "../src/core/e";

const placements: PopupPlacement[] = ["bottom-start", "bottom", "bottom-end", "top-start", "top", "top-end", "right-start", "right", "right-end", "left-start", "left", "left-end"];

function button(label: string, onclick?: (event: MouseEvent, el: HTMLButtonElement) => void): HTMLButtonElement {
    return e("button", { ui: ["elg", "btn", "neutral"], onclick }, label);
}

function menuItem(label: string, onclick?: () => void): HTMLButtonElement {
    return e("button", { onclick: () => onclick?.() }, label);
}

/** Playground route demonstrating popup placements, dismissal, context menus, and nesting. */
export const popupRouterHandler = {
    path: "/popup",
    createPage() {
        const page = div({ ui: ["d-flex", "flex-col", "gap-4"] },
            e("h2", "Popup / native popover demo"),
            e("p", "Try the placement buttons, right-click the context area, and open the nested menu. Popups use native Popover API positioning and viewport-aware placement.")
        );

        const placementArea = div({
            style: {
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gridTemplateRows: "repeat(6, auto)",
                gap: "8px",
                padding: "80px 20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                maxWidth: "600px"
            }
        });
        for (const placement of placements) {
            const anchor = button(placement);
            //anchor.style.maxWidth = "100px";
            const popup = new Popup({
                anchorElement: anchor,
                placement,
                children: [menuItem(`Placement: ${placement}`), menuItem("Popup item", () => popup.hide())]
            });
            placementArea.appendChild(anchor);
            popup.mount(page);
        }
        page.appendChild(div({ ui: ["elg", "box", "p-2", "d-flex", "flex-col", "gap-2"] },
            e("h3", "All placement modes"),
            placementArea
        ));

        const dropdownAnchor = button("Open dropdown");
        const dropdown = new Popup({
            anchorElement: dropdownAnchor,
            placement: "bottom-start",
            gap: 8,
            closeMode: "auto",
            onclose: () => dropdownAnchor.textContent = "Open dropdown",
            children: [menuItem("Edit", () => dropdown.hide()), menuItem("Duplicate", () => dropdown.hide()), menuItem("Delete", () => dropdown.hide())]
        });
        dropdown.dom.addEventListener("toggle", () => dropdownAnchor.textContent = dropdown.isOpen() ? "Close dropdown" : "Open dropdown");
        page.appendChild(div({ ui: ["elg", "box", "p-2", "d-flex", "flex-col", "gap-2"] },
            e("h3", "Dropdown and programmatic API"),
            dropdownAnchor
        ));
        dropdown.mount(page);

        const contextTarget = div({ ui: ["p-4", "border", "border-dashed", "rounded-1", "user-select-none"] }, "Right-click here for a context menu");
        const contextMenu = new Popup({ point: { x: 0, y: 0 }, placement: "bottom-start", children: [menuItem("Refresh", () => contextMenu.hide()), menuItem("Inspect", () => contextMenu.hide())] });
        contextTarget.addEventListener("contextmenu", event => {
            event.preventDefault();
            contextMenu.setPoint(event.clientX, event.clientY);
            contextMenu.show();
        });
        page.appendChild(div({ ui: ["elg", "box", "p-2", "d-flex", "flex-col", "gap-2"] },
            e("h3", "Context menu"),
            contextTarget
        ));
        contextMenu.mount(page);

        const nestedAnchor = button("More actions");
        const nested = new Popup({ anchorElement: nestedAnchor, placement: "right-start", children: [menuItem("Nested action 1"), menuItem("Nested action 2")] });
        const rootAnchor = button("Open nested menu");
        const root = new Popup({ anchorElement: rootAnchor, placement: "bottom-start", children: [menuItem("First action"), nestedAnchor] });
        nestedAnchor.addEventListener("mouseenter", () => nested.show());
        page.appendChild(div({ ui: ["elg", "box", "p-2", "d-flex", "flex-col", "gap-2"] },
            e("h3", "Nested context-style menu"),
            rootAnchor
        ));
        root.mount(page);
        root.append(nested);

        let compactMode = false;
        const popupMenuAnchor = button("Open PopupMenu");
        const popupMenu = new PopupMenu();
        popupMenu.mount(page);

        const createPopupMenuItems = (): MenuItem[] => [
            {
                key: "edit",
                text: "Edit",
                icon: "ri-edit-line",
                action: () => alert("Edit selected")
            },
            {
                key: "view",
                text: "View options",
                icon: "ri-eye-line",
                subItems: async () => [
                    {
                        key: "compact",
                        text: "Compact mode",
                        icon: "ri-layout-column-line",
                        checked: () => compactMode,
                        closeOnAction: false,
                        action: () => { compactMode = !compactMode; }
                    },
                    {
                        key: "details",
                        text: "Show details",
                        icon: "ri-information-line",
                        action: () => alert("Details selected")
                    }
                ]
            },
            {
                key: "share",
                text: "Share",
                icon: "ri-share-line",
                subItems: async () => [
                    {
                        key: "copy-link",
                        text: "Copy link",
                        icon: "ri-link",
                        action: () => alert("Link copied")
                    },
                    {
                        key: "send-email",
                        text: "Send by email",
                        icon: "ri-mail-line",
                        action: () => alert("Email sharing selected")
                    }
                ]
            },
            { isDivider: true },
            {
                key: "delete",
                text: "Delete",
                icon: "ri-delete-bin-line",
                className: "danger-action",
                action: () => alert("Delete selected")
            }
        ];
        popupMenuAnchor.addEventListener("click", () => popupMenu.toggle({
            anchor: popupMenuAnchor,
            placement: "bottom-start",
            gap: 8,
            items: createPopupMenuItems()
        }));

        const contextMenuTarget = div({
            ui: ["p-4", "border", "border-dashed", "rounded-1", "user-select-none"]
        }, "Right-click for a dynamic PopupMenu");
        const dynamicContextMenu = new PopupMenu();
        dynamicContextMenu.mount(page);
        contextMenuTarget.addEventListener("contextmenu", event => {
            event.preventDefault();
            dynamicContextMenu.show({
                point: { x: event.clientX, y: event.clientY },
                items: [
                    {
                        key: "refresh",
                        text: "Refresh target",
                        icon: "ri-refresh-line",
                        action: () => contextMenuTarget.textContent = "Target refreshed"
                    },
                    {
                        key: "copy",
                        text: "Copy target",
                        icon: "ri-file-copy-line",
                        action: () => alert("Target copied")
                    }
                ]
            });
        });

        page.appendChild(div({ ui: ["elg", "box", "p-2", "d-flex", "flex-col", "gap-2"] },
            e("h3", "PopupMenu"),
            e("p", "Menus can be generated at show time, use Remix Icon classes, and contain nested items."),
            div({ ui: ["d-flex", "gap-2", "flex-wrap"] }, popupMenuAnchor, contextMenuTarget)
        ));

        page.appendChild(div({ className: "text-muted", style: { fontSize: "0.85em" } }, "Native Popover API is required. Dropdown uses closeMode: auto; outside clicks and Escape are handled by the browser."));
        return { title: "Popup", description: "Popup positioning and nested menu demo", dom: page };
    }
};
