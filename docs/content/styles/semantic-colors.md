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

The matching semantic class sets the background's base HSL values, the foreground
color, and the border color token. For example, `ui: ["elg", "success", "p-2"]`
creates a filled success surface. The semantic class does not draw a border:
add `border`, `box`, or `btn` when a visible border is needed.

Use CSS variables through `var(...)` in style declarations, not as names in
the `ui` array. For standalone colored text, use the `text-*` styles described
below.

<live-demo id="semantic-color-swatches" mode="readonly" demo="swatches"></live-demo>

## Theme-aware components

Use semantic classes for controls and containers so a theme switch changes the entire example consistently. The tokens are also available as CSS variables when a component needs a custom rule.

<live-demo id="semantic-theme-preview" mode="readonly" demo="theme-preview"></live-demo>

Use semantic classes when the background and foreground belong together. For
custom CSS, consume the corresponding variables explicitly:

```css
.success-note {
    background-color: var(--elg-success-bg);
    color: var(--elg-success-text);
    border: 1px solid var(--elg-success-border);
    padding: .5rem;
}
```

For standalone accents, use `text-primary`, `text-success`, or `text-danger`
(for example, `ui: ["text-danger"]`). These consume the role's `*-color` token,
which can be lighter in the dark theme without changing filled button colors.
`text-neutral` uses the neutral role's text color for readable neutral text.

## Interaction and selection

The following UI styles change appearance; they do not implement selection,
keyboard navigation, or application state themselves.

| UI style | Visual behavior |
| --- | --- |
| `hover` | Adjusts the background while the pointer is over the element |
| `focus` | Adjusts the background when the element matches `:focus-visible` |
| `selected` | Applies the theme's selection background and foreground |
| `active` | Adds persistent emphasis and an additional pressed-state adjustment |

```ts
const item = e("button", {
    type: "button",
    ui: ["elg", "surface", "hover", "focus", "p-2", "rounded-1"]
}, "Choose item");
document.body.append(item);

// Application code controls persistent visual states.
item.classList.add("elg-selected");
item.setAttribute("aria-pressed", "true");
```

Use an appropriate native element or ARIA pattern for the interaction. The
`focus` style does not make a noninteractive element focusable. Native controls
marked `elg` also have a focus-visible outline, independently of this background
style. Controls styled with `btn` already provide hover and pressed feedback.

## Applying a theme

Set `data-theme="dark"` on the document element for an application-wide theme:

```ts
document.documentElement.dataset.theme = "dark";
// Restore the default light theme:
delete document.documentElement.dataset.theme;
```

The same attribute can be applied to a container to create a dark region inside
a light page. Add `elg` to an element that should paint the themed background;
the theme attribute defines tokens but does not paint a background itself.
Derived color tokens are recalculated at the theme boundary. Popups follow
the theme of their DOM ancestors; mount them inside the themed region when
using a local theme. Native controls use the matching CSS `color-scheme`.

Use `--elg-bg-color`, `--elg-surface-color`, `--elg-text-color`,
`--elg-text-muted`, `--elg-border-color`, and `--elg-border-strong` for ordinary
surfaces. `--elg-hover-bg` supplies a subtle accent hover background;
`--elg-selection-bg`, `--elg-selection-text`, and `--elg-selection-border`
describe selection. `--elg-shadow-color` adapts shadow strength to the theme.

## Customizing colors

Override shared tokens rather than adding dark-theme rules to every component.
The semantic classes derive their filled backgrounds from the role's base HSL
values. Set those values to customize a role across controls:

```css
/* Include application overrides after the library stylesheet. */
:root {
    --elg-primary-h: 210;
    --elg-primary-s: 80;
    --elg-primary-l: 45;
}

/* A locally branded dark region: <section class="elg brand-region" data-theme="dark"> */
.brand-region[data-theme="dark"] {
    --elg-primary-h: 175;
    --elg-primary-s: 65;
    --elg-primary-l: 40;
}
```

Derived variables are recalculated at `:root` and elements with `[data-theme]`.
When overriding base HSL values locally, use a theme boundary as above; merely
setting them on an arbitrary descendant does not recalculate inherited derived
variables. CSS rules that consume a final token directly can override that token
at their scope instead. For example, `--elg-success-color` controls `text-success`;
changing `--elg-success-bg` alone does not change the HSL-based `success` class.

The built-in light palette is defined at `:root`, with overrides for
`[data-theme="dark"]`. A nested `data-theme="light"` does not reset all values
inherited from a dark ancestor; a locally inverted light region needs an explicit
light palette. Theme customization should also preserve foreground/background
contrast and visible focus and selection states.

Iframe documents have their own theme. The documentation previews synchronize
the docs theme automatically, including while an example is running.

Continue with [HTML elements](?!=/styles/html-elements) to see these roles applied to native elements and controls.
