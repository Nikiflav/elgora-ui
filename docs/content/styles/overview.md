---
id: styles-overview
title: UI styles and utilities
group: styles
path: /styles/overview
order: 10
description: Compose typed UI styles, literal classes, spacing and semantic building blocks.
api:
  - UiStyle
---

# UI styles and utilities

## UI styles

Elgora UI styles are composable classes backed by CSS custom properties. The classes describe the visual role of an element, while theme tokens decide the actual colors and proportions. This separation makes an application’s markup stable when its visual theme changes.

`class`, `className` and `ui` are combined into one declarative class set,
independently of prop order. Duplicate class tokens appear only once. This behavior
is shared by `e()`, `c()` and virtual nodes created with `v()`.

```ts
e("div", { className: "customer-field", ui: ["col-12", "col-sm-6"] });
// class="customer-field elg-col-12 elg-col-sm-6"
```

When props are patched, only obsolete declarative classes are removed; unrelated
classes added through `bindClass()` or `classList` are retained. Do not manage the
same class token through both props and a binding or imperative code.

### The `elg` base class

The ui array prefixes style names with elg-; the special elg marker stays unchanged.
The marker is not added automatically and is not inherited as a class by children.
Layout and spacing utilities work without it. Add elg for base surface/text
rendering and opt-in native-control styles, alongside the relevant visual role:

```js
e("span", { ui: ["elg", "primary"] }, "Primary text");
cbutton({ ui: ["elg", "btn", "primary"], children: "Save" });
```

Use `ui` on both components and native elements. It keeps the style vocabulary consistent and lets the framework compose the final class list for you.

### Color system

Color classes such as `primary`, `accent`, `success`, and `surface` are semantic roles. They are resolved through CSS variables, so the same component can use a different palette without changing its JavaScript.

<live-demo id="theme-tokens" src="../getting-started/framework-overview.md.theme-tokens.ts"></live-demo>

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

- `box` — a border, radius and shadow; add a surface and padding separately.
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

## Related topics and API

- [Colors and themes](?!=/styles/semantic-colors), [responsive layout](?!=/styles/layout) and [button variants](?!=/styles/buttons).
- [UiStyle](?!=/api-reference/UiStyle) lists the supported typed names.
