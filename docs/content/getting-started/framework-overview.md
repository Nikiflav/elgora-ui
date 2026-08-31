---
id: framework-overview
title: ElgoraUI fundamentals
group: getting-started
path: /getting-started/framework-overview
order: 1
description: Learn the core ElgoraUI concepts, components, reactive state, and UI styles.
next: /getting-started/download
toc: true
api:
  - Component
  - cdiv
  - cbutton
  - e
  - ObservableValue
  - ObservableEvent
  - ElgoraUI
keywords:
  - framework
  - observable
  - event
  - theme
  - ui styles
  - css variables
---

# ElgoraUI fundamentals

## Overview

ElgoraUI is a browser-native framework for building self-contained web apps. Its foundation is a small set of composable components, native DOM elements, observable state, explicit events, and a token-based UI style system.

The examples on this page are live and editable. They use plain JavaScript and run directly in the browser, so the code you learn here is also the code you can use in an ordinary HTTP-served application. The playground exposes the common ElgoraUI factories directly, so one-off elements can be composed without an `Elgora.` prefix.

## Elements and components

Use `e()` when you need a native DOM element. Use a `Component` or a `c*` factory when the element should have component state, lifecycle, rendering, or bindings.

<live-demo id="framework-composition" demo="composition"></live-demo>

```js
root.append(cdiv({
      ui: ["elg", "surface", "box", "p-3", "d-flex", "flex-col", "gap-2"]
    },
    e("strong", { ui: ["elg"] }, "Hello from ElgoraUI"),
    e("span", { ui: ["elg", "text-muted"] }, "A native DOM tree with Elgora behavior."),
    cbutton({
        ui: ["elg", "btn", "primary"],
        children: "Change message",
        onclick: (_event, button) => {
            button.textContent = "The DOM is the application surface.";
        }
    })
).dom);
```

The `c*` factories create `Component` instances, while `e()` creates native elements when a component lifecycle is not needed. Both accept normal DOM properties and children. A component can be mounted into any ordinary DOM element; no application-wide runtime object or template compiler is required.

## UI styles

Elgora UI styles are composable classes backed by CSS custom properties. The classes describe the visual role of an element, while theme tokens decide the actual colors and proportions. This separation makes an application’s markup stable when its visual theme changes.

### The `elg` base class

The `elg` class opts an element into the ElgoraUI style vocabulary. Add it together with a semantic or utility class:

```js
e("span", { ui: ["elg", "primary"] }, "Primary text");
cbutton({ ui: ["elg", "btn", "primary"], children: "Save" });
```

Use `ui` on both components and native elements. It keeps the style vocabulary consistent and lets the framework compose the final class list for you.

### Color system

Color classes such as `primary`, `accent`, `success`, and `surface` are semantic roles. They are resolved through CSS variables, so the same component can use a different palette without changing its JavaScript.

<live-demo id="theme-tokens" demo="theme-tokens"></live-demo>

```js
const themeSelect = e("select", {
      ui: ["elg"],
      onchange: event => applyTheme(event.target.value, hue.value)
    },
    e("option", { value: "light" }, "Light"),
    e("option", { value: "dark" }, "Dark")
);

const hue = e("input", {
    ui: ["elg"],
    type: "range",
    min: "0",
    max: "360",
    value: "220",
    oninput: event => applyTheme(themeSelect.value, event.target.value)
});

const label = e("span", { ui: ["elg", "text-muted"] }, "Theme hue: 220");

function applyTheme(theme, value) {
    const themeHue = Number(value);
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    document.documentElement.style.setProperty("--elg-theme-h", themeHue);
    document.documentElement.style.setProperty("--elg-primary-h", themeHue);
    document.documentElement.style.setProperty("--elg-accent-h", (themeHue + 90) % 360);
    document.documentElement.style.setProperty("--elg-success-h", (themeHue + 145) % 360);
    label.textContent = `Theme hue: ${themeHue}`;
}

const preview = cdiv({
      ui: ["elg", "surface", "box", "p-3", "d-flex", "flex-col", "gap-2"]
    },
    e("strong", { ui: ["elg", "primary", "p-2"] }, "Primary token"),
    e("span", { ui: ["elg", "accent", "p-2"] }, "Accent token"),
    e("span", { ui: ["elg", "success", "p-2"] }, "Success token")
);

root.append(
    cdiv({ ui: ["elg", "d-flex", "flex-col", "gap-2"] },
        cdiv({ ui: ["elg", "d-flex", "items-center", "gap-2"] },
            themeSelect,
            hue,
            label
        ),
        preview
    ).dom
);
applyTheme("light", "220");

return () => {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--elg-theme-h");
    document.documentElement.style.removeProperty("--elg-primary-h");
    document.documentElement.style.removeProperty("--elg-accent-h");
    document.documentElement.style.removeProperty("--elg-success-h");
};
```

