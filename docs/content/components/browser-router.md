---
id: browser-router
title: Browser Router
group: components
path: /components/browser-router
order: 50
description: Navigate between client-side pages without full document reloads.
toc: true
api:
  - BrowserRouter
keywords:
  - browser router
  - routing
  - navigation
  - history api
---

# Browser Router

`BrowserRouter` maps the current browser URL to a page and replaces only the
router's content when navigation occurs. It uses the History API, handles
internal links, and responds to browser back and forward actions.

## Define routes and mount the router

A route handler provides a path and a page factory. A page contains its DOM
root and can optionally provide a title, description, and initialization hook.

<live-demo id="browser-router-basic" height="240px"></live-demo>

The router should normally be created once for the application and mounted to
the element that owns the page content.

See the [`BrowserRouter` API reference](?!=/api-reference/BrowserRouter).
