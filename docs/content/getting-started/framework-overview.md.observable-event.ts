import { ObservableEvent } from "../../../src/index";
import { cdiv, cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
    const clicked = new ObservableEvent<string>();
    const output = e("span", { ui: ["elg", "text-muted"] }, "No event yet");
    const emit = cbutton({ ui: ["elg", "btn", "accent"] }, "Emit event");
    let eventNumber = 0;
    clicked.subscribe(payload => output.textContent = payload + " (" + (++eventNumber) + ")");
    emit.dom.addEventListener("click", () => clicked.invoke("A user action happened"));
    const content = cdiv({ ui: ["elg", "surface", "box", "p-3", "d-flex", "items-center", "gap-2"] }, emit, output);
    content.mount(document.body);
}


