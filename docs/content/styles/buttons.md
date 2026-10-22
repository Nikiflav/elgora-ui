---
id: style-buttons
title: Buttons
group: styles
path: /styles/buttons
order: 60
description: Native actions, semantic button variants, ghost buttons, focus and disabled states.
---

# Buttons

## Buttons

`button.elg` keeps the native element predictable and flat. Add `btn` for the component styling, then choose a semantic role such as `primary`, `neutral`, or `danger`.

The demo below includes all six semantic roles: `primary`, `accent`, `neutral`,
`success`, `warning`, and `danger`, alongside flat and disabled buttons.
"Anchor as button" is an `<a>` styled as a neutral button; "Text link →" is a
plain navigation link, using the primary text color and an underline on hover
or keyboard focus. Both links open an example destination in a new tab.

For a neutral action without a resting fill or visible frame, combine `btn`
with `btn-ghost`. Unlike a bare `button.elg`, it retains the standard button
padding, radius, hover/pressed feedback, disabled treatment and keyboard focus
outline. Its border stays transparent rather than changing the button's size;
an explicit `selected` state still shows its selection background.

```ts
cbutton({ ui: ["elg", "btn", "btn-ghost"] }, "Action");
```

Plain and `neutral` buttons have a faint neutral background, a subtle border and
neutral hover/pressed fills. Semantic roles such as `primary` and `danger` stay
filled; explicit surfaces and `selected` keep their own backgrounds. Keyboard
focus uses the shared outline. Native disabled buttons are dimmed and do not
receive hover/pressed styling. An `aria-disabled` link is styled the same way,
but the application must prevent its activation.

The defaults are `--elg-btn-radius: 6px` and `--elg-btn-padding: .15em .5em`.
Override these on a container or individual button for a denser layout.
`--elg-btn-neutral-bg`, `--elg-btn-neutral-hover-bg`,
`--elg-btn-neutral-pressed-bg` and `--elg-btn-neutral-border` control the neutral
appearance. The resting/hover/pressed defaults mix the theme text color at 3%/6%/10% over
transparency, so they work on both themes. Reduced motion disables transitions.

<live-demo id="html-buttons" mode="readonly" src="html-elements.md.buttons.ts"></live-demo>

## Standard text links

Ordinary anchors with href use --elg-link-color, which defaults to the theme's
primary foreground color. Visited links keep that same color. Links are not
underlined at rest; hover and keyboard focus add an underline. Keyboard focus
also shows the shared focus outline. The underline offset defaults to .18em
through --elg-link-underline-offset.

```css
.help-panel {
    --elg-link-color: var(--elg-accent-color);
}
```

The same defaults apply to plain HTML and e("a", ...). Explicit color utilities
still override the default. The btn style keeps its own treatment; no-underline
opts out of the text-link underline behavior for custom navigation. Anchors
without href are not styled as interactive links.

## Related topics and API

- [Colors and themes](?!=/styles/semantic-colors) define semantic roles.
- [Native inputs and tables](?!=/styles/html-elements) use the same style vocabulary.
- [UiStyle](?!=/api-reference/UiStyle), [cbutton](?!=/api-reference/cbutton) and [e](?!=/api-reference/e).
