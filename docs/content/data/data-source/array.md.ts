import { ArrayDataSource, cdiv, e, type NewRowSession } from "../../../../src/index";

export default function demo(): void {
    type Product = { id: string | number; name: string; price: number; stock: number };
    const products: Product[] = [
        { id: 1, name: "Wireless keyboard", price: 49, stock: 12 },
        { id: 2, name: "USB-C docking station", price: 189, stock: 5 },
        { id: 3, name: "Wireless mouse", price: 23, stock: 18 }
    ];
    const source = new ArrayDataSource(products, {
        defaults: () => ({ name: "", price: 0, stock: 0 }),
        createRowId: () => crypto.randomUUID()
    });
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2"] });
    const body = e("tbody", {});
    const status = e("p", { ui: ["m-0", "text-muted"], role: "status" }, "Changes apply directly to the local array.");
    const log = e("pre", { ui: ["m-0", "overflow-auto", "fs-90"], style: { maxHeight: "130px" } });
    const events: string[] = [];
    let row: Product | undefined;
    let draft: NewRowSession<Product> | undefined;
    let busy = false;
    let revision = 0;
    const dialog = e("dialog", { ui: ["elg", "surface", "border-0", "rounded-2", "p-3"],
        style: { width: "min(360px, calc(100% - 40px))" } });
    const title = e("h3", { ui: ["m-0"] }, "Product");
    const name = e("input", { ui: ["elg", "field", "min-w-0"], required: true, ariaLabel: "Product name" });
    const price = e("input", { ui: ["elg", "field", "min-w-0"], type: "number", min: "0", step: "0.01", required: true, ariaLabel: "Price" });
    const stock = e("input", { ui: ["elg", "field", "min-w-0"], type: "number", min: "0", step: "1", required: true, ariaLabel: "Stock" });
    const error = e("p", { ui: ["m-0", "text-danger"], role: "alert" });
    const form = e("form", { ui: ["d-flex", "flex-col", "gap-2"] });
    const button = (text: string) => e("button", { ui: ["elg", "btn", "neutral"], type: "button" }, text);
    const add = button("Add product");
    const cancel = button("Cancel");
    const ok = e("button", { ui: ["elg", "btn", "primary"], type: "button" }, "OK");

    async function run(action: () => Promise<void>): Promise<void> {
        if (busy) return;
        busy = true;
        add.disabled = cancel.disabled = ok.disabled = true;
        for (const field of [name, price, stock]) field.disabled = true;
        error.textContent = "";
        try { await action(); }
        catch (reason) {
            error.textContent = reason instanceof Error ? reason.message : String(reason);
            status.textContent = error.textContent;
        } finally {
            busy = false;
            add.disabled = cancel.disabled = ok.disabled = false;
            for (const field of [name, price, stock]) field.disabled = false;
            await refresh();
        }
    }

    function open(product: Product, session?: NewRowSession<Product>): void {
        row = product;
        draft = session;
        title.textContent = session ? "Add product" : "Edit product";
        name.value = product.name;
        price.value = String(product.price);
        stock.value = String(product.stock);
        error.textContent = "";
        dialog.showModal();
    }

    function close(): void {
        dialog.close();
        row = undefined;
        draft = undefined;
    }

    async function refresh(): Promise<void> {
        const current = ++revision;
        const result = await source.loadData({});
        if (current !== revision) return;
        body.replaceChildren(...(result.dataItems ?? []).map(product => {
            const edit = button("Edit");
            edit.onclick = () => { if (!busy) open(product); };
            const remove = button("Delete");
            remove.onclick = () => { void run(async () => {
                const result = await source.delete(product);
                if (!result.success) throw new Error(result.error);
                status.textContent = "Product removed from the array.";
            }); };
            edit.disabled = remove.disabled = busy;
            return e("tr", {}, e("td", {}, product.name),
                e("td", {}, "$" + product.price.toFixed(2)), e("td", {}, String(product.stock)),
                e("td", {}, e("div", { ui: ["d-flex", "gap-1"] }, edit, remove)));
        }));
    }

    add.onclick = () => { void run(async () => {
        const session = await source.createNewRow();
        open(session.row, session);
        status.textContent = "Draft initialized. It is not in the product list yet.";
    }); };
    cancel.onclick = () => { void run(async () => {
        if (draft) await draft.cancel();
        close();
        status.textContent = "Form cancelled. The product list was not changed.";
    }); };
    function accept(): void {
        if (busy || !row || !form.reportValidity()) return;
        if (!name.value.trim()) { error.textContent = "Enter a product name."; return; }
        const product = row;
        const session = draft;
        const values = { name: name.value.trim(), price: Number(price.value), stock: Number(stock.value) };
        void run(async () => {
            const updated = await source.update(product, values);
            if (!updated.success) throw new Error(updated.error);
            if (session) {
                const inserted = await session.insert();
                if (!inserted.success) throw new Error(inserted.error);
            }
            close();
            status.textContent = "Product accepted. The source has updated the local array.";
        });
    }
    ok.onclick = accept;
    root.listen(form, "submit", event => { event.preventDefault(); accept(); });
    root.listen(form, "keydown", event => {
        const key = event as KeyboardEvent;
        if (key.key === "Enter" && key.target instanceof HTMLInputElement) { key.preventDefault(); accept(); }
    });
    root.listen(dialog, "cancel", event => { event.preventDefault(); if (!busy) cancel.click(); });
    root.addCleanup(source.changed.subscribe(event => {
        events.push(event.kind + (event.fields ? " [" + event.fields.join(", ") + "]" : "") + " | " + JSON.stringify(event.row));
        log.textContent = events.slice(-20).join("\n");
        void refresh();
    }));
    form.append(title,
        e("label", { ui: ["d-flex", "flex-col", "min-w-0"] }, "Product name", name),
        e("div", { ui: ["d-flex", "flex-wrap", "gap-2"] },
            e("label", { ui: ["d-flex", "flex-col", "flex-1", "min-w-0"], style: { flexBasis: "130px" } }, "Price", price),
            e("label", { ui: ["d-flex", "flex-col", "flex-1", "min-w-0"], style: { flexBasis: "130px" } }, "Stock", stock)),
        error, e("div", { ui: ["d-flex", "justify-end", "gap-2"] }, cancel, ok));
    dialog.append(form);
    root.append([e("div", {}, add),
        e("div", { ui: ["overflow-auto"] }, e("table", { ui: ["elg", "table", "table-row-borders", "w-100"] },
            e("thead", {}, e("tr", {}, ...["Product", "Price", "Stock", "Actions"].map(text => e("th", {}, text)))), body)),
        status, e("details", {}, e("summary", {}, "Change notifications"), log), dialog]);
    root.addCleanup(() => dialog.close());
    root.mount(document.body);
    void refresh();
}
