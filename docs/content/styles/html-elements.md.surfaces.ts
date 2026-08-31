import { e } from "../../../src/core/e";

export default function demo(): void {
    const surfaceNames = ["surface", "surface-2", "surface-3"] as const;
    const content = e("div", { ui: ["elg", "d-flex", "flex-col", "gap-2"] },
        ...surfaceNames.map((surface, index) => e("div", {
            ui: ["elg", surface, "box", "p-3"]
        }, surface + " layer", e("p", { ui: ["elg", "text-muted", "m-0"] },
            "Content on " + (index === 0 ? "the page" : "a raised layer") + "."
        )))
    );
    document.body.append(content);
}


