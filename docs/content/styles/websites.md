---
id: websites
title: Building a website — Forma
group: styles
path: /styles/websites
order: 90
description: Build a fictional product website with composable layouts, gradients and accessible scroll reveals.
sectionRedirects:
  - containers-sections-and-typography|/styles/containers#containers-sections-and-typography
  - gradients|/styles/surfaces#gradients
  - revealing-content-on-scroll|/styles/motion#revealing-content-on-scroll
  - rotating-disclosure-icons|/styles/motion#rotating-disclosure-icons
  - accessibility-and-fallback|/styles/motion#accessibility-and-fallback
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

<live-demo id="forma-website" mode="preview" height="800px" src="websites.md.ts"></live-demo>

## How it is built

Forma combines reusable library primitives, not a site-specific framework. Its layout uses containers and the responsive grid; tokens provide surfaces and gradients; Component bindings and keyed VNodes update the workspace; ScrollReveal owns the entrance effects. Brand artwork and copy belong to this example, not the library.

Start with ordinary semantic HTML, add styles, then add a Component only where state or resource ownership is needed.

## Related topics

- [Containers and typography](?!=/styles/containers)
- [Layout and responsive grid](?!=/styles/layout)
- [Surfaces and gradients](?!=/styles/surfaces)
- [Motion and scroll reveal](?!=/styles/motion)
- [Rendering and VNodes](?!=/fundamentals/rendering)
