import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/data/ArrayDataSource";
import { e } from "../../../../src/core/e";
import type { SelectionMode } from "../../../../src/components/datagrid/SelectionManager";

export default function demo(): void {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    task: ["Review", "Approve", "Export", "Archive"][index % 4],
    owner: ["Mira", "Ivan", "Nora"][index % 3],
    status: index % 3 === 0 ? "Open" : "Done"
  }));
  let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const grid = new DataGrid({
    data: new ArrayDataSource(rows, { createRowId: () => nextId++ }),
    columns: [
      { name: "id", caption: "ID", width: 60, textAlign: "end" },
      { name: "task", caption: "Task", width: 220 },
      { name: "owner", caption: "Owner", width: 140 },
      { name: "status", caption: "Status", width: 120 }
    ]
  });
  grid.dom.style.height = "360px";
  grid.refresh();
  const mode = e("select", { ui: ["elg", "field"], ariaLabel: "Selection mode", onchange: () => {
    grid.setOptions({ selectionMode: mode.value as SelectionMode });
  } },
    e("option", { value: "multiple-cells" }, "Multiple cells"),
    e("option", { value: "single-row" }, "Single row"),
    e("option", { value: "multiple-rows" }, "Multiple rows"));
  document.body.append(e("label", { ui: ["d-flex", "items-center", "gap-2", "mb-2"] }, "Selection mode", mode));
  grid.mount(document.body);
}
