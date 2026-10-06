import { describe, expect, it } from "vitest";
import { DataFilterRow } from "../../src/components/datagrid/DataFilterRow";

const row = new DataFilterRow([
  { name: "name", caption: "Name", dataType: "string" as const },
  { name: "price", caption: "Price", dataType: "number" as const },
  { name: "created", caption: "Created", dataType: "date" as const }
]);

describe("DataFilterRow", () => {
  it("uses type-specific default operators", () => {
    expect(row.parse("name", "phone")).toEqual(["name", "contains", "phone"]);
    expect(row.parse("price", "100")).toEqual(["price", "=", 100]);
  });

  it("prefers dataType over editorType for semantic parsing", () => {
    const column = new DataFilterRow([
      { name: "price", dataType: "number" as const, editorType: "text" as const }
    ]);

    expect(column.parse("price", "100")).toEqual(["price", "=", 100]);
  });

  it("parses symbolic operators and escaped operator-looking text", () => {
    expect(row.parse("price", ">=100")).toEqual(["price", ">=", 100]);
    expect(row.parse("name", "=phone")).toEqual(["name", "=", "phone"]);
    expect(row.parse("name", "\\=phone")).toEqual(["name", "contains", "=phone"]);
    expect(row.parse("name", "\\>100")).toEqual(["name", "contains", ">100"]);
  });

  it("parses numeric and date ranges", () => {
    expect(row.parse("price", "1..100")).toEqual([
      "and",
      ["price", ">=", 1],
      ["price", "<=", 100]
    ]);

    const filter = row.parse("created", "01.10.26..10.10.26") as any[];
    expect(filter?.[0]).toBe("and");
    expect((filter?.[1] as any[])[2]).toEqual(new Date(2026, 9, 1));
    expect((filter?.[2] as any[])[2]).toEqual(new Date(2026, 9, 10));

    expect(row.parse("price", "500..")).toEqual(["price", ">=", 500]);
    expect(row.parse("price", "..500")).toEqual(["price", "<=", 500]);
    expect(row.parse("created", "today..")).toEqual([
      "created",
      ">=",
      expect.any(Date)
    ]);
    expect(row.parse("created", "..10.12.26")).toEqual([
      "created",
      "<=",
      new Date(2026, 11, 10)
    ]);
    expect(row.parse("price", "..")).toBeUndefined();
  });

  it("combines row values into an AND filter", () => {
    expect(row.toFilter([
      { field: "name", text: "phone" },
      { field: "price", text: ">=100" }
    ])).toEqual([
      "and",
      ["name", "contains", "phone"],
      ["price", ">=", 100]
    ]);
  });

  it("formats simple filters and omits default operators", () => {
    expect(row.fromFilter([
      "and",
      ["name", "contains", "phone"],
      ["price", ">=", 100]
    ] as any)).toEqual([
      { field: "name", text: "phone" },
      { field: "price", text: "100.." }
    ]);

    expect(row.fromFilter(["created", "<=", new Date(2026, 11, 10)] as any)).toEqual([
      { field: "created", text: "..10.12.26" }
    ]);

    expect(row.fromFilter(["name", ">=", "A"] as any)).toEqual([
      { field: "name", text: ">=A" }
    ]);
  });

  it("formats ranges and escapes literal operator prefixes", () => {
    expect(row.fromFilter([
      "and",
      ["price", ">=", 1],
      ["price", "<=", 100],
      ["name", "contains", "=phone"]
    ] as any)).toEqual([
      { field: "price", text: "1..100" },
      { field: "name", text: "\\=phone" }
    ]);
  });

  it("returns false for filters that cannot be represented by one row value", () => {
    expect(row.fromFilter([
      "or",
      ["name", "=", "phone"],
      ["name", "=", "tablet"]
    ] as any)).toBe(false);

    expect(row.fromFilter([
      "and",
      ["name", "=", "phone"],
      ["name", "=", "tablet"]
    ] as any)).toBe(false);
  });

  it("supports named non-default operators for round trips", () => {
    const values = row.fromFilter(["name", "startswith", "Pro"] as any);
    expect(values).toEqual([{ field: "name", text: "startswith:Pro" }]);
    expect(row.toFilter(values!)).toEqual(["name", "startswith", "Pro"]);
  });

  it("formats a human-readable summary for OR filters", () => {
    expect(row.toText([
      "or",
      ["name", "contains", "123"],
      ["price", "=", 567]
    ] as any)).toBe("Name contains '123' or Price = 567");
  });

  it("formats nested groups with parentheses", () => {
    expect(row.toText([
      "and",
      ["name", "contains", "phone"],
      ["or", ["price", ">", 100], ["price", "<", 10]]
    ] as any)).toBe("Name contains 'phone' and (Price > 100 or Price < 10)");
  });

  it("returns an empty summary for an empty filter", () => {
    expect(row.toText()).toBe("");
    expect(row.toText([] as any)).toBe("");
  });
});
