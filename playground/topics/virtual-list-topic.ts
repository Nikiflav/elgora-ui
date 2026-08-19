import { VirtualList } from "../../src/components/virtual-list/VirtualList";
import { div, e } from "../../src/core/e";
import { DocumentationTopic } from "../docs/types";
import { TopicPage } from "../docs/TopicPage";

const exactExampleCode = `const rowCount = 100000;

const data = Array.from({ length: rowCount }, (_, i) => ({
    id: i,
    name: "Row " + i,
    value: Math.random()
}));

const virtualList = new VirtualList({
    data: {
        getAt(index) {
            return data[index];
        },
        count() {
            return data.length;
        }
    },
    renderRow: ({ rowElement: el, data, index }) => {
        el.style.padding = "10px";
        el.innerText = data.name;
        el.style.background = index % 2 === 0 ? "#ede" : "#fefede";
        el.style.height = data.value * 300 + 30 + "px";
    }
});

virtualList.mount(document.body);`;

export const virtualListTopic: DocumentationTopic = {
    path: "/virtual-list",
    title: "Virtual List",
    description: "Efficiently render very large collections by keeping only the visible rows in the DOM.",
    api: ["VirtualList", "VirtualListOptions", "DataList", "RenderRowArgs", "SizeManager", "VariableSizeManager", "FixedSizeManager"],
    examples: [
        {
            title: "100,000 variable-height rows",
            description: "This is the original Virtual List example: 100,000 generated rows with random heights and only the visible rows rendered.",
            code: exactExampleCode,
            createDemo(root) {
                const host = div({
                    ui: ["elg", "box"],
                    style: { width: "100%", height: "420px", minHeight: "420px" }
                });
                root.appendChild(host);

                const rowCount = 100000;

                const data = Array.from({ length: rowCount }, (_, i) => ({
                    id: i,
                    name: "Row " + i,
                    value: Math.random()
                }));

                const virtualList = new VirtualList({
                    data: {
                        getAt(index) {
                            return data[index];
                        },
                        count() {
                            return data.length;
                        }
                    },
                    renderRow: ({ rowElement: el, data, index }) => {
                        el.style.padding = "10px";
                        el.innerText = data.name;
                        el.style.background = index % 2 === 0 ? "#ede" : "#fefede";
                        el.style.height = data.value * 300 + 30 + "px";
                    }
                });

                virtualList.mount(host);
            }
        }
    ]
};

export const virtualListRouterHandler = {
    path: virtualListTopic.path,
    createPage() {
        const page = new TopicPage(virtualListTopic);
        return {
            title: virtualListTopic.title,
            description: virtualListTopic.description,
            dom: page.dom,
            init: () => page.load()
        };
    }
};
