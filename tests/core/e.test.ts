import { afterEach, describe, expect, it } from "vitest";
import { Component } from "../../src/core/Component";
import { c } from "../../src/core/c";
import { e, setElementProps, v } from "../../src/core/e";

afterEach(() => {
  document.body.replaceChildren();
});

describe("native and component composition", () => {
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
