---
id: quick-start
title: Quick start
group: getting-started
path: /getting-started/quick-start
order: 2
description: Build a complete interactive panel with native elements, owned state and a reactive button.
prev: /getting-started/download
next: /getting-started/framework-overview
toc: true
sectionRedirects:
  - show-some-data|/components/datagrid/overview
---

# Quick start

Build a small interactive panel, then use the same ideas in a form, grid or website.
This example needs only JavaScript, the library stylesheet and an HTTP server.

## Prepare the page

Follow [Installation](?!=/getting-started/download) to build and copy the browser
assets. This guide uses that static ESM setup:

~~~text
index.html
assets/
├── elgora-ui.js
├── elgora-ui.css
└── app.js
~~~

Create index.html:

~~~html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./assets/elgora-ui.css">
</head>
<body>
    <script type="module" src="./assets/app.js"></script>
</body>
</html>
~~~

Serve the folder over HTTP, not file://. No global Elgora object is required.

## Create a component

Put this complete example in assets/app.js. Its import is relative to app.js,
which is beside the library bundle. No build tool or TypeScript compiler is needed.

~~~js
import { cdiv, cbutton, e } from "./elgora-ui.js";

const app = cdiv({
    ui: ["elg", "surface", "box", "p-3", "m-3", "d-flex", "flex-col", "gap-2"]
});
const count = app.observable(0);
const button = cbutton({
    ui: ["elg", "btn", "primary"],
    style: { alignSelf: "flex-start" },
    onclick: () => count.Value++
});
button.bindProperty("textContent", count, value => "Clicked " + value + " times");

app.append([
    e("h2", { ui: ["m-0"] }, "Hello, Elgora UI"),
    e("p", { ui: ["m-0", "text-muted"] }, "A native DOM interface with reactive state."),
    button
]);
app.mount(document.body);
~~~

With a package-based build setup, the public import is from "elgora-ui" instead;
the component code stays the same. Do not use internal src paths in your app.

## Try it

Click the button. Its label updates without replacing the panel or manually
changing textContent in the click handler. Reloading resets the local count.

<live-demo id="quick-start-panel" mode="preview" height="230px"></live-demo>

## What each part does

- e() creates ordinary DOM elements for the static heading and paragraph.
- cdiv() and cbutton() create Components. The app owns the button appended to it.
- ui composes library classes: box supplies the frame, p-3 adds padding, and
  d-flex / flex-col / gap-2 arrange the children. Styles are separate from behavior.
- app.observable(0) creates an ObservableValue owned by the panel. Updating Value
  notifies its subscribers.
- bindProperty projects the count into the button label through the UI scheduler.
  The binding is disposed with its component.
- mount() attaches the component tree and runs its mount lifecycle.

These are the same primitives used by the larger library components; no app-wide
runtime object or template compiler is needed.

## Own the lifecycle

When this panel is no longer needed, dispose its common owner:

~~~js
app.dispose();
~~~

This removes the panel and disposes its owned button, observable and binding.
You do not need to dispose every child separately. Use unmount() instead only
when you want to detach the panel temporarily and mount it again later.
See [Lifecycle and resource ownership](?!=/components) for external listeners and
other resources.

## Where next?

- Learn the model: [Elements and components](?!=/getting-started/framework-overview),
  [state and events](?!=/fundamentals/state-and-events), then [rendering](?!=/fundamentals/rendering).
- Build a form: [Value editors](?!=/components/value-editors) and [responsive layout](?!=/styles/layout).
- Display records: [DataGrid overview](?!=/components/datagrid/overview) and [connecting data](?!=/components/datagrid/data-sources).
- Build a website: [Forma](?!=/styles/websites), [containers and typography](?!=/styles/containers), and [motion](?!=/styles/motion).

API: [e](?!=/api-reference/e), [cdiv](?!=/api-reference/cdiv),
[cbutton](?!=/api-reference/cbutton), [Component](?!=/api-reference/Component),
[ObservableValue](?!=/api-reference/ObservableValue).
