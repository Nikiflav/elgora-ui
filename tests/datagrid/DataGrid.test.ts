import { afterEach, describe, expect, it } from "vitest";
import { DataGrid } from "../../src/components/datagrid/DataGrid";
import { DataSource, QueryArgs } from "../../src/components/datagrid/DataSource";

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
    const dataCells = grid.dom.querySelectorAll<HTMLTableCellElement>(".elg-gridrow-filter .elg-gridcell-data");
    expect(dataCells).toHaveLength(2);
    expect(dataCells[0].colSpan).toBe(2);
    expect(dataCells[1].style.display).toBe("none");
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

    const inputs = grid.dom.querySelectorAll<HTMLInputElement>(".elg-gridrow-filter input");
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
      '.elg-gridrow-filter button[aria-label="Clear filter Name"]'
    );
    expect(clearButton).not.toBeNull();
    expect(clearButton!.tabIndex).toBe(-1);
    clearButton!.click();
    await settle();

    expect(grid.getOptions().filter).toEqual(["amount", ">=", 10]);
    expect(grid.dom.querySelector('.elg-gridrow-filter button[aria-label="Clear filter Name"]')).toBeNull();
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
      '.elg-gridrow-filter input[aria-label="Filter Amount"]'
    );
    expect(amountInput).not.toBeNull();
    amountInput!.value = "1..400";
    amountInput!.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));

    const visibleRows = [...grid.dom.querySelectorAll<HTMLTableRowElement>("tbody tr.elg-gridrow-data")]
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
