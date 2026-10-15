import { ScrollEngine, type ScrollbarMode } from "../../../src/components/scrollbar/scroll-engine";
import { e } from "../../../src/core/e";

export default function demo(): void {
  const mode = e("select", { ui: ["elg", "field"], ariaLabel: "Scrollbar mode" },
    e("option", { value: "thin" }, "Thin (default)"),
    e("option", { value: "auto" }, "Auto"),
    e("option", { value: "always" }, "Always"));
  document.body.append(e("label", { ui: ["d-flex", "items-center", "gap-2", "mb-2"] }, "Scrollbar mode", mode));
  const distance = e("select", { ui: ["elg", "field"], ariaLabel: "Scrollbar hover distance" },
    ...[0, 25, 50, 100].map(value => e("option", { value: String(value), selected: value === 50 }, `${value}px`)));
  document.body.append(e("label", { ui: ["d-flex", "items-center", "gap-2", "mb-2"] }, "Hover distance", distance));
  const viewport = e("div", {
    ui: ["elg", "border", "w-100"],
    style: { height: "240px" }
  });
  const content = e("div", {
    ui: ["elg", "p-3"],
    style: {
      width: "1000px",
      height: "700px",
      background: "linear-gradient(135deg, var(--elg-primary-bg), var(--elg-surface-color-3))"
    }
  },
    e("h2", "Virtual scroll area"),
    e("p", "Use the wheel, keyboard, or custom scrollbar to explore the content."),
    e("p", { style: { marginTop: "520px" } }, "You reached the lower part of the virtual content."),
    e("p", "The engine reports virtual coordinates through scrollTop and scrollLeft."));

  viewport.append(content);
  document.body.append(viewport);

  const scroller = new ScrollEngine(viewport);
  mode.addEventListener("change", () => { scroller.scrollbarMode = mode.value as ScrollbarMode; });
  distance.addEventListener("change", () => { scroller.scrollbarHoverDistance = Number(distance.value); });
  scroller.updateDimensions(1000, 700);
  scroller.onScroll(() => {
    content.style.transform = `translate(-${scroller.scrollLeft}px, -${scroller.scrollTop}px)`;
  });
}
