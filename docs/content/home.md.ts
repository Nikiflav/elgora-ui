import { ArrayDataSource, DataGrid, cdiv, cbutton, e, v, type DataGridColumn } from "../../src/index";

export default function demo(): void {
    const products = [
        { id: 1, name: "Wireless keyboard", image: "keyboard", category: "Accessories", price: 49 },
        { id: 2, name: "Studio headphones", image: "headphones", category: "Audio", price: 129 },
        { id: 3, name: "27-inch monitor", image: "monitor", category: "Displays", price: 249 },
        { id: 4, name: "Oak desk lamp", image: "lamp", category: "Office", price: 39 }
    ];
    const destinations = [
        { name: "Germany", flag: "de" }, { name: "France", flag: "fr" },
        { name: "Bulgaria", flag: "bg" }, { name: "Japan", flag: "jp" }, { name: "United States", flag: "us" }
    ];
    const states = ["Processing", "Shipped", "Delivered"];
    const customers = ["Northwind", "Acme Studio", "Atlas Design", "Greenfield", "Paper & Pine"];
    const rows = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1, productId: products[index % products.length].id,
        customer: customers[(index * 3) % customers.length],
        destination: destinations[(index * 7) % destinations.length].name,
        status: states[index % states.length], quantity: (index % 5) + 1,
        total: products[index % products.length].price * ((index % 5) + 1),
        delivery: `2026-10-${String(16 + index % 14).padStart(2, "0")}`
    }));
    type Order = typeof rows[number];
    let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    // Store derived totals in the source too, so sorting, filtering and sums all
    // operate on the same values shown in the cells.
    class OrderSource extends ArrayDataSource<Order> {
        override async update(row: Order, values: Record<string, unknown>) {
            const candidate = { ...row, ...values };
            const product = products.find(item => item.id === candidate.productId)!;
            return super.update(row, { ...values, total: product.price * candidate.quantity });
        }
    }
    const source = new OrderSource(rows, { createRowId: () => nextId++, defaults: () => ({
        productId: 1, customer: "New customer", destination: "Bulgaria", status: "Processing", quantity: 1, total: 49, delivery: "2026-10-20"
    }) });
    const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
    const productFor = (row: Order) => products.find(product => product.id === row.productId)!;
    const thumbnail = (image: string) => `./assets/products/${image}.svg`;
    const columns: DataGridColumn<Order>[] = [
        { name: "id", caption: "#", dataType: "number", width: 48, readonly: true },
        { name: "productId", caption: "Product & customer", dataType: "number", width: 220,
            lookup: {
                loadItems: async query => {
                    const matches = products.filter(product => product.name.toLowerCase().includes(query.search.toLowerCase()));
                    return { items: matches.slice(query.skip ?? 0, (query.skip ?? 0) + (query.top ?? 50)), totalCount: matches.length };
                },
                getItemValue: item => item.id, getItemText: item => item.name,
                getValueText: value => products.find(product => product.id === value)?.name ?? "",
                columns: [{ name: "name", caption: "Product", width: 210 },
                    { name: "price", caption: "Price", width: 80, dataType: "number" }]
            },
            renderCell: cell => {
                if (!cell.rowData || !["data", "new", "node"].includes(cell.gridRow.type)) return v("span", cell.text);
                const product = productFor(cell.rowData);
                return v("span", { ui: ["d-flex", "items-center", "gap-2", "min-w-0"] },
                    v("img", { src: thumbnail(product.image), alt: "", width: 30, height: 30, style: { flex: "none", borderRadius: "6px" } }),
                    v("span", { ui: ["d-flex", "flex-col", "min-w-0"], style: { lineHeight: "1.2" } },
                        v("span", { ui: ["text-ellipsis", "overflow-hidden"] }, product.name),
                        v("span", { ui: ["text-muted", "fs-80"] }, cell.rowData.customer)));
            }
        },
        { name: "destination", caption: "Destination", width: 130,
            renderCell: cell => {
                const destination = destinations.find(item => item.name === cell.value);
                return v("span", { ui: ["d-flex", "items-center", "gap-2"] },
                    destination ? v("img", { src: `./assets/flags/${destination.flag}.svg`, alt: "", width: 20, height: 14 }) : null,
                    v("span", cell.text));
            }
        },
        { name: "status", caption: "Status", width: 110,
            renderCell: cell => {
                if (!cell.rowData || !["data", "new", "node"].includes(cell.gridRow.type)) return v("span", cell.text);
                const color = cell.value === "Delivered" ? "success" : cell.value === "Shipped" ? "primary" : "warning";
                return v("span", { ui: ["elg", "fs-80", "rounded-1", "px-2", "py-1", color] }, cell.text);
            },
            resolveText: text => {
                const match = states.find(state => state.toLowerCase() === text.trim().toLowerCase());
                if (!match) throw new Error("Use Processing, Shipped or Delivered.");
                return match;
            }
        },
        { name: "quantity", caption: "Qty", dataType: "number", width: 65, textAlign: "end",
            validate: value => Number.isInteger(value) && value > 0 ? undefined : "Enter a positive whole quantity." },
        { name: "total", caption: "Total", dataType: "number", width: 105, textAlign: "end", readonly: true,
            getText: async row => money(row.total),
            renderCell: cell => v("span", typeof cell.value === "number" ? money(cell.value) : cell.text) },
        { name: "delivery", caption: "Delivery", dataType: "date", width: 120 }
    ];
    const grid = new DataGrid({ data: source, columns, allowEdit: true, showFilterRow: true, showRowHeader: false,
        columnWidthMode: "stretch-all", showRowHover: true,
        groupSummary: [{ field: "quantity", summaryType: "sum" }, { field: "total", summaryType: "sum" }],
        totalSummary: [{ field: "quantity", summaryType: "sum" }, { field: "total", summaryType: "sum" }] });
    grid.dom.style.height = "444px";
    grid.dom.style.setProperty("--elg-data-grid-row-height", "44px");
    const status = e("span", { ui: ["text-muted", "fs-80"], role: "status" }, "100 orders · editable local data");
    const reset = cbutton({ type: "button", ui: ["elg", "btn", "neutral"], onclick: async () => {
        if (await grid.endRowEdit()) grid.setOptions({ groupColumns: [], filter: undefined, orderBy: [] });
    } }, "Reset view");
    const group = cbutton({ type: "button", ui: ["elg", "btn", "neutral"], onclick: async () => {
        if (await grid.endRowEdit()) grid.setOptions({ groupColumns: ["destination"] });
    } }, "Group by destination");
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2", "min-w-0"] },
        cdiv({ ui: ["d-flex", "items-center", "justify-between", "gap-2", "flex-wrap"] },
            status, cdiv({ ui: ["d-flex", "gap-2"] }, group, reset)), grid);
    root.mount(document.body);
    const subscription = source.changed.subscribe(() => { status.textContent = `${rows.length} orders · changes stay in this demo`; });
    window.addEventListener("pagehide", () => { subscription.dispose(); root.dispose(); }, { once: true });
}
