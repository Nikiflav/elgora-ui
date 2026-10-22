import { cdiv, e, v, setElementProps, ScrollReveal, type Component } from "../../src/index";
import "./forma.css";

/** Mounts the fictional product showcase; the returned component owns state, observers and listeners. */
export function mountForma(host: HTMLElement): Component {
    const root = cdiv({ className: "forma" });
    const view = root.observable<"board" | "list">("board");
    const completed = root.observable<readonly string[]>([]);
    const previousTheme = document.documentElement.getAttribute("data-theme");
    let changedTheme = false;
    const icon = (name: string) => e("i", { class: name, ariaHidden: "true" });
    const link = (text: string, href: string, secondary = false) => e("a", {
        href, class: `forma-button${secondary ? " forma-button-secondary" : ""}`
    }, text, icon("ri-arrow-right-line"));
    const sectionHead = (eyebrow: string, title: string, description: string) => e("div", {
        class: "forma-section-head", "data-elg-reveal": "fade-up"
    }, e("p", { ui: ["eyebrow"] }, eyebrow), e("h2", { ui: ["title-section"] }, title),
        e("p", { ui: ["lead", "text-muted"] }, description));
    const section = (id: string, ...children: HTMLElement[]) => e("section", { id, ui: ["section"] },
        e("div", { ui: ["container"] }, ...children));
    const avatars = () => e("div", { class: "forma-avatars", ariaLabel: "Three fictional collaborators" },
        ...["AL", "JM", "SK"].map(name => e("span", { class: "forma-avatar" }, name)));

    const boardHost = e("div", { class: "forma-board", ariaLabel: "Interactive sample project" });
    const notes = [
        { id: "light", title: "Chasing the afternoon light", text: "Moodboard · 8 ideas", art: "landscape", task: "Choose the location" },
        { id: "notes", title: "Make something meaningful", text: "Direction · 3 references", art: "poster", task: "Share the first draft" },
        { id: "shape", title: "Room for a different angle", text: "Exploration · 6 sketches", art: "shapes", task: "Pick a colour palette" }
    ];
    const renderBoard = () => setElementProps(boardHost, {
        class: `forma-board${view.Value === "list" ? " is-list" : ""}`,
        vnodes: notes.map(note => v("article", { key: note.id, class: "forma-note" },
            v("div", { class: `forma-art forma-art-${note.art}`, ariaHidden: "true" }),
            v("div", {}, v("h4", note.title), v("p", note.text)),
            v("button", { type: "button", class: "forma-task", ariaPressed: String(completed.Value.includes(note.id)),
                onclick: () => { completed.Value = completed.Value.includes(note.id)
                    ? completed.Value.filter(id => id !== note.id) : [...completed.Value, note.id]; }
            }, v("i", { class: completed.Value.includes(note.id) ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line", ariaHidden: "true" }), note.task)))
    });
    const boardButton = e("button", { type: "button", ariaPressed: "true", onclick: () => { view.Value = "board"; } }, "Board");
    const listButton = e("button", { type: "button", ariaPressed: "false", onclick: () => { view.Value = "list"; } }, "List");
    root.renderOnChange(view, () => {
        boardButton.setAttribute("aria-pressed", String(view.Value === "board"));
        listButton.setAttribute("aria-pressed", String(view.Value === "list"));
        renderBoard();
    });
    root.renderOnChange(completed, renderBoard);

    const workspace = e("div", { id: "workspace", class: "forma-workspace-wrap", "data-elg-reveal": "fade-up" },
        e("div", { class: "forma-workspace" },
            e("aside", { class: "forma-sidebar", ariaLabel: "Sample workspace" },
                e("span", { class: "forma-logo" }, e("span", { class: "forma-logo-mark" }), "forma"),
                e("div", { class: "forma-side-item" }, icon("ri-home-5-line"), "Studio home"),
                e("div", { class: "forma-side-item" }, icon("ri-inbox-line"), "All your ideas"),
                e("p", { class: "forma-side-label" }, "YOUR PROJECTS"),
                e("div", { class: "forma-side-item forma-side-active" }, icon("ri-layout-masonry-line"), "A slower kind of Sunday"),
                e("div", { class: "forma-side-item" }, icon("ri-music-2-line"), "Summer sessions"),
                e("div", { class: "forma-side-item" }, icon("ri-shapes-line"), "The little rebrand")),
            e("div", { class: "forma-workspace-main" },
                e("div", { class: "forma-workspace-title" }, e("h3", {}, "A slower kind of Sunday"), avatars()),
                e("p", { class: "forma-workspace-subtitle" }, "A shared space for our next creative adventure."),
                e("div", { class: "forma-view-controls", role: "group", ariaLabel: "Project view" }, boardButton, listButton), boardHost)));

    const features = e("div", { ui: ["grid", "gap-3"] },
        e("article", { class: "forma-feature forma-feature-wide", ui: ["col-md-7"], "data-elg-reveal": "fade-up" },
            e("span", { class: "forma-feature-icon" }, icon("ri-lightbulb-line")), e("h3", {}, "Catch the idea. Keep the feeling."),
            e("p", {}, "A passing thought, a palette, a reference you love. Give the little things a place to become something bigger."),
            e("div", { class: "forma-mini-notes", ariaHidden: "true" },
                e("div", { class: "forma-mini-note" }, "What if we tried something a little softer?"),
                e("div", { class: "forma-mini-note" }, "Less noise. More possibilities."))),
        e("article", { class: "forma-feature", ui: ["col-md-5"], "data-elg-reveal": "fade-up" },
            e("span", { class: "forma-feature-icon" }, icon("ri-group-line")), e("h3", {}, "Good things happen together."),
            e("p", {}, "Bring your favourite people into the process. Share a direction, collect feedback, and keep everyone in the picture."),
            e("div", { ui: ["mt-4"] }, avatars()),
            e("p", { ui: ["fs-80"] }, "One shared canvas. Plenty of room for you.")));
    const steps = e("div", { ui: ["grid", "gap-4"] }, ...[
        ["01", "Start with a spark", "Create a space for the project on your mind. No perfect plan required."],
        ["02", "Find your direction", "Collect references, connect the dots, and invite another point of view."],
        ["03", "Make it happen", "Turn the next step into a small, doable task. Then celebrate the progress."]
    ].map(([number, title, text]) => e("article", { class: "forma-step", ui: ["col-md-4"], "data-elg-reveal": "fade-up" },
        e("span", { class: "forma-step-number" }, number), e("h3", {}, title), e("p", {}, text))));
    const projects = e("div", { ui: ["grid", "gap-3"] }, ...[
        ["landscape", "A slower kind of Sunday", "Photography · Find beauty in the everyday"],
        ["poster", "Field notes", "Print & editorial · A story worth keeping"],
        ["shapes", "The little rebrand", "Design · A fresh point of view"]
    ].map(([art, title, text]) => e("article", { class: "forma-project", ui: ["col-md-4"], "data-elg-reveal": "fade-up" },
        e("div", { class: `forma-art forma-art-${art}`, ariaHidden: "true" }), e("h3", {}, title), e("p", {}, text))));
    const faq = e("div", { class: "forma-faq", "data-elg-reveal": "fade" }, ...[
        ["Is Forma a real product?", "No. Forma is a fictional product created to demonstrate Elgora UI. The workspace, people and projects are sample content."],
        ["Can I interact with the workspace?", "Yes. Switch between Board and List and check off a few tasks. Changes live only in this page and reset when it reloads."],
        ["How are the visuals and animations made?", "The preview uses real elements, keyed VNodes and observable state. The illustrations are CSS, and ScrollReveal starts the entrance animations."]
    ].map(([question, answer]) => e("details", {},
        e("summary", {}, e("span", {}, question),
            e("i", { class: "ri-arrow-down-s-line", ui: ["rotate-on-open"], ariaHidden: "true" })),
        e("p", {}, answer))));

    root.append([
        e("a", { href: "#forma-main", class: "forma-skip" }, "Skip to content"),
        e("div", { class: "forma-demo-notice" }, "A fictional product. A real Elgora UI website demo."),
        e("header", { class: "forma-header elg-container elg-d-flex elg-items-center elg-justify-between elg-gap-2" },
            e("a", { href: "#forma-main", class: "forma-logo", ariaLabel: "Forma home" }, e("span", { class: "forma-logo-mark", ariaHidden: "true" }), "forma"),
            e("nav", { class: "forma-nav-links", ariaLabel: "Main navigation" },
                e("a", { href: "#features" }, "A little more"), e("a", { href: "#how-it-works" }, "How it works"), e("a", { href: "#projects", class: "forma-nav-extra" }, "Inspiration")),
            e("div", { ui: ["d-flex", "items-center", "gap-2"] },
                e("button", { type: "button", class: "forma-theme", ariaLabel: "Toggle light and dark theme", onclick: () => {
                    changedTheme = true;
                    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
                } }, icon("ri-contrast-2-line")),
                e("a", { href: "#workspace", class: "forma-button forma-button-small forma-nav-extra" }, "Explore the demo", icon("ri-arrow-right-line")))),
        e("main", { id: "forma-main" },
            e("section", { class: "forma-hero elg-gradient-mesh" }, e("div", { ui: ["container"] },
                e("div", { "data-elg-reveal": "fade-up" },
                    e("span", { class: "forma-badge" }, e("span", { class: "forma-badge-dot" }), "A home for your next good idea"),
                    e("h1", { ui: ["title-display"] }, "A little space.", e("br"), "For ", e("em", {}, "big things.")),
                    e("p", { ui: ["lead", "text-muted"] }, "Bring your ideas, people, and next steps together. A calmer place to make something that matters."),
                    e("div", { ui: ["d-flex", "justify-center", "flex-wrap", "gap-2"] }, link("Find your flow", "#workspace"), link("Take a look around", "#features", true)),
                    e("p", { class: "forma-hero-note elg-text-muted" }, "No sign-up. Just a little inspiration.")), workspace)),
            e("div", { class: "forma-proof elg-container" }, e("p", {}, "FOR THE PEOPLE WHO CAN’T HELP MAKING THINGS"),
                e("div", { class: "forma-proof-roles" }, e("span", {}, "Independent minds"), e("span", {}, "Small studios"), e("span", {}, "Creative collectives"))),
            section("features", sectionHead("Less scattered. More connected.", "Room for the messy middle.", "Not everything starts with a plan. Build a space that moves with the way you think."), features),
            section("how-it-works", sectionHead("From what if to what's next", "A simple rhythm for good work.", "A little structure, without getting in the way."), steps),
            section("projects", sectionHead("Made of possibilities", "Different projects. Same spark.", "A few fictional projects to get your imagination going."), projects),
            section("questions", sectionHead("A few small details", "Curious? Start here.", "What this demo does — and what it doesn't."), faq),
            section("get-started", e("div", { class: "forma-cta elg-gradient-mesh", "data-elg-reveal": "fade-up" },
                e("p", { ui: ["eyebrow", "mb-3"] }, "Less busywork. More possibility."),
                e("h2", { ui: ["title-section"] }, "Make room for your ", e("em", {}, "next idea.")),
                e("p", {}, "Start small, bring someone along, and see where the good ideas take you."), link("Explore the workspace", "#workspace")))),
        e("footer", { class: "forma-footer" }, e("div", { ui: ["container", "d-flex", "justify-between", "flex-wrap", "gap-3"] },
            e("span", {}, "forma · A little space for big things."), e("span", {}, "Fictional product. Built with Elgora UI.")))
    ]);
    root.mount(host);
    root.addCleanup(new ScrollReveal(root.dom, { stagger: 65 }));
    root.listen(window, "pagehide", () => root.dispose());
    root.addCleanup(() => {
        if (changedTheme) {
            if (previousTheme === null) document.documentElement.removeAttribute("data-theme");
            else document.documentElement.setAttribute("data-theme", previousTheme);
        }
    });
    return root;
}
