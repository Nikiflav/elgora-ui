---
id: html-editor
title: Overview
group: html-editor
path: /components/html-editor/overview
order: 10
description: Edit rich HTML with one model, shared commands and host-controlled acceptance.
toc: true
api:
  - HtmlEditor
  - HtmlEditorOptions
  - HtmlEditorSurface
  - HtmlEditorSurfaceOptions
  - HtmlEditorToolbar
  - HtmlEditorInspector
keywords:
  - HTML
  - rich text
  - contenteditable
  - CMS
---

# HTML editor

`HtmlEditor` provides an editable rich-text surface for content stored as HTML.
It follows the shared [value-editor lifecycle](?!=/components/value-editors/lifecycle):
the editor keeps a draft, while the host decides when that draft is accepted or
persisted.

## Try the editor

Edit the sample, select text and try the formatting buttons or keyboard shortcuts
(Ctrl+B or ⌘B). **Save** calls `commit()` and updates the saved HTML shown below;
**Discard** calls `cancel()` and restores the last accepted content. The example
simulates an asynchronous save callback.

<live-demo id="html-editor-basic" height="1500px" src="html-editor.md.ts"></live-demo>

The demo's buttons call the editor's command API. Typing, deletion, Enter,
Shift+Enter, bold and italic use model transactions. Undo and redo restore both the
document and selection. The selected-element inspector exposes compact Basic
controls for the selected element; more advanced structural commands are still
under development. Dropped content is blocked.

Try Enter in the middle of a card or cell, Backspace/Delete at a paragraph
boundary, then Undo and Redo.
Try inserting fragments in the [HTML insertion and clipboard](?!=/components/html-editor/insertion-and-clipboard) demo.

## Add the editor to a host form

```ts
const content = new HtmlEditor({
    value: article.bodyHtml,
    label: "Article body",
    placeholder: "Write your article…",
    minHeight: 240,
    toolbar: true,
    inspector: true,
    onCommit: async html => { await saveArticle({ bodyHtml: html }); }
});
content.mount(container);

if (await content.commit()) closeEditor();
```

`html` and `getHtml()` return the current draft. `setHtml()` replaces the content
and establishes a new accepted baseline; `cancel()` restores that baseline.

## Explore HTML Editor

- [Architecture and data flow](?!=/components/html-editor/architecture): component ownership and command flow.
- [Document model](?!=/components/html-editor/model): nodes, attributes and authored styles.
- [Selection and focus](?!=/components/html-editor/selection): text ranges, inspector targets and overlays.
- [Commands and formatting](?!=/components/html-editor/commands): command definitions and target resolution.
- [Property providers](?!=/components/html-editor/providers): configure palettes, custom values and CSS classes.
- [Editing behavior](?!=/components/html-editor/editing): structural rules, keyboard behavior and history.
- [Inspector and toolbar](?!=/components/html-editor/ui-surfaces): DataForm surfaces, tree navigation and link editing.
- [HTML insertion and clipboard](?!=/components/html-editor/insertion-and-clipboard): paste, copy and cut.
