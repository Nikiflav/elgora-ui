import { cdiv, e, v } from "../../../src/index";

export default function demo(): void {
    const root = cdiv({ ui: ["d-flex", "flex-col", "gap-2"] });
    const width = e("input", { type: "range", min: "280", max: "1200", step: "1",
        value: "640", ariaLabel: "Container width", ui: ["min-w-0", "flex-1"] });
    const output = e("output", { ui: ["text-muted"] });
    const grid = e("div", { ui: ["grid", "gap-2"], style: { width: "640px" } });
    const field = (label: string, value: string) => e("label", {
        ui: ["d-flex", "flex-col", "min-w-0", "col-12", "col-sm-6", "col-md-4", "col-lg-3"]
    }, label, e("input", { ui: ["elg", "field", "min-w-0"], value, ariaLabel: label }));
    grid.append(
        field("Customer", "Northwind Office"), field("Order number", "SO-1042"),
        field("Date", "2026-10-13"), field("Reference", "Website order"),
        field("Currency", "EUR"), field("Payment terms", "30 days"),
        e("label", { ui: ["d-flex", "flex-col", "min-w-0", "col-12", "col-sm-6", "col-md-8", "col-lg-6"] },
            "Address (larger span)", e("input", { ui: ["elg", "field", "min-w-0"], value: "14 Market Street", ariaLabel: "Address" })),
        e("label", { ui: ["d-flex", "flex-col", "min-w-0", "col-12"] }, "Notes (full row)",
            e("textarea", { ui: ["elg", "field", "min-w-0"], rows: 2, ariaLabel: "Notes" }, "Deliver during office hours."))
    );
    const contact = cdiv({ ui: ["elg", "surface-2", "p-2", "rounded-1", "col-12", "col-lg-6"] },
        e("strong", {}, "Contact — nested grid"),
        e("div", { ui: ["grid", "gap-2", "mt-1"] },
            e("label", { ui: ["d-flex", "flex-col", "min-w-0", "col-12", "col-sm-6"] }, "Email",
                e("input", { ui: ["elg", "field", "min-w-0"], value: "sales@example.com", ariaLabel: "Email" })),
            e("label", { ui: ["d-flex", "flex-col", "min-w-0", "col-12", "col-sm-6"] }, "Phone",
                e("input", { ui: ["elg", "field", "min-w-0"], value: "+359 2 123 4567", ariaLabel: "Phone" })))
    );
    contact.mount(grid);
    const totals = cdiv({ ui: ["col-12", "col-lg-6"] });
    // VNode styling uses the same utilities; this is patched content, not another layout API.
    totals.append(e("div", { vnodes: [v("div", { ui: ["grid", "gap-2"] },
        v("div", { ui: ["elg", "surface-2", "p-2", "rounded-1", "col-12", "col-sm-6"] }, "Subtotal: €420"),
        v("div", { ui: ["elg", "surface-2", "p-2", "rounded-1", "col-12", "col-sm-6"] }, "Total: €504")
    )] }));
    totals.mount(grid);
    function update(): void {
        grid.style.width = width.value + "px";
        const size = Number(width.value);
        const mode = size >= 1024 ? "lg: 4 fields / row" : size >= 768 ? "md: 3 fields / row"
            : size >= 480 ? "sm: 2 fields / row" : "base: 1 field / row";
        output.textContent = size + "px — " + mode;
    }
    root.listen(width, "input", update);
    const presets = [360, 480, 768, 1024].map(size => e("button", {
        ui: ["elg", "btn", "neutral"], type: "button", onclick: () => {
            width.value = String(size); update();
        }
    }, size + "px"));
    root.append([
        e("label", { ui: ["d-flex", "items-center", "gap-2"] }, "Container width", width),
        e("div", { ui: ["d-flex", "flex-wrap", "gap-1", "items-center"] }, ...presets, output),
        e("div", { ui: ["overflow-auto", "min-w-0", "p-1"], style: { maxHeight: "540px" } }, grid)
    ]);
    root.mount(document.body);
    root.addCleanup(() => { contact.dispose(); totals.dispose(); });
    update();
}
