import { cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
    const linkStyle = e("style", {},
        ".demo-text-link:hover, .demo-text-link:focus-visible { text-decoration: underline; text-underline-offset: 3px; } " +
        ".demo-text-link:focus-visible { outline: 2px solid var(--elg-selection-border); outline-offset: 2px; }");
    const content = e("div", { ui: ["elg", "d-flex", "gap-2", "flex-wrap"] },
        e("button", { ui: ["elg"], type: "button" }, "Flat button"),
        cbutton({ ui: ["elg", "btn", "primary"] }, "Primary"),
        cbutton({ ui: ["elg", "btn", "accent"] }, "Accent"),
        cbutton({ ui: ["elg", "btn", "neutral"] }, "Neutral"),
        cbutton({ ui: ["elg", "btn", "btn-ghost"] }, "Ghost"),
        cbutton({ ui: ["elg", "btn", "success"] }, "Success"),
        cbutton({ ui: ["elg", "btn", "warning"] }, "Warning"),
        cbutton({ ui: ["elg", "btn", "danger"] }, "Danger"),
        cbutton({ ui: ["elg", "btn"], disabled: true }, "Disabled"),
        e("a", { ui: ["elg", "btn", "neutral"], href: "https://example.com", target: "_blank", rel: "noopener" }, "Anchor as button"),
        e("a", { class: "demo-text-link", ui: ["text-primary", "no-underline"], style: { alignSelf: "center" },
            href: "https://example.com", target: "_blank", rel: "noopener" }, "Text link →")
    );
    document.body.append(linkStyle, content);
}


