---
id: popup-menu
title: PopupMenu
group: components
path: /popup
order: 31
description: Build dynamic action menus with nested items and context positioning.
toc: true
api:
  - PopupMenu
  - PopupMenuOptions
  - PopupMenuShowOptions
  - MenuItem
  - RemixIcon
keywords:
  - popup menu
  - menu
  - submenu
  - context menu
parent: menus
---

# PopupMenu

`PopupMenu` renders action menus on demand. Items can contain icons, actions,
links, dividers, checked state, and asynchronously loaded nested submenus.

## Dynamic nested menu

Create a menu once and provide its items when the trigger is activated. This
keeps menu content close to the action that opens it and allows submenus to be
loaded only when needed.

<live-demo id="popup-menu-dynamic" src="popup-menu.md.ts"></live-demo>

## Context menu

The same menu can be opened at the pointer by passing a `point` to `show()`.

```js
target.addEventListener("contextmenu", event => {
  event.preventDefault();
  menu.show({
    point: { x: event.clientX, y: event.clientY },
    items: createItems()
  });
});
```

See the [`PopupMenu` API reference](?!=/api-reference/PopupMenu),
[`PopupMenuOptions`](?!=/api-reference/PopupMenuOptions),
[`PopupMenuShowOptions`](?!=/api-reference/PopupMenuShowOptions),
[`MenuItem`](?!=/api-reference/MenuItem), and
[`RemixIcon`](?!=/api-reference/RemixIcon).
