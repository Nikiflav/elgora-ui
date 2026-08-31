---
id: download
title: Download and installation
group: getting-started
path: /getting-started/download
order: 2
description: Choose how to include ElgoraUI in a browser application.
prev: /getting-started/framework-overview
next: /components
toc: true
keywords:
  - download
  - installation
  - npm
  - github
  - static
  - cdn
---

# Download and installation

ElgoraUI can be used as a set of static browser assets or, in the future, through a package manager. The right option depends on whether the application is a plain HTML project, a build-based project, or a project that wants to track published releases.

## Choose a distribution method

| Method | What you need | Best for |
| --- | --- | --- |
| Static bundles | `elgora-ui.js` and `elgora-ui.css` | Plain HTML applications and any HTTP server |
| npm package | Node.js and a package manager | Vite, Webpack, or other build-based applications |
| GitHub release assets | A downloaded release archive | Pinning and serving a specific version |
| CDN | A public URL to published assets | Prototypes and simple demos |

The static bundle is the currently available distribution path. The npm, GitHub, and CDN links below are placeholders until the corresponding release workflow is published.

## Static bundles from an HTTP server

Build or download the production files and copy them into the application’s public assets directory. The library build produces:

```text
dist/
├── elgora-ui.css
├── elgora-ui.js
└── elgora-ui.umd.cjs
```

For a plain browser application, include the CSS and the ESM JavaScript module in `index.html`:

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

Then import ElgoraUI from the copied bundle in the application module:

```js
import { cbutton } from "./assets/elgora-ui.js";

cbutton({
    ui: ["elg", "btn", "primary"],
    children: "Hello from ElgoraUI"
}).mount(document.getElementById("app"));
```

The static files must be served over HTTP. Use `npm run docs:build` to build the documentation site or `npm run build` to build the library distribution. Opening the HTML file directly with `file://` is not the supported deployment model because browser module and asset loading rules vary by browser.

## npm package

The planned npm distribution will be the recommended option for applications that already use a JavaScript build tool. The expected workflow will look like this:

```bash
npm install elgora-ui
```

```js
import { cbutton } from "elgora-ui";
import "elgora-ui/dist/elgora-ui.css";

cbutton({
    ui: ["elg", "btn", "primary"],
    children: "Installed from npm"
}).mount(document.getElementById("app"));
```

Package link: [npm package — placeholder](https://www.npmjs.com/package/elgora-ui).

The package should expose ESM, UMD, TypeScript declarations, and the production CSS bundle. The CSS remains a separate import so applications can decide how and when to load the visual system.

## GitHub release assets

For teams that want to download and archive a specific version, each release can later contain a versioned archive with the same static files:

```text
elgora-ui-1.0.0/
├── elgora-ui.css
├── elgora-ui.js
├── elgora-ui.umd.cjs
└── index.d.ts
```

This is useful when the assets are served from an internal web server or committed into an application repository. Release link: [GitHub releases — placeholder](https://github.com/your-org/elgora-ui/releases).

## CDN

A CDN build can be useful for prototypes and small standalone demos. Once a release CDN exists, the usage could look like this:

```html
<link rel="stylesheet" href="https://cdn.example.com/elgora-ui/1.0.0/elgora-ui.css">
<script type="module">
    import { cbutton } from "https://cdn.example.com/elgora-ui/1.0.0/elgora-ui.js";

    cbutton({
        ui: ["elg", "btn", "primary"],
        children: "CDN example"
    }).mount(document.getElementById("app"));
</script>
```

CDN link: [CDN documentation — placeholder](https://cdn.example.com/elgora-ui).

For production applications, pin an exact version and use integrity metadata when the hosting provider supports it. Avoid depending on an unversioned `latest` URL.

## Which option should I choose?

- Use static bundles when the application should run from an ordinary HTTP server without a build step.
- Use npm when the application already has a build pipeline and should import only the modules it needs.
- Use GitHub release assets when the team controls deployment and wants an auditable, versioned archive.
- Use a CDN for prototypes, examples, and temporary experiments.

## See also

- [ElgoraUI fundamentals](?!=/getting-started/framework-overview)
- [Components](?!=/components)
