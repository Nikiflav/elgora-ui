import { Popover } from "../../../src/components/popup/popover";
import { Component } from "../../../src/core/Component";
import { cbutton } from "../../../src/core/c";
import { e } from "../../../src/core/e";
import { ResizeHandle } from "../../../src/components/resize/ResizeHandle";

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
      Object.assign(popover.dom.style, { width: "300px", height: "150px", padding: "12px" });
      popover.append(e("p", {}, "Drag the bottom-right grip to resize. The size is retained when reopened."));
      const grip = new ResizeHandle({ target: popover.dom, minWidth: 200, minHeight: 100 });
      popover.addCleanup(grip);
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



