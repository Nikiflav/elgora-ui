import { ArrayDataSource, LocalGroupingDataSource, DataGrid, type DataSource, type MutationResult, e } from "../../../../src/index";

export default function demo(): void {
    type Row = { id: number; product: string; quantity: number };
    const rows: Row[] = [{ id: 1, product: "Keyboard", quantity: 2 }, { id: 2, product: "Mouse", quantity: 5 }];
    const status = e("p", { ui: ["text-muted", "m-0", "mb-2"], role: "status" }, "Quantity above 100 is rejected remotely.");
    // These two providers simulate server-side storage and query processing.
    // A real remote source sends QueryArgs to an endpoint instead.
    let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    const storage = new ArrayDataSource(rows, { createRowId: () => nextId++, defaults: () => ({ product: "New product", quantity: 1 }) });
    const queries = new LocalGroupingDataSource(storage,
        async (row, field) => row[field as keyof Row],
        name => ({ name, dataType: name === "quantity" ? "number" : "string" }));
    const delay = () => new Promise(resolve => setTimeout(resolve, 600));
    const validate = (row: Row): MutationResult => {
        const fieldErrors: Record<string, string> = {};
        if (!row.product?.trim()) fieldErrors.product = "Product is required.";
        if (!Number.isFinite(row.quantity) || row.quantity <= 0 || row.quantity > 100)
            fieldErrors.quantity = "Remote quantity must be greater than 0 and at most 100.";
        return Object.keys(fieldErrors).length
            ? { success: false, error: "Row rejected. Correct the highlighted values.", fieldErrors }
            : { success: true };
    };
    // A projected response is a value object; mutations locate its stored row by identity.
    const storedRow = (row: Row) => rows.find(item => item.id === row.id) ?? row;
    const source: DataSource<Row> = {
        changed: storage.changed,
        getRowId: row => row.id,
        loadData: async args => {
            args.abortSignal?.throwIfAborted();
            const result = await queries.loadData(args);
            args.abortSignal?.throwIfAborted();
            if (args.select && result.dataItems) {
                const fields = new Set(["id", ...args.select]);
                result.dataItems = result.dataItems.map(row =>
                    Object.fromEntries([...fields].map(field => [field, row[field as keyof Row]])) as Row);
            }
            return { ...result, args };
        },
        update: async (row, values) => {
            status.textContent = "Saving…";
            await delay();
            const actual = storedRow(row);
            const validation = validate({ ...actual, ...values });
            if (!validation.success) {
                status.textContent = validation.error; return validation;
            }
            const result = await storage.update(actual, values);
            status.textContent = result.success ? `Saved row ${actual.id}: quantity ${actual.quantity}.` : result.error;
            return result;
        },
        createNewRow: async () => {
            status.textContent = "Initializing new row…";
            await delay();
            const session = await storage.createNewRow();
            status.textContent = "New row is pending. Complete its fields, then leave the row to insert.";
            return {
                row: session.row,
                get state() { return session.state; },
                insert: async () => {
                    status.textContent = "Inserting…"; await delay();
                    if (session.state === "pending") {
                        const validation = validate(session.row);
                        if (!validation.success) { status.textContent = validation.error; return validation; }
                    }
                    const result = await session.insert();
                    status.textContent = result.success ? "New row inserted." : result.error;
                    return result;
                },
                cancel: async () => {
                    await session.cancel(); status.textContent = "New row cancelled.";
                }
            };
        },
        delete: async row => {
            status.textContent = "Deleting…"; await delay();
            const result = await storage.delete(storedRow(row));
            status.textContent = result.success ? "Row deleted." : result.error;
            return result;
        }
    };
    document.body.append(status);
    const grid = new DataGrid({ data: source, allowEdit: true, showGroupPanel: false,
        columns: [{ name: "product", caption: "Product", required: true },
            { name: "quantity", caption: "Quantity", dataType: "number", validate: value => value > 0 ? undefined : "Enter a positive quantity." }],
        totalSummary: [{ field: "quantity", summaryType: "sum" }] });
    grid.dom.style.height = "240px";
    grid.mount(document.body);
}
