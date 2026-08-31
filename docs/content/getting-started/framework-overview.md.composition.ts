import { cdiv, cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
    const content = cdiv({ ui: ["elg", "surface", "box", "p-3", "d-flex", "flex-col", "gap-2"] },
        e("strong", { ui: ["elg"] }, "Hello from ElgoraUI"),
        e("span", { ui: ["elg", "text-muted"] }, "A native DOM tree with Elgora behavior."),
        cbutton({ ui: ["elg", "btn", "primary"] }, "Change message")
    );
    content.mount(document.body);
}


