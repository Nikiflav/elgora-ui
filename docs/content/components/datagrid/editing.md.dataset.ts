import { DataGrid, DataSet, cdiv, cbutton, type DataRow } from "../../../../src/index";

export default function demo(): void {
    const dataset = new DataSet();
    let lastId = 0;
    const table = dataset.createTable("lines", [
        { id: 1, product: "Keyboard", quantity: 2, price: 45, total: 90 },
        { id: 2, product: "Mouse", quantity: 5, price: 25, total: 125 }
    ], {
        createRowId: table => lastId = table.rows.reduce((max, row) => Math.max(max, Number(row.key)), lastId) + 1,
        defaults: () => ({ product: "", quantity: 1, price: 0, total: 0 })
    });
    table.rowChanged.subscribe(async event => {
        if (event.kind === "update" && (event.fields.includes("quantity") || event.fields.includes("price"))) {
            await event.context.update(event.row, { total: Number(event.row.getValue("quantity")) * Number(event.row.getValue("price")) });
        }
    });
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2"] });
    const grid = new DataGrid<DataRow>({ data: table, allowEdit: true, showGroupPanel: false,
        columns: [
            { name: "product", caption: "Product", getValue: async row => row.getValue("product") },
            { name: "quantity", caption: "Quantity", dataType: "number", getValue: async row => row.getValue("quantity") },
            { name: "price", caption: "Price", dataType: "number", getValue: async row => row.getValue("price") },
            { name: "total", caption: "Total", dataType: "number", readonly: true, getValue: async row => row.getValue("total") }
        ] });
    grid.dom.style.height = "240px";
    root.append([cdiv({ ui: ["d-flex", "gap-2"] },
        cbutton({ ui: ["elg", "btn", "neutral"], onclick: async () => { if (await grid.endEdit()) await dataset.undoCoordinator.undo(); } }, "Undo"),
        cbutton({ ui: ["elg", "btn", "neutral"], onclick: async () => { if (await grid.endEdit()) await dataset.undoCoordinator.redo(); } }, "Redo")
    ), grid]);
    root.mount(document.body);
}
