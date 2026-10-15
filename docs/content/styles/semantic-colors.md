---
id: semantic-colors
title: Semantic colors
group: styles
path: /styles/semantic-colors
order: 10
description: Understand ElgoraUI semantic color roles and their background, text, and border tokens.
toc: true
keywords:
  - colors
  - theme
  - semantic
  - tokens
  - light
  - dark
---

# Semantic colors

ElgoraUI uses semantic colors instead of hard-coded color names. The same `primary` or `danger` role adapts to the active theme, while the markup stays unchanged.

## Color roles

The built-in roles are `primary`, `accent`, `neutral`, `success`, `warning`, and `danger`. Each role provides these tokens:

| Token | Purpose |
| --- | --- |
| `--elg-<role>-bg` | Background or fill of the semantic element |
| `--elg-<role>-text` | Text and icon color on that background |
| `--elg-<role>-border` | Border, divider, or outline color |
| `--elg-<role>-color` | Standalone accent text or icon on a normal surface |

The matching utility class applies the background, foreground text, and border roles together. For example, `ui: ["elg", "success"]` is a complete success surface; use `success-bg`, `success-text`, or `success-border` when only one role is needed.

<live-demo id="semantic-color-swatches" mode="readonly" demo="swatches"></live-demo>

## Theme-aware components

Use semantic classes for controls and containers so a theme switch changes the entire example consistently. The tokens are also available as CSS variables when a component needs a custom rule.

<live-demo id="semantic-theme-preview" mode="readonly" demo="theme-preview"></live-demo>

Use `*-bg` for a fill, `*-text` for text or icons, and `*-border` for outlines. Prefer the complete semantic class when the three roles belong together; this keeps the result readable in both light and dark themes.

For standalone accents, use `text-primary`, `text-success`, or `text-danger`
(for example, `ui: ["text-danger"]`). These consume the role's `*-color` token,
which can be lighter in the dark theme without changing filled button colors.
`text-neutral` uses the neutral role's text color for readable neutral text.

## Applying a theme

Set `data-theme="dark"` on the document element for an application-wide theme:

```ts
document.documentElement.dataset.theme = "dark";
// Restore the default light theme:
delete document.documentElement.dataset.theme;
```

The same attribute can be applied to a container to create a dark region.
Derived color tokens are recalculated at the theme boundary. Popups follow
the theme of their DOM ancestors; mount them inside the themed region when
using a local theme. Native controls use the matching CSS `color-scheme`.

Use `--elg-bg-color`, `--elg-surface-color`, `--elg-text-color`,
`--elg-text-muted`, `--elg-border-color`, and `--elg-border-strong` for ordinary
surfaces. `--elg-hover-bg` supplies a subtle accent hover background;
`--elg-selection-bg`, `--elg-selection-text`, and `--elg-selection-border`
describe selection. `--elg-shadow-color` adapts shadow strength to the theme.
Override tokens on the document or a container rather than adding dark-theme
rules to individual components.

Iframe documents have their own theme. The documentation previews synchronize
the docs theme automatically, including while an example is running.

Continue with [HTML elements](?!=/styles/html-elements) to see these roles applied to native elements and controls.
