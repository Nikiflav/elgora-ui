---
id: tooltip
title: Tooltip
group: components
path: /tooltip
order: 40
description: Add hover and keyboard-focus descriptions to any element.
toc: true
api:
  - Tooltip
  - TooltipContent
  - TooltipShowOptions
keywords:
  - tooltip
  - hover
  - focus
  - accessibility
---

# Tooltip

`Tooltip.attach()` adds a small description to an anchor. It supports pointer
hover and keyboard focus, accepts plain text or rich content, and returns a
cleanup function for temporary UI.

## Attach a tooltip

Attach a tooltip to any suitable native element or Component DOM root. The
placement and delay are optional.

<live-demo id="tooltip-attach"></live-demo>

```js
const cleanup = Tooltip.attach(button, "Helpful description", {
  placement: "top",
  delay: 300
});
```

## Rich content

Tooltip content can be a string, an `HTMLElement`, a Component, or another
supported typed content value.

```js
const content = e("span", { ui: ["elg"] }, "Rich tooltip");

Tooltip.attach(anchor, content, { placement: "right" });
```

Call the returned cleanup function when the anchor is removed or the tooltip
is no longer needed.

See the [`Tooltip` API reference](?!=/api-reference/Tooltip),
[`TooltipContent`](?!=/api-reference/TooltipContent), and
[`TooltipShowOptions`](?!=/api-reference/TooltipShowOptions).
