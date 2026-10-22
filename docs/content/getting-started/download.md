---
id: download
title: Installation
group: getting-started
path: /getting-started/download
order: 1
description: Build and serve the currently supported browser assets; distinguish planned distribution channels.
keywords:
  - install
  - download
  - package
  - npm
sectionRedirects:
  - choose-a-distribution-method|/getting-started/download#current-distribution
  - npm-package|/getting-started/download#planned-distribution-channels
  - github-release-assets|/getting-started/download#planned-distribution-channels
  - cdn|/getting-started/download#planned-distribution-channels
  - which-option-should-i-choose|/getting-started/download#current-distribution
  - see-also|/getting-started/download#next-step
---

# Installation

Elgora UI is still in development. The supported path documented here is to build
the library from this checkout and serve its static assets over HTTP. Public npm,
release-archive and CDN publishing are planned, not assumed available.

## Current distribution

In a checkout with its development dependencies installed:

```bash
npm run build
```

The library build produces ESM JavaScript, a UMD bundle, TypeScript declarations
and a separate stylesheet in dist. The documentation site is a different output:
use npm run docs:build only when building this docs site.

## Static bundles from an HTTP server

Copy the ESM bundle and stylesheet to your application's public assets:

```text
assets/
├── elgora-ui.js
├── elgora-ui.css
└── app.js
```

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./assets/elgora-ui.css">
</head>
<body>
    <main id="app"></main>
    <script type="module" src="./assets/app.js"></script>
</body>
</html>
```

Because app.js is itself in assets, its relative import is:

```js
import { cbutton } from "./elgora-ui.js";

cbutton({
    ui: ["elg", "btn", "primary"],
    children: "Hello from Elgora UI"
}).mount(document.getElementById("app"));
```

Use an HTTP server, not file://. The ESM build uses imports, not a global Elgora
object. Global bundle examples refer to the UMD build, which must be loaded and
configured separately.

## Planned distribution channels

npm, downloadable release archives and CDN hosting are not configured by this
guide. Do not copy placeholder installation commands or example hosting URLs
into production. When those channels are published, pin an explicit version
and include the matching CSS.

Other guides use imports from "elgora-ui" to show the public module boundary.
For the static setup above, replace that module specifier with the relative
bundle path. Do not import library internals from src in a consuming application.

## Next step

Continue to [Quick start](?!=/getting-started/quick-start), or return to
[Documentation](?!=/docs) to choose a form, grid, website or data workflow.
