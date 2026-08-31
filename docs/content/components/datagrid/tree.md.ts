import { DataGrid } from "../../../../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../../../../src/components/datagrid/DataSource";

type FileSystemRow = { id: number; parentId: number | null; name: string; type: "folder" | "file"; size: number; modified: string };

export default function demo(): void {
  const rows: FileSystemRow[] = [];
  let nextId = 1;
  const extensions = [".txt", ".pdf", ".docx", ".xlsx", ".png", ".jpg", ".zip", ".mp4"];
  const randomDate = () => new Date(2023, 0, 1 + Math.floor(Math.random() * 730)).toISOString().split("T")[0];
  const addFolder = (parentId: number | null, name: string) => {
    const id = nextId++;
    rows.push({ id, parentId, name, type: "folder", size: 0, modified: randomDate() });
    return id;
  };
  const addFile = (parentId: number, name: string) => rows.push({ id: nextId++, parentId, name: name + extensions[Math.floor(Math.random() * extensions.length)], type: "file", size: Math.floor(Math.random() * 5_000_000) + 1024, modified: randomDate() });
  for (const root of ["Documents", "Photos", "Projects", "Downloads", "Archive"]) {
    const rootId = addFolder(null, root);
    for (let index = 0; index < 3; index++) addFile(rootId, `file-${index + 1}`);
    for (const child of ["Reports", "Shared", "Archive"]) {
      const childId = addFolder(rootId, child);
      for (let index = 0; index < 3; index++) addFile(childId, `${child.toLowerCase()}-${index + 1}`);
    }
  }
  const grid = new DataGrid({
    data: new ArrayDataSource(rows, { parentField: "parentId" }),
    columns: [
      { name: "name", caption: "Name", editorType: "text", width: 350, getText: async row => (row.type === "folder" ? "📁 " : "📄 ") + row.name },
      { name: "type", caption: "Type", editorType: "text" },
      { name: "size", caption: "Size", editorType: "number", textAlign: "end", getText: async row => row.type === "folder" ? "" : `${(row.size / 1024).toFixed(1)} KB` },
      { name: "modified", caption: "Modified", editorType: "date" }
    ],
    stickyGroupRows: true
  });
  grid.dom.classList.add("elg-h-100");
  grid.refresh();
  grid.mount(document.body);
}


