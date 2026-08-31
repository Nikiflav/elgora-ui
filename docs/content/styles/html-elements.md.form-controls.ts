import { e } from "../../../src/core/e";

export default function demo(): void {
    const content = e("div", { ui: ["elg", "d-flex", "flex-col", "gap-2"] },
        e("input", { ui: ["elg", "field"], type: "text", placeholder: "Text input" }),
        e("select", { ui: ["elg", "field"] },
            e("option", { value: "one" }, "Select an option"),
            e("option", { value: "two" }, "Another option")
        ),
        e("textarea", { ui: ["elg", "field"], rows: 3, placeholder: "Textarea" }),
        e("label", { ui: ["elg", "d-flex", "gap-1", "items-center"] },
            e("input", { ui: ["elg"], type: "checkbox", checked: true }),
            "Enable feature"
        )
    );
    document.body.append(content);
}


