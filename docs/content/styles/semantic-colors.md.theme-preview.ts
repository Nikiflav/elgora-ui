import { Component } from "../../../src/core/Component";
import { e } from "../../../src/core/e";

export default function demo(): void {
    const component = new Component({
        ui: ["elg", "d-flex", "flex-col", "gap-2", "p-3", "surface-2", "rounded-1"],
        comcreate(com) {
            const themes = ["light", "dark"] as const;
            const themeColors = ["primary", "success", "warning", "danger"] as const;
            const currentTheme = com.observable<string>(
                document.documentElement.dataset.theme || "light"
            );

            com.state = { currentTheme };
            com.append([
                e("label", { ui: ["elg", "d-flex", "flex-col", "gap-1"] },
                    "Preview theme",
                    e("select", {
                        ui: ["elg", "field"],
                        value: currentTheme.Value,
                        onchange: event => {
                            currentTheme.Value = (event.target as HTMLSelectElement).value;
                        }
                    }, ...themes.map(theme => e("option", { value: theme }, theme)))
                ),
                e("div", { ui: ["elg", "d-flex", "gap-2", "flex-wrap"] },
                    ...themeColors.map(color =>
                        e("div", { ui: ["elg", color, "p-2", "rounded-1"] }, color)
                    )
                )
            ]);

            com.renderOnChange(currentTheme, () => {
                document.documentElement.dataset.theme = currentTheme.Value;
            });
        },
        comdispose() {
            delete document.documentElement.dataset.theme;
        }
    });
    component.mount(document.body);
}


