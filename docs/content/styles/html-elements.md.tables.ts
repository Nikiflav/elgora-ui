import { e } from "../../../src/core/e";

export default function demo(): void {
    const rows: Array<[string, string, "primary" | "success" | "warning"]> = [
        ["Primary", "Main action", "primary"],
        ["Success", "Completed state", "success"],
        ["Warning", "Needs attention", "warning"]
    ];
    const table = e("table", { ui: ["elg", "table", "table-row-borders"] },
        e("thead", {},
            e("tr", {}, e("th", {}, "Role"), e("th", {}, "Meaning"), e("th", {}, "Preview"))
        ),
        e("tbody", {},
            ...rows.map(row => e("tr", {},
                e("td", {}, row[0]),
                e("td", {}, row[1]),
                e("td", {}, e("span", { ui: ["elg", row[2], "px-2", "rounded-1"] }, row[2]))
            ))
        )
    );
    document.body.append(table);
}


