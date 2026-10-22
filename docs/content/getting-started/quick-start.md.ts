import { cdiv, cbutton, e } from "../../../src/index";

/** The guide example; return its owner for lifecycle tests. */
export default function demo() {
    const app = cdiv({
        ui: ["elg", "surface", "box", "p-3", "m-3", "d-flex", "flex-col", "gap-2"]
    });
    const count = app.observable(0);
    const button = cbutton({
        ui: ["elg", "btn", "primary"],
        style: { alignSelf: "flex-start" },
        onclick: () => count.Value++
    });
    button.bindProperty("textContent", count, value => "Clicked " + value + " times");
    
    app.append([
        e("h2", { ui: ["m-0"] }, "Hello, Elgora UI"),
        e("p", { ui: ["m-0", "text-muted"] }, "A native DOM interface with reactive state."),
        button
    ]);
    app.mount(document.body);
    return app;
}
