import { Tooltip } from "../../src/components/popup/Tooltip";
import { button, div, e } from "../../src/core/e";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const attachCode = `const button = document.querySelector("button")!;

Tooltip.attach(button, "Helpful description", {
    placement: "top",
    delay: 300
});`;

const richCode = `const content = div({ ui: ["elg", "d-flex", "flex-col", "gap-1"] },
    e("strong", { className: "elg" }, "Rich tooltip"),
    e("span", { className: "elg" }, "Tooltip content can be an HTMLElement.")
);

Tooltip.attach(anchor, content, {
    placement: "right"
});`;

export const tooltipTopic: DocumentationTopic = {
    path: "/tooltip",
    title: "Tooltip",
    description: "A universal singleton tooltip for hover and focus descriptions, backed by the reusable Popover component.",
    api: ["Tooltip", "TooltipContent", "TooltipShowOptions"],
    examples: [
        {
            title: "Hover and focus tooltip",
            description: "Tooltip.attach() adds pointer and keyboard focus behavior and returns a cleanup function.",
            code: attachCode,
            createDemo(root) {
                const anchor = button({
                    className: "elg elg-btn elg-primary",
                    title: ""
                }, "Hover or focus me");
                root.appendChild(anchor);
                Tooltip.attach(anchor, "Helpful description", { placement: "top", delay: 300 });
            }
        },
        {
            title: "Rich tooltip content",
            description: "Tooltip content can be a string, HTMLElement, Component, or typed ElementProps object.",
            code: richCode,
            createDemo(root) {
                const anchor = button({ className: "elg elg-btn elg-accent" }, "Show rich tooltip");
                const content = div({ ui: ["elg", "d-flex", "flex-col", "gap-1"] },
                    e("strong", { className: "elg" }, "Rich tooltip"),
                    e("span", { className: "elg" }, "Tooltip content can be an HTMLElement.")
                );
                root.appendChild(anchor);
                Tooltip.attach(anchor, content, { placement: "right" });
            }
        }
    ]
};

export const tooltipRouterHandler = {
    path: tooltipTopic.path,
    createPage() {
        const page = new TopicPage(tooltipTopic);
        return {
            title: tooltipTopic.title,
            description: tooltipTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
