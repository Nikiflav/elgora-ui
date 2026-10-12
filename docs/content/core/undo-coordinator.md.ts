import { UndoCoordinator, DataSet, cdiv, e } from "../../../src/index";

export default function demo(): void {
    const coordinator = new UndoCoordinator();
    const viewHistory = coordinator.createHistory("view");
    const dataset = new DataSet({ undoCoordinator: coordinator });
    const table = dataset.createTable("items", [{ id: 1, amount: 20 }]);
    const row = table.rows[0];
    let compact = false;
    let working = false;
    const events: string[] = [];
    const root = cdiv({ ui: ["elg", "d-flex", "flex-col", "gap-2"] });
    const input = e("input", { ui: ["elg", "field"], type: "number", ariaLabel: "Amount", value: "20" });
    const status = e("p", { ui: ["elg", "m-0", "text-muted"], role: "status" });
    const preview = e("div", { ui: ["elg", "surface-2", "p-3"] });
    const scopeInfo = e("pre", { ui: ["elg", "m-0", "overflow-auto"] });
    const log = e("pre", { ui: ["elg", "m-0", "text-muted", "overflow-auto"], style: { maxHeight: "120px" } });
    const controls: HTMLButtonElement[] = [];
    const button = (label: string, action: () => void | Promise<unknown>) => {
        const node = e("button", { ui: ["elg", "btn", "neutral"], type: "button" }, label);
        controls.push(node);
        node.onclick = () => { void run(action); };
        return node;
    };
    const undo = button("Undo", () => coordinator.undo());
    const redo = button("Redo", () => coordinator.redo());
    const apply = button("Apply amount", async () => { await row.setValue("amount", Number(input.value)); });
    const toggle = button("Toggle view", () => {
        coordinator.ensureIdle();
        const before = compact, after = !before;
        compact = after;
        viewHistory.record({
            label: "Toggle view",
            undo: () => { compact = before; },
            redo: () => { compact = after; },
            afterReplay: paint
        });
    });
    const save = button("Save data", async () => {
        await dataset.saveChanges(async () => ({ success: true }));
        status.textContent = "Data baseline accepted. View history is unchanged.";
    });
    function paint(): void {
        input.value = String(row.getValue("amount"));
        preview.textContent = (compact ? "Compact" : "Detailed") + " view · Amount: " + row.getValue("amount");
        preview.classList.toggle("elg-p-3", !compact);
        preview.classList.toggle("elg-p-1", compact);
        scopeInfo.textContent = JSON.stringify({
            journal: { canUndo: coordinator.canUndo, canRedo: coordinator.canRedo, busy: coordinator.busy },
            data: { canUndo: dataset.undoHistory.canUndo, canRedo: dataset.undoHistory.canRedo },
            view: { canUndo: viewHistory.canUndo, canRedo: viewHistory.canRedo }
        }, null, 2);
        log.textContent = events.slice(-8).join("\n");
        for (const control of controls) control.disabled = working || coordinator.busy;
        input.disabled = working || coordinator.busy;
        undo.disabled ||= !coordinator.canUndo;
        redo.disabled ||= !coordinator.canRedo;
    }
    async function run(action: () => void | Promise<unknown>): Promise<void> {
        if (working) return;
        working = true;
        try { await action(); }
        catch (error) { status.textContent = String(error); }
        finally { working = false; paint(); }
    }
    root.listen(input, "change", () => {
        const value = Number(input.value);
        void run(async () => { await row.setValue("amount", value); });
    });
    root.addCleanup(coordinator.changed.subscribe(paint));
    root.addCleanup(dataset.undoHistory.changed.subscribe(kind => { events.push("Data: " + kind); }));
    root.addCleanup(viewHistory.changed.subscribe(kind => { events.push("View: " + kind); }));
    root.addCleanup(dataset.undoHistory.returnedToBaseline.subscribe(() => { events.push("Data baseline reached"); }));
    root.addCleanup(viewHistory.returnedToBaseline.subscribe(() => { events.push("View baseline reached"); }));
    root.append([
        e("label", {}, "Amount ", input),
        e("div", { ui: ["elg", "d-flex", "flex-wrap", "gap-2"] }, apply, undo, redo, toggle, save),
        status, preview, scopeInfo, log
    ]);
    root.mount(document.body);
    paint();
}
