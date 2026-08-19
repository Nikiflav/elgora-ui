import { cbutton, cdiv } from "../../src/core/c";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const semanticCode = `cbutton({ ui: ["elg", "btn", "primary"] }, "Primary");
cbutton({ ui: ["elg", "btn", "accent"] }, "Accent");
cbutton({ ui: ["elg", "btn", "success"] }, "Success");
cbutton({ ui: ["elg", "btn", "warning"] }, "Warning");
cbutton({ ui: ["elg", "btn", "danger"] }, "Danger");
cbutton({ ui: ["elg", "btn", "neutral"] }, "Neutral");`;

const stateCode = `cbutton({ ui: ["elg", "btn", "primary", "selected"] }, "Selected");
cbutton({ ui: ["elg", "btn", "primary", "active"] }, "Active");
cbutton({ ui: ["elg", "btn", "primary", "hover"] }, "Hover");
cbutton({ ui: ["elg", "btn", "primary", "focus"] }, "Focus");
cbutton({ ui: ["elg", "btn", "primary"], disabled: true }, "Disabled");`;

const interactionCode = `cbutton({
    ui: ["elg", "btn", "primary"],
    children: "Click me",
    onclick: () => {
        // handle the action
    }
});`;

export const buttonTopic: DocumentationTopic = {
    path: "/btn",
    title: "Button",
    description: "Semantic, stateful buttons built from standard HTML controls and Elgora UI utility classes.",
    api: [],
    examples: [
        {
            title: "Semantic variants",
            description: "Use a semantic color class to communicate the purpose or state of an action.",
            code: semanticCode,
            createDemo(root) {
                const group = cdiv({ ui: ["d-flex", "flex-wrap", "gap-2"] },
                    cbutton({ ui: ["elg", "btn", "primary"] }, "Primary"),
                    cbutton({ ui: ["elg", "btn", "accent"] }, "Accent"),
                    cbutton({ ui: ["elg", "btn", "success"] }, "Success"),
                    cbutton({ ui: ["elg", "btn", "warning"] }, "Warning"),
                    cbutton({ ui: ["elg", "btn", "danger"] }, "Danger"),
                    cbutton({ ui: ["elg", "btn", "neutral"] }, "Neutral")
                );
                root.appendChild(group.dom);
            }
        },
        {
            title: "States",
            description: "State utility classes are useful for documenting or previewing persistent interaction states.",
            code: stateCode,
            createDemo(root) {
                const group = cdiv({ ui: ["d-flex", "flex-wrap", "gap-2"] },
                    cbutton({ ui: ["elg", "btn", "primary", "selected"] }, "Selected"),
                    cbutton({ ui: ["elg", "btn", "primary", "active"] }, "Active"),
                    cbutton({ ui: ["elg", "btn", "primary", "hover"] }, "Hover"),
                    cbutton({ ui: ["elg", "btn", "primary", "focus"] }, "Focus"),
                    cbutton({ ui: ["elg", "btn", "primary"], disabled: true }, "Disabled")
                );
                root.appendChild(group.dom);
            }
        },
        {
            title: "Interactive button",
            description: "Buttons are ordinary controls, so standard event handlers can be attached directly.",
            code: interactionCode,
            createDemo(root) {
                let count = 0;
                const control = cbutton({
                    ui: ["elg", "btn", "primary"],
                    onclick: (_event, component) => {
                        count++;
                        component.dom.textContent = `Clicked ${count} times`;
                    }
                }, "Clicked 0 times");
                root.appendChild(control.dom);
            }
        }
    ]
};

export const buttonRouterHandler = {
    path: buttonTopic.path,
    createPage() {
        const page = new TopicPage(buttonTopic);
        return {
            title: buttonTopic.title,
            description: buttonTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