To create a theme, override the same token variables in a named selector. Future theme tooling can package these definitions and switch them through a small controller:

```css
[data-theme="ocean"] {
    --elg-theme-h: 195;
    --elg-primary-h: 200;
    --elg-accent-h: 175;
}
```

## CSS utilities

Utilities are small, composable classes for layout and spacing. They keep simple presentation close to the component declaration:

```js
cdiv(
    {
        ui: ["elg", "d-flex", "flex-col", "items-center", "gap-2", "p-3"]
    },
    title,
    button
);
```

Common utilities include `d-flex`, `flex-col`, `items-center`, `justify-between`, `gap-*`, `p-*`, `m-*`, `text-muted`, and related spacing, alignment, and display helpers. Utilities should solve layout concerns; semantic component classes should describe the component itself.

## Component classes: `box`, `btn`, and future additions

Component classes are reusable visual building blocks. Today the main examples are:

- `box` — a surface/container with border, radius, padding, and elevation-friendly styling.
- `btn` — button structure and interaction styling.
- `primary`, `accent`, `success` — semantic variants shared by components and elements.

Compose them with `elg` and utilities:

```js
const card = cdiv({
    ui: ["elg", "surface", "box", "p-3", "d-flex", "flex-col", "gap-2"]
},
    e("strong", { ui: ["elg"] }, "Settings"),
    cbutton({ ui: ["elg", "btn", "primary"], children: "Apply" })
);
```

This list is intentionally open. As the style system grows, new classes should follow the same contract: predictable composition, semantic names, and theme-aware variables.

## Reactive values and events

Use `ObservableValue` for mutable state that should notify subscribers when its value changes. The current value is available through `.Value`.

<live-demo id="observable-value" demo="observable-value"></live-demo>

```js
const count = new ObservableValue(0);
const output = new Component({ tag: "strong", ui: ["elg"], children: "Value: 0" });
const increment = cbutton({ ui: ["elg", "btn", "primary"], children: "Increment" });

output.bindProperty("textContent", count, value => `Value: ${value}`);
increment.dom.addEventListener("click", () => count.Value++);

root.append(
    cdiv(
        { ui: ["elg", "surface", "box", "p-3", "d-flex", "items-center", "gap-2"] },
        output,
        increment
    ).dom
);
```

Use `ObservableEvent` for an explicit notification that does not hold a current value.

<live-demo id="observable-event" demo="observable-event"></live-demo>

```js
const clicked = new ObservableEvent();
const output = e("span", { ui: ["elg", "text-muted"] }, "No event yet");
const emit = cbutton({ ui: ["elg", "btn", "accent"], children: "Emit event" });
let eventNumber = 0;
const subscription = clicked.subscribe(payload => output.textContent = `${payload} (${++eventNumber})`);
emit.dom.addEventListener("click", () => clicked.invoke("A user action happened"));
root.append(
    cdiv(
        { ui: ["elg", "surface", "box", "p-3", "d-flex", "items-center", "gap-2"] },
        emit,
        output
    ).dom
);
return () => subscription.dispose();
```

### Binding observable state to the DOM

For direct projections of state, bind an observable to a property, attribute, style, or class. Bindings are refreshed through the ElgoraUI render scheduler and are disposed with the component.

<live-demo id="component-bindings" demo="component-bindings"></live-demo>

```js
const active = new ObservableValue(false);
const toggle = cbutton({ ui: ["elg", "btn", "primary"], children: "Toggle state" });
const card = cdiv({ ui: ["elg", "surface", "box", "p-3"] }, toggle);

card.bindUiStyle("selected", active);
card.bindAttribute("aria-pressed", active, value => String(value));
toggle.bindProperty("textContent", active, value => value ? "Deactivate" : "Activate");
toggle.bindProperty("disabled", active, value => false);
toggle.dom.addEventListener("click", () => active.Value = !active.Value);
root.append(card.dom);
```

```js
component.bindProperty("disabled", loading);
component.bindAttribute("aria-label", count, value => `Count: ${value}`);
component.bindStyle("opacity", visible, value => value ? "1" : "0");
component.bindUiStyle("selected", isSelected);
component.bindUiStyle(["selected", "text-primary"], isSelected);
```

## API reference

This topic introduces the concepts; the complete signatures and member
documentation are available in the [Component API reference](?!=/api-reference/Component),
[element and component factories](?!=/api-reference/c),
[`ObservableValue`](?!=/api-reference/ObservableValue), and
[`ObservableEvent`](?!=/api-reference/ObservableEvent).

## See also

- [Components](?!=/components)
- [Framework fundamentals](?!=/getting-started/framework-overview)
