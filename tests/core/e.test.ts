import { afterEach, describe, expect, it } from "vitest";
import { Component } from "../../src/core/Component";
import { ObservableValue } from "../../src/core/ElgoraUI";
import { c } from "../../src/core/c";
import { assignElementProps, e, setElementProps, v } from "../../src/core/e";

afterEach(() => {
  document.body.replaceChildren();
});

describe("native and component composition", () => {
  it("retains bindClass state across patches and lets the binding toggle it later", async () => {
    const active = new ObservableValue(true);
    const component = c("div", { className: "before", ui: ["col-12"] });
    component.bindClass("is-active", active);
    component.mount(document.body);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    expect(component.dom.classList.contains("is-active")).toBe(true);
    setElementProps(component.dom, { className: "after", ui: ["col-6"] });
    expect(component.dom.classList.contains("is-active")).toBe(true);
    active.Value = false;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    expect(component.dom.classList.contains("is-active")).toBe(false);
    expect(component.dom.classList.contains("after")).toBe(true);
    component.dispose();
  });

  it("normalizes class aliases and UI identically in e(), c() and v(), regardless of prop order", () => {
    const first = { className: "customer  shared", ui: ["elg", "col-12"] as const, class: "shared extra" };
    const second = { class: "shared extra", ui: ["elg", "col-12"] as const, className: "customer  shared" };
    const elements = [
      e("div", { ...first, ui: [...first.ui] }), e("div", { ...second, ui: [...second.ui] }),
      c("div", { ...first, ui: [...first.ui] }).dom,
      e("div", { vnodes: [v("div", { ...second, ui: [...second.ui] })] }).firstElementChild!
    ];
    const expected = ["customer", "elg", "elg-col-12", "extra", "shared"];
    for (const el of elements) expect([...el.classList].sort()).toEqual(expected);
    expect(first.className).toBe("customer  shared");
  });

  it("removes omitted UI without erasing unrelated dynamic classes", () => {
    const el = e("div", { ui: ["elg", "col-12", "col-sm-6"] });
    el.classList.add("is-active");
    setElementProps(el, {});
    expect(el.className).toBe("is-active");
    setElementProps(el, { className: "new", ui: ["col-6"] });
    expect([...el.classList].sort()).toEqual(["elg-col-6", "is-active", "new"]);
  });

  it("retains a shared token while any declarative source still requires it", () => {
    const el = e("div", { class: "shared", className: "shared elg-primary", ui: ["primary"] });
    setElementProps(el, { className: "shared", ui: ["primary"] });
    expect([...el.classList].sort()).toEqual(["elg-primary", "shared"]);
    setElementProps(el, { ui: ["primary"] });
    expect(el.className).toBe("elg-primary");
    setElementProps(el, { className: "elg-primary" });
    expect(el.className).toBe("elg-primary");
  });

  it("patches explicit className while preserving unrelated runtime state", () => {
    const el = e("div", { className: "old", ui: ["col-12"] });
    el.classList.add("is-loading");
    setElementProps(el, { className: "next", ui: ["col-6"] });
    expect([...el.classList].sort()).toEqual(["elg-col-6", "is-loading", "next"]);
  });

  it("preserves omitted class sources during assign, but replaces supplied sources", () => {
    const el = e("div", { class: "base", className: "literal", ui: ["col-12"], title: "Keep" });
    assignElementProps(el, { ui: ["col-6"] });
    expect([...el.classList].sort()).toEqual(["base", "elg-col-6", "literal"]);
    expect(el.title).toBe("Keep");
    assignElementProps(el, { className: "updated" });
    expect([...el.classList].sort()).toEqual(["base", "elg-col-6", "updated"]);
    assignElementProps(el, { title: "Updated" });
    expect([...el.classList].sort()).toEqual(["base", "elg-col-6", "updated"]);
    setElementProps(el, {});
    expect(el.className).toBe("");
    expect(el.title).not.toBe("Updated");
  });

  it("uses snapshots when the caller mutates a UI array in place", () => {
    const ui: ("col-12" | "col-6")[] = ["col-12"];
    const el = e("div", { ui });
    ui[0] = "col-6";
    setElementProps(el, { ui });
    expect(el.className).toBe("elg-col-6");
  });

  it("shares Component class bookkeeping with later native prop patches", () => {
    const component = c("div", { className: "old", ui: ["col-12"] });
    component.dom.classList.add("is-active");
    setElementProps(component.dom, { className: "next", ui: ["col-6"] });
    expect([...component.dom.classList].sort()).toEqual(["elg-col-6", "is-active", "next"]);
    component.dispose();
  });

  it("keeps runtime state when a keyed VNode changes or removes class props", () => {
    const root = e("div", { vnodes: [v("div", { key: 1, className: "before", ui: ["col-12"] })] });
    const item = root.firstElementChild!;
    item.classList.add("is-active");
    setElementProps(root, { vnodes: [v("div", { key: 1, class: "after", ui: ["col-6"] })] });
    expect(root.firstElementChild).toBe(item);
    expect([...item.classList].sort()).toEqual(["after", "elg-col-6", "is-active"]);
    setElementProps(root, { vnodes: [v("div", { key: 1 })] });
    expect(item.className).toBe("is-active");
  });

  it("supports typed layout grid and responsive columns in e() and c()", () => {
    const native = e("div", { ui: ["grid", "gap-2"] },
      e("div", { ui: ["col-12", "col-sm-6", "col-md-4", "col-lg-3"] }));
    const component = c("div", { ui: ["grid"] }, c("div", { ui: ["col-12", "col-md-6"] }));
    expect(native.classList.contains("elg-grid")).toBe(true);
    expect(native.firstElementChild!.className).toBe("elg-col-12 elg-col-sm-6 elg-col-md-4 elg-col-lg-3");
    expect(component.dom.classList.contains("elg-grid")).toBe(true);
    expect(component.dom.firstElementChild!.classList.contains("elg-col-md-6")).toBe(true);
    component.dispose();
  });

  it("patches responsive VNode column classes without replacing the item", () => {
    const root = e("div", { ui: ["grid"], vnodes: [v("div", { key: "field", ui: ["col-12", "col-sm-6"] }, "Field")] });
    const item = root.firstElementChild;
    setElementProps(root, { ui: ["grid"], vnodes: [v("div", { key: "field", ui: ["col-12", "col-md-4"] }, "Field")] });
    expect(root.firstElementChild).toBe(item);
    expect(item!.classList.contains("elg-col-sm-6")).toBe(false);
    expect(item!.classList.contains("elg-col-md-4")).toBe(true);
  });

  it("creates native elements with nested children", () => {
    const child = e("span", "Hello");
    const root = e("div", { className: "container" }, child);

    expect(root).toBeInstanceOf(HTMLDivElement);
    expect(root.className).toBe("container");
    expect(root.firstElementChild).toBe(child);
    expect(root.textContent).toBe("Hello");
  });

  it("creates a Component with a native DOM root and composed children", () => {
    const nativeChild = e("span", "Native child");
    const component = c("section", nativeChild);

    expect(component).toBeInstanceOf(Component);
    expect(component.dom).toBeInstanceOf(HTMLElement);
    expect(component.dom.firstElementChild).toBe(nativeChild);
    expect(component.dom.textContent).toBe("Native child");
  });

  it("does not invoke a replaced event callback twice during one dispatch", () => {
    const root = e("button");
    let calls = 0;
    let currentHandler = () => {
      calls++;
      setElementProps(root, { onclick: currentHandler });
    };

    setElementProps(root, { onclick: currentHandler });
    root.click();

    expect(calls).toBe(1);
  });

  it("keeps all event wrappers stable when multiple event props are updated", () => {
    const root = e("button");
    let clicks = 0;
    let currentClick = () => {
      clicks++;
      setElementProps(root, {
        onmousedown: () => undefined,
        onclick: currentClick,
        oncontextmenu: () => undefined
      });
    };

    setElementProps(root, {
      onmousedown: () => undefined,
      onclick: currentClick,
      oncontextmenu: () => undefined
    });
    root.click();
    root.click();

    expect(clicks).toBe(2);
  });
});

