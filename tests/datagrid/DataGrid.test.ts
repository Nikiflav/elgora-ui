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
});
