---
id: scroll-spy
title: ScrollSpy
group: components
path: /components/scroll-spy
order: 62
description: Track the active section in existing in-page navigation.
toc: true
api:
  - ScrollSpy
  - ScrollSpyOptions
---

# ScrollSpy

`ScrollSpy` connects navigation links to headings in an existing content element.
The “On this page” navigation in these documentation topics uses it. Scroll this
page or click a section link to see the active section change.

## Basic usage

Use unique IDs on the headings and matching anchor links in the navigation.
The component adds no wrapper elements and does not render the navigation.

```html
<article id="content">
  <h2 id="overview">Overview</h2>
  <!-- Section content -->
  <h2 id="details">Details</h2>
  <!-- Section content -->
</article>
<nav id="sections" aria-label="Page sections">
  <a href="#overview">Overview</a>
  <a href="#details">Details</a>
</nav>
```

```ts
import { ScrollSpy } from "elgora-ui";

const spy = new ScrollSpy({
    container: document.querySelector<HTMLElement>("#content")!,
    navigation: document.querySelector<HTMLElement>("#sections")!,
    offset: 24
});
```

## Scroll containers

By default the scroll viewport is the window. Set `scrollContainer` when the
content is inside a separately scrolling panel. Both the content and its
navigation may be placed inside that panel; sticky positioning is configured
through CSS, independently of ScrollSpy.

```ts
const spy = new ScrollSpy({
    container: article,
    navigation: sectionNavigation,
    scrollContainer: panel,
    offset: 32
});
```

The last heading above the activation line is active. Before the first heading,
the first section is active. At the bottom of a scrollable viewport, the last
section becomes active even when it is too short to reach the activation line.
Hidden targets, missing targets and links to other documents are ignored.

## Active appearance

The current link receives `aria-current="location"` and the class
`elg-scroll-spy-active`. Supply `activeClass` to use a different class.
Styling remains under the application's control, for example:

```css
nav a { border-left: 2px solid transparent; }
nav a.elg-scroll-spy-active {
    color: var(--elg-primary-color);
    border-left-color: currentColor;
}
```

When the navigation itself scrolls, ScrollSpy keeps the newly active link
visible without scrolling the surrounding page. It does not intercept anchor
clicks, move keyboard focus, or change the URL during scrolling.

## Refresh and disposal

Scroll and resize updates are batched through the ElgoraUI scheduler. Content
size changes are observed automatically. After adding, removing or renaming
headings or links, call `refresh()` to rescan their associations.

```ts
spy.refresh();

// When the view is removed:
spy.dispose();

// Inside an owning Component, use its cleanup lifecycle instead:
this.addCleanup(spy);
```

Disposal removes listeners and observers and restores the navigation's original
active classes and `aria-current` attributes.

## API reference

See [ScrollSpy](?!=/api-reference/ScrollSpy) and
[ScrollSpyOptions](?!=/api-reference/ScrollSpyOptions).
