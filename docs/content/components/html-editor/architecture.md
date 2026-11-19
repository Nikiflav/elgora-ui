---
id: html-editor-architecture
title: Architecture
group: html-editor
path: /components/html-editor/architecture
order: 20
description: Understand HtmlEditor ownership, command flow and the shared editing model.
toc: true
api:
  - HtmlEditor
  - HtmlEditorSurface
  - HtmlEditorCommandRegistry
  - HtmlEditorUiCommandFieldService
  - HtmlEditorToolbar
  - HtmlEditorInspector
keywords:
  - architecture
  - components
  - command flow
  - model
---

# Architecture and data flow

HtmlEditor has one editing model and several coordinated interfaces around it.
The interfaces present commands and state; the surface remains the sole owner of
document mutations, selection mapping and history.

## Component responsibilities

| Component | Responsibility |
| --- | --- |
| <code>HtmlEditor</code> | Public ValueEditor wrapper. Owns the accepted value and draft lifecycle, creates the surface and optional UI, and exposes the common editor API. |
| <code>HtmlEditorSurface</code> | Owns the editable DOM, structured document, DOM/model mapping, remembered selection, input reconciliation and Undo/Redo history. |
| <code>HtmlEditorCommandRegistry</code> | Owns UI command definitions and dispatch. Resolves command targets, values and enabled state, then routes actions to the surface. |
| <code>HtmlEditorUiCommandController</code> | Internal lifecycle coordinator. Creates the field service and optional toolbar/inspector, subscribes to surface events and refreshes both views together. |
| <code>HtmlEditorUiCommandFieldService</code> | Projects a resolved command field into DataForm metadata and shares adapter behavior across the toolbar and inspector. |
| <code>HtmlEditorToolbar</code> and <code>HtmlEditorInspector</code> | Presentation components. The toolbar presents a compact subset; the inspector presents the tree, tabs and full command fields. |
| Selection overlay and command menu | Editor-owned visual and menu surfaces. They use shared selection and registry state, not another document model. |

## Update and command flow

1. The surface maps supported browser input to the document model and emits
   document, selection and interaction events.
2. The controller subscribes once and refreshes both presentations from the same
   model and selection generation.
3. A presentation requests fields from the field service. It delegates target
   and value resolution to the registry, then maps the binding to DataForm fields.
4. A command action returns through the registry, which validates the captured
   binding before dispatch.
5. The command updates the surface. The surface renders the model change and
   records one history transaction.
6. The controller refreshes both views. Separately, the host accepts the HTML
   with commit() or restores the accepted value with cancel().

The command menu uses the same registry but does not need DataForm. The toolbar
and inspector use DataForm because they need different layouts for shared fields.

## Lifecycle boundary
`HtmlEditorSurface` is a standalone `Component`. It owns the contenteditable area,
model, DOM mapping, text selection, input handling and the single Undo/Redo history.
It does not have `value`, `confirmedValue`, `commit()` or `cancel()`.

`HtmlEditor` remains a `ValueEditor<string>`. It creates and disposes one surface
and the optional `HtmlEditorToolbar`/`HtmlEditorInspector`, connects their events,
and owns parsing/validation/external acceptance through the value-editor lifecycle.
The existing `content`, `document`, `selection`, `execute`, `canUndo` and `canRedo`
API delegates to that same surface; no second model or history is maintained.
Use `editor.setHtml()` for an accepted baseline, not `editor.surface.setHtml()`:
the low-level surface method only replaces its document and resets its history.

For a custom host that needs only the editing area:

```ts
const surface = new HtmlEditorSurface({ html: "<p>Hello</p>", label: "Content" });
surface.mount(container);
surface.input.subscribe(() => console.log(surface.html));
```

The host owns saving and any baseline when using the surface directly. The built-in
toolbar and inspector never save content or create their own edit history.

A standalone surface leaves baseline and persistence to its host:

<pre><code>const surface = new HtmlEditorSurface({ html: "&lt;p&gt;Hello&lt;/p&gt;", label: "Content" });
surface.mount(container);
surface.input.subscribe(() =&gt; console.log(surface.html));</code></pre>