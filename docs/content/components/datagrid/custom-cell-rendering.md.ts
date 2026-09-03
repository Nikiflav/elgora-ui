import { e } from "../../../../src/core/e";
import { DataGrid } from "../../../../src/components/datagrid/DataGrid";

type OrderRow = {
  id: number;
  product: string;
  status: "Ready" | "Delayed";
  amount: number;
};

export default function demo(): void {
  const rows: OrderRow[] = [
    { id: 1, product: "Keyboard", status: "Ready", amount: 89 },
    { id: 2, product: "Monitor", status: "Delayed", amount: 249 },
    { id: 3, product: "Webcam", status: "Ready", amount: 69 },
    { id: 4, product: "Desk lamp", status: "Delayed", amount: 42 },
    { id: 5, product: "Headphones", status: "Ready", amount: 129 },
    { id: 6, product: "Mouse", status: "Ready", amount: 59 },
    { id: 7, product: "Docking station", status: "Delayed", amount: 179 },
    { id: 8, product: "Microphone", status: "Ready", amount: 149 }
  ];

  const grid = new DataGrid({
    data: rows,
    columns: [
      { name: "id", caption: "ID", editorType: "number", width: 60 },
      { name: "product", caption: "Product", editorType: "text", width: 220 },
      {
        name: "status",
        caption: "Status",
        editorType: "text",
        customCellStyle: cell => ({
          className: "elg-text-uppercase",
          style: {
            "--elg-grid-cell-bg": cell.value === "Ready" ? "#d9f2e3" : "#f7dfdf"
          }
        }),
        renderCell: cell => e("strong", { ui: ["fw-600"] }, cell.text)
      },
      {
        name: "amount",
        caption: "Amount",
        editorType: "number",
        textAlign: "end",
        renderCell: cell => e("span", { ui: ["fw-600"] }, `$${cell.value}`)
      }
    ]
  });

  grid.dom.style.height = "360px";
  grid.refresh();
  grid.mount(document.body);
}
