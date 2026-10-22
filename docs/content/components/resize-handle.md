---
id: resize-handle
title: Resizable elements — ResizeHandle
group: components
parent: menus
path: /components/resize-handle
order: 33
description: Add a reusable pointer resize grip, minimum dimensions and viewport constraints.
api:
  - ResizeHandle
  - ResizeHandleOptions
---

# Resizable elements — ResizeHandle

ResizeHandle adds resizing to a positioned element without owning its content. Try dragging the corner of the [Popover demo](?!=/popover).

## Configure a resize handle

The demo also uses [ResizeHandle](?!=/api-reference/ResizeHandle) to resize the panel
from its bottom-right corner. It captures the pointer, constrains dimensions to
the viewport and retains inline dimensions when the panel is reopened.

```ts
const grip = new ResizeHandle({
    target: popover.dom, minWidth: 200, minHeight: 100,
    onResize: size => console.log(size.width, size.height)
});
popover.addCleanup(grip);
```

The helper changes border-box dimensions, not panel positioning. Use a positioned
target with flexible content; dispose the helper with its owner.



## Ownership

Register the helper with its owner through addCleanup. Dispose it before removing an independently managed target. Resizing changes inline dimensions, not application data or the target’s placement policy.

API: [ResizeHandle](?!=/api-reference/ResizeHandle), [ResizeHandleOptions](?!=/api-reference/ResizeHandleOptions).
