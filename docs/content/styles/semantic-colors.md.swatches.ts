import { e } from "../../../src/core/e";

export default function demo(): void {
    const colors = ["primary", "accent", "neutral", "success", "warning", "danger"] as const;
    const content = e("div", { ui: ["elg", "d-flex", "flex-wrap", "gap-2"] },
        ...colors.map(color => e("div", {
            ui: ["elg", color, "p-3", "rounded-1"],
            style: { minWidth: "120px" }
        }, color))
    );
    document.body.append(content);
}


