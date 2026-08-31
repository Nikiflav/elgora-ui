import { Component } from "../../../src/core/Component";
import { e } from "../../../src/core/e";

export default function demo(): void {
  class StatusPanel extends Component {
    private status!: HTMLParagraphElement;

    constructor() {
      super({
        tag: "section",
        ui: ["elg", "surface", "box", "p-3", "d-flex", "flex-col", "gap-2"]
      });

      const status = e(
        "p",
        { ui: ["elg", "text-muted", "m-0"] },
        "Waiting for mount"
      );
      this.status = status;
      this.append([
        e("h3", { ui: ["elg", "m-0"] }, "A mounted Component has a lifecycle"),
        status
      ]);
    }

    private updateStatus = () => {
      this.status.textContent = `Mounted at ${window.innerWidth}px wide`;
    };

    protected onMount(): void {
      this.updateStatus();
      window.addEventListener("resize", this.updateStatus);
    }

    protected onUnmount(): void {
      window.removeEventListener("resize", this.updateStatus);
    }
  }

  const panel = new StatusPanel();
  const toggle = e(
    "button",
    { ui: ["elg", "btn", "neutral"] },
    "Unmount panel"
  );

  toggle.addEventListener("click", () => {
    if (panel.mounted) {
      panel.unmount();
      toggle.textContent = "Mount panel";
    } else {
      panel.mount(demo);
      toggle.textContent = "Unmount panel";
    }
  });

  const demo = e("div", { ui: ["elg", "d-flex", "flex-col", "gap-2"] });
  demo.append(panel.dom, toggle);
  document.body.append(demo);
  panel.mount(demo);
}
