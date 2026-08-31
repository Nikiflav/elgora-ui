import { a, code, div, e, h1, h2, h3, p, pre } from "../src/core/e";

function codeBlock(source: string): HTMLElement {
    return pre({
        className: "elg elg-doc-code",
        style: {
            margin: "0",
            padding: "12px",
            overflow: "auto",
            borderRadius: "6px",
            background: "#111827",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            lineHeight: "1.5"
        }
    }, code(source.trim()));
}

function topic(title: string, description: string, href: string, icon: string): HTMLElement {
    return a({
        href,
        className: "elg elg-doc-topic",
        style: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            padding: "16px",
            minHeight: "110px",
            color: "inherit",
            textDecoration: "none",
            border: "1px solid var(--elg-border-color, #d1d5db)",
            borderRadius: "8px"
        }
    },
        e("i", { className: `elg ${icon} fs-150`, ariaHidden: "true" } as any),
        e("strong", title),
        e("span", { className: "elg text-muted", style: { fontSize: "0.9em" } }, description)
    );
}

/** Documentation overview for the Elgora UI library. */
export const overviewRouterHandler = {
    path: "/",
    createPage() {
        const page = div({
            ui: ["d-flex", "flex-col", "gap-4"],
            style: { maxWidth: "960px", width: "100%" }
        },
            div({ ui: ["elg", "box", "p-4"] },
                e("div", { className: "elg text-muted", style: { fontSize: "0.85em" } }, "ELGORA UI"),
                h1("Build browser-native interfaces"),
                p({ style: { maxWidth: "680px", fontSize: "1.1em" } }, "A lightweight TypeScript UI toolkit for building composable, accessible interfaces with native browser APIs."),
                div({ ui: ["d-flex", "gap-2", "flex-wrap"] },
                    a({ href: "?!=/popover", className: "elg elg-btn elg-primary" }, "Explore Popover"),
                    a({ href: "?!=/popup", className: "elg elg-btn elg-neutral" }, "View live demos")
                )
            ),
            div({ ui: ["elg", "box", "p-4", "d-flex", "flex-col", "gap-3"] },
                h2("Quick start"),
                p("Create a component, add it to the document, and compose it with the same DOM and lifecycle primitives used by the library components."),
                codeBlock(`import { Component } from "elgora-ui";

const app = new Component({
    tag: "div",
    children: "Hello from Elgora UI"
});

app.mount(document.body);`)
            ),
            div({ ui: ["elg", "box", "p-4", "d-flex", "flex-col", "gap-3"] },
                h2("Explore the library"),
                div({
                    style: {
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                        gap: "12px"
                    }
                },
                    topic("Framework fundamentals", "Components, VNodes, lifecycle, and observables.", "?!=/getting-started/framework-overview", "ri-code-s-line"),
                    topic("Popover", "Native popover positioning and dismissal.", "?!=/popover", "ri-layout-2-line"),
                    topic("PopupMenu", "Dynamic menus with nested submenus.", "?!=/popup", "ri-menu-line"),
                    topic("Tooltip", "Universal hover and focus descriptions.", "?!=/tooltip", "ri-information-line"),
                    topic("Data Grid", "Virtualized tabular data and selection.", "?!=/components/datagrid/overview", "ri-table-line"),
                    topic("Virtual List", "Efficient rendering for large collections.", "?!=/components/virtual-list", "ri-list-check-3"),
                    topic("Scroll Engine", "Programmatic scrolling and viewport interaction.", "?!=/components/scroll-engine", "ri-scroll-to-bottom-line"),
                    topic("Browser Router", "Client-side routing without full page reloads.", "?!=/components/browser-router", "ri-route-line")
                )
            ),
            div({ ui: ["elg", "box", "p-4", "d-flex", "flex-col", "gap-3"] },
                h2("Design principles"),
                div({ ui: ["d-flex", "flex-col", "gap-2"] },
                    e("div", ["Prefer native browser behavior", "Use platform capabilities such as Popover API and standard DOM events."]),
                    e("div", ["Keep components composable", "Components share a small core without requiring a larger application framework."]),
                    e("div", ["Make dynamic UI explicit", "VNode patching, stable keys, and observable state support efficient updates."]),
                    e("div", ["Accessibility belongs in the component", "Roles, focus behavior, labels, and keyboard interactions are part of the component API."])
                )
            ),
            div({ ui: ["elg", "box", "p-4", "d-flex", "flex-col", "gap-2"] },
                h2("Browser requirements"),
                p("Modern browser support is expected. Popover, PopupMenu, and Tooltip require the native Popover API. No polyfill is currently included."),
                p({ className: "elg text-muted", style: { marginBottom: "0" } }, "API reference data is generated from the exported TypeScript declarations and will be displayed here as documentation topics evolve.")
            )
        );

        return {
            title: "Overview",
            description: "Build browser-native interfaces with Elgora UI.",
            dom: page
        };
    }
};
