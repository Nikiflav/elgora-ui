import { cbutton, cdiv } from "../../src/core/c";
import { Component } from "../../src/core/Component";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const componentCode = `class ClickCounter extends Component {
    constructor() {
        super({
            tag: "button",
            ui: ["elg", "btn", "primary"],
            children: "Clicked 0 times",
            comcreate(component) {
                component.state = { count: component.observable(0) };
                component.renderOnChange(component.state.count, () => {
                    component.dom.textContent =
                        \`Clicked \${component.state.count.Value} times\`;
                });
            },
            onclick: (_event, component) => {
                component.state.count.Value++;
            }
        });
    }
}

new ClickCounter().mount(document.body);`;

const factoryCode = `const panel = cdiv({
    ui: ["elg", "surface", "p-3"]
},
    cbutton({ ui: ["elg", "btn", "primary"] }, "Continue")
);

panel.mount(document.body);`;

export const componentsTopic: DocumentationTopic = {
    path: "/components",
    title: "Components",
    description: "Composable UI components and typed component factories for building reusable browser-native interfaces.",
    api: ["Component", "ComponentOptions", "ComponentChild", "c", "cdiv", "cbutton"],
    examples: [
        {
            title: "Component class",
            description: "Extend Component when a reusable element needs its own state, lifecycle, or behavior. This counter updates through observable state.",
            code: componentCode,
            createDemo(root) {
                const component = new Component({
                    tag: "button",
                    ui: ["elg", "btn", "primary"],
                    children: "Clicked 0 times",
                    comcreate(com) {
                        com.state = { count: com.observable(0) };
                        com.renderOnChange(com.state.count, () => {
                            com.dom.textContent = `Clicked ${com.state.count.Value} times`;
                        });
                    },
                    onclick: (_event, com) => {
                        com.state.count.Value++;
                    }
                });
                root.appendChild(component.dom);
            }
        },
        {
            title: "Typed component factories",
            description: "Use cdiv, cbutton, and the other c* helpers when you want Component instances with typed HTML props.",
            code: factoryCode,
            createDemo(root) {
                const panel = cdiv({ ui: ["elg", "d-flex", "gap-2", "items-center"] },
                    cbutton({ ui: ["elg", "btn", "primary"] }, "Continue"),
                    cbutton({ ui: ["elg", "btn", "neutral"] }, "Cancel")
                );
                root.appendChild(panel.dom);
            }
        }
    ]
};

export const componentsRouterHandler = {
    path: componentsTopic.path,
    createPage() {
        const page = new TopicPage(componentsTopic);
        return {
            title: componentsTopic.title,
            description: componentsTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
