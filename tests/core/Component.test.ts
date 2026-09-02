import { afterEach, describe, expect, it, vi } from "vitest";
import { Component } from "../../src/core/Component";
import { ObservableEvent, ObservableValue } from "../../src/core/ElgoraUI";

afterEach(() => {
  document.body.replaceChildren();
});

function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

describe("Component lifecycle", () => {
  it("runs hooks and option callbacks in the documented order", () => {
    const events: string[] = [];

    class HookComponent extends Component {
      constructor(private readonly name: string) {
        super({
          commount: () => events.push(`${name}:commount`),
          comunmount: () => events.push(`${name}:comunmount`)
        });
      }

      protected onMount(): void {
        events.push(`${this.name}:onMount`);
      }

      protected onUnmount(): void {
        events.push(`${this.name}:onUnmount`);
      }
    }

    const parent = new HookComponent("parent");
    const child = new HookComponent("child");
    parent.append(child);

    parent.mount(document.body);
    parent.unmount();

    expect(events).toEqual([
      "parent:commount",
      "parent:onMount",
      "child:commount",
      "child:onMount",
      "child:comunmount",
      "child:onUnmount",
      "parent:comunmount",
      "parent:onUnmount"
    ]);
  });

  it("mounts the component tree from parent to child", () => {
    const events: string[] = [];
    const child = new Component({
      commount: () => events.push("child:mount"),
      comunmount: () => events.push("child:unmount")
    });
    const parent = new Component({
      commount: () => events.push("parent:mount"),
      comunmount: () => events.push("parent:unmount")
    });

    parent.append(child);
    parent.mount(document.body);

    expect(events).toEqual(["parent:mount", "child:mount"]);
    expect(parent.mounted).toBe(true);
    expect(child.mounted).toBe(true);
    expect(child.dom.parentElement).toBe(parent.dom);
  });

  it("unmounts the component tree from child to parent", () => {
    const events: string[] = [];
    const child = new Component({
      comunmount: () => events.push("child:unmount")
    });
    const parent = new Component({
      comunmount: () => events.push("parent:unmount")
    });

    parent.append(child);
    parent.mount(document.body);
    events.length = 0;

    parent.unmount();

    expect(events).toEqual(["child:unmount", "parent:unmount"]);
    expect(parent.mounted).toBe(false);
    expect(child.mounted).toBe(false);
    expect(parent.dom.isConnected).toBe(false);
  });

  it("mounts through a selector and preserves state across remount", () => {
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    firstHost.id = "first";
    secondHost.id = "second";
    document.body.append(firstHost, secondHost);

    const component = new Component();
    component.state = { count: 3 };
    component.mount("#first");
    component.mount("#second");

    expect(component.dom.parentElement).toBe(secondHost);
    expect(component.state).toEqual({ count: 3 });
    expect(firstHost.childElementCount).toBe(0);
  });

  it("rejects missing selectors", () => {
    const component = new Component();

    expect(() => component.mount("#missing")).toThrow(
      'Cannot mount component: selector "#missing" did not match an element.'
    );
  });

  it("disposes cleanup resources once and cannot be mounted again", () => {
    const cleanup = vi.fn();
    const component = new Component();
    component.addCleanup(cleanup);
    component.mount(document.body);

    component.dispose();
    component.dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(component.disposed.Value).toBe(true);
    expect(component.mounted).toBe(false);
    expect(() => component.mount(document.body)).toThrow(
      "Cannot mount a disposed component."
    );
  });

  it("keeps component-lifetime cleanup until dispose", () => {
    const cleanup = vi.fn();
    const component = new Component();
    component.addCleanup(cleanup);

    component.mount(document.body);
    component.unmount();
    expect(cleanup).not.toHaveBeenCalled();

    component.dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("removes listeners registered through listen when disposed", () => {
    const listener = vi.fn() as EventListener;
    const component = new Component();
    component.listen(window, "resize", listener);

    window.dispatchEvent(new Event("resize"));
    expect(listener).toHaveBeenCalledTimes(1);

    component.dispose();
    window.dispatchEvent(new Event("resize"));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("disconnects observers when disposed", () => {
    const disconnect = vi.fn();
    const component = new Component();
    component.observe({ disconnect });

    component.dispose();
    component.dispose();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

describe("Component reactive bindings", () => {
  it("renders the initial value and batches changes into one frame", async () => {
    const component = new Component();
    const count = component.observable(1);
    const rendered: number[] = [];

    component.renderOnChange(count, () => rendered.push(count.Value));
    expect(rendered).toEqual([]);

    await nextFrame();
    expect(rendered).toEqual([1]);

    count.Value = 2;
    count.Value = 3;
    await nextFrame();

    expect(rendered).toEqual([1, 3]);
  });

  it("updates properties, attributes, styles, classes, and UI styles", async () => {
    const component = new Component();
    const value = new ObservableValue("ready");
    const enabled = new ObservableValue(true);

    component.bindProperty("textContent", value);
    component.bindAttribute("aria-label", value);
    component.bindStyle("opacity", enabled, state => state ? "1" : "0.5");
    component.bindClass("is-ready", enabled);
    component.bindUiStyle("selected", enabled);
    await nextFrame();

    expect(component.dom.textContent).toBe("ready");
    expect(component.dom.getAttribute("aria-label")).toBe("ready");
    expect(component.dom.style.opacity).toBe("1");
    expect(component.dom.classList.contains("is-ready")).toBe(true);
    expect(component.dom.classList.contains("elg-selected")).toBe(true);

    value.Value = "updated";
    enabled.Value = false;
    await nextFrame();

    expect(component.dom.textContent).toBe("updated");
    expect(component.dom.getAttribute("aria-label")).toBe("updated");
    expect(component.dom.style.opacity).toBe("0.5");
    expect(component.dom.classList.contains("is-ready")).toBe(false);
    expect(component.dom.classList.contains("elg-selected")).toBe(false);
  });

  it("stops binding updates after component disposal", async () => {
    const component = new Component();
    const value = new ObservableValue("before dispose");
    component.bindProperty("textContent", value);
    await nextFrame();

    component.dispose();
    value.Value = "after dispose";
    await nextFrame();

    expect(component.dom.textContent).toBe("before dispose");
  });
});

describe("Observable events and subscriptions", () => {
  it("invokes event subscribers and supports explicit unsubscribe", () => {
    const event = new ObservableEvent<string>();
    const handler = vi.fn();
    const subscription = event.subscribe(handler);

    event.invoke("first");
    subscription.dispose();
    event.invoke("second");

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("first");
  });

  it("disposes a Component subscription with the component", () => {
    const source = new ObservableValue(0);
    const handler = vi.fn();
    const component = new Component();
    component.subscribe(source, handler);

    source.Value = 1;
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);

    component.dispose();
    source.Value = 2;

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("clears all event handlers when an event is disposed", () => {
    const event = new ObservableEvent<number>();
    const first = vi.fn();
    const second = vi.fn();
    event.subscribe(first);
    event.subscribe(second);

    event.dispose();
    event.invoke(1);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });
});
