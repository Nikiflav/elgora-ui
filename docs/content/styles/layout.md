---
id: layout
title: Layout and responsive grid
group: styles
path: /styles/layout
order: 30
description: Compose twelve-column layouts with container-responsive utilities using e(), c() or v().
---

# Layout and responsive grid

Use the `grid` UI style to create a twelve-column CSS grid. No layout component
or JavaScript width measurement is needed for the layout itself.
The layout class `elg-grid` is separate from the DataGrid component, whose root
class is `elg-data-grid`.
Use the same utilities with native `e()` elements, `c()` components or virtual
nodes created with `v()`.

## Resize the container

Change **Container width** below. The surrounding page stays the same width;
the fields respond to their own grid container. A wide demo can scroll horizontally
inside the preview so the selected width remains independent of the browser width.

<live-demo id="layout-responsive-grid" height="660px"></live-demo>

The form uses full-width fields initially, two fields per row from 480px,
three from 768px and four from 1024px. Address and Notes use different spans.
The nested Contact grid responds to its own, smaller content area. It remains
two columns at widths where the outer grid can show four.

## Basic grid

```ts
e("div", { ui: ["grid", "gap-2"] },
    e("div", { ui: ["col-6"] }, customerField),
    e("div", { ui: ["col-6"] }, dateField),
    e("div", { ui: ["col-12"] }, notesField)
);
```

`col-1` through `col-12` determine how many of the twelve tracks an item spans.
A direct child without a column class occupies all twelve tracks.
Use `gap-0` through `gap-5` for spacing. The default grid has no gap.
Tracks use `minmax(0, 1fr)`, and direct children have `min-width: 0` so their
intrinsic width does not force wider tracks. Oversized content still needs its
own wrapping, truncation or scroll behavior.

API: [UiStyle](?!=/api-reference/UiStyle), [e](?!=/api-reference/e),
[cdiv](?!=/api-reference/cdiv).

## Container breakpoints

| Class | Applies when the grid content width is |
| --- | --- |
| col-N | Any width |
| col-sm-N | At least 480px |
| col-md-N | At least 768px |
| col-lg-N | At least 1024px |

`N` is an integer from 1 to 12. These are mobile-first overrides: a larger
breakpoint overrides the smaller one when both apply, independently of class order.
They are **container queries**, not viewport media queries.

```ts
e("div", { ui: ["grid", "gap-2"] },
    e("div", {
        ui: ["col-12", "col-sm-6", "col-md-4", "col-lg-3"]
    }, productField),
    e("div", { ui: ["col-12"] }, notesField)
);
```

Responsive classes are applied to direct children of the grid. A non-responsive
`col-6` remains half-width even in a narrow dialog; choose `col-12 col-sm-6` when
it should stack at smaller sizes.

The actual classes have the usual prefix, for example `elg-grid` and
`elg-col-sm-6`. Existing utilities without responsive variants remain unchanged;
this first version provides responsive overrides for column spans only.

## Components and virtual nodes

```ts
const form = cdiv({ ui: ["grid", "gap-3"] },
    cdiv({ ui: ["col-12", "col-md-6"] }, customerEditor),
    cdiv({ ui: ["col-12", "col-md-6"] }, dateEditor)
);
form.mount(document.body);

const view = v("div", { ui: ["grid", "gap-2"] },
    v("div", { ui: ["col-12", "col-sm-6"] }, "Customer"),
    v("div", { ui: ["col-12", "col-sm-6"] }, "Date")
);

// v() describes content; e() creates the host and renders it through vnodes.
const host = e("div", { vnodes: [view] });
document.body.append(host);
```

`v()` returns a virtual node, not a DOM element. Pass it through the `vnodes`
property rather than calling `appendChild(view)`. Both native elements and
rendered virtual nodes receive the same CSS classes.

API: [cdiv](?!=/api-reference/cdiv), [v](?!=/api-reference/v).

## Nesting and sizing

Each grid declares the named inline-size query container `elg-grid`.
An item's responsive span uses the nearest ancestor with that container name,
which is its direct parent grid. A nested grid is sized by its outer column,
while its children query the nested grid's width.

Container queries use the grid's content box: padding is not usable track width.
Inline-size containment also means the grid does not provide its contents'
intrinsic width to an auto-sized parent. Give a shrink-to-fit host, such as a
dialog, an explicit width or an appropriate available-width constraint.

Do not reorder items just to change the visual layout: keep DOM order aligned
with reading order and keyboard navigation. The grid does not impose a scroll
container; place `overflow-auto` on the host that should own scrolling.
