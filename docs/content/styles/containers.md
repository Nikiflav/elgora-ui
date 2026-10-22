---
id: style-containers
title: Containers and typography
group: styles
path: /styles/containers
order: 40
description: Arrange website sections and readable, fluid typography without wrapper components.
---

# Containers and typography

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

## Related topics and API

- [Layout and responsive grid](?!=/styles/layout) for column spans and container breakpoints.
- [Surfaces and gradients](?!=/styles/surfaces) and [Forma](?!=/styles/websites) for complete composition.
- [UiStyle](?!=/api-reference/UiStyle) lists the typed utility names.
