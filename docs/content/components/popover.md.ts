import { Popover } from "../../../src/components/popup/popover";
import { Component } from "../../../src/core/Component";
import { cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";

export default function demo(): void {
  const component = new Component({
    ui: ["elg", "d-flex", "flex-col", "gap-3"],
    comcreate(com) {
      const anchor = cbutton({ ui: ["elg", "btn", "primary"] }, "Open popover");
      const popover = new Popover({
        anchorElement: anchor.dom,
        bindAnchorTarget: false,
        placement: "bottom-start",
        children: e("span", { ui: ["elg"] }, "This panel is positioned relative to the button.")
      });
      anchor.dom.addEventListener("click", () => popover.toggle());
      com.append([anchor, popover]);

      const target = e(
        "div",
        { ui: ["elg", "p-3", "border", "border-dashed", "rounded-1", "user-select-none"] },
        "Right-click here for a point-based popover"
      );
      const pointPopover = new Popover({
        point: { x: 0, y: 0 },
        placement: "bottom-start",
        children: "Context popover"
      });
      target.addEventListener("contextmenu", event => {
        event.preventDefault();
        pointPopover.setPoint(event.clientX, event.clientY);
        pointPopover.show();
      });
      com.append([target, pointPopover]);
    }
  });
  component.mount(document.body);
}



