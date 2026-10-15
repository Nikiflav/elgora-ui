---
id: scrollbars
title: Native scrollbars
group: components
path: /components/scrollbars
order: 61
description: Add Elgora scrollbars to native scroll containers, a container subtree or an entire document.
toc: true
api:
  - Scrollbars
keywords:
  - native scrollbars
  - automatic scrollbars
  - overflow
---

# Native scrollbars

`Scrollbars` gives native scroll containers the same scrollbar appearance as
[ScrollEngine](?!=/components/scroll-engine). The browser still scrolls the content:
wheel, touch gestures, keyboard navigation, text selection and `scrollIntoView()`
continue to work normally. No wrapper is inserted around the content.

## Automatic installation

The example installs scrollbars for its sandbox window. Try the native panel,
the textarea and the page scrollbar. Add a panel to see automatic discovery.
Enable **Local** to keep panels in always-visible mode while the global controls
continue to affect the page and textarea. Disable Local to resume the global
settings. Turning Global off disposes only the global installation; an enabled
local installation continues to work. Scroll positions are preserved.

<live-demo id="native-scrollbars" height="480px"></live-demo>

```ts
const installation = Scrollbars.install(window, { scrollbarMode: "thin", scrollbarHoverDistance: 50 });

// Applies to the native containers owned by this installation.
installation.scrollbarMode = "always";
installation.scrollbarHoverDistance = 25;

// Restores native scrollbars and releases observers, listeners and overlays.
installation.dispose();
```

Installation discovers containers with `overflow: auto` or `overflow: scroll`,
including containers that gain overflow later. A Window installation also handles
the document's scrolling element. New elements and layout changes are reconciled through the
ElgoraUI frame scheduler. `ScrollEngine` viewports and their descendants are skipped.
Call `installation.refresh()` after application-specific changes that do not emit
DOM or resize notifications.

## Container scopes and ownership

`install(container)` enhances the container itself and its descendants. It leaves
the rest of the document alone, making it suitable for dialogs or embedded views:

```ts
const pageScrollbars = Scrollbars.install(window, { scrollbarMode: "thin" });
const dialogScrollbars = Scrollbars.install(dialog, { scrollbarMode: "always" });

// The page changes to auto; the dialog keeps its local always setting.
pageScrollbars.scrollbarMode = "auto";

// The dialog immediately resumes the page's auto settings, without losing scroll position.
dialogScrollbars.dispose();
```

Ownership follows these priorities, regardless of creation order:

1. An explicit `Scrollbars.attach(element)` owns that element's scrollbar.
2. The closest container installation owns the other native scroll viewports in its scope.
3. A Window installation is the fallback for the remaining document.

Nested installations do not duplicate controls. Ownership transfers reuse the
existing overlay and preserve scroll position. Disposing an outer installation
does not dispose a deeper installation or an explicit attachment. New descendants
and moved containers are reconciled automatically.

## Attach to one container

Set up native overflow and a bounded size, then attach:

```ts
const panel = e("div", {
    style: { height: "240px", overflow: "auto" }
}, content);
document.body.append(panel);

const handle = Scrollbars.attach(panel, { scrollbarMode: "thin" });
handle.scrollbarMode = "auto";
handle.refresh();

// Keep the panel and its content; restore its original scrollbar visibility.
handle.dispose();
```

`Scrollbars.attach(window)` enhances only the page scrollbar. `attach(textarea)`
also works; user input and resizing refresh its scroll geometry. A programmatic
`textarea.value` change can be followed by `handle.refresh()`.

Repeated calls to `attach()` for an element return the same handle. Repeated
`install()` calls for the same Window or container return the same installation.
If options are provided again, they update its presentation. Dispose when the owner is released;
these calls do not create independent ownership counts.

An automatic installation leaves explicit attachments alone, including
their mode and disposal. Calling `attach()` on an automatically managed element
returns its current handle and promotes it to explicit ownership. Further changes
or disposal of installations do not affect that handle. If the explicit handle is
disposed while an installation still covers the element, automatic discovery can
enhance it again on the next scheduled reconciliation.

The helper preserves the target's inline styles and DOM
children. An axis without overflow has no scrollbar.

## Appearance and scope

`scrollbarMode` supports `"thin"` (default), `"auto"` and `"always"`, with the same
3px idle thumb and 12px pointer hit area as ScrollEngine. Pointer proximity, scrolling and
dragging expand the thumb in thin mode. Both adapters share the painting and
pointer interaction implementation.

`scrollbarHoverDistance` defaults to `50` CSS pixels from the viewport's right or
bottom edge. Each axis expands independently; the middle of the content stays
visually quiet. `0` means direct scrollbar hover only. The option is available on
`attach()`, `install()` and their returned handles, and accepts non-negative finite
numbers. Moving the pointer away restores the idle appearance unless scrolling
or dragging is still active.

Each installation handles its scope in one document's ordinary HTML tree. It does not traverse
iframe documents or shadow roots. Call `Scrollbars.install(iframe.contentWindow)`
from code with access to that document to enhance it separately. Native controls
whose internal scroll areas are not exposed as DOM elements are browser-managed.
Scroll containers with rotations or scaled transforms are not supported.

## API reference

[Scrollbars](?!=/api-reference/Scrollbars),
[ScrollbarsOptions](?!=/api-reference/ScrollbarsOptions),
[ScrollbarsHandle](?!=/api-reference/ScrollbarsHandle),
[ScrollbarsInstallation](?!=/api-reference/ScrollbarsInstallation),
[ScrollbarMode](?!=/api-reference/ScrollbarMode).
