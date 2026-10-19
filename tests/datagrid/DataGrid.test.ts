import { afterEach, describe, expect, it, vi } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import type { DataSource, QueryArgs } from "../../src/data/DataSource";

class TestResizeObserver {
  observe(): void { }
  unobserve(): void { }
  disconnect(): void { }
}

globalThis.ResizeObserver = TestResizeObserver as any;

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: () => ({
    font: "",
    measureText: (value: string) => ({ width: value.length * 8 })
  })
});

type Row = { id: number, name: string, amount: number };

const rows: Row[] = [
  { id: 1, name: "Alpha", amount: 10 },
  { id: 2, name: "Beta", amount: 20 }
];

afterEach(() => {
  document.body.replaceChildren();
});

function settle(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 20));
}

describe("DataGrid data contracts", () => {
  it("aborts old source queries on a filter change and cancels replacement queries on disposal", async () => {
    const requests: QueryArgs[] = [];
    const source: DataSource<Row> = { loadData: args => {
      requests.push(args);
      return new Promise(() => {});
    } };
    const grid = new DataGrid({ data: source, columns: [{ name: "name" }] });
    try {
      await vi.waitFor(() => expect(requests).toHaveLength(1));
      const first = requests[0].abortSignal!;
      expect(first.aborted).toBe(false);
      grid.setOptions({ filter: ["name", "=", "Beta"] });
      await vi.waitFor(() => expect(requests).toHaveLength(2));
      expect(first.aborted).toBe(true);
      expect(requests[1].abortSignal).not.toBe(first);
      grid.dispose();
      expect(requests[1].abortSignal?.aborted).toBe(true);
    } finally { grid.dispose(); }
  });

  it("restores the expand control after child loading fails and permits retry", async () => {
    let fail = true;
    const source: DataSource<Row> = { loadData: async args => {
      if (args.groupColumn) return { args, totalCount: 1, groups: [{ groupField: "name", groupValue: "A", count: 1 }] };
      if (fail) throw new Error("Offline");
      return { args, totalCount: 1, dataItems: [rows[0]] };
    } };
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    const grid = new DataGrid({ data: source, columns: [{ name: "name" }], groupColumns: ["name"] });
    grid.mount(document.body);
    try {
      await vi.waitFor(() => expect(grid.dom.querySelector(".elg-data-grid-expand-icon")).not.toBeNull());
      grid.dom.querySelector(".elg-data-grid-expand-icon")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await vi.waitFor(() => expect(report).toHaveBeenCalledWith("Failed to change grid row expansion.", expect.any(Error)));
      await vi.waitFor(() => expect(grid.dom.querySelector(".elg-data-grid-expand-icon.ri-arrow-right-s-line")).not.toBeNull());
      fail = false;
      grid.dom.querySelector(".elg-data-grid-expand-icon")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await vi.waitFor(() => expect(grid.dom.querySelector(".elg-data-grid-expand-icon.ri-arrow-down-s-line")).not.toBeNull());
    } finally { grid.dispose(); report.mockRestore(); }
  });

  it("applies scrollbar mode initially and at runtime without reloading rows", () => {
    const grid = new DataGrid<Row>({ data: rows, columns: [{ name: "name" }], scrollbarMode: "auto" });
    try {
      const viewport = grid.dom.querySelector(".elg-scroll-container")!;
      expect(viewport.getAttribute("data-scrollbar-mode")).toBe("auto");
      expect(grid.getOptions().scrollbarHoverDistance).toBe(50);
      const reload = vi.spyOn(grid, "reloadRows");
      grid.setOptions({ scrollbarMode: "always", scrollbarHoverDistance: 25 });
      expect(viewport.getAttribute("data-scrollbar-mode")).toBe("always");
      expect(grid.getOptions().scrollbarHoverDistance).toBe(25);
      expect((grid as any)._scrollEngine.scrollbarHoverDistance).toBe(25);
      expect(reload).not.toHaveBeenCalled();
      grid.setOptions({ scrollbarMode: undefined });
      expect(grid.getOptions().scrollbarMode).toBe("thin");
      expect(viewport.getAttribute("data-scrollbar-mode")).toBe("thin");
    } finally { grid.dispose(); }
  });
  it("ensures visibility without moving rows already inside the viewport", () => {
    const grid = new DataGrid<Row>({ data: rows, columns: [{ name: "name" }] });
    const internal = grid as any;
    const engine = internal._scrollEngine;
    const sizes = internal._sizeManager;
    const scroll = { scrollTop: 100 };
    const column = vi.spyOn(grid, "scrollToColumn").mockImplementation(() => {});
    internal._scrollEngine = scroll;
    internal._sizeManager = { getOffset: (row: number) => row * 20, getSize: () => 20 };
    internal._scrollTop = 100;
    internal._viewportHeight = 200;
    internal._headerHeight = 30;
    internal._footerHeight = 20;
    try {
      grid.ensureCellVisible(7, 0); // 140..160 is within 100..250.
      expect(scroll.scrollTop).toBe(100);
      grid.ensureCellVisible(4, 0); // Reveal the upper edge, without extra movement.
      expect(scroll.scrollTop).toBe(80);
      grid.ensureCellVisible(13, 0); // Reveal 260..280 below the usable viewport.
      expect(scroll.scrollTop).toBe(130);
      expect(column).toHaveBeenCalledTimes(3);
    } finally {
      internal._scrollEngine = engine;
      internal._sizeManager = sizes;
      column.mockRestore();
      grid.dispose();
    }
  });
  it("renders rows and a total summary from a plain array", async () => {
    const grid = new DataGrid<Row>({
      data: rows,
      columns: [
        { name: "name", caption: "Name" },
        { name: "amount", caption: "Amount" }
      ],
      totalSummary: [{ field: "amount", summaryType: "sum" }]
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    expect(grid.dom.querySelector("thead")?.textContent).toContain("Name");
    expect(grid.dom.querySelector("tbody")?.textContent).toContain("Alpha");
    expect(grid.dom.textContent).toContain("30");
  });

  it("does not reserve group icon space in a flat grid", async () => {
    const grid = new DataGrid<Row>({ data: rows, columns: [{ name: "name" }] });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    const firstCell = grid.dom.querySelector<HTMLTableCellElement>("tbody .elg-data-grid-cell-data");
    expect(firstCell).not.toBeNull();
    expect(firstCell!.querySelector(".ri-arrow-right-s-line, .ri-arrow-down-s-line")).toBeNull();
  });

  it("requests totalSummary from a remote source and renders its returned value", async () => {
    const requests: QueryArgs[] = [];
    const source: DataSource<Row> = {
      loadData: async args => {
        requests.push(args);
        return {
          args,
          dataItems: rows,
          totalCount: rows.length,
          totalSummary: args.totalSummary?.map(summary => ({
            ...summary,
            value: 30
          }))
        };
      }
    };
    const grid = new DataGrid<Row>({
      data: source,
      columns: [
        { name: "name", caption: "Name" },
        { name: "amount", caption: "Amount" }
      ],
      totalSummary: [{ field: "amount", summaryType: "sum" }]
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    expect(requests.length).toBeGreaterThan(0);
    expect(requests.some(request => request.totalSummary?.length === 1)).toBe(true);
    expect(grid.dom.textContent).toContain("30");
  });

  it("does not request totalSummary when the footer is disabled", async () => {
    const requests: QueryArgs[] = [];
    const source: DataSource<Row> = {
      loadData: async args => {
        requests.push(args);
        return { args, dataItems: rows, totalCount: rows.length };
      }
    };
    const grid = new DataGrid<Row>({
      data: source,
      columns: [{ name: "name", caption: "Name" }],
      totalSummary: [{ field: "amount", summaryType: "sum" }],
      showColumnFooters: false
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    expect(requests).not.toHaveLength(0);
    expect(requests.every(request => request.totalSummary === undefined)).toBe(true);
  });

  it("shows a readable filter summary in one merged filter-row cell", async () => {
    const grid = new DataGrid<Row>({
      data: rows,
      filter: ["or", ["name", "contains", "Alpha"], ["amount", "=", 100]] as any,
      showFilterRow: true,
      columns: [
        { name: "name", caption: "Name", dataType: "string" },
        { name: "amount", caption: "Amount", dataType: "number" }
      ]
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    expect(grid.dom.textContent).toContain("Name contains 'Alpha' or Amount = 100");
    const dataCells = grid.dom.querySelectorAll<HTMLTableCellElement>(".elg-data-grid-row-filter .elg-data-grid-cell-data");
    expect(dataCells).toHaveLength(2);
    expect(dataCells[0].colSpan).toBe(2);
    expect(dataCells[1].style.display).toBe("none");
    const summaryButton = grid.dom.querySelector<HTMLButtonElement>(
      '.elg-data-grid-row-filter button[aria-label^="Edit filter:"]'
    );
    expect(summaryButton).not.toBeNull();
    expect(summaryButton!.classList.contains("elg-btn")).toBe(false);
    expect(summaryButton!.classList.contains("elg-text-primary")).toBe(true);
    expect(summaryButton!.classList.contains("elg-border-0")).toBe(true);
  });

  it("keeps separate inputs when the filter is representable by DataFilterRow", async () => {
    const grid = new DataGrid<Row>({
      data: rows,
      filter: ["and", ["name", "contains", "Alpha"], ["amount", ">=", 100]] as any,
      showFilterRow: true,
      columns: [
        { name: "name", caption: "Name", dataType: "string" },
        { name: "amount", caption: "Amount", dataType: "number" }
      ]
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    const inputs = grid.dom.querySelectorAll<HTMLInputElement>(".elg-data-grid-row-filter input");
    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe("Alpha");
    expect(inputs[1].value).toBe("100..");
  });

  it("clears only the filter field represented by the filter-row clear button", async () => {
    const grid = new DataGrid<Row>({
      data: rows,
      filter: ["and", ["name", "contains", "Alpha"], ["amount", ">=", 10]] as any,
      showFilterRow: true,
      columns: [
        { name: "name", caption: "Name", dataType: "string" },
        { name: "amount", caption: "Amount", dataType: "number" }
      ]
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    const clearButton = grid.dom.querySelector<HTMLButtonElement>(
      '.elg-data-grid-row-filter button[aria-label="Clear filter Name"]'
    );
    expect(clearButton).not.toBeNull();
    expect(clearButton!.tabIndex).toBe(-1);
    clearButton!.click();
    await settle();

    expect(grid.getOptions().filter).toEqual(["amount", ">=", 10]);
    expect(grid.dom.querySelector('.elg-data-grid-row-filter button[aria-label="Clear filter Name"]')).toBeNull();
  });

  it("applies a numeric range entered in the filter row", async () => {
    const filteringRows = [
      { id: 1, name: "Keyboard", amount: 356 },
      { id: 2, name: "Monitor", amount: 498 },
      { id: 3, name: "Dock", amount: 537 },
      { id: 4, name: "Mouse", amount: 118 }
    ];
    const grid = new DataGrid<Row>({
      data: filteringRows,
      filter: ["name", "contains", "o"],
      showFilterRow: true,
      columns: [
        { name: "name", caption: "Name", dataType: "string" },
        { name: "amount", caption: "Amount", dataType: "number" }
      ]
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    const amountInput = grid.dom.querySelector<HTMLInputElement>(
      '.elg-data-grid-row-filter input[aria-label="Filter Amount"]'
    );
    expect(amountInput).not.toBeNull();
    amountInput!.value = "1..400";
    amountInput!.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));

    const visibleRows = [...grid.dom.querySelectorAll<HTMLTableRowElement>("tbody tr.elg-data-grid-row-data")]
      .filter(row => row.style.display !== "none")
      .map(row => row.textContent ?? "");
    expect(grid.getOptions().filter).toEqual([
      "and",
      ["name", "contains", "o"],
      ["and", ["amount", ">=", 1], ["amount", "<=", 400]]
    ]);
    expect(visibleRows.join(" ")).toContain("356");
    expect(visibleRows.join(" ")).not.toContain("498");
    expect(visibleRows.join(" ")).not.toContain("537");
  });

  it("shows readable text for a complex filter", async () => {
    const grid = new DataGrid<Row>({
      data: rows,
      filter: ["or", ["name", "=", "Alpha"], ["name", "=", "Beta"]] as any,
      showFilterRow: true,
      columns: [{ name: "name", caption: "Name", dataType: "string" }]
    });
    grid.dom.style.height = "300px";
    grid.mount(document.body);
    await settle();

    expect(grid.dom.textContent).toContain("Name = 'Alpha' or Name = 'Beta'");
  });

});
