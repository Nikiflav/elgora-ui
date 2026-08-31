---
id: popover
title: Popover
group: components
path: /popover
order: 20
description: Create anchored and point-positioned floating panels.
toc: true
api:
  - Popover
  - PopoverOptions
  - PopoverPoint
  - PopoverPlacement
  - PopoverCloseMode
keywords:
  - popover
  - anchor
  - context menu
  - floating panel
---

# Popover

`Popover` is a reusable floating panel. It can be positioned relative to an
anchor element or at a screen point, making it useful for contextual help,
menus, inspectors, and custom context-menu interactions.

## Anchored popover

Pass an `anchorElement` and a placement to position the panel relative to a
native element. The panel is a Component, so it can contain text, native
elements, or other Components.

<live-demo id="popover-anchored"></live-demo>

The essential API shape is:

```js
const popover = new Popover({
  anchorElement: button,
  placement: "bottom-start",
  children: "Popover content"
});

popover.mount(document.body);
popover.show();
```

## Point-based popover

Use `setPoint(x, y)` and `show()` when the panel should open at a pointer
position, such as after a `contextmenu` event.

```js
target.addEventListener("contextmenu", event => {
  event.preventDefault();
  popover.setPoint(event.clientX, event.clientY);
  popover.show();
});
```

See the [`Popover` API reference](?!=/api-reference/Popover), including
[`PopoverOptions`](?!=/api-reference/PopoverOptions),
[`PopoverPoint`](?!=/api-reference/PopoverPoint),
[`PopoverPlacement`](?!=/api-reference/PopoverPlacement), and
[`PopoverCloseMode`](?!=/api-reference/PopoverCloseMode).
