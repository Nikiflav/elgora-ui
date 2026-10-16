import { ArrayDataSource, DataGrid } from "../../../../src/index";

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
    grid.mount(document.body);
}
