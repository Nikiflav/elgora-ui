---
id: data-form-layout
title: Layout
group: components
parent: forms
path: /components/data-form/layout
order: 20
description: Arrange fields in vertical forms, wrapping flex rows and twelve-column grids.
---

# DataForm layout

Field definitions describe values, editors and validation. The optional `layout`
describes their visual order and placement. Without it, fields appear vertically.
An explicit layout displays only listed fields. Names must exist in `fields` and
must not be repeated. Keyboard navigation follows the displayed order.

## Try different layouts

<live-demo id="data-form-layout" height="1250px" src="data-form-layout.md.ts"></live-demo>

## Flex rows

Each row defaults to `display: "flex"` and `wrap: true`. Item `width` accepts
pixels or a CSS length; omission uses the natural width. Any number of fields
can share a row. With `wrap: false`, the row scrolls horizontally when necessary.

```ts
layout: [{
    display: "flex", labelPosition: "none",
    fields: [{ field: "search", width: 200 }, { field: "actions" }]
}]
```

## Twelve-column rows

Use `display: "grid"` with item `span` values from 1 to 12 (default 12).
Items wrap when the row is full. On narrow screens, grid fields stack.
Flex and grid rows may coexist in the same form.

```ts
layout: [
    { display: "grid", fields: [{ field: "name", span: 8 }, { field: "quantity", span: 4 }] },
    { fields: [{ field: "actions" }], labelPosition: "none" }
]
```

## Collapsible groups

Interleave ordinary rows and named groups in `layout`. A group contains `id`,
`title`, and `rows`; add `collapsible: true` for a keyboard-accessible disclosure.
Groups start expanded unless `collapsed: true` is supplied. IDs must be unique.

```ts
layout: [{
    id: "appearance", title: "Appearance", collapsible: true,
    rows: [{ fields: [{ field: "color", width: "100%" }] }]
}]
```

DataForm owns section rendering and disclosure. `form.getGroupState()` returns
a snapshot of collapsed states; pass it as `groupState` when creating a replacement
form. Saved states override initial `collapsed` values. Keyboard traversal skips
fields inside collapsed groups. Groups without `collapsible` have a static heading.

## Utility styles

Rows and items accept `ui: UiStyle | UiStyle[]`. Row utilities style the row
container; item utilities style the complete field wrapper, including its label.
Use spacing utilities for extra space below a field or a different gap within a row:

```ts
layout: [{
    ui: ["gap-2"],
    fields: [{ field: "name", ui: ["mb-2"] }, { field: "quantity" }]
}]
```

Item margins add to the row gap. Explicit layout options such as `width`, `span`
and `display` still define placement; use utilities for spacing and decoration.

## Label placement

`labelPosition: "top" | "start" | "none"` can be specified on the form,
on a layout row and on an individual layout item, with the item taking precedence.
Hidden labels retain accessible field names. Button fields render direct buttons
in a flex host. Use `surface: "none"` to embed a form without padding or a frame.
