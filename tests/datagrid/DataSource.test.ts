import { describe, expect, it, vi } from "vitest";
import { ArrayDataSource, DataSource, LocalGroupingDataSource, QueryArgs } from "../../src/components/datagrid/DataSource";

type Row = { id: number, region: string, amount: number };

const rows: Row[] = [
  { id: 1, region: "West", amount: 10 },
  { id: 2, region: "East", amount: 20 },
  { id: 3, region: "West", amount: 30 }
];

describe("DataSource totalSummary contract", () => {
  it("calculates summaries from the full filtered set, not the requested page", async () => {
    const source = new ArrayDataSource(rows);

    const result = await source.loadData({
      skip: 0,
      top: 1,
      requireTotalCount: true,
      totalSummary: [
        { field: "amount", summaryType: "sum" },
        { field: "amount", summaryType: "avg" },
        { field: "region", summaryType: "distinct" }
      ]
    });

    expect(result.dataItems).toHaveLength(1);
    expect(result.totalCount).toBe(3);
    expect(result.totalSummary).toEqual([
      { field: "amount", summaryType: "sum", value: 60 },
      { field: "amount", summaryType: "avg", value: 20 },
      { field: "region", summaryType: "distinct", value: 2 }
    ]);
  });

  it("does not calculate a summary when it was not requested", async () => {
    const source = new ArrayDataSource(rows);
    const result = await source.loadData({ skip: 0, top: 1 });

    expect(result.totalSummary).toBeUndefined();
  });

  it("applies filtering before calculating the total summary", async () => {
    const source = new ArrayDataSource(rows);
    const result = await source.loadData({
      filter: ["region", "=", "West"],
      totalSummary: [{ field: "amount", summaryType: "sum" }]
    });

    expect(result.totalSummary).toEqual([
      { field: "amount", summaryType: "sum", value: 40 }
    ]);
  });

  it("applies both bounds of a numeric range filter", async () => {
    const source = new ArrayDataSource([
      { amount: 118 },
      { amount: 356 },
      { amount: 498 },
      { amount: 537 }
    ]);
    const result = await source.loadData({
      filter: ["and", ["amount", ">=", 1], ["amount", "<=", 400]],
      requireTotalCount: true
    });

    expect(result.totalCount).toBe(2);
    expect(result.dataItems).toEqual([{ amount: 118 }, { amount: 356 }]);
  });

  it("keeps remote total summaries separate from the current page", async () => {
    const requests: QueryArgs[] = [];
    const source: DataSource<Row> = {
      loadData: vi.fn(async (args: QueryArgs) => {
        requests.push(args);
        return {
          args,
          dataItems: rows.slice(args.skip ?? 0, (args.skip ?? 0) + (args.top ?? rows.length)),
          totalCount: rows.length,
          totalSummary: args.totalSummary?.map(summary => ({
            ...summary,
            value: summary.summaryType === "avg" ? 20 : 60
          }))
        };
      })
    };

    const result = await source.loadData({
      skip: 2,
      top: 1,
      totalSummary: [{ field: "amount", summaryType: "avg" }]
    });

    expect(result.dataItems).toEqual([rows[2]]);
    expect(result.totalSummary).toEqual([
      { field: "amount", summaryType: "avg", value: 20 }
    ]);
    expect(requests[0].totalSummary).toEqual([
      { field: "amount", summaryType: "avg" }
    ]);
  });

  it("does not add a total summary to a remote response when it was not requested", async () => {
    const loadData = vi.fn(async (args: QueryArgs) => ({ args, dataItems: rows.slice(0, 1) }));
    const source: DataSource<Row> = { loadData };

    const result = await source.loadData({ skip: 0, top: 1 });

    expect(loadData).toHaveBeenCalledOnce();
    expect(loadData.mock.calls[0][0].totalSummary).toBeUndefined();
    expect(result.totalSummary).toBeUndefined();
  });

  it("calculates summaries locally when LocalGroupingDataSource falls back to flat remote data", async () => {
    const loadData = vi.fn(async (args: QueryArgs) => ({
      args,
      dataItems: rows,
      totalCount: rows.length
    }));
    const source = new LocalGroupingDataSource<Row>(
      { loadData },
      async (row, field) => (row as any)[field]
    );

    const result = await source.loadData({
      groupColumn: "region",
      groupSummary: [{ field: "amount", summaryType: "sum" }],
      totalSummary: [{ field: "amount", summaryType: "sum" }]
    });

    expect(result.groups?.map(group => group.groupValue)).toEqual(["East", "West"]);
    expect(result.totalSummary).toEqual([
      { field: "amount", summaryType: "sum", value: 60 }
    ]);
    expect(loadData).toHaveBeenCalledTimes(2);
  });
});
