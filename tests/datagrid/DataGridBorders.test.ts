import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

afterEach(() => document.body.replaceChildren());

describe("DataGrid border geometry", () => {
    it("reserves identical cell and outer border widths in every mode", () => {
        const style = document.createElement("style");
        // jsdom does not resolve custom properties inside border shorthands.
        style.textContent = readFileSync(resolve("src/components/datagrid/DataGrid.css"), "utf8")
            .replaceAll("var(--elg-data-grid-cell-border)", "#888")
            .replaceAll("var(--elg-data-grid-pending-row-border-color)", "rgba(0, 128, 0, 0.3)");
        const grid = document.createElement("div");
        grid.innerHTML = '<table><tbody><tr><td class="elg-data-grid-cell elg-data-grid-cell-rowheader">*</td><td class="elg-data-grid-cell elg-data-grid-cell-data">A</td><td class="elg-data-grid-cell elg-data-grid-cell-data">B</td></tr></tbody></table>';
        document.body.append(style, grid);
        const cells = Array.from(grid.querySelectorAll("td"));
        const widths = (element: Element) => {
            const css = getComputedStyle(element);
            return [css.borderTopWidth, css.borderRightWidth, css.borderBottomWidth, css.borderLeftWidth];
        };
        grid.className = "elg-data-grid";
        const expected = cells.map(widths), outer = widths(grid);
        expect(expected[0][1]).toBe("1px");
        expect(expected[0][2]).toBe("1px");
        expect(parseFloat(expected[0][0]) || 0).toBe(0);
        expect(parseFloat(expected[0][3]) || 0).toBe(0);
        for (const mode of ["", "elg-data-grid-no-cell-borders", "elg-data-grid-all-cell-borders"]) {
            for (const frame of ["", "elg-data-grid-no-border"]) {
                grid.className = `elg-data-grid ${mode} ${frame}`;
                expect(cells.map(widths)).toEqual(expected);
                expect(widths(grid)).toEqual(outer);
                const headerBorder = getComputedStyle(cells[0]).borderBottomColor;
                cells[0].parentElement!.classList.add("elg-data-grid-row-pending");
                expect(cells.map(widths)).toEqual(expected);
                expect(getComputedStyle(cells[0]).borderBottomColor).toBe(headerBorder);
                for (const cell of cells.slice(1))
                    expect(getComputedStyle(cell).borderBottomColor).toBe("rgba(0, 128, 0, 0.3)");
                cells[0].parentElement!.classList.remove("elg-data-grid-row-pending");
            }
        }
    });
});
