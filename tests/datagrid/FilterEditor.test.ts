import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterEditor } from "../../src/components/datagrid/FilterEditor";

afterEach(() => {
  document.body.replaceChildren();
});

const columns = [
  { name: "region", caption: "Region", dataType: "string" as const },
  { name: "amount", caption: "Amount", dataType: "number" as const }
];

describe("FilterEditor", () => {
  it("loads a structured filter and returns it unchanged after editing", () => {
    const filter = [
      "and",
      ["region", "contains", "West"],
      ["amount", ">=", 100]
    ] as any;
    const editor = new FilterEditor({ columns, filter });

    expect(editor.getFilter()).toEqual(filter);
    expect(editor.dom.textContent).toContain("region contains \"West\"");
    expect(editor.dom.textContent).toContain("amount >= 100");
    expect(editor.dom.querySelector(".elg-popup-menu")?.classList.contains("elg-popup-menu-compact")).toBe(true);
  });

  it("edits a condition and reports the applied filter", () => {
    const onApply = vi.fn();
    const editor = new FilterEditor({
      columns,
      filter: ["region", "contains", "West"] as any,
      onApply
    });
    document.body.append(editor.dom);

    const input = editor.dom.querySelector<HTMLInputElement>("input");
    expect(input).not.toBeNull();
    input!.value = "East";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    editor.apply();

    expect(onApply).toHaveBeenCalledWith(
      ["region", "contains", "East"],
      editor
    );
  });

  it("supports nested groups and clearing the filter", () => {
    const onApply = vi.fn();
    const editor = new FilterEditor({
      columns,
      filter: [
        "and",
        ["region", "=", "West"],
        ["or", ["amount", ">", 100], ["amount", "<", 20]]
      ] as any,
      onApply
    });

    expect(editor.getFilter()).toEqual([
      "and",
      ["region", "=", "West"],
      ["or", ["amount", ">", 100], ["amount", "<", 20]]
    ]);

    editor.clear();
    expect(editor.getFilter()).toBeUndefined();
    expect(onApply).toHaveBeenCalledWith(undefined, editor);
  });

  it("clears filters from the compact clear button", () => {
    const onApply = vi.fn();
    const editor = new FilterEditor({
      columns,
      filter: ["region", "contains", "West"] as any,
      onApply
    });

    const button = editor.dom.querySelector<HTMLButtonElement>("button[aria-label='Clear']");
    expect(button).not.toBeNull();
    expect(button!.textContent).toContain("Clear");
    button!.click();

    expect(editor.getFilter()).toBeUndefined();
    expect(onApply).toHaveBeenCalledWith(undefined, editor);
  });

  it("does not render empty groups from an empty filter branch", () => {
    const editor = new FilterEditor({
      columns,
      filter: ["and", [], ["region", "contains", "West"], ["or", []]] as any
    });

    expect(editor.getFilter()).toEqual(["region", "contains", "West"]);
    expect([...editor.dom.querySelectorAll("button")].filter(button => button.textContent === "And")).toHaveLength(1);
  });

  it("cancels changes and restores the last applied filter", () => {
    const onApply = vi.fn();
    const onCancel = vi.fn();
    const editor = new FilterEditor({
      columns,
      filter: ["amount", "=", 10] as any,
      onApply,
      onCancel
    });

    const input = editor.dom.querySelector<HTMLInputElement>("input");
    input!.value = "20";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    editor.cancel();

    expect(editor.getFilter()).toEqual(["amount", "=", 10]);
    expect(onCancel).toHaveBeenCalledWith(editor);
  });
});
