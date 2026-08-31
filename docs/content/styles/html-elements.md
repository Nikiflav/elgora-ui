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

## Containers and surfaces

Use `surface`, `surface-2`, and `surface-3` to establish visual layers. Add `box` when a surface needs a border, radius, and spacing as a distinct content container.

<live-demo id="html-surfaces" mode="readonly" demo="surfaces"></live-demo>

## Buttons

`button.elg` keeps the native element predictable and flat. Add `btn` for the component styling, then choose a semantic role such as `primary`, `neutral`, or `danger`.

<live-demo id="html-buttons" mode="readonly" demo="buttons"></live-demo>

## Form controls

Add `field` when a native input, select, or textarea should participate in a form layout. The `elg` marker enables the framework defaults without affecting unmarked controls.

<live-demo id="html-form-controls" mode="readonly" demo="form-controls"></live-demo>

## Tables

Use `table` for the base table treatment. `table-row-borders` adds only horizontal separators, while `table-bordered` adds a border around the table and its cells.

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
