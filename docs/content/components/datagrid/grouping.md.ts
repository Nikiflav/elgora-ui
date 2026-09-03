import { DataGrid } from "../../../../src/components/datagrid/DataGrid";

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
    groupColumns: ["region"],
    stickyGroupRows: true
  });
  grid.dom.style.height = "360px";
  grid.refresh();
  grid.mount(document.body);
}
