import { e } from "../../../../src/core/e";
import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/components/datagrid/DataSource";

export default function demo(): void {
  const rows = [
    { id: 1, product: "Keyboard", quantity: 4, total: 356 },
    { id: 2, product: "Monitor", quantity: 2, total: 498 },
    { id: 3, product: "Webcam", quantity: 7, total: 483 },
    { id: 4, product: "Dock", quantity: 3, total: 537 }
  ];
  const grid = new DataGrid({
    data: new ArrayDataSource(rows),
    columns: [
      { name: "id", caption: "ID", width: 60, textAlign: "end" },
      { name: "product", caption: "Product", width: 220 },
      { name: "quantity", caption: "Qty", width: 80, textAlign: "end" },
      { name: "total", caption: "Total", width: 110, textAlign: "end" }
    ],
    fixedLeftColumns: 1,
    fixedRightColumns: 1
  });
  grid.dom.style.height = "360px";
  grid.refresh();
  grid.mount(document.body);
}
