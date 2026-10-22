import { c, cdiv } from "../../src/core/c";
import { e } from "../../src/core/e";
import { createDocsBrand } from "./DocsBrand";
import { createDocsThemeButton } from "./DocsThemeButton";

const storageKey = "elg-docs-sidebar-collapsed";

/** Docs-only chrome. Desktop preference is independent of the temporary mobile drawer. */
export function createDocsHeader(sidebar: HTMLElement) {
    const header = c("header", {
        className: "docs-header",
        ui: ["elg"]
    });
    const mobile = window.matchMedia("(max-width: 900px)");
    let collapsed = false;
    let mobileOpen = false;
    try { collapsed = localStorage.getItem(storageKey) === "true"; } catch { /* Storage may be unavailable. */ }

    const toggle = e("button", {
        type: "button", class: "docs-nav-toggle", ui: ["elg", "btn", "neutral"]
    }, e("i", { class: "ri-side-bar-line", ariaHidden: "true" }));
    const collapse = e("button", {
        type: "button", class: "docs-sidebar-collapse", ui: ["elg", "btn", "btn-ghost"]
    }, e("i", { class: "ri-side-bar-line", ariaHidden: "true" }));
    const brandRow = e("div", { class: "docs-sidebar-brand" }, createDocsBrand(), collapse);
    for (const button of [toggle, collapse]) button.setAttribute("aria-controls", "docs-sidebar");
    sidebar.prepend(brandRow);

    function sync() {
        const expanded = mobile.matches ? mobileOpen : !collapsed;
        sidebar.toggleAttribute("data-collapsed", collapsed);
        sidebar.toggleAttribute("data-open", mobile.matches && mobileOpen);
        header.dom.toggleAttribute("data-sidebar-collapsed", collapsed);
        for (const button of [toggle, collapse]) {
            const label = expanded ? "Collapse navigation" : "Expand navigation";
            button.setAttribute("aria-expanded", String(expanded));
            button.setAttribute("aria-label", label);
            button.title = label;
        }
    }
    function changeNavigation() {
        if (mobile.matches) mobileOpen = !mobileOpen;
        else {
            collapsed = !collapsed;
            try { localStorage.setItem(storageKey, String(collapsed)); } catch { /* Keep the in-memory preference. */ }
        }
        sync();
        if (!(mobile.matches ? mobileOpen : !collapsed)) toggle.focus();
        else collapse.focus();
    }
    header.listen(toggle, "click", changeNavigation);
    header.listen(collapse, "click", changeNavigation);
    header.listen(sidebar, "click", event => {
        if (mobile.matches && (event.target as Element).closest("a")) {
            mobileOpen = false;
            sync();
            toggle.focus();
        }
    });
    header.listen(sidebar, "keydown", event => {
        if ((event as KeyboardEvent).key === "Escape" && mobile.matches && mobileOpen) {
            event.preventDefault();
            mobileOpen = false;
            sync();
            toggle.focus();
        }
    });
    header.listen(mobile, "change", () => {
        const focusInSidebar = sidebar.contains(document.activeElement);
        mobileOpen = false;
        sync();
        if (focusInSidebar && (mobile.matches || collapsed)) toggle.focus();
    });
    header.addCleanup(() => brandRow.remove());

    const themeButton = createDocsThemeButton();
    // The footer stays outside the scrolling topic tree, but shares this chrome's lifecycle.
    const footer = cdiv({ className: "docs-sidebar-footer" }, themeButton);
    sidebar.append(footer.dom);
    header.addCleanup(footer);
    header.append([toggle, createDocsBrand("docs-header-brand")]);
    sync();
    return header;
}
