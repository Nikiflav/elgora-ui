import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { e } from "../../../../src/core/e";
import type { GridExpansionState } from "../../../../src/components/datagrid/GridExpansionState";

export default function demo(): void {
  const rows = [
    { region: "West", product: "Keyboard", total: 356 },
    { region: "East", product: "Monitor", total: 498 },
    { region: "West", product: "Webcam", total: 483 },
    { region: "East", product: "Dock", total: 537 },
    { region: "North", product: "Mouse", total: 118 },
    { region: "North", product: "Keyboard", total: 267 }
  ];
  const grid = new DataGrid({
    data: rows,
    columns: [
      { name: "region", caption: "Region", width: 140, groupInterval: "firstChar" },
      { name: "product", caption: "Product", width: 220 },
      { name: "total", caption: "Total", width: 120, textAlign: "end" }
    ],
    groupColumns: ["region", "product"],
    groupSummary: [{ field: "total", summaryType: "sum" }],
    stickyGroupRows: true
  });
  grid.dom.style.height = "310px";
  const status = e("span", { ui: ["text-muted"], role: "status" });
  const controls: HTMLButtonElement[] = [];
  let savedExpansion: GridExpansionState | undefined;
  const button = (text: string, action: () => Promise<void>) => {
    const control = e("button", { ui: ["elg", "btn", "neutral"], type: "button", onclick: async () => {
      controls.forEach(button => { button.disabled = true; });
      status.textContent = "";
      try { await action(); } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
      finally { controls.forEach(button => { button.disabled = false; }); }
    } }, text);
    controls.push(control);
    return control;
  };
  document.body.append(e("div", { ui: ["d-flex", "flex-wrap", "gap-2", "items-center", "mb-2"] },
    button("Expand all", () => grid.expandAllGroups()),
    button("Collapse all", () => grid.collapseAllGroups()),
    button("Expand product level", () => grid.expandAllGroups(1)),
    button("Save expansion", async () => { savedExpansion = grid.getExpansionState(); status.textContent = "Expansion saved."; }),
    button("Restore expansion", async () => {
      if (savedExpansion) await grid.setExpansionState(savedExpansion);
      else status.textContent = "Save an expansion state first.";
    }), status));
  grid.refresh();
  grid.mount(document.body);
}
