import { e } from "../../../../src/core/e";
import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/data/ArrayDataSource";
import type { ColumnWidthMode } from "../../../../src/components/datagrid/DataGrid";

export default function demo(): void {
  const rows = [
    { id: 1, product: "Keyboard", quantity: 4, total: 356 },
    { id: 2, product: "Monitor", quantity: 2, total: 498 },
    { id: 3, product: "Webcam", quantity: 7, total: 483 },
    { id: 4, product: "Dock", quantity: 3, total: 537 }
  ];
  let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const grid = new DataGrid({
    data: new ArrayDataSource(rows, { createRowId: () => nextId++ }),
    columns: [
      { name: "id", caption: "ID", width: 60, textAlign: "end" },
      { name: "product", caption: "Product" },
      { name: "quantity", caption: "Qty", width: 80, textAlign: "end" },
      { name: "total", caption: "Total", width: 110, textAlign: "end" }
    ],
    fixedLeftColumns: 1,
    fixedRightColumns: 1
  });
  grid.dom.style.height = "360px";
  const mode = e("select", { ui: ["elg", "field"], ariaLabel: "Column width mode", onchange: () => {
    grid.setOptions({ columnWidthMode: mode.value as ColumnWidthMode });
  } },
    e("option", { value: "fixed" }, "Fixed"),
    e("option", { value: "stretch-auto", selected: true }, "Stretch auto columns"),
    e("option", { value: "stretch-all" }, "Stretch all columns"));
  const panel = e("div", { style: { width: "600px" } });
  const width = e("input", { type: "range", min: "320", max: "1000", value: "600",
    ariaLabel: "Grid container width", oninput: () => { panel.style.width = width.value + "px"; } });
  document.body.append(
    e("div", { ui: ["d-flex", "flex-wrap", "gap-2", "items-center", "mb-2"] },
      e("label", {}, "Column widths ", mode), e("label", {}, "Container width ", width)),
    e("div", { ui: ["overflow-auto", "p-1"] }, panel));
  grid.refresh();
  grid.mount(panel);
}
