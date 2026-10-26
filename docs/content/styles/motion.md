---
id: style-motion
title: Motion and scroll reveal
group: styles
path: /styles/motion
order: 80
description: Reveal content and animate disclosure icons with ownership and reduced-motion fallbacks.
api:
  - ScrollReveal
  - ScrollRevealOptions
---

# Motion and scroll reveal

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

Set `--elg-open-rotation` on the icon to customize the angle (default `180deg`).
TreeView uses `90deg` to turn a right-facing chevron downward. Keep the icon's
DOM node when updating the state so the CSS transition can run.

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
