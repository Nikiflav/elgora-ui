import { Popover } from "../../src/components/popup/popover";
import { button, div, e } from "../../src/core/e";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const anchoredCode = `const button = document.querySelector("button")!;

const popover = new Popover({
    anchorElement: button,
    children: "Popover content",
    placement: "bottom-start"
});

popover.mount(document.body);`;

const pointCode = `target.addEventListener("contextmenu", event => {
    event.preventDefault();
    popover.setPoint(event.clientX, event.clientY);
    popover.show();
});`;

export const popoverTopic: DocumentationTopic = {
    path: "/popover",
    title: "Popover",
    description: "A reusable floating panel based on the native Popover API, with anchor and point positioning.",
    api: ["Popover", "PopoverOptions", "PopoverPoint", "PopoverPlacement", "PopoverCloseMode"],
    examples: [
        {
            title: "Anchored popover",
            description: "Popover positions itself relative to an anchor and uses the browser's top layer.",
            code: anchoredCode,
            createDemo(root) {
                const anchor = button({ className: "elg elg-btn elg-primary" }, "Open popover");
                const popover = new Popover({
                    anchorElement: anchor,
                    placement: "bottom-start",
                    children: div({ ui: ["d-flex", "flex-col", "gap-2"] },
                        e("strong", "Popover content"),
                        e("span", "This panel is positioned relative to the button.")
                    )
                });
                root.appendChild(anchor);
                popover.mount(root);
            }
        },
        {
            title: "Point-based context popover",
            description: "A point-based popover can be used as a custom context menu.",
            code: pointCode,
            createDemo(root) {
                const target = div({
                    ui: ["p-4", "border", "border-dashed", "rounded-1", "user-select-none"]
                }, "Right-click here");
                const popover = new Popover({
                    point: { x: 0, y: 0 },
                    placement: "bottom-start",
                    children: "Context popover"
                });
                target.addEventListener("contextmenu", event => {
                    event.preventDefault();
                    popover.setPoint(event.clientX, event.clientY);
                    popover.show();
                });
                root.appendChild(target);
                popover.mount(root);
            }
        }
    ]
};

export const popoverRouterHandler = {
    path: popoverTopic.path,
    createPage() {
        const page = new TopicPage(popoverTopic);
        return {
            title: popoverTopic.title,
            description: popoverTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
