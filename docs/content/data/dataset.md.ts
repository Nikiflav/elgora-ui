import { DataSet, cdiv, e, type NewRowSession, type DataRow, type DataRowChangeEvent } from "../../../src/index";

export default function demo(): void {
    const dataset = new DataSet({ createRowId: () => crypto.randomUUID() });
    const headers = dataset.createTable("salesOrders", [
        { id: "SO-1042", customer: "Northwind Office", date: "2026-04-15", total: 379 }
    ]);
    const header = headers.getRow("SO-1042")!;
    let lastLineId = 0;
    const lines = dataset.createTable("salesOrderLines", [
        { id: 1, orderId: header.key, product: "Wireless keyboard", quantity: 2, price: 49, total: 98 },
        { id: 2, orderId: header.key, product: "USB-C docking station", quantity: 1, price: 189, total: 189 },
        { id: 3, orderId: header.key, product: "Wireless mouse", quantity: 4, price: 23, total: 92 }
    ], {
        // Include accepted server mappings as well as locally issued identities.
        createRowId: table => lastLineId = table.rows.reduce((max, row) => Math.max(max, Number(row.key)), lastLineId) + 1,
        defaults: () => ({ orderId: header.key, product: "", quantity: 1, price: 0, total: 0 })
    });
    const coordinator = dataset.undoCoordinator;
    const drafts: NewRowSession<DataRow>[] = [];
    const money = (value: unknown) => new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD"
    }).format(Number(value));
    const round = (value: number) => Math.round(value * 100) / 100;
    const events: string[] = [];
    let sequence = 0;
    let busy = false;
    let serverId = 100;
    let editing: DataRow | undefined;
    let newRowSession: NewRowSession<DataRow> | undefined;
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2"] });
    const status = e("p", { ui: ["m-0", "text-muted"], role: "status" }, "Edit or add a line. Changes stay local until Save order.");
    const tbody = e("tbody", {});
    const total = e("strong", {});
    const log = e("pre", { ui: ["m-0", "overflow-auto", "fs-90"], style: { maxHeight: "210px" } });
    const changes = e("pre", { ui: ["surface-2", "p-2", "m-0", "overflow-auto"], style: { maxHeight: "180px" } });
    const failSave = e("input", { type: "checkbox" });
    const dialog = e("dialog", { ui: ["surface", "border-0", "rounded-2", "p-3"],
        style: { width: "min(380px, calc(100% - 40px))" } });
    const title = e("h3", { ui: ["m-0"] }, "Edit order line");
    const form = e("form", { ui: ["d-flex", "flex-col", "gap-2"] });
    const product = e("input", { ui: ["elg", "field", "min-w-0"], required: true, ariaLabel: "Product" });
    const quantity = e("input", { ui: ["elg", "field", "min-w-0"], type: "number", required: true,
        min: "1", step: "1", ariaLabel: "Quantity" });
    const price = e("input", { ui: ["elg", "field", "min-w-0"], type: "number", required: true,
        min: "0", step: "0.01", ariaLabel: "Unit price" });
    const formError = e("p", { ui: ["m-0", "text-danger"], role: "alert" });
    const controls: HTMLButtonElement[] = [];

    function appendLog(message: string): void {
        events.push(String(++sequence).padStart(3, "0") + "  " + message);
        if (events.length > 80) events.shift();
        log.textContent = events.join("\n");
        log.scrollTop = log.scrollHeight;
    }

    // Business events expose proposed/applied values and their previous values.
    function logBusiness(phase: string, event: DataRowChangeEvent): void {
        const details = event.kind === "update"
            ? event.fields.map(field => field + ": " + JSON.stringify(event.oldValues[field]) +
                " → " + JSON.stringify(event.values[field])).join(", ")
            : JSON.stringify(event.values);
        appendLog(phase + " [" + event.context.transaction.label + "] " +
            event.row.table.name + " #" + event.row.key + " " + event.kind + " | " + details);
    }

    function button(label: string, action: () => void | Promise<unknown>): HTMLButtonElement {
        const control = e("button", { ui: ["elg", "btn", "neutral"], type: "button" }, label);
        controls.push(control);
        control.onclick = () => { void run(action); };
        return control;
    }

    async function run(action: () => void | Promise<unknown>): Promise<void> {
        if (busy) return;
        busy = true;
        formError.textContent = "";
        paint();
        try { await action(); }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            status.textContent = message;
            formError.textContent = message;
            appendLog("FAILED | " + message + " | order total remains " + header.getValue("total"));
        } finally { busy = false; paint(); }
    }

    function openForm(row: DataRow, session?: NewRowSession<DataRow>): void {
        editing = row;
        newRowSession = session;
        title.textContent = session ? "Add order line" : "Edit order line";
        product.value = String(row.getValue("product"));
        quantity.value = String(row.getValue("quantity"));
        price.value = String(row.getValue("price"));
        formError.textContent = "";
        dialog.showModal();
    }

    function closeForm(): void {
        dialog.close();
        editing = undefined;
        newRowSession = undefined;
    }

    const add = button("Add line", async () => {
        const pending = drafts.find(draft => draft.state === "pending");
        const session = pending ?? await lines.createNewRow();
        if (!pending) drafts.push(session);
        openForm(session.row, session);
    });
    const undo = button("Undo", async () => {
        await coordinator.undo();
        status.textContent = drafts.some(draft => draft.state === "pending")
            ? "Insertion undone. Resume the draft to finish or cancel it before saving."
            : "Last action undone, including its calculated totals.";
    });
    const redo = button("Redo", async () => {
        await coordinator.redo();
        status.textContent = "Last action restored, including its calculated totals.";
    });
    const save = button("Save order", async () => {
        const result = await dataset.saveChanges(async batch => {
            appendLog("SERVER request | " + JSON.stringify(batch));
            await new Promise<void>(resolve => setTimeout(resolve, 400));
            if (failSave.checked) return { success: false, error: "The server rejected this order. Local changes are retained." };
            const keyMappings = { salesOrderLines: lines.getChanges()
                .filter(change => change.type === "insert")
                .map(change => ({ temporaryKey: change.key!, key: ++serverId })) };
            appendLog("SERVER success | key mappings " + JSON.stringify(keyMappings));
            return { success: true, keyMappings };
        });
        if (!result.success) throw new Error(result.error);
        status.textContent = "Order saved. Local changes and data undo history have been cleared.";
    });
    const cancel = button("Cancel", async () => {
        if (newRowSession) await newRowSession.cancel();
        closeForm();
        status.textContent = "Form cancelled. Existing line values were not changed.";
    });
    const ok = e("button", { ui: ["elg", "btn", "primary"], type: "button" }, "OK");
    controls.push(ok);
    form.append(title,
        e("label", { ui: ["d-flex", "flex-col", "min-w-0"] }, "Product", product),
        e("div", { ui: ["d-flex", "flex-wrap", "gap-2"] },
            e("label", { ui: ["d-flex", "flex-col", "flex-1", "min-w-0"],
                style: { flexBasis: "140px" } }, "Quantity", quantity),
            e("label", { ui: ["d-flex", "flex-col", "flex-1", "min-w-0"],
                style: { flexBasis: "140px" } }, "Unit price", price)),
        formError, e("div", { ui: ["d-flex", "justify-end", "gap-2"] }, cancel, ok));
    dialog.append(form);
    function acceptForm(): void {
        if (!editing || !form.reportValidity()) return;
        const row = editing;
        const session = newRowSession;
        const values = { product: product.value.trim(), quantity: Number(quantity.value), price: Number(price.value) };
        void run(async () => {
            // One OK produces one undoable action, including both calculated totals.
            const result = await dataset.transaction(session ? "Insert order line" : "Edit order line", async tx => {
                await tx.update(lines, row, values);
                if (session) await tx.insert(session);
            });
            if (!result.success) throw new Error(result.error);
            closeForm();
            status.textContent = "Line accepted locally. Save order sends all accumulated changes to the server.";
        });
    }
    // The preview sandbox disables native form submission. Apply locally instead.
    ok.onclick = acceptForm;
    root.listen(form, "submit", event => { event.preventDefault(); acceptForm(); });
    root.listen(form, "keydown", event => {
        const key = event as KeyboardEvent;
        if (key.key === "Enter" && key.target instanceof HTMLInputElement) {
            key.preventDefault();
            acceptForm();
        }
    });
    root.listen(dialog, "cancel", event => { event.preventDefault(); if (!busy) cancel.click(); });

    function paint(): void {
        tbody.replaceChildren(...lines.rows.filter(row => row.state !== "deleted").map(row => {
            const edit = e("button", { ui: ["elg", "btn", "neutral"], type: "button", disabled: busy || coordinator.busy }, "Edit");
            edit.onclick = () => { if (!busy) openForm(row); };
            const remove = e("button", { ui: ["elg", "btn", "neutral"], type: "button", disabled: busy || coordinator.busy }, "Delete");
            remove.onclick = () => { void run(async () => {
                const result = await lines.delete(row);
                if (!result.success) throw new Error(result.error);
                status.textContent = "Line removed locally. Undo restores it and the order total.";
            }); };
            return e("tr", {},
                e("td", {}, String(row.getValue("product"))),
                e("td", { ui: ["text-end"] }, String(row.getValue("quantity"))),
                e("td", { ui: ["text-end"] }, money(row.getValue("price"))),
                e("td", { ui: ["text-end"] }, money(row.getValue("total"))),
                e("td", {}, e("div", { ui: ["d-flex", "gap-1"] }, edit, remove)));
        }));
        total.textContent = "Order total: " + money(header.getValue("total"));
        changes.textContent = JSON.stringify(dataset.getChanges(), null, 2);
        for (const control of controls) control.disabled = busy || coordinator.busy;
        for (const input of [product, quantity, price]) input.disabled = busy || coordinator.busy;
        undo.disabled ||= !coordinator.canUndo || dialog.open;
        redo.disabled ||= !coordinator.canRedo || dialog.open;
        const pending = drafts.some(draft => draft.state === "pending");
        add.textContent = pending ? "Resume draft" : "Add line";
        save.disabled ||= pending;
    }

    root.addCleanup(lines.rowChanging.subscribe(event => {
        logBusiness("BEFORE", event);
        if (event.kind !== "update" && event.kind !== "insert") return;
        const values = { ...event.row.toObject(), ...event.values };
        if (!String(values.product).trim()) event.reject("Product is required.", { product: "Enter a product" });
        if (!Number.isInteger(values.quantity) || Number(values.quantity) <= 0)
            event.reject("Quantity must be a positive whole number.", { quantity: "Enter a positive whole number" });
        if (!Number.isFinite(values.price) || Number(values.price) < 0)
            event.reject("Unit price must be nonnegative.", { price: "Enter a nonnegative price" });
    }));
    root.addCleanup(lines.rowChanged.subscribe(async event => {
        logBusiness("AFTER", event);
        if (event.fields.includes("quantity") || event.fields.includes("price"))
            await event.context.setValue(event.row, "total", round(
                Number(event.row.getValue("quantity")) * Number(event.row.getValue("price"))));
        // Drafts calculate their own amount, but must not modify the order header.
        if (!event.row.isPending && (event.fields.includes("total") || event.kind === "insert" || event.kind === "delete"))
            await event.context.setValue(header, "total", round(lines.rows
                .filter(row => row.state !== "deleted")
                .reduce((sum, row) => sum + Number(row.getValue("total")), 0)));
    }));
    root.addCleanup(headers.rowChanging.subscribe(event => logBusiness("BEFORE", event)));
    root.addCleanup(headers.rowChanged.subscribe(event => logBusiness("AFTER", event)));
    for (const table of [headers, lines]) root.addCleanup(table.changed.subscribe(event => {
        appendLog("UI " + table.name + " " + event.kind + " | " + JSON.stringify(event.row
            ? { state: event.row.state, pending: event.row.isPending, ...event.row.toObject() }
            : table.rows.map(row => ({ state: row.state, ...row.toObject() }))));
        paint();
    }));
    root.addCleanup(dataset.undoHistory.changed.subscribe(kind => {
        appendLog("HISTORY " + kind + " | undo=" + coordinator.canUndo + ", redo=" + coordinator.canRedo);
    }));
    root.addCleanup(coordinator.changed.subscribe(() => paint()));
    root.append([
        e("div", { ui: ["d-flex", "justify-between", "gap-2"] },
            e("strong", {}, "Sales order " + header.key), e("span", { ui: ["text-muted"] }, String(header.getValue("date")))),
        e("p", { ui: ["m-0"] }, "Customer: " + header.getValue("customer")),
        e("div", { ui: ["d-flex", "gap-2", "flex-wrap"] }, add, undo, redo, save),
        e("div", { ui: ["overflow-auto"] }, e("table", { ui: ["elg", "table", "table-row-borders", "w-100"] },
            e("thead", {}, e("tr", {}, ...["Product", "Quantity", "Unit price", "Amount", "Actions"].map(label => e("th", {}, label)))), tbody)),
        e("div", { ui: ["text-end", "p-2"] }, total), status,
        e("details", {}, e("summary", {}, "Behind the scenes"),
            e("div", { ui: ["d-flex", "flex-col", "gap-2", "pt-2"] },
                e("label", {}, failSave, " Simulate server rejection"),
                e("strong", {}, "Changes to save"), changes,
                e("strong", {}, "Event log — transaction, table, row and values"), log)),
        dialog
    ]);
    root.addCleanup(() => dialog.close());
    root.mount(document.body);
    paint();
}
