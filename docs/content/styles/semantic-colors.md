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

The built-in roles are `primary`, `accent`, `neutral`, `success`, `warning`, and `danger`. Every role defines three related tokens:

| Token | Purpose |
| --- | --- |
| `--elg-<role>-bg` | Background or fill of the semantic element |
| `--elg-<role>-text` | Text and icon color on that background |
| `--elg-<role>-border` | Border, divider, or outline color |

The matching utility class applies the background, foreground text, and border roles together. For example, `ui: ["elg", "success"]` is a complete success surface; use `success-bg`, `success-text`, or `success-border` when only one role is needed.

<live-demo id="semantic-color-swatches" mode="readonly" demo="swatches"></live-demo>

## Theme-aware components

Use semantic classes for controls and containers so a theme switch changes the entire example consistently. The tokens are also available as CSS variables when a component needs a custom rule.

<live-demo id="semantic-theme-preview" mode="readonly" demo="theme-preview"></live-demo>

Use `*-bg` for a fill, `*-text` for text or icons, and `*-border` for outlines. Prefer the complete semantic class when the three roles belong together; this keeps the result readable in both light and dark themes.

Continue with [HTML elements](?!=/styles/html-elements) to see these roles applied to native elements and controls.
