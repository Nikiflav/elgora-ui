import { Component } from "../../../src/core/Component";
import { cdiv, cbutton } from "../../../src/core/c";

export default function demo(): void {
    const owner = new Component();
    const active = owner.observable(false);
    const toggle = cbutton({ ui: ["elg", "btn", "primary"] }, "Toggle state");
    const card = cdiv({ ui: ["elg", "surface", "box", "p-3"] }, toggle);
    card.bindUiStyle("selected", active);
    card.bindAttribute("aria-pressed", active, value => String(value));
    toggle.bindProperty("textContent", active, value => value ? "Deactivate" : "Activate");
    toggle.dom.addEventListener("click", () => active.Value = !active.Value);
    card.mount(document.body);
}


