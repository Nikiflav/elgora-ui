---
id: websites
title: Website composition and motion
group: styles
path: /styles/websites
order: 40
description: Build a fictional product website with composable layouts, gradients and accessible scroll reveals.
---

# Website composition and motion

**Forma** is a fictional creative workspace. This example combines ordinary HTML,
typed `ui` styles, observable state and keyed VNodes into a product landing page.
There is no real service, account, server request, or external image/font dependency.

<a href="./forma.html" target="_blank" rel="noopener">Open Forma as a full website ↗</a>

## Try the website

Switch **Board / List**, check off tasks in the workspace, toggle light/dark mode,
and scroll through the sections. The FAQ uses native `details` elements. Sample
illustrations are CSS, not screenshots of an application. Changes reset on reload.

<live-demo id="forma-website" mode="preview" height="800px"></live-demo>

## Containers, sections and typography

Use the same classes with `e()`, `c()` or plain HTML. No `Section` or `Hero`
component is required. Combine them with the existing [responsive grid](?!=/styles/layout).

```ts
const section = e("section", { ui: ["section"] },
    e("div", { ui: ["container"] },
        e("p", { ui: ["eyebrow"] }, "A little space for big things"),
        e("h1", { ui: ["title-display"] }, "Make room for your next idea."),
        e("p", { ui: ["lead", "measure"] }, "Your supporting introduction.")
    )
);
```

| UI style | Purpose |
| --- | --- |
| `container` | Centered content with a maximum width, responsive gutters and border-box sizing. |
| `section` | Fluid vertical section spacing. |
| `title-display` | Large, fluid hero typography. |
| `title-section` | Fluid section headings. |
| `lead` | A comfortable introductory text size and line height. |
| `measure` | Limits reading width to 62 characters. |
| `eyebrow` | Small, spaced uppercase section labels. |

Override `--elg-container-width` (default `74rem`), `--elg-container-gutter`
(`clamp(1rem, 4vw, 2.5rem)`) and `--elg-section-space`
(`clamp(3.5rem, 7vw, 6.5rem)`) on a page or section. Typography does not force a
color scheme; use the normal semantic color tokens and utility styles.

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

## Revealing content on scroll

[`ScrollReveal`](?!=/api-reference/ScrollReveal) observes marked elements. It
starts CSS entrance animations when they enter the viewport; it does not tie
animation progress to each pixel of scrolling. Observations are batched through
the Elgora UI scheduler, not a per-frame scroll listener.

```ts
import { cdiv, e, ScrollReveal } from "elgora-ui";

const page = cdiv({},
    e("article", { "data-elg-reveal": "fade-up" }, "First idea"),
    e("article", { "data-elg-reveal": "fade" }, "Another idea")
);
page.mount(document.body);
page.addCleanup(new ScrollReveal(page.dom, { stagger: 65 }));
```

`data-elg-reveal` selects `fade` or `fade-up`; an empty value uses the configured
effect (default `fade-up`). Targets reveal only once by default. Set `once: false`
to repeat after leaving/re-entering. `stagger` delays sibling targets, capped at
240ms so long groups do not make readers wait. The default threshold is 15%.

Pass `root` for a nested scroll viewport. Call `refresh()` after adding/removing
targets; the helper does not install a mutation observer or recreate your DOM.
[`dispose()`](?!=/api-reference/ScrollReveal#dispose) restores owned classes and
delays and disconnects observers/listeners. Register it with `addCleanup()`.

The motion tokens are `--elg-motion-duration` (`560ms`),
`--elg-motion-easing` (`cubic-bezier(.2, .7, .2, 1)`) and
`--elg-motion-distance` (`18px`); `--elg-reveal-delay` can delay an individual
target when sibling staggering is not configured. `fade-up` uses individual
`translate`, leaving a component's `transform` available for hover/scale effects.
Do not simultaneously animate the same target's opacity or individual translate
from two systems; reveal a wrapper in that case. Animation styles release their
properties after completion.

## Rotating disclosure icons

Apply `ui: ["rotate-on-open"]` (or `elg-rotate-on-open` in plain HTML) to a
decorative icon inside a native `summary`. It rotates 180° while its `details`
is open, with a 180ms transition using `--elg-motion-easing`.

```ts
e("details", {},
    e("summary", {}, "More information",
        e("i", { class: "ri-arrow-down-s-line", ui: ["rotate-on-open"], ariaHidden: "true" })),
    e("p", {}, "The details.")
);
```

For custom controls, put the icon directly inside a button with
`aria-expanded="true"` or `"false"`. The control must update that attribute and
manage the associated content; this utility only animates the icon. Reduced
motion disables the transition, but preserves the open-state rotation.

## Accessibility and fallback

Content remains visible if IntersectionObserver is unavailable. The helper does
not set `aria-hidden` or remove content from the document. Keyboard focus reveals
its containing target. `prefers-reduced-motion: reduce` shows all targets without
animation, including when that preference changes while the page is open. Print
styles also show pending targets without animation. Keyboard-focused targets
appear immediately, without stagger delays.
After opting out, once-only targets are not hidden again when motion is enabled.

The helper also works on server-rendered HTML: without JavaScript, targets are
visible because the pending class is installed only by the helper. Forma itself
is a client-rendered component demo; it is not an SSR or SEO implementation.

See [`ScrollRevealOptions`](?!=/api-reference/ScrollRevealOptions) for the complete
observer configuration and the [Component lifecycle](?!=/components) for resource
ownership. The standalone showcase uses the same public library exports as the
embedded preview; its branding and illustrations remain demo-specific.
