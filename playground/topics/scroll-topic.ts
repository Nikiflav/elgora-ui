import { ScrollEngine } from "../../src/components/scrollbar/scroll-engine";
import { cbutton } from "../../src/core/c";
import { div, e } from "../../src/core/e";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const basicCode = `const viewport = div({
    style: { width: "420px", height: "220px" }
});

const scroller = new ScrollEngine(viewport);
scroller.updateDimensions(1200, 900);
scroller.scrollTo(240, 180);`;

const eventsCode = `const scroller = new ScrollEngine(viewport);

scroller.onScroll(() => {
    console.log(scroller.scrollLeft, scroller.scrollTop);
});

scroller.onResize(() => {
    // Recalculate dependent layout when the viewport changes.
});`;

const imageCode = `const image = e("img", {
    src: "large-image.jpg",
    alt: "Scrollable image",
    style: { maxWidth: "none", display: "block" }
});

const viewport = div({
    style: { width: "500px", height: "300px" }
}, image);
const scroller = new ScrollEngine(viewport);

image.onload = () => {
    scroller.updateDimensions(image.naturalWidth, image.naturalHeight);
};

scroller.onScroll(() => {
    image.style.transform =
        \`translate(-\${scroller.scrollLeft}px, -\${scroller.scrollTop}px)\`;
});`;

function createViewport(): { viewport: HTMLDivElement; content: HTMLDivElement } {
    const content = div({
        className: "elg",
        style: {
            width: "1200px",
            height: "900px",
            padding: "16px",
            background: "linear-gradient(135deg, var(--elg-surface-color-2), var(--elg-surface-color-3))"
        }
    }, e("strong", { className: "elg" }, "Virtual scroll space 1200 × 900"));
    const viewport = div({
        className: "elg",
        style: { width: "420px", height: "220px", border: "1px solid var(--elg-border-color)" }
    }, content);
    return { viewport, content };
}

export const scrollTopic: DocumentationTopic = {
    path: "/scroll",
    title: "Scroll Engine",
    description: "A custom scroll engine for virtual dimensions, large scroll ranges, keyboard input, pointer dragging, and touch inertia.",
    api: ["ScrollEngine"],
    examples: [
        {
            title: "Programmatic scrolling",
            description: "Create an engine around a viewport, provide its virtual dimensions, and control its position with scrollTo().",
            code: basicCode,
            createDemo(root) {
                const { viewport } = createViewport();
                root.appendChild(viewport);
                const scroller = new ScrollEngine(viewport);
                scroller.updateDimensions(1200, 900);
                root.appendChild(cbutton({
                    ui: ["elg", "btn", "primary", "mt-2"],
                    onclick: () => scroller.scrollTo(240, 180)
                }, "Scroll to 240 × 180").dom);
            }
        },
        {
            title: "Scroll and resize events",
            description: "Observe virtual coordinates and respond when the viewport dimensions change.",
            code: eventsCode,
            createDemo(root) {
                const { viewport } = createViewport();
                const output = e("span", { className: "elg text-muted" }, "Scroll position: 0 × 0");
                root.append(viewport, output);
                const scroller = new ScrollEngine(viewport);
                scroller.updateDimensions(1200, 900);
                scroller.onScroll(() => {
                    output.textContent = `Scroll position: ${Math.round(scroller.scrollLeft)} × ${Math.round(scroller.scrollTop)}`;
                });
            }
        },
        {
            title: "Large image",
            description: "The engine can scroll a large image while keeping the browser's physical scroll range within safe limits.",
            code: imageCode,
            createDemo(root) {
                const image = e("img", {
                    src: "https://images.pexels.com/photos/37375886/pexels-photo-37375886.jpeg",
                    alt: "Large scrollable landscape",
                    className: "elg",
                    style: { display: "block", maxWidth: "none" }
                });
                const viewport = div({
                    className: "elg",
                    style: { width: "500px", height: "300px", border: "1px solid var(--elg-border-color)" }
                }, image);
                root.appendChild(viewport);
                const scroller = new ScrollEngine(viewport);
                scroller.onScroll(() => {
                    image.style.transform = `translate(-${scroller.scrollLeft}px, -${scroller.scrollTop}px)`;
                });
                image.addEventListener("load", () => {
                    scroller.updateDimensions(image.naturalWidth, image.naturalHeight);
                });
                if (image.complete && image.naturalWidth > 0) {
                    scroller.updateDimensions(image.naturalWidth, image.naturalHeight);
                }
            }
        }
    ]
};

export const scrollRouterHandler = {
    path: scrollTopic.path,
    createPage() {
        const page = new TopicPage(scrollTopic);
        return {
            title: scrollTopic.title,
            description: scrollTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
