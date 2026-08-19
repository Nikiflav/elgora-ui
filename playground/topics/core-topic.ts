import { ElgoraUI } from "../../src/core/ElgoraUI";
import { e } from "../../src/core/e";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const schedulerCode = `const update = () => {
    // batch DOM work into the next animation frame
};

ElgoraUI.scheduler.schedule(update);`;

const elementCode = `const heading = e("h2", {
    className: "elg",
    title: "Generated with e()"
}, "Hello Elgora UI");

document.body.append(heading);`;

const uiCode = `const panel = e("div", {
    ui: ["elg", "surface", "p-3", "d-flex", "gap-2"]
}, "Utility styles become elg-* classes");`;

export const coreTopic: DocumentationTopic = {
    path: "/core",
    title: "Core",
    description: "The small runtime layer behind Elgora UI: scheduling, observable state, typed DOM helpers, VNodes, and utility styles.",
    api: ["ElgoraUI", "Scheduler", "Observable", "ObservableValue", "ObservableEvent", "e", "v", "UiStyle"],
    examples: [
        {
            title: "Frame-batched scheduler",
            description: "Schedule work through ElgoraUI.scheduler to deduplicate tasks and run them in the next animation frame.",
            code: schedulerCode,
            createDemo(root) {
                const output = e("span", { className: "elg" }, "Waiting for a scheduled task…");
                root.appendChild(output);
                ElgoraUI.scheduler.schedule(() => {
                    output.textContent = "Scheduled in the next animation frame.";
                });
            }
        },
        {
            title: "Typed element helper",
            description: "e() creates a native HTML element, applies typed properties, and appends children.",
            code: elementCode,
            createDemo(root) {
                root.appendChild(e("strong", { className: "elg" }, "Created with e()"));
            }
        },
        {
            title: "UI utility styles",
            description: "The ui property maps typed utility names to elg-* classes. Include elg as the base class for theme rendering.",
            code: uiCode,
            createDemo(root) {
                root.appendChild(e("div", {
                    ui: ["elg", "surface", "p-3", "d-flex", "gap-2"]
                }, "Utility styles become elg-* classes."));
            }
        }
    ]
};

export const coreRouterHandler = {
    path: coreTopic.path,
    createPage() {
        const page = new TopicPage(coreTopic);
        return {
            title: coreTopic.title,
            description: coreTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
