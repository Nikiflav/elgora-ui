import { cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
    const content = e("div", { ui: ["elg", "d-flex", "gap-2", "flex-wrap"] },
        e("button", { ui: ["elg"], type: "button" }, "Flat button"),
        cbutton({ ui: ["elg", "btn", "primary"] }, "Primary"),
        cbutton({ ui: ["elg", "btn", "neutral"] }, "Neutral"),
        cbutton({ ui: ["elg", "btn", "danger"] }, "Danger")
    );
    document.body.append(content);
}


