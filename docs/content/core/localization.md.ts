import { cdiv, e, DataGrid, ArrayDataSource, DatePicker, DateEditor, Localization } from "../../../src/index";

/** One owned application with an independent, shared regional context. */
export default function demo() {
    const app = cdiv({ ui: ["elg", "p-2", "d-flex", "flex-col", "gap-2"] });
    const localization = new Localization({ locale: "bg-BG" });
    const select = e("select", { ui: "elg", ariaLabel: "Application locale" },
        ...["bg-BG", "en-US", "de-DE"].map(locale => e("option", { value: locale }, locale)));
    app.listen(select, "change", () => localization.setLocale(select.value));
    app.append(e("label", { ui: ["d-flex", "items-center", "gap-2"] }, "Application locale", select));
    const rows = [
        { id: 1, amount: 1234.5, date: "2026-10-22" },
        { id: 2, amount: 9876.25, date: "2026-12-03" }
    ];
    let nextId = 3;
    const grid = new DataGrid({ localization, allowEdit: true, showGroupPanel: false,
        data: new ArrayDataSource(rows, { createRowId: () => nextId++ }),
        columns: [
            { name: "amount", caption: "Amount (inherited)", dataType: "number", displayFormat: "N2", width: 150 },
            { name: "usd", caption: "USD (en-US)", dataType: "number", getValue: row => row.amount,
                displayFormat: "C2$", locale: "en-US", readonly: true, width: 140 },
            { name: "date", caption: "Date (inherited)", dataType: "date", displayFormat: "d", width: 140,
                createEditor: context => new DateEditor({ value: context.value, locale: context.locale,
                    dateFormat: "d", onCommit: context.onCommit }) }
        ],
        totalSummary: [{ field: "amount", summaryType: "sum" }]
    });
    grid.dom.style.height = "260px";
    const calendar = new DatePicker({ localization, value: "2026-10-22", today: "2026-10-22" });
    const layout = cdiv({ ui: ["d-flex", "flex-wrap", "gap-2", "items-start"] });
    grid.dom.style.flex = "1 1 360px";
    layout.append([grid, calendar]);
    app.append(layout);
    app.mount(document.body);
    grid.refresh();
    return app;
}
