import { cdiv, e, DataGrid, ArrayDataSource, DatePicker, DateEditor, Localization } from "../../../src/index";
import { bgMessages } from "../../../src/locales/bg";
import { deMessages } from "../../../src/locales/de";

/** One owned application with an independent, shared regional context. */
export default function demo() {
    const app = cdiv({ ui: ["elg", "p-2", "d-flex", "flex-col", "gap-2"] });
    const localization = new Localization({ locale: "bg-BG" });
    localization.addMessages("bg", bgMessages);
    localization.addMessages("de", deMessages);
    const select = e("select", { ui: "elg", ariaLabel: "Application locale" },
        ...["bg-BG", "en-US", "de-DE"].map(locale => e("option", { value: locale }, locale)));
    app.listen(select, "change", () => localization.setLocale(select.value));
    app.append(e("label", { ui: ["d-flex", "items-center", "gap-2"] }, "Application locale", select));
    const rows = [
        { id: 1, amount: 1234.5, date: "2026-10-22" },
        { id: 2, amount: 9876.25, date: "2026-12-03" }
    ];
    let nextId = 3;
    const columnsFor = (locale: string) => {
        const language = locale.toLowerCase().split("-")[0];
        const captions = language === "bg"
            ? { amount: "Сума", usd: "USD (en-US)", date: "Дата" }
            : language === "de"
                ? { amount: "Betrag", usd: "USD (en-US)", date: "Datum" }
                : { amount: "Amount", usd: "USD (en-US)", date: "Date" };
        return [
            { name: "amount", caption: captions.amount, dataType: "number" as const, displayFormat: "N2", width: 150 },
            { name: "usd", caption: captions.usd, dataType: "number" as const, getValue: (row: typeof rows[number]) => row.amount,
                displayFormat: "C2$", locale: "en-US", readonly: true, width: 140 },
            { name: "date", caption: captions.date, dataType: "date" as const, displayFormat: "d", width: 140,
                createEditor: (context: any) => new DateEditor({ value: context.value, locale: context.locale,
                    localization: context.localization, dateFormat: "d", onCommit: context.onCommit }) }
        ];
    };
    const grid = new DataGrid({ localization, allowEdit: true, showGroupPanel: false,
        data: new ArrayDataSource(rows, { createRowId: () => nextId++ }),
        columns: columnsFor(localization.locale),
        totalSummary: [{ field: "amount", summaryType: "sum" }]
    });
    app.subscribe(localization.changed, locale => grid.setOptions({ columns: columnsFor(locale) }));
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
