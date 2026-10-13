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
  const applyButton = (editor: FilterEditor) =>
    [...editor.dom.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Apply Filter")!;
  const editValue = (editor: FilterEditor, value: string) => {
    const input = editor.dom.querySelector<HTMLInputElement>("input")!;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  it("keeps unchanged Apply neutral and clickable, including repeated applications", () => {
    const onApply = vi.fn();
    const editor = new FilterEditor({ columns, filter: ["amount", "=", 10], onApply });
    const button = applyButton(editor);
    expect(button.classList.contains("elg-neutral")).toBe(true);
    expect(button.classList.contains("elg-primary")).toBe(false);
    expect(button.disabled).toBe(false);
    button.click();
    button.click();
    expect(onApply).toHaveBeenCalledTimes(2);
    expect(onApply).toHaveBeenLastCalledWith(["amount", "=", 10], editor);
    expect(button.classList.contains("elg-neutral")).toBe(true);
  });

  it("marks edits primary and becomes neutral when values are restored", () => {
    const editor = new FilterEditor({ columns, filter: ["amount", "=", 10] });
    editValue(editor, "20");
    expect(applyButton(editor).classList.contains("elg-primary")).toBe(true);
    expect(applyButton(editor).disabled).toBe(false);
    editValue(editor, "10");
    expect(applyButton(editor).classList.contains("elg-neutral")).toBe(true);
    expect(applyButton(editor).classList.contains("elg-primary")).toBe(false);
  });

  it("compares against the most recently applied filter", () => {
    const editor = new FilterEditor({ columns, filter: ["region", "contains", "West"] });
    editValue(editor, "East");
    applyButton(editor).click();
    expect(applyButton(editor).classList.contains("elg-neutral")).toBe(true);
    editValue(editor, "West");
    expect(applyButton(editor).classList.contains("elg-primary")).toBe(true);
    editor.cancel();
    expect(editor.getFilter()).toEqual(["region", "contains", "East"]);
    expect(applyButton(editor).classList.contains("elg-neutral")).toBe(true);
  });

  it("loads setFilter as a new baseline without applying and normalizes single-child groups", () => {
    const onApply = vi.fn();
    const editor = new FilterEditor({ columns, filter: ["and", ["amount", "=", 10]], onApply });
    expect(applyButton(editor).classList.contains("elg-neutral")).toBe(true);
    editValue(editor, "20");
    editor.setFilter(["region", "contains", "North"]);
    expect(applyButton(editor).classList.contains("elg-neutral")).toBe(true);
    expect(onApply).not.toHaveBeenCalled();
    editValue(editor, "South");
    editor.cancel();
    expect(editor.getFilter()).toEqual(["region", "contains", "North"]);
    expect(applyButton(editor).classList.contains("elg-neutral")).toBe(true);
  });

  it("marks condition removal dirty and clears both the draft controls and visual indicator", () => {
    const onApply = vi.fn();
    const editor = new FilterEditor({
      columns, filter: ["and", ["region", "=", "West"], ["amount", ">", 0]], onApply
    });
    [...editor.dom.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "×")!.click();
    expect(applyButton(editor).classList.contains("elg-primary")).toBe(true);
    editor.clear();
    expect(editor.getFilter()).toBeUndefined();
    expect(editor.dom.querySelectorAll("input")).toHaveLength(0);
    expect(applyButton(editor).classList.contains("elg-neutral")).toBe(true);
    expect(applyButton(editor).disabled).toBe(false);
    expect(onApply).toHaveBeenCalledWith(undefined, editor);
  });

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
