import { afterEach, describe, expect, it } from "vitest";
import { DataForm } from "../../src/components/dataform/DataForm";
import { DataSet } from "../../src/data/dataset/DataSet";

const owned: DataForm<any>[] = [];
afterEach(() => { owned.splice(0).forEach(form => form.dispose()); });

describe("DataForm", () => {
    it("interleaves groups and rows and restores collapsed state by stable ID", () => {
        const fields = ["a", "b", "c", "d"].map(name => ({ name }));
        const layout = [
            { fields: [{ field: "a" }] },
            { id: "middle", title: "Middle", collapsible: true, rows: [{ fields: [{ field: "b" }] }] },
            { fields: [{ field: "c" }] },
            { id: "last", title: "Last", rows: [{ fields: [{ field: "d" }] }] }
        ];
        const form = new DataForm({ data: {}, fields, layout }); owned.push(form);
        expect([...form.dom.querySelectorAll<HTMLElement>(".elg-data-form-field")].map(field => field.dataset.field)).toEqual(["a", "b", "c", "d"]);
        const group = form.dom.querySelector("details")!;
        expect(group.open).toBe(true);
        group.open = false;
        const replacement = new DataForm({ data: {}, fields, layout, groupState: form.getGroupState() }); owned.push(replacement);
        expect(replacement.dom.querySelector("details")!.open).toBe(false);
        expect(replacement.dom.querySelector('section[data-group="last"] h3')!.textContent).toBe("Last");
    });
    it("renders mixed rows in layout order and preserves direct action hosts", async () => {
        const form = new DataForm({ data: { a: "A", b: "B" }, fields: [
            { name: "a" }, { name: "b" }, { name: "actions", type: "buttons", buttons: [{ id: "go", text: "Go" }] }
        ], layout: [
            { display: "grid", labelPosition: "start", fields: [{ field: "b", span: 6 }, { field: "a", span: 6 }] },
            { labelPosition: "none", fields: [{ field: "actions" }] }
        ] });
        owned.push(form); form.mount(document.body);
        await new Promise(resolve => setTimeout(resolve, 0));
        const rows = form.dom.querySelectorAll(".elg-data-form-layout-row");
        expect(rows).toHaveLength(2);
        expect([...form.dom.querySelectorAll<HTMLElement>(".elg-data-form-field")].map(row => row.dataset.field)).toEqual(["b", "a", "actions"]);
        const host = rows[1].querySelector(".elg-data-form-buttons-host")!;
        expect(host.querySelector(":scope > button")).not.toBeNull();
        expect(rows[1].querySelector("label")).toBeNull();
    });
    it("edits a plain object through its generated adapter", async () => {
        const order = { id: 1, name: "Initial" };
        const form = new DataForm({ data: order, fields: [{ name: "name", caption: "Name" }] });
        owned.push(form); form.mount(document.body);
        (form.dom.querySelector(".elg-data-form-value") as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 0));
        const input = form.dom.querySelector<HTMLInputElement>("input, textarea")!;
        input.value = "Updated"; input.dispatchEvent(new Event("input", { bubbles: true }));
        expect(await form.finishEdit()).toBe(true);
        expect(form.value).not.toBe(order);
        expect((form.value as typeof order).name).toBe("Updated");
        expect(order.name).toBe("Initial");
    });

    it("updates a DataRow through its table contract", async () => {
        const dataset = new DataSet();
        const table = dataset.createTable("orders", [{ id: 1, name: "Initial" }]);
        const row = table.rows[0];
        const form = new DataForm({ data: row, fields: [{ name: "name", caption: "Name" }] });
        owned.push(form); form.mount(document.body);
        (form.dom.querySelector(".elg-data-form-value") as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 0));
        const input = form.dom.querySelector<HTMLInputElement>("input, textarea")!;
        input.value = "Updated"; input.dispatchEvent(new Event("input", { bubbles: true }));
        expect(await form.finishEdit()).toBe(true);
        expect(row.getValue("name")).toBe("Updated");
        expect(row.state).toBe("modified");
    });

    it("uses the date display format in the built-in editor while keeping the ISO value", async () => {
        const form = new DataForm({ data: { deliveryDate: "2026-10-14" }, fields: [
            { name: "deliveryDate", caption: "Delivery date", dataType: "date", displayFormat: "dd.MM.yyyy" }
        ] });
        owned.push(form); form.mount(document.body);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(form.dom.querySelector(".elg-data-form-value")?.textContent).toContain("14.10.2026");
        (form.dom.querySelector(".elg-data-form-value") as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(form.dom.querySelector<HTMLInputElement>("input")?.value).toBe("14.10.2026");
        expect((form.value as any).deliveryDate).toBe("2026-10-14");
    });

    it("commits and navigates with Enter/Tab, and cancels with Escape", async () => {
        const form = new DataForm({ data: { first: "A", second: "B" }, fields: [
            { name: "first", caption: "First" }, { name: "second", caption: "Second" }
        ] });
        owned.push(form); form.mount(document.body);
        const cells = [...form.dom.querySelectorAll<HTMLElement>(".elg-data-form-value")];
        cells[0].click(); await new Promise(resolve => setTimeout(resolve, 0));
        const input = form.dom.querySelector<HTMLInputElement>("input")!;
        input.value = "Changed"; input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect((form.value as any).first).toBe("Changed");
        expect(document.activeElement).toBe(form.dom.querySelectorAll("input")[0]);

        cells[1].click(); await new Promise(resolve => setTimeout(resolve, 0));
        const secondInput = form.dom.querySelector<HTMLInputElement>("input")!;
        secondInput.value = "Discarded"; secondInput.dispatchEvent(new Event("input", { bubbles: true }));
        secondInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        expect((form.value as any).second).toBe("B");
        expect(document.activeElement).toBe(cells[1]);
    });

    it("starts editing with the typed character when a value cell is focused", async () => {
        const form = new DataForm({ data: { name: "Initial" }, fields: [{ name: "name", caption: "Name" }] });
        owned.push(form); form.mount(document.body);
        const cell = form.dom.querySelector<HTMLElement>(".elg-data-form-value")!;
        cell.focus();
        cell.dispatchEvent(new KeyboardEvent("keydown", { key: "X", bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(form.dom.querySelector<HTMLInputElement>("input")?.value).toBe("X");
        expect((form.value as any).name).toBe("Initial");
    });

    it("keeps subsequent numeric keystrokes inside the active editor", async () => {
        const form = new DataForm({ data: { quantity: 12 }, fields: [
            { name: "quantity", caption: "Quantity", dataType: "number" }
        ] });
        owned.push(form); form.mount(document.body);
        const cell = form.dom.querySelector<HTMLElement>(".elg-data-form-value")!;
        cell.focus();
        cell.dispatchEvent(new KeyboardEvent("keydown", { key: "3", bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        const input = form.dom.querySelector<HTMLInputElement>("input")!;
        input.value = "34";
        const secondKey = new KeyboardEvent("keydown", { key: "4", bubbles: true, cancelable: true });
        input.dispatchEvent(secondKey);
        expect(secondKey.defaultPrevented).toBe(false);
        expect(form.dom.querySelector(".elg-data-form-value-editing")).not.toBeNull();
    });

    it("renders a buttons field without entering value editing", async () => {
        const calls: any[] = [];
        const form = new DataForm({ data: { name: "Initial" }, fields: [
            { name: "name", caption: "Name" },
            { name: "actions", type: "buttons", caption: "Actions", buttons: [
                { id: "inspect", text: "Inspect", ui: "btn-ghost", visible: ({ row }) => row?.name === "Initial",
                    onClick: context => calls.push(context) }
            ] }
        ] });
        owned.push(form); form.mount(document.body);
        const button = form.dom.querySelector<HTMLButtonElement>(".elg-data-form-action-button")!;
        expect(button).not.toBeNull();
        button.click();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(calls).toHaveLength(1);
        expect(calls[0].field.name).toBe("actions");
        expect(calls[0].row.name).toBe("Initial");
        expect(form.dom.querySelector("input, textarea")).toBeNull();
        expect(button.classList.contains("elg-btn-ghost")).toBe(true);
    });
});
