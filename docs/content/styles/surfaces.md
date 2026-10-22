---
id: style-surfaces
title: Surfaces and gradients
group: styles
path: /styles/surfaces
order: 50
description: Layer theme-aware surfaces, boxes and linear, radial or mesh gradients.
---

# Surfaces and gradients

## Containers and surfaces

Use `surface`, `surface-2`, and `surface-3` with `elg` to establish visual layers.
`box` adds a border, rounded corners, and a shadow. It does not add spacing or
choose a background: combine it with a surface and `p-*` for inner padding.

```ts
e("section", { ui: ["elg", "surface-2", "box", "p-3"] }, "Panel content");
```

<live-demo id="html-surfaces" mode="readonly" height="272px" src="html-elements.md.surfaces.ts"></live-demo>

## Gradients

The existing `gradient` style accepts an angle and two colors. Its original
background-color defaults remain available through `--elg-bg-color` and
`--elg-bg-color-2`. `gradient-radial` adds a soft spotlight; `gradient-mesh`
layers three radial gradients. The mesh is a static CSS approximation, not a
canvas or continuously running animation.

```ts
e("section", {
    ui: ["section", "gradient-mesh"],
    style: {
        "--elg-gradient-from": "rgb(156 126 255 / 18%)",
        "--elg-gradient-to": "rgb(255 166 127 / 15%)",
        "--elg-gradient-accent": "rgb(235 153 209 / 12%)"
    }
}, e("div", { ui: ["container"] }, "Your content"));
```

`gradient` uses `--elg-gradient-angle` (default `300deg`), `--elg-gradient-from`
and `--elg-gradient-to`. The radial variant also accepts
`--elg-gradient-position` (default `50% 50%`). Radial/mesh defaults derive from
primary/accent tokens and transparency, allowing the underlying surface to show
through. These styles set background images; they do not choose readable text
colors for arbitrary custom stops. Check text contrast in both themes.

## Related topics and API

- [Colors and themes](?!=/styles/semantic-colors) for reusable color tokens.
- [Containers and typography](?!=/styles/containers) and [Forma](?!=/styles/websites) for composition.
- [UiStyle](?!=/api-reference/UiStyle) lists the available surface and gradient names.