describe("virtual nodes", () => {
  it("creates a VNode descriptor without creating a DOM node", () => {
    const node = v("span", { key: "name", className: "value" }, "Alice");

    expect(node).toEqual({
      tag: "span",
      key: "name",
      props: {
        className: "value",
        vnodes: ["Alice"]
      }
    });
  });

  it("renders VNode children and patches existing DOM nodes", () => {
    const root = e("div", {
      vnodes: [v("span", { key: "name" }, "Alice")]
    });
    const nameElement = root.firstElementChild;

    setElementProps(root, {
      vnodes: [v("span", { key: "name", className: "updated" }, "Bob")]
    });

    expect(root.firstElementChild).toBe(nameElement);
    expect(root.firstElementChild?.textContent).toBe("Bob");
    expect(root.firstElementChild?.className).toBe("updated");
  });

  it("preserves keyed DOM identity when children are reordered", () => {
    const root = e("div", {
      vnodes: [
        v("span", { key: "first" }, "First"),
        v("span", { key: "second" }, "Second")
      ]
    });
    const first = root.children[0];
    const second = root.children[1];

    setElementProps(root, {
      vnodes: [
        v("span", { key: "second" }, "Second updated"),
        v("span", { key: "first" }, "First updated")
      ]
    });

    expect(root.children[0]).toBe(second);
    expect(root.children[1]).toBe(first);
    expect(root.textContent).toBe("Second updatedFirst updated");
  });

  it("adds and removes VNode children while preserving the remaining nodes", () => {
    const root = e("div", {
      vnodes: [v("span", { key: "keep" }, "Keep")]
    });
    const keep = root.firstElementChild;

    setElementProps(root, {
      vnodes: [
        v("span", { key: "keep" }, "Keep updated"),
        v("strong", { key: "new" }, "New")
      ]
    });
    expect(root.children[0]).toBe(keep);
    expect(root.children).toHaveLength(2);

    setElementProps(root, {
      vnodes: [v("strong", { key: "new" }, "New updated")]
    });
    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild?.tagName).toBe("STRONG");
    expect(root.textContent).toBe("New updated");
  });
});
