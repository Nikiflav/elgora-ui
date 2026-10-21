import { DataGrid, DataSet, cdiv, cbutton, e, type DataRow } from "../../../../src/index";

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
    const status = e("p", { ui: ["m-0", "text-muted", "fs-80"], role: "status" },
        "Edit Quantity or Price: edited and calculated cells turn pale green. Undo/Redo restores their modification state. Save simulates successful persistence and clears the marks.");
    root.append([cdiv({ ui: ["d-flex", "gap-2"] },
        cbutton({ ui: ["elg", "btn", "neutral"], onclick: async () => { if (await grid.endEdit()) await dataset.undoCoordinator.undo(); } }, "Undo"),
        cbutton({ ui: ["elg", "btn", "neutral"], onclick: async () => { if (await grid.endEdit()) await dataset.undoCoordinator.redo(); } }, "Redo"),
        cbutton({ ui: ["elg", "btn", "primary"], onclick: async () => {
            try {
                if (!await grid.endEdit() || grid.hasValidationErrors) {
                    status.textContent = "Correct invalid cells before saving."; return;
                }
                for (const session of grid.newRowSessions) {
                    if (!await grid.insertNewRow(session)) { status.textContent = "Correct or cancel the pending row before saving."; return; }
                }
                // Replace this callback with the application's server request.
                const result = await dataset.saveChanges(async () => ({ success: true }));
                status.textContent = result.success ? "Simulated save succeeded. Changes are accepted; no server request was made." : result.error;
            } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
        } }, "Save (simulated)")
    ), grid, status]);
    root.mount(document.body);
}
