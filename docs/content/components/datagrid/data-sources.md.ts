import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/components/datagrid/DataSource";

export default function demo(): void {
  const rows = Array.from({ length: 80 }, (_, index) => ({
    id: index + 1,
    name: `Record ${index + 1}`,
    value: Math.round(Math.random() * 1000)
  }));
  const grid = new DataGrid({
    data: new ArrayDataSource(rows),
    pageSize: 25,
    columns: [
      { name: "id", caption: "ID", width: 70, textAlign: "end" },
      { name: "name", caption: "Name", width: 220 },
      { name: "value", caption: "Value", width: 120, textAlign: "end" }
    ]
  });
  grid.dom.style.height = "360px";
  grid.refresh();
  grid.mount(document.body);
}
