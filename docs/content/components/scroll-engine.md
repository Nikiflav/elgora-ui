---
id: scroll-engine
title: Scroll Engine
group: components
path: /components/scroll-engine
order: 52
description: Scroll virtual dimensions through a bounded viewport with programmatic and pointer input.
toc: true
api:
  - ScrollEngine
keywords:
  - scroll engine
  - scrolling
  - virtual dimensions
  - custom scrollbar
parent: scrolling
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

<live-demo id="scroll-engine-basic" height="400px" src="scroll-engine.md.ts"></live-demo>

The same engine also handles wheel, keyboard, pointer, and touch input. Use
`onScroll()` to update dependent UI and `onResize()` to recalculate layout.

Wheel gestures are consumed only when the viewport can move in the requested
direction. At a scroll boundary, or when that axis has no overflow, the event
remains uncancelled so a surrounding scroll container can handle it. Shift +
wheel scrolls horizontally. A gesture that reaches a boundary is clamped there;
the next gesture in the same direction is passed through. This also applies to
DataGrid, which uses ScrollEngine internally.

See the [`ScrollEngine` API reference](?!=/api-reference/ScrollEngine).

## Scrollbar appearance

`scrollbarMode` controls the presentation of overflowing axes:

- `"thin"` (default): a 3px thumb remains visible, including during scrolling.
  Moving near its edge or dragging expands it to 12px.
- `"auto"`: hidden at rest, full-width near its edge or during scrolling and dragging.
- `"always"`: full-width whenever the axis has overflow.

The pointer hit area stays 12px wide in all modes. Only the painted thumb becomes
thinner, so dragging and track clicks keep the same geometry. An axis without
overflow stays hidden regardless of the selected mode. In auto mode, the
scrollbar hides 600ms after scrolling ends, unless the pointer is nearby or dragging.

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

## Fixed header space

Use `verticalScrollbarTop` to place the vertical track below a fixed header. The
value is a non-negative finite number in CSS pixels, defaulting to `0`:

```ts
const scroller = new ScrollEngine(viewport, { verticalScrollbarTop: 72 });
scroller.verticalScrollbarTop = header.offsetHeight; // update after layout changes
```

The inset shortens the track and adjusts the thumb to represent the remaining
body area. It does not change virtual scroll coordinates, the maximum scroll
position, or fire `onScroll`. Track clicks and dragging still reach both ends.
An inset covering the whole viewport hides the vertical track; reducing it makes
the track available again when content overflows.

DataGrid manages this automatically from its complete table-header height:
column headers, the filter row and all rendered sticky group/tree rows. The
group panel is already outside the scroll viewport. The scrollbar's pointer
area therefore never covers those header controls, including the last column's
resize handle. No grid-specific configuration is required.

API: [ScrollEngine.verticalScrollbarTop](?!=/api-reference/ScrollEngine#verticalScrollbarTop).
