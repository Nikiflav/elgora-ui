import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/data/ArrayDataSource";

export default function demo(): void {
  const rows = Array.from({ length: 100_000 }, (_, index) => ({
    id: index + 1,
    name: `Generated record ${index + 1}`,
    score: (index * 17) % 1000
  }));
  let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const grid = new DataGrid({
    data: new ArrayDataSource(rows, { createRowId: () => nextId++ }),
    pageSize: 100,
    columns: [
      { name: "id", caption: "ID", width: 80, textAlign: "end" },
      { name: "name", caption: "Name", width: 280 },
      { name: "score", caption: "Score", width: 110, textAlign: "end" }
    ]
  });
  grid.dom.style.height = "360px";
  grid.refresh();
  grid.mount(document.body);
}
