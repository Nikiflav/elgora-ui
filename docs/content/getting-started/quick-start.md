---
id: quick-start
title: Quick start
group: getting-started
path: /getting-started/quick-start
order: 2
description: Compose your first component, bind observable state and connect a grid to local data.
prev: /getting-started/download
next: /getting-started/framework-overview
toc: true
---

# Quick start

First follow [installation](?!=/getting-started/download) to load the JavaScript
and CSS in your application. Examples below use TypeScript imports; the browser
bundle exposes the same API through `Elgora`.

## Create a component

```ts
import { cbutton, ObservableValue } from "elgora-ui";

const count = new ObservableValue(0);
const button = cbutton({
    ui: ["elg", "btn", "primary"],
    onclick: () => count.Value++
});
button.bindProperty("textContent", count, value => `Clicked ${value} times`);
button.mount(document.body);
```

UI styles select reusable styling rules. `ObservableValue` holds explicit state;
the binding updates the button's text when that state changes. See
[cbutton](?!=/api-reference/cbutton), [ObservableValue](?!=/api-reference/ObservableValue)
and [Component.bindProperty](?!=/api-reference/Component#bindProperty).

## Show some data

```ts
import { DataGrid } from "elgora-ui";

const grid = new DataGrid({
    data: [{ product: "Keyboard", quantity: 2 }, { product: "Mouse", quantity: 5 }],
    showGroupPanel: false,
    columns: [
        { name: "product", caption: "Product" },
        { name: "quantity", caption: "Quantity", dataType: "number" }
    ]
});
grid.dom.style.height = "280px";
grid.mount(document.body);
```

The grid wraps a plain array in an [ArrayDataSource](?!=/api-reference/ArrayDataSource).
For editing, validation and explicit new-row defaults, continue with
[Cell editing](?!=/components/datagrid/editing). For a remote backend, use the
[DataSource contract](?!=/data/data-source/overview).

## Own the lifecycle

Dispose a component when its owning view is removed:

```ts
button.dispose();
grid.dispose();
```

For larger interfaces, compose components under a parent instead of maintaining
unrelated DOM roots. Parent disposal releases owned child components. See
[Components and lifecycle](?!=/components).

## Where next?

- [Fundamentals](?!=/getting-started/framework-overview) — DOM, VNodes, observables and scheduling.
- [Styles & layout](?!=/styles/layout) — layout utilities without a layout component.
- [Value editors](?!=/components/value-editors) — text, numbers, dates, toggles and lookups.
- [DataSet](?!=/data/dataset) — transactions, business rules and undoable local changes.
