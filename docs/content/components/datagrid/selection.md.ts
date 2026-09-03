import { DataGrid } from "../../../../src/components/datagrid/DataGrid";

export default function demo(): void {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    task: ["Review", "Approve", "Export", "Archive"][index % 4],
    owner: ["Mira", "Ivan", "Nora"][index % 3],
    status: index % 3 === 0 ? "Open" : "Done"
  }));
  const grid = new DataGrid({
    data: rows,
    columns: [
      { name: "id", caption: "ID", width: 60, textAlign: "end" },
      { name: "task", caption: "Task", width: 220 },
      { name: "owner", caption: "Owner", width: 140 },
      { name: "status", caption: "Status", width: 120 }
    ]
  });
  grid.dom.style.height = "360px";
  grid.refresh();
  grid.mount(document.body);
}
