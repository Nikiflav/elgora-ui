import { Component } from "../../../src/core/Component";
import { cdiv } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
    const component = new Component({
        ui: ["elg", "surface", "box", "p-3", "d-flex", "flex-col", "gap-2"],
        comcreate(com) {
            const theme = com.observable("light");
            com.append([
                e("select", { ui: ["elg", "field"], onchange: event => {
                    document.documentElement.dataset.theme = (event.target as HTMLSelectElement).value === "dark" ? "dark" : "";
                } }, e("option", { value: "light" }, "Light"), e("option", { value: "dark" }, "Dark")),
                cdiv({ ui: ["elg", "d-flex", "gap-2"] },
                    e("strong", { ui: ["elg", "primary", "p-2"] }, "Primary token"),
                    e("span", { ui: ["elg", "accent", "p-2"] }, "Accent token"),
                    e("span", { ui: ["elg", "success", "p-2"] }, "Success token")
                )
            ]);
            com.state = { theme };
        },
        comdispose() { delete document.documentElement.dataset.theme; }
    });
    component.mount(document.body);
}


