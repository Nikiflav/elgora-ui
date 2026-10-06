import { describe, expect, it } from "vitest";
import { evalFilter, type DataFilter, type FilterFunctionRegistry } from "../../src/data/filter";

type Row = {
  name: string;
  amount: number;
  active: boolean;
  nullable: string | null;
  nested: { code: string };
  created: Date;
};

const row: Row = {
  name: "Alpha Server",
  amount: 42,
  active: true,
  nullable: null,
  nested: { code: "EU-42" },
  created: new Date(2026, 9, 5, 14, 30, 45)
};

const matches = (filter: DataFilter, item: Record<string, any> = row, functions?: FilterFunctionRegistry) =>
  evalFilter(item, filter, functions);

describe("evalFilter", () => {
  it("accepts empty filters", () => {
    expect(evalFilter(row, undefined as any)).toBe(true);
    expect(evalFilter(row, null as any)).toBe(true);
    expect(evalFilter(row, [])).toBe(true);
  });

  it.each([
    ["=", 42, true],
    ["=", 41, false],
    ["<>", 41, true],
    ["<>", 42, false],
    [">", 41, true],
    [">", 42, false],
    [">=", 42, true],
    [">=", 43, false],
    ["<", 43, true],
    ["<", 42, false],
    ["<=", 42, true],
    ["<=", 41, false]
  ] as const)("evaluates numeric operator %s", (operator, value, expected) => {
    expect(matches(["amount", operator, value] as any)).toBe(expected);
  });

  it("evaluates case-insensitive string operators", () => {
    expect(matches(["name", "contains", "PHA SER"])).toBe(true);
    expect(matches(["name", "contains", "database"])).toBe(false);
    expect(matches(["name", "startswith", "alpha"])).toBe(true);
    expect(matches(["name", "startswith", "server"])).toBe(false);
    expect(matches(["name", "endswith", "SERVER"])).toBe(true);
    expect(matches(["name", "endswith", "alpha"])).toBe(false);
    expect(matches(["name", "notcontains", "database"])).toBe(true);
    expect(matches(["name", "notcontains", "server"])).toBe(false);
  });

  it("uses safe string comparison for null and missing values", () => {
    expect(matches(["nullable", "contains", ""])).toBe(true);
    expect(matches(["nullable", "contains", "x"])).toBe(false);
    expect(matches(["missing", "startswith", ""])).toBe(true);
    expect(matches(["missing", "endswith", "x"])).toBe(false);
    expect(matches(["missing", "notcontains", "x"])).toBe(true);
  });

  it("resolves nested property paths", () => {
    expect(matches(["nested.code", "=", "EU-42"])).toBe(true);
    expect(matches(["nested.code", "contains", "eu-"])).toBe(true);
    expect(matches(["nested.missing", "=", undefined])).toBe(true);
  });

  it("evaluates explicit and implicit groups", () => {
    expect(matches(["and", ["amount", ">", 40], ["active", "=", true]])).toBe(true);
    expect(matches(["and", ["amount", ">", 40], ["active", "=", false]])).toBe(false);
    expect(matches(["or", ["name", "=", "Other"], ["amount", "=", 42]])).toBe(true);
    expect(matches(["or", ["name", "=", "Other"], ["amount", "=", 41]])).toBe(false);
    expect(matches([["amount", ">", 40], ["active", "=", true]])).toBe(true);
    expect(matches([["amount", ">", 40], ["active", "=", false]])).toBe(false);
  });

  it("supports deeply nested mixed groups", () => {
    const filter: DataFilter = [
      "and",
      ["amount", ">=", 40],
      ["or",
        ["name", "startswith", "Beta"],
        ["and", ["active", "=", true], ["nested.code", "endswith", "42"]]
      ]
    ] as any;

    expect(matches(filter)).toBe(true);
    expect(matches(filter, { ...row, active: false })).toBe(false);
    expect(matches(filter, { ...row, name: "Beta" })).toBe(true);
  });

  it("supports unary negation around binary and grouped filters", () => {
    expect(matches(["!", ["active", "=", false]] as any)).toBe(true);
    expect(matches(["!", ["amount", ">", 40]] as any)).toBe(false);
    expect(matches(["!", ["or", ["amount", "<", 0], ["name", "=", "Other"]]] as any)).toBe(true);
  });

  it("evaluates built-in date selector functions", () => {
    expect(matches([{ function: "year", field: "created" }, "=", 2026] as any)).toBe(true);
    expect(matches([{ function: "yearMonth", field: "created" }, "=", "2026-10"] as any)).toBe(true);
    expect(matches([{ function: "quarter", field: "created" }, "=", 4] as any)).toBe(true);
    expect(matches([{ function: "month", field: "created" }, "=", 10] as any)).toBe(true);
    expect(matches([{ function: "day", field: "created" }, "=", 5] as any)).toBe(true);
    expect(matches([{ function: "dayOfWeek", field: "created" }, "=", 1] as any)).toBe(true);
    expect(matches([{ function: "hour", field: "created" }, "=", 14] as any)).toBe(true);
    expect(matches([{ function: "minute", field: "created" }, "=", 30] as any)).toBe(true);
    expect(matches([{ function: "second", field: "created" }, "=", 45] as any)).toBe(true);
  });

  it("merges custom filter functions with the built-ins", () => {
    const functions: FilterFunctionRegistry = {
      amountPlus: (value, args, item) => Number(value) + Number(args[0] ?? 0) + Number(item.offset ?? 0)
    };
    const filter = [{ function: "amountPlus", field: "amount", args: [5] }, "=", 50] as any;

    expect(matches(filter, { ...row, offset: 3 }, functions)).toBe(true);
    expect(matches(["and", filter, [{ function: "year", field: "created" }, "=", 2026]] as any,
      { ...row, offset: 3 }, functions)).toBe(true);
    expect(matches(["!", filter] as any, { ...row, offset: 3 }, functions)).toBe(false);
  });

  it("uses short-circuit semantics for groups", () => {
    const unsupported = ["missingFunction", "x"] as any;
    expect(matches(["or", ["amount", "=", 42], [unsupported, "=", 1]] as any)).toBe(true);
    expect(matches(["and", ["amount", "=", 41], [unsupported, "=", 1]] as any)).toBe(false);
  });

  it("rejects malformed filters with useful errors", () => {
    expect(() => evalFilter(row, "amount" as any)).toThrow("Expected an array");
    expect(() => evalFilter(row, ["amount", "between", 1] as any)).toThrow("Invalid Binary Operator");
    expect(() => evalFilter(row, ["!", ["amount", "=", 42], []] as any)).toThrow("Invalid Unary Filter");
    expect(() => evalFilter(row, [{ function: "unknown", field: "amount" }, "=", 1] as any))
      .toThrow('Unsupported filter function: "unknown"');
    expect(() => evalFilter(row, ["and", ["amount", "between", 1]] as any))
      .toThrow('Error in "and" group');
    expect(() => evalFilter(row, [["amount", "between", 1]] as any))
      .toThrow("Error in implicit");
    expect(() => evalFilter(row, ["not-a-group", "value"] as any)).toThrow("Malformed Filter");
  });
});
