---
id: html-elements
title: Native inputs and tables
group: styles
path: /styles/html-elements
order: 70
description: Style native inputs, selects, textareas and tables, and choose when to use a value editor.
toc: true
keywords:
  - html
  - elements
  - buttons
  - forms
  - tables
  - surfaces
sectionRedirects:
  - ui-styles-and-css-classes|/styles/overview
  - containers-and-surfaces|/styles/surfaces#containers-and-surfaces
  - buttons|/styles/buttons#buttons
---

# Native inputs and tables

Use native HTML controls when you need browser behavior and simple styling. For parsing, validation and asynchronous acceptance, use [Value editors](?!=/components/value-editors).

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

<live-demo id="html-form-controls" mode="readonly" src="html-elements.md.form-controls.ts"></live-demo>

## Tables

Use `table` for the base table treatment. `table-row-borders` adds only horizontal separators, while `table-bordered` adds a border around the table and its cells.

Apply these styles to the `<table>` element. `table` sets full width, collapsed
borders, cell padding, and header text styling; border variants add separators
without changing the data or interaction behavior.

<live-demo id="html-tables" mode="readonly" src="html-elements.md.tables.ts"></live-demo>

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

## Related topics

- [Buttons](?!=/styles/buttons)
- [UI styles and utilities](?!=/styles/overview)
- [Surfaces and gradients](?!=/styles/surfaces)
