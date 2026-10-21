import { ArrayDataSource, DataGrid, cdiv, cbutton, e, v } from "../../../../src/index";

export default function demo(): void {
    const products = [
        { id: 1, code: "KB", name: "Keyboard", price: 45 },
        { id: 2, code: "MS", name: "Mouse", price: 25 },
        { id: 3, code: "DC", name: "Dock", price: 120 }
    ];
    const rows = [
        { id: 1, description: "Office", productId: 1, quantity: 2, delivery: "2026-10-20", approved: false },
        { id: 2, description: "Workshop", productId: 2, quantity: 5, delivery: "2026-10-22", approved: true }
    ];
    let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    const source = new ArrayDataSource(rows, { createRowId: () => nextId++, defaults: () => ({
        description: "", productId: 1, quantity: 1, delivery: "2026-10-20", approved: false
    }) });
    const grid = new DataGrid({ data: source, allowEdit: true, showGroupPanel: false,
        columns: [
            { name: "id", caption: "ID", width: 50, readonly: true },
            { name: "description", caption: "Description", required: true, width: 150 },
            { name: "productId", caption: "Product", dataType: "number", width: 150, lookup: {
                columns: [{ name: "code", caption: "Code", width: 60 }, { name: "name", caption: "Product", width: 140 },
                    { name: "price", caption: "Price", dataType: "number", width: 70 }],
                popupWidth: 310,
                loadItems: async query => {
                    const matches = products.filter(item => `${item.code} ${item.name}`.toLowerCase().includes(query.search.toLowerCase()));
                    return { items: matches.slice(query.skip ?? 0, (query.skip ?? 0) + (query.top ?? 50)), totalCount: matches.length };
                },
                getItemValue: item => item.id, getItemText: item => item.name,
                getValueText: value => products.find(item => item.id === value)?.name ?? ""
            } },
            { name: "quantity", caption: "Quantity", dataType: "number", width: 100,
                validate: value => value > 0 ? undefined : "Quantity must be positive." },
            { name: "delivery", caption: "Delivery", dataType: "date", width: 130 },
            { name: "approved", caption: "Approved", dataType: "boolean", width: 100 }
        ], totalSummary: [{ field: "quantity", summaryType: "sum" }]
    });
    grid.dom.style.height = "250px";
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2", "min-w-0"] });
    const status = e("p", { ui: ["m-0", "text-muted", "fs-80"], role: "status" },
        "Add rows or paste into Description. Invalid quantities keep their row pending.");
    const sessions = e("div", { ariaLabel: "Pending new-row sessions" });
    let busy = false;
    const renderSessions = () => {
        if (root.disposed.Value) return;
        const pending = grid.newRowSessions; // Independent snapshot; operations may remove entries.
        sessions.replaceChildren(e("div", { ui: ["d-flex", "flex-col", "gap-1"],
            vnodes: pending.length ? pending.map(session => v("div", {
                key: String(session.row.id), ui: ["d-flex", "items-center", "gap-2", "flex-wrap"]
            }, v("span", { ui: ["flex-1", "fs-80"] }, `Pending #${session.row.id}: ${session.row.description || "(empty description)"}`),
            v("button", { type: "button", ui: ["elg", "btn", "neutral"], disabled: busy,
                onmousedown: event => event.preventDefault(),
                onclick: () => run(async () => {
                    const success = await grid.insertNewRow(session);
                    return success ? `Inserted #${session.row.id}.` : `Row #${session.row.id} remains pending. Correct its errors or cancel it.`;
                })
            }, "Insert"),
            v("button", { type: "button", ui: ["elg", "btn", "neutral"], disabled: busy,
                onmousedown: event => event.preventDefault(),
                onclick: () => run(async () => await grid.cancelNewRow(session)
                    ? `Cancelled #${session.row.id}.` : `Could not cancel #${session.row.id}. ${grid.newRowError ?? "Another operation is running."}`)
            }, "Cancel"))) : [v("span", { ui: ["text-muted", "fs-80"] }, "No pending sessions.")]
        }));
    };
    const run = async (action: () => Promise<string>) => {
        if (busy) return;
        busy = true; root.render(renderSessions);
        try { status.textContent = await action(); }
        catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
        finally { busy = false; root.render(renderSessions); }
    };
    const borders = e("select", { ui: ["elg", "field"], ariaLabel: "Cell borders", onchange: () => {
        grid.setOptions({ cellBorders: borders.value as "none" | "rows" | "all" });
    } }, e("option", { value: "none" }, "No cell borders"),
        e("option", { value: "rows", selected: true }, "Row borders"),
        e("option", { value: "all" }, "All cell borders"));
    const outerBorder = e("input", { type: "checkbox", checked: true, onchange: () => {
        grid.setOptions({ showBorder: outerBorder.checked });
    } });
    const editorButtons = e("select", { ui: ["elg", "field"], ariaLabel: "Editor button visibility", onchange: () => {
        grid.setOptions({ defaultColumnOptions: { editorButtonVisibility: editorButtons.value as "always" | "hover" | "never" } });
    } }, e("option", { value: "hover" }, "Editor buttons: hover"),
        e("option", { value: "always" }, "Editor buttons: always"),
        e("option", { value: "never" }, "Editor buttons: never"));
    root.append([
        cdiv({ ui: ["d-flex", "flex-wrap", "items-center", "gap-2"] }, cbutton({ type: "button", ui: ["elg", "btn", "neutral"], onclick: () => run(async () => {
            const session = await grid.createNewRow();
            return `Created pending #${session.row.id}. Edit the row, then use Insert or Cancel for that session.`;
        }) }, "Add row"), borders, editorButtons, e("label", { ui: ["d-flex", "items-center", "gap-1"] }, outerBorder, "Outer border")), grid,
        e("p", { ui: ["m-0", "text-muted", "fs-80"] },
            "Hover Product or Delivery and click its button to edit and open the picker. Choose always for touch, or never to hide cell buttons. Alt+Down opens the active cell’s picker in any visibility mode."),
        e("p", { ui: ["m-0", "text-muted", "fs-80"] },
            "Copy cells from Excel or Sheets, click Description once, then press Ctrl+V / Command+V or choose Paste from the grid’s context menu. Inside an open editor, keyboard paste inserts text into that editor only. Clipboard access from the menu may require browser permission."),
        e("p", { ui: ["m-0", "text-muted", "fs-80"] },
            "Esc: closes an open popup first. Otherwise, clears the active cell’s invalid input and restores its actual value, even when its editor is closed. If the active cell has no error, Esc cancels its entire pending row; in an existing row, it only cancels the current cell edit."),
        sessions, status
    ]);
    root.addCleanup(source.changed.subscribe(() => root.render(renderSessions)));
    root.render(renderSessions);
    root.mount(document.body);
}
