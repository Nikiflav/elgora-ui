---
id: scroll-engine
title: Scroll Engine
group: components
path: /components/scroll-engine
order: 60
description: Scroll virtual dimensions through a bounded viewport with programmatic and pointer input.
toc: true
api:
  - ScrollEngine
keywords:
  - scroll engine
  - scrolling
  - virtual dimensions
  - custom scrollbar
---

# Scroll Engine

`ScrollEngine` enhances an existing viewport with virtual dimensions and
custom scrolling. It keeps the physical viewport small even when the logical
content is very large, and exposes coordinates and scroll events to the host
application.

For ordinary HTML overflow containers, use [Scrollbars](?!=/components/scrollbars)
to keep native browser scrolling while applying the same scrollbar appearance.

## Programmatic scrolling

Create the viewport first, then pass it to `ScrollEngine`. Call
`updateDimensions()` with the logical content size and use `scrollTo()` when
application code needs to change the position.

<live-demo id="scroll-engine-basic" height="400px"></live-demo>

The same engine also handles wheel, keyboard, pointer, and touch input. Use
`onScroll()` to update dependent UI and `onResize()` to recalculate layout.

See the [`ScrollEngine` API reference](?!=/api-reference/ScrollEngine).

## Scrollbar appearance

`scrollbarMode` controls the presentation of overflowing axes:

- `"thin"` (default): a 3px thumb remains visible at rest. Moving near its edge,
  scrolling or dragging expands it to 12px.
- `"auto"`: hidden at rest, full-width near its edge or during scrolling and dragging.
- `"always"`: full-width whenever the axis has overflow.

The pointer hit area stays 12px wide in all modes. Only the painted thumb becomes
thinner, so dragging and track clicks keep the same geometry. An axis without
overflow stays hidden regardless of the selected mode. After scrolling ends, the
scrollbar returns to its idle appearance after 600ms, unless the pointer is nearby or dragging.

`scrollbarHoverDistance` defaults to `50` CSS pixels. Inside the viewport, the
vertical scrollbar expands near the right edge and the horizontal scrollbar near
the bottom edge, independently. Both expand near the bottom-right corner. Set `0`
to expand only when directly hovering a scrollbar. Non-negative finite values are
accepted; changing the setting rechecks the current pointer position.

```ts
const scroller = new ScrollEngine(viewport, { scrollbarMode: "thin", scrollbarHoverDistance: 50 });
scroller.scrollbarMode = "always"; // Change appearance without resetting position.
scroller.scrollbarHoverDistance = 25;
```

DataGrid exposes the same option, including runtime updates:

```ts
const grid = new DataGrid({ data: rows, columns, scrollbarMode: "thin" });
grid.setOptions({ scrollbarMode: "auto", scrollbarHoverDistance: 25 });
```

See [ScrollEngineOptions](?!=/api-reference/ScrollEngineOptions) and
[ScrollbarMode](?!=/api-reference/ScrollbarMode).
