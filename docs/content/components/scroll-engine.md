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

## Programmatic scrolling

Create the viewport first, then pass it to `ScrollEngine`. Call
`updateDimensions()` with the logical content size and use `scrollTo()` when
application code needs to change the position.

<live-demo id="scroll-engine-basic" height="300px"></live-demo>

The same engine also handles wheel, keyboard, pointer, and touch input. Use
`onScroll()` to update dependent UI and `onResize()` to recalculate layout.

See the [`ScrollEngine` API reference](?!=/api-reference/ScrollEngine).
