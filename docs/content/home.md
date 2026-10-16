---
id: docs-home
title: Elgora UI documentation
group: home
path: /
order: 0
description: Browser-native TypeScript components, editable data views and composable application foundations.
toc: false
---

<section class="docs-home-hero">
<p class="elg-text-muted docs-eyebrow">ELGORA UI · TYPESCRIPT · BROWSER-NATIVE</p>
<h1>Data-rich interfaces.<br>Built for the browser.</h1>
<p class="docs-home-lead">Compose editable grids, forms and application workflows with native DOM elements, explicit state and a shared visual language.</p>
<div class="elg-d-flex elg-flex-wrap elg-gap-2">
<a href="?!=/getting-started/quick-start" class="elg elg-btn elg-primary elg-no-underline">Get started →</a>
<a href="?!=/components/datagrid/overview" class="elg elg-btn elg-neutral elg-no-underline">Explore DataGrid</a>
</div>
</section>

## A small order desk. A lot of possibilities.

100 sample orders, product illustrations and destination flags. Double-click a
cell to edit, filter a column, or drag its header into the grouping area.
The totals update with the data. Everything here is local demo data.

<live-demo id="home-order-desk" mode="preview" height="540px"></live-demo>

<p class="elg-text-muted">Try changing a quantity, choosing a product from the lookup, or grouping by destination. <a href="?!=/components/datagrid/editing">See the editing guide →</a></p>

## Find your starting point

<div class="elg-grid elg-gap-4 docs-home-paths">
<a href="?!=/getting-started/framework-overview" class="elg-col-sm-6 elg-col-lg-3"><i class="ri-code-s-slash-line" aria-hidden="true"></i><h3>Fundamentals</h3><p>Elements, components, keyed VNodes and observable state.</p><span>Learn the building blocks →</span></a>
<a href="?!=/components/value-editors" class="elg-col-sm-6 elg-col-lg-3"><i class="ri-input-method-line" aria-hidden="true"></i><h3>Components</h3><p>Value editors, calendars, menus and virtualized data views.</p><span>Explore the editors →</span></a>
<a href="?!=/data/data-source/overview" class="elg-col-sm-6 elg-col-lg-3"><i class="ri-database-2-line" aria-hidden="true"></i><h3>Data</h3><p>Storage-independent sources, filtering and transactional datasets.</p><span>Connect your data →</span></a>
<a href="?!=/styles/layout" class="elg-col-sm-6 elg-col-lg-3"><i class="ri-layout-grid-line" aria-hidden="true"></i><h3>Styles & layout</h3><p>Semantic colors, reusable UI styles and a responsive grid.</p><span>Build your layout →</span></a>
</div>

## Start small

A component owns its DOM and lifecycle. Use the same primitives to compose a
single button or an entire application.

```ts
import { cbutton } from "elgora-ui";

const button = cbutton({
    ui: ["elg", "btn", "primary"],
    onclick: () => console.log("Hello, Elgora UI")
}, "Say hello");
button.mount(document.body);
```

Follow [installation](?!=/getting-started/download) to load the script and styles,
then continue with the [quick start](?!=/getting-started/quick-start).
Detailed types and methods are linked from each guide to the API Reference.

### Platform first

Modern browsers are the target. Popover-based controls use the native Popover API;
there is no bundled polyfill. The grid above uses local data, not a backend service.
See [framework fundamentals](?!=/getting-started/framework-overview) for rendering,
state and component ownership.
