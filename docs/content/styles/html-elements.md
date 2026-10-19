---
id: html-elements
title: HTML elements
group: styles
path: /styles/html-elements
order: 20
description: Explore how ElgoraUI styles native HTML elements, controls, containers, and tables.
toc: true
keywords:
  - html
  - elements
  - buttons
  - forms
  - tables
  - surfaces
---

# HTML elements

ElgoraUI styles native HTML elements through the `elg` marker and the `ui` array. The same `e()` composition API works for a one-off element, while `cbutton()` and other components add reusable behavior.

## UI styles and CSS classes

`ui` accepts typed style names and adds the `elg-` prefix. The special `elg`
marker stays unchanged:

```ts
e("div", { ui: ["elg", "surface", "p-3"] }, "Content");
// Creates: <div class="elg elg-surface elg-p-3">Content</div>
```

The same classes can be written directly in HTML. Use `class` or `className`
for literal CSS classes; `ui` is not a space-separated class string.

`elg` enables the base background/text rendering and opt-in native-control
styles. It is not added automatically by the `ui` property. Layout utilities
such as `d-flex`, `gap-2`, and `grid` work without it. A parent marked `elg`
does not automatically add that marker to its children.

See [UiStyle](?!=/api-reference/UiStyle) for supported names and
[Semantic colors](?!=/styles/semantic-colors) for color roles and themes.

## Containers and surfaces

Use `surface`, `surface-2`, and `surface-3` with `elg` to establish visual layers.
`box` adds a border, rounded corners, and a shadow. It does not add spacing or
choose a background: combine it with a surface and `p-*` for inner padding.

```ts
e("section", { ui: ["elg", "surface-2", "box", "p-3"] }, "Panel content");
```

<live-demo id="html-surfaces" mode="readonly" demo="surfaces"></live-demo>

## Buttons

`button.elg` keeps the native element predictable and flat. Add `btn` for the component styling, then choose a semantic role such as `primary`, `neutral`, or `danger`.

<live-demo id="html-buttons" mode="readonly" demo="buttons"></live-demo>

## Form controls

Use `ui: ["elg", "field"]` on a native input, select, or textarea. `elg` supplies
the base control colors, border, and focus indication; `field` adds padding,
rounded corners, border-box sizing, and `min-width: 0`. It does not arrange the
form or make the control full-width. Add `w-100` when needed and use flex or the
[responsive grid](?!=/styles/layout) to arrange fields.

```ts
e("label", { ui: ["d-flex", "flex-col", "gap-1"] },
    "Customer",
    e("input", { ui: ["elg", "field", "w-100"], type: "text" })
);
```

Most native-control styling is opt-in through `elg`, while utility classes work
independently. The stylesheet also defines global body typography, and normal
CSS inheritance still applies to unmarked elements. For richer controls with
parsing and validation, see [Value editors](?!=/components/value-editors).

<live-demo id="html-form-controls" mode="readonly" demo="form-controls"></live-demo>

## Tables

Use `table` for the base table treatment. `table-row-borders` adds only horizontal separators, while `table-bordered` adds a border around the table and its cells.

Apply these styles to the `<table>` element. `table` sets full width, collapsed
borders, cell padding, and header text styling; border variants add separators
without changing the data or interaction behavior.

<live-demo id="html-tables" mode="readonly" demo="tables"></live-demo>

To show cell boundaries as well, replace `table-row-borders` with `table-bordered`.

## Composition

Elements can be nested directly. Components are useful when behavior is reused, while `e()` is ideal for local structure:

```js
root.append(
    e("div", { ui: ["elg", "box", "surface-2", "p-3", "d-flex", "flex-col", "gap-2"] },
        e("h3", {}, "Account"),
        e("input", { ui: ["elg", "field"], placeholder: "Name" }),
        cbutton({ ui: ["elg", "btn", "primary"], children: "Save" })
    )
);
```
