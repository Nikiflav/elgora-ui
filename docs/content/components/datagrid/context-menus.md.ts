import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/components/datagrid/DataSource";

export default function demo(): void {
  const rows = [
    { id: 1, customer: "Acme Corp", total: 356 },
    { id: 2, customer: "Northwind", total: 498 },
    { id: 3, customer: "Contoso", total: 483 },
    { id: 4, customer: "Adventure Works", total: 537 }
  ];
  const grid = new DataGrid({
    data: new ArrayDataSource(rows),
    columns: [
      { name: "id", caption: "ID", width: 60 },
      { name: "customer", caption: "Customer", width: 240 },
      { name: "total", caption: "Total", width: 120, textAlign: "end" }
    ],
    rowContextMenuItems: context => [
      { text: `Inspect ${context.rowData?.customer ?? "row"}`, action: () => console.log(context.rowData) }
    ]
  });
  grid.dom.style.height = "360px";
  grid.refresh();
  grid.mount(document.body);
}
