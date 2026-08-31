import { Tooltip } from "../../../src/components/popup/Tooltip";
import { Component } from "../../../src/core/Component";
import { cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
  const component = new Component({
    ui: ["elg", "d-flex", "flex-col", "gap-3"],
    comcreate(com) {
      const button = cbutton({ ui: ["elg", "btn", "primary"] }, "Hover or focus me");
      Tooltip.attach(button.dom, "Helpful description", { placement: "top", delay: 300 });
      com.append(button);

      const richButton = cbutton({ ui: ["elg", "btn", "accent"] }, "Show rich tooltip");
      const content = e(
        "span",
        { ui: ["elg", "d-flex", "flex-col", "gap-1"] },
        e("strong", { ui: ["elg"] }, "Rich tooltip"),
        e("span", { ui: ["elg"] }, "Tooltip content can be an HTMLElement.")
      );
      Tooltip.attach(richButton.dom, content, { placement: "right" });
      com.append(richButton);
    }
  });
  component.mount(document.body);
}



