import { Component, c, cdiv, e, TextEditor, NumberEditor, LookupEditor, DateEditor, ToggleEditor, ScrollReveal } from "../../src/index";
import { createDocsBrand } from "./DocsBrand";
import { createDocsThemeButton } from "./DocsThemeButton";
import { ReadonlyExample } from "./ReadonlyExample";
import type { MarkdownDemo } from "./types";
import "./landing.css";

const icon = (name: string) => e("i", { class: name, ariaHidden: "true" });
const link = (label: string, href: string, secondary = false) => e("a", {
    href, class: `landing-button${secondary ? " landing-button-secondary" : ""}`
}, label, icon("ri-arrow-right-line"));
const heading = (eyebrow: string, title: string, description: string) => e("div", { class: "landing-section-head" },
    e("p", { ui: ["eyebrow"] }, eyebrow), e("h2", { ui: ["title-section"] }, title),
    e("p", { ui: ["lead", "text-muted"] }, description));

/** Product introduction, distinct from the topic-reading shell. Owns all live examples and motion. */
export class LandingPage extends Component {
    constructor(demos: MarkdownDemo[], scrollContainer: HTMLElement) {
        super({ className: "landing", ui: ["elg"] });
        const theme = createDocsThemeButton();
        const navigation = e("nav", { ariaLabel: "Main navigation", class: "landing-links" },
            e("a", { href: "?!=/docs" }, "Docs"),
            e("a", { href: "?!=/components/value-editors" }, "Components"),
            e("a", { href: "#examples" }, "Examples"));
        const header = c("header", { className: "landing-header", ui: ["container"] },
            createDocsBrand(), navigation, theme);
        const hero = e("section", { class: "landing-hero", ui: ["container"] },
            e("p", { class: "landing-kicker" }, e("span", { class: "landing-status-dot", ariaHidden: "true" }), "TYPESCRIPT UI · IN ACTIVE DEVELOPMENT"),
            e("h1", { ui: ["title-display"] }, "Expressive websites.", e("br"), e("span", {}, "Powerful applications.")),
            e("p", { class: "landing-intro", ui: ["lead"] }, "From the first button to a data-rich workspace. Compose native browser elements, reactive components and editable data views — with one shared visual language."),
            e("div", { class: "landing-actions" }, link("Get started", "?!=/getting-started/quick-start"), link("Explore components", "?!=/components/value-editors", true)),
            e("div", { class: "landing-hero-notes" }, "Native DOM", e("span", { ariaHidden: "true" }, "/"), "Explicit state", e("span", { ariaHidden: "true" }, "/"), "Composable CSS"));

        const orderDemo = demos.find(demo => demo.id === "home-order-desk");
        const order = orderDemo ? new ReadonlyExample({ ...orderDemo, mode: "preview", height: "540px" }) : undefined;
        const dataSection = c("section", { id: "data-demo", className: "landing-data", ui: ["container"] },
            e("div", { class: "landing-demo-heading" }, e("div", {}, e("p", { ui: ["eyebrow"] }, "NOT A SCREENSHOT"),
                e("h2", {}, "A small order desk. A lot of possibilities.")), e("span", { class: "landing-demo-badge" }, "100 sample orders")),
            cdiv({ className: "landing-grid-frame" }, order ?? e("p", {}, "The order demo is unavailable. Open the DataGrid guide below.")),
            e("div", { class: "landing-demo-caption" }, e("p", {}, "Double-click to edit. Filter a column. Group by destination. Watch totals update."),
                e("a", { href: "?!=/components/datagrid/editing" }, "Explore DataGrid ↗")));

        const directions = e("section", { id: "capabilities", ui: ["section", "container"] },
            heading("ONE TOOLKIT. DIFFERENT POSSIBILITIES.", "Make it yours. From the surface down.", "Choose the building blocks you need, without giving every project the same look."),
            e("div", { class: "landing-directions", "data-elg-reveal": "fade-up" }, ...[
                ["01", "ri-layout-masonry-line", "Websites", "Responsive layouts, fluid type, gradients and considered motion. Build a visual identity, not just a page.", "?!=/styles/websites", "Compose a website"],
                ["02", "ri-input-method-line", "Applications", "Text and number inputs, lookups, calendars, menus and popovers. Small controls that work together.", "?!=/components/value-editors", "Explore the editors"],
                ["03", "ri-database-2-line", "Data interfaces", "Virtualized grids, grouping, summaries and editing. Connect local arrays, transactional tables or your own source.", "?!=/data/data-source/overview", "Connect your data"]
            ].map(([number, glyph, title, description, href, action]) => e("article", {},
                e("div", { class: "landing-direction-number" }, icon(glyph), e("span", {}, number)),
                e("h3", {}, title), e("p", {}, description), e("a", { href }, action, " →")))));

        const feedback = e("p", { class: "landing-form-feedback", role: "status" }, "Try a field. Changes stay in this page.");
        const values = { customer: "Northwind Studio", product: 1, quantity: 2, date: "2026-10-28" as string | null, priority: true };
        const accept = (key: keyof typeof values, value: unknown) => {
            Object.assign(values, { [key]: value });
            feedback.textContent = `${key === "product" ? "Product" : key.charAt(0).toUpperCase() + key.slice(1)} updated · local demo only`;
        };
        const products = [{ id: 1, name: "Studio headphones" }, { id: 2, name: "Wireless keyboard" }, { id: 3, name: "Desk lamp" }];
        const customer = new TextEditor({ value: values.customer, label: "Customer", onCommit: value => accept("customer", value) });
        const product = new LookupEditor({ value: values.product, label: "Product",
            columns: [{ name: "name", caption: "Product" }],
            loadItems: async ({ search, skip = 0, top = 50 }) => {
                const matches = products.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
                return { items: matches.slice(skip, skip + top), totalCount: matches.length };
            }, getItemValue: item => item.id, getItemText: item => item.name,
            getValueText: id => products.find(item => item.id === id)?.name ?? "",
            onCommit: value => accept("product", value) });
        const quantity = new NumberEditor({ value: values.quantity, label: "Quantity",
            validate: value => value === null || !Number.isInteger(value) || value <= 0 ? "Enter a positive whole quantity." : undefined,
            onCommit: value => accept("quantity", value) });
        const date = new DateEditor({ value: values.date, label: "Delivery date", dateFormat: "dd.MM.yyyy", onCommit: value => accept("date", value) });
        const priority = new ToggleEditor({ value: values.priority, label: "Priority delivery", onCommit: value => accept("priority", value) });
        const form = cdiv({ className: "landing-form" }, e("div", { class: "landing-form-title" }, icon("ri-shopping-bag-3-line"), e("strong", {}, "A little order form"), e("span", {}, "LIVE")));
        const fields = cdiv({ className: "landing-fields", ui: ["grid", "gap-3"] });
        for (const [label, editor] of [["Customer", customer], ["Product", product], ["Quantity", quantity], ["Delivery date", date]] as const) {
            fields.append(cdiv({ className: "landing-field", ui: ["col-12", "col-sm-6"] }, e("span", {}, label), editor));
        }
        form.append([fields, cdiv({ className: "landing-priority" }, e("span", {}, "Priority delivery"), priority), feedback]);
        const applications = c("section", { id: "examples", className: "landing-application-section", ui: ["container", "section"] },
            e("div", {}, heading("SMALL CONTROLS. REAL BEHAVIOUR.", "The details make the interface.", "Open a lookup. Pick a date. Change a quantity. These are the same editors used inside the grid, ready for ordinary forms."),
                link("Meet the value editors", "?!=/components/value-editors", true)), form);

        const websites = e("section", { class: "landing-websites", ui: ["section", "container"] },
            e("a", { href: "./forma.html", class: "landing-forma", ariaLabel: "Open the Forma website demo" },
                e("div", { class: "landing-forma-bar" }, e("strong", {}, "forma"), e("span", {}, "A fictional product. A real website.")),
                e("div", { class: "landing-forma-art", ui: ["gradient-mesh"] },
                    e("span", { class: "landing-forma-orbit", ariaHidden: "true" }),
                    e("p", {}, "A little space.", e("br"), e("em", {}, "For big things.")), e("span", { class: "landing-forma-cta" }, "Find your flow ↗"))),
            e("div", {}, heading("BEYOND THE WORKSPACE", "Give your ideas a different canvas.", "A shared toolkit doesn't mean a shared appearance. Forma combines layouts, typography, gradients and scroll reveals into a completely different kind of interface."),
                link("Explore Forma", "./forma.html"), e("a", { href: "?!=/styles/websites", class: "landing-text-link" }, "See how it is built →")));

        const principles = e("section", { class: "landing-foundations", ui: ["section", "container"] },
            heading("A FOUNDATION YOU CAN FOLLOW", "Browser-native. Deliberately explicit.", "Build with the platform, keep ownership clear, and make the moving parts visible."),
            e("div", { class: "landing-principles" }, ...[
                ["Native elements", "Create real DOM with e(). Add component ownership and lifecycle with c()."],
                ["Focused reactivity", "Observable state and keyed VNodes update the parts that change, through the UI scheduler."],
                ["Clear ownership", "Components own their listeners, observers and children. dispose() releases their resources."],
                ["A shared visual language", "Semantic tokens and composable CSS connect your layouts, controls and light/dark themes."]
            ].map(([title, description]) => e("div", {}, e("h3", {}, title), e("p", {}, description)))));
        const source = `import { cbutton } from "elgora-ui";

const button = cbutton({
    ui: ["elg", "btn", "primary"],
    onclick: () => console.log("Hello, Elgora UI")
}, "Make something");

button.mount(document.body);`;
        const start = e("section", { class: "landing-start", ui: ["section", "container"] },
            e("div", {}, heading("START WITH SOMETHING SMALL", "A button today. Your next idea tomorrow.", "A few lines to begin. Components, data and layouts when you need more."),
                link("Read the quick start", "?!=/getting-started/quick-start"),
                e("p", { class: "landing-development-note" }, "Elgora UI is in active development. APIs may change; the demos show the current implementation.")),
            e("pre", { class: "landing-code" }, e("code", {}, source)));
        const footer = e("footer", { class: "landing-footer", ui: ["container"] }, createDocsBrand(),
            e("p", {}, "Built with Elgora UI. Including this page."),
            e("nav", { ariaLabel: "Footer navigation" }, e("a", { href: "?!=/getting-started/download" }, "Installation"), e("a", { href: "?!=/docs" }, "Documentation")));
        this.append([e("a", { href: "#landing-main", class: "landing-skip" }, "Skip to content"), header,
            c("main", { id: "landing-main" }, hero, dataSection, directions, applications, websites, principles, start), footer]);
        // BrowserRouter handles topic links. These local anchors only scroll this page.
        this.listen(this.dom, "click", event => {
            const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
            if (!anchor) return;
            const target = this.dom.querySelector<HTMLElement>(anchor.getAttribute("href")!);
            if (target) { event.preventDefault(); target.scrollIntoView({ block: "start" }); if (anchor.classList.contains("landing-skip")) { target.tabIndex = -1; target.focus(); } }
        });
        this.addCleanup(new ScrollReveal(this.dom, { root: scrollContainer, threshold: .08, stagger: 55 }));
    }
}
