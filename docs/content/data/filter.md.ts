import { ArrayDataSource, DataFilterRow, FilterEditor, cdiv, e, evalFilter,
    type DataFilter, type FilterEditorColumn } from "../../../src/index";

export default function demo(): void {
    type Product = { name: string; category: string; price: number; stock: number; received: Date };
    const products: Product[] = [
        { name: "Wireless keyboard", category: "Accessories", price: 49, stock: 12, received: new Date(2026, 0, 12) },
        { name: "USB-C docking station", category: "Accessories", price: 189, stock: 5, received: new Date(2026, 1, 3) },
        { name: "Wireless mouse", category: "Accessories", price: 23, stock: 0, received: new Date(2025, 11, 20) },
        { name: "Laptop stand", category: "Office", price: 35, stock: 9, received: new Date(2026, 2, 8) },
        { name: "27-inch monitor", category: "Displays", price: 249, stock: 4, received: new Date(2026, 0, 29) },
        { name: "Desk lamp", category: "Office", price: 39, stock: 0, received: new Date(2025, 10, 15) }
    ];
    const columns: FilterEditorColumn<Product>[] = [
        { name: "name", caption: "Product", dataType: "string" },
        { name: "category", caption: "Category", dataType: "string" },
        { name: "price", caption: "Price", dataType: "number" },
        { name: "stock", caption: "Stock", dataType: "number" },
        { name: "received", caption: "Received", dataType: "date" }
    ];
    const source = new ArrayDataSource(products);
    const filterRow = new DataFilterRow(columns);
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2"] });
    const body = e("tbody", {});
    const summary = e("p", { ui: ["m-0"], role: "status" });
    const json = e("pre", { ui: ["m-0", "overflow-auto"], style: { maxHeight: "170px" } });
    const expressions = e("pre", { ui: ["m-0", "overflow-auto", "fs-90"] });
    const note = e("p", { ui: ["m-0", "text-muted"], hidden: true },
        "NOT is evaluated by DataFilter but cannot yet be edited with FilterEditor. Choose another example to edit.");
    const expression = e("input", { ui: ["elg", "field", "min-w-0"], ariaLabel: "Price expression",
        placeholder: "20..100, 100.. or ..50" });
    const expressionError = e("span", { ui: ["text-danger"], role: "alert" });
    const button = (text: string) => e("button", { ui: ["elg", "btn", "neutral"], type: "button" }, text);
    const presets: { text: string; filter?: DataFilter; not?: boolean }[] = [
        { text: "All products" },
        { text: "In-stock accessories", filter: ["and", ["category", "=", "Accessories"], ["stock", ">", 0]] },
        { text: "Nested AND / OR", filter: ["and", ["stock", ">", 0],
            ["or", ["category", "=", "Office"], ["price", ">=", 150]]] },
        { text: "NOT in stock", filter: ["!", ["stock", ">", 0]], not: true },
        { text: "Price 20..100", filter: ["and", ["price", ">=", 20], ["price", "<=", 100]] },
        { text: "Received in 2026", filter: ["and",
            ["received", ">=", new Date(2026, 0, 1)], ["received", "<=", new Date(2026, 11, 31)]] }
    ];
    let revision = 0;
    const editor = new FilterEditor<Product>({
        columns,
        ui: ["elg", "surface-2", "rounded-2", "p-2"],
        onApply: filter => { void display(filter); }
    });

    async function display(filter?: DataFilter): Promise<void> {
        const current = ++revision;
        const result = await source.loadData({ filter });
        if (current !== revision) return;
        const matches = result.dataItems ?? [];
        const evaluated = products.filter(product => !filter || evalFilter(product, filter));
        summary.textContent = (filterRow.toText(filter) || "No filter") +
            " — " + matches.length + " / " + products.length + " products (evalFilter: " + evaluated.length + ").";
        json.textContent = filter ? JSON.stringify(filter, null, 2) : "undefined — all products";
        const rowValues = filterRow.fromFilter(filter);
        expressions.textContent = rowValues === false
            ? "fromFilter → false: this filter cannot be represented as one expression per field."
            : "fromFilter → " + JSON.stringify(rowValues, null, 2);
        body.replaceChildren(...matches.map(product => e("tr", {},
            e("td", {}, product.name), e("td", {}, product.category),
            e("td", {}, "$" + product.price.toFixed(2)), e("td", {}, String(product.stock)),
            e("td", {}, product.received.toLocaleDateString("en-GB")))));
    }

    function setExample(filter?: DataFilter, not = false): void {
        editor.dom.hidden = not;
        note.hidden = !not;
        expressionError.textContent = "";
        // Do not give an unsupported NOT node to the visual editor.
        if (!not) editor.setFilter(filter);
        void display(filter);
    }
    const presetButtons = presets.map(preset => {
        const control = button(preset.text);
        control.onclick = () => setExample(preset.filter, preset.not);
        return control;
    });
    const applyExpression = button("Apply price expression");
    function applyPrice(): void {
        const text = expression.value.trim();
        const parsed = filterRow.parse("price", text);
        if (text && !parsed) { expressionError.textContent = "Enter a valid numeric expression."; return; }
        setExample(parsed);
    }
    applyExpression.onclick = applyPrice;
    root.listen(expression, "keydown", event => {
        if ((event as KeyboardEvent).key === "Enter") { event.preventDefault(); applyPrice(); }
    });
    root.addCleanup(() => editor.dispose());
    root.append([
        e("div", { ui: ["d-flex", "flex-wrap", "gap-1"] }, ...presetButtons),
        note, editor,
        e("div", { ui: ["d-flex", "flex-wrap", "items-center", "gap-2"] },
            e("label", {}, "Price expression (replaces filter): ", expression), applyExpression, expressionError),
        summary,
        e("div", { ui: ["overflow-auto"] }, e("table", { ui: ["elg", "table", "table-row-borders", "w-100"] },
            e("thead", {}, e("tr", {}, ...["Product", "Category", "Price", "Stock", "Received"].map(text => e("th", {}, text)))), body)),
        e("details", {}, e("summary", {}, "Filter JSON and filter-row expressions"), json, expressions)
    ]);
    root.mount(document.body);
    setExample(presets[1].filter);
}
