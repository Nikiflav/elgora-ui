
import { RouterHandler } from "../src/components/browser-router/BrowserRouter";
import { DataGrid } from "../src/components/datagrid/DataGrid";
import { ArrayDataSource } from "../src/components/datagrid/DataSource";

type FileSystemRow = {
    id: number;
    parentId: number | null;
    name: string;
    type: "folder" | "file";
    size: number;
    modified: string;
};

const fileExtensions = [".txt", ".pdf", ".docx", ".xlsx", ".png", ".jpg", ".zip", ".mp4"];
const rows: FileSystemRow[] = [];
let nextId = 1;

function randomDate(): string {
    const date = new Date(2023, 0, 1 + Math.floor(Math.random() * 730));
    return date.toISOString().split("T")[0];
}

function addFile(parentId: number, name: string): void {
    const ext = fileExtensions[Math.floor(Math.random() * fileExtensions.length)];
    rows.push({
        id: nextId++,
        parentId,
        name: name + ext,
        type: "file",
        size: Math.floor(Math.random() * 5_000_000) + 1024,
        modified: randomDate()
    });
}

function addFolder(parentId: number | null, name: string): number {
    const id = nextId++;
    rows.push({
        id,
        parentId,
        name,
        type: "folder",
        size: 0,
        modified: randomDate()
    });
    return id;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const rootFolders = [
    { name: "Documents", subfolders: ["Invoices", "Contracts", "Reports"] },
    { name: "Photos", subfolders: ["Vacation 2024", "Family", "Screenshots"] },
    { name: "Projects", subfolders: ["Website Redesign", "Mobile App", "Data Pipeline"] },
    { name: "Downloads", subfolders: ["Installers", "Misc"] },
    { name: "Archive", subfolders: ["2022", "2023"] }
];

for (const root of rootFolders) {
    const rootId = addFolder(null, root.name);

    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        addFile(rootId, `file-${i + 1}`);
    }

    for (const subName of root.subfolders) {
        const subId = addFolder(rootId, subName);
        const fileCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < fileCount; i++) {
            addFile(subId, `${subName.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`);
        }
    }
}

const grid = new DataGrid({
    data: new ArrayDataSource(rows, { parentField: "parentId" }),
    columns: [
        {
            name: "name",
            caption: "Name",
            editorType: "text",
            width: 350,
            getText: async (row) => (row.type === "folder" ? "📁 " : "📄 ") + row.name
        },
        { name: "type", caption: "Type", editorType: "text" },
        {
            name: "size",
            caption: "Size",
            editorType: "number",
            textAlign: "end",
            getText: async (row) => row.type === "folder" ? "" : formatSize(row.size)
        },
        { name: "modified", caption: "Modified", editorType: "date" }
    ]
});

grid.dom.classList.add("elg-h-100");

// Create testing router page

export const dataGridTreeRouterHandler: RouterHandler = {
    path: '/data-grid-tree',
    createPage(urlParams) {
        grid.refresh()
        return {
            title: 'Data Grid - Tree',
            description: 'Hierarchical (parent/child) Data Grid component',
            dom: grid.dom
        };
    }
};
