import { Scrollbars, type ScrollbarsInstallation } from "../../../src/components/scrollbar/Scrollbars";
import type { ScrollbarMode } from "../../../src/components/scrollbar/ScrollbarMode";
import { e } from "../../../src/core/e";

export default function demo(): void {
    const mode = e("select", { ui: ["elg", "field"], ariaLabel: "Native scrollbar mode" },
        e("option", { value: "thin" }, "Thin"), e("option", { value: "auto" }, "Auto"), e("option", { value: "always" }, "Always"));
    const panels = e("div", { ui: ["d-flex", "flex-col", "gap-2"] });
    const distance = e("select", { ui: ["elg", "field"], ariaLabel: "Scrollbar hover distance" },
        ...[0, 25, 50, 100].map(value => e("option", { value: String(value), selected: value === 50 }, `${value}px`)));
    const addPanel = () => {
        const panel = e("div", { ui: ["elg", "border", "rounded-1"], style: { overflow: "auto", height: "170px" } },
            e("div", { ui: ["p-2"], style: { width: "900px", height: "400px", background: "linear-gradient(135deg, var(--elg-surface-color-2), var(--elg-primary-bg))" } },
                e("strong", {}, "Native scroll container"),
                e("p", {}, "Wheel, touch, keyboard and scrollIntoView stay native."),
                e("p", { style: { marginTop: "220px" } }, "Bottom of this panel.")));
        panels.append(panel);
    };
    let installation = Scrollbars.install(window);
    let globalEnabled = true;
    let localInstallation: ScrollbarsInstallation | undefined;
    const scopeStatus = e("span", { ui: ["text-muted"], role: "status" }, "Panels use the global settings.");
    const toggle = e("button", { ui: ["elg", "btn"], onclick: () => {
        globalEnabled = !globalEnabled;
        if (!globalEnabled) installation.dispose();
        else installation = Scrollbars.install(window, { scrollbarMode: mode.value as ScrollbarMode, scrollbarHoverDistance: Number(distance.value) });
        toggle.textContent = globalEnabled ? "Global: on" : "Global: off";
    } }, "Global: on");
    const local = e("button", { ui: ["elg", "btn"], onclick: () => {
        if (localInstallation) {
            localInstallation.dispose(); localInstallation = undefined;
            local.textContent = "Local: off"; scopeStatus.textContent = "Panels use the global settings when enabled.";
        } else {
            localInstallation = Scrollbars.install(panels, { scrollbarMode: "always", scrollbarHoverDistance: 25 });
            local.textContent = "Local: on"; scopeStatus.textContent = "Panels: local always mode. Page and textarea: global settings.";
        }
    } }, "Local: off");
    mode.addEventListener("change", () => { installation.scrollbarMode = mode.value as ScrollbarMode; });
    distance.addEventListener("change", () => { installation.scrollbarHoverDistance = Number(distance.value); });
    document.body.append(e("div", { ui: ["p-1", "d-flex", "flex-col", "gap-2"] },
        e("div", { ui: ["d-flex", "flex-wrap", "items-center", "gap-2"] }, mode,
            e("label", { ui: ["d-flex", "items-center", "gap-1"] }, "Hover", distance), toggle, local,
            e("button", { ui: ["elg", "btn"], onclick: addPanel }, "Add panel")),
        scopeStatus,
        panels,
        e("label", { ui: ["d-flex", "flex-col", "gap-1"] }, "Native textarea",
            e("textarea", { ui: ["elg", "field"], ariaLabel: "Native textarea", style: { height: "90px", overflow: "auto" },
                value: Array.from({ length: 20 }, (_, i) => `Editable line ${i + 1}`).join("\n") })),
        e("div", { ui: ["elg", "surface", "p-2"], style: { height: "180px" } }, "Scroll the page to reach the final note."),
        e("p", {}, "End of the native page scroll demo.")));
    addPanel();
}
