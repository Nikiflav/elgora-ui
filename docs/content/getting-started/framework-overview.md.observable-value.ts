import { Component, ObservableValue } from "../../../src/index";
import { cdiv, cbutton } from "../../../src/core/c";

export default function demo(): void {
    const count = new ObservableValue(0);
    const output = new Component({ tag: "strong", ui: ["elg"], children: "Value: 0" });
    const increment = cbutton({ ui: ["elg", "btn", "primary"] }, "Increment");
    output.bindProperty("textContent", count, value => "Value: " + value);
    increment.dom.addEventListener("click", () => count.Value++);
    const content = cdiv({ ui: ["elg", "surface", "box", "p-3", "d-flex", "items-center", "gap-2"] }, output, increment);
    content.mount(document.body);
}


