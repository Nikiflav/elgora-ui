import { BrowserRouter, RouterHandler } from '../src/components/browser-router/BrowserRouter';
import { ScrollEngine } from '../src/components/scrollbar/scroll-engine';
import { VirtualList } from '../src/components/virtual-list/VirtualList';
import { c, cbutton, cdiv } from '../src/core/c';
import { a, div, e, nav } from '../src/core/e';
import { dataGridRouterHandler } from './data-grid-demo';
import { dataGridTreeRouterHandler } from './data-grid-tree-demo';
import { popupRouterHandler } from './popup-demo';

const routes: RouterHandler[] = [

    // Data Grid - Tree
    dataGridTreeRouterHandler,

    // Data Grid
    dataGridRouterHandler,

    // Popup Demo
    popupRouterHandler,


    // Simple Button Demo
    {
        path: '/btn',
        createPage(urlParams) {
            return {
                title: 'Button',
                description: 'Learn more about buttons',
                dom: div({ ui: ["p-4"] },
                    div({ ui: ["elg", "box", "p-2"] },
                        cbutton({
                            ui: ["elg", "btn", "primary"],
                            comcreate(com) {
                                com.state = { count: com.observable(0) };
                                com.renderOnChange(com.state.count, () => com.dom.textContent = `Clicked ${com.state.count} times`)
                            },
                            onclick(e, com) {
                                com.state.count.Value++;
                            }
                        })
                    ),
                    div({ ui: ["elg", "box", "mt-3"] },
                        div({ ui: ["px-4", "py-2", "border-1", "border-bottom", "fs-150", "fw-500"] },
                            "Box test"),
                        div({ ui: ["p-4"] },
                            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.")
                    )
                ),
            };
        }
    },
    // Virtual List Demo
    {
        path: '/virtual-list',
        createPage(urlParams) {
            return {
                title: 'Virtual List',
                description: 'Learn more about virtual lists',
                dom: e('div', { ui: ["h-100", "d-flex", "flex-col", "box"] }),
                async init() {
                    const rowCount = 100000;

                    const data = Array.from({ length: rowCount }, (_, i) => ({
                        id: i,
                        name: "Row " + i,
                        value: Math.random()
                    }))

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

                    virtualList.mount(this.dom);
                }
            };
        }
    },
    // ScrollEngine Demo
    {
        path: '/scroll',
        createPage(urlParams) {
            const scroller = new ScrollEngine(div({
                style: { width: '500px', height: '500px', border: "1px solid black" },
            }, e("img", {
                src: "https://images.pexels.com/photos/37375886/pexels-photo-37375886.jpeg",
                onload: (e, img) => {
                    scroller.updateDimensions(img.naturalWidth, img.naturalHeight);
                    scroller.onScroll(() => {
                        img.style.transform = `translate(-${scroller.scrollLeft}px, -${scroller.scrollTop}px)`;
                    })
                }
            })));

            return {
                title: 'Scroll Engine',
                description: 'Welcome to the Scroll Engine demo page',
                dom: scroller.dom
            };
        }
    },
    // Home - fallback page
    {
        path: '/',
        createPage(urlParams) {
            return {
                title: 'Elgora UI Demo',
                description: 'Welcome to the Elgora UI demo page',
                dom: div(
                    {
                        class: 'home-page',
                        ui: ["elg", "box"],
                        style: { padding: '20px' }
                    },
                    "Welcome to the Elgora UI demo page. Use the links on the left to navigate through different components and features of Elgora UI."
                ),
            };
        }
    },
];

const router = new BrowserRouter(routes);

// Main layout container.
const app = cdiv(
    { ui: ["d-flex", "h-100", "gap-1"] },
    // Sidebar
    nav(
        {
            ui: ["elg", "surface", "flex-none", "p-4",
                "border-end", "d-flex", "flex-col", "gap-1"]
        },
        a({ href: "?!=/" }, "Home"),
        a({ href: "?!=/btn" }, "Button"),
        a({ href: "?!=/scroll" }, "Scroll Engine"),
        a({ href: "?!=/virtual-list" }, "Virtual List"),
        a({ href: "?!=/data-grid" }, "Data Grid"),
        a({ href: "?!=/data-grid-tree" }, "Data Grid - Tree"),        
        a({ href: "?!=/popup" }, "Popup"),
    ),
    // Page Content
    div({ ui: ["grow-1", "d-flex", "p-4" ] },
        router)
)

app.mount(document.getElementById('app')!);