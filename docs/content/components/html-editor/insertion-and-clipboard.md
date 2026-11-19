---
id: html-editor-insertion
title: HTML insertion and clipboard
group: html-editor
path: /components/html-editor/insertion-and-clipboard
order: 80
description: Learn how HTML fragments, paste, copy and cut preserve supported document structure.
toc: true
api:
  - HtmlEditor
  - HtmlEditorCommand
  - HtmlEditorSurface
keywords:
  - paste
  - clipboard
  - insertHtml
  - copy
  - cut
---

# HTML insertion and clipboard

## Try HTML insertion

Place the caret or select content in the editor, choose a fragment and click
**Insert HTML**. Use Undo to restore the previous content and selection.

<live-demo id="html-editor-insertion-demo" height="500px" src="insertion-and-clipboard.md.ts"></live-demo>

`insertHtml` and clipboard paste share the same placement rules. The fragment is
parsed inertly through the supported tag, attribute and presentation policy.
Scripts, embedded documents, event attributes and unsafe URL schemes are removed.
An empty/fully removed fragment is rejected without deleting the selection.

- Inline content is inserted inside the current text block. A single unstyled
  paragraph is treated as its inline content; authored block attributes, classes
  and styles keep a paragraph structural instead.
- Lists, tables and layout containers split the current text block. Text on both
  sides and its inline formatting are preserved. Editable content after the
  inserted structure receives the caret so typing can continue outside it.
- A cell, list item or layout container retains its outer shell. Block content
  stays inside that shell; a list pasted inside an item becomes a nested list.
- At an explicit list gap, content is adapted to list items. At a table row gap,
  cell fragments are accepted, while paragraphs are rejected. Standalone list
  items, rows and cells at flow positions receive the necessary list/table wrappers.
  After insertion at a table structural gap, the caret moves to the end of the
  last inserted editable cell so typing can continue. If the fragment contains
  no editable area (for example, columns only), it moves after the enclosing table.
- Selected ranges can cross cells and containers in either direction. Recursive
  removal preserves partial shells and removes fully covered subtrees, then inserts
  at the surviving start or the nearest legal outer gap as described above.

Every inserted node receives a fresh editor identity. Conflicting authored HTML
IDs are given unique suffixes, and fragment-local `href="#..."` and supported ARIA
ID references follow the new IDs. Insertion is one Undo/Redo step including the
selection. This policy supports the editor's HTML subset, not arbitrary scripts,
stylesheets, custom elements or every malformed HTML nesting.

If HTML placement fails, the paste handler tries nonempty `text/plain` content;
an empty text fallback never clears the selection. Plain-text-only paste inserts
line breaks inside the current editing area. This editing policy does not replace
an application's server-side HTML sanitization.

Copy and Cut intercept the native clipboard events and export from the model,
not from the browser's serialization of the live DOM. Both `text/html` and
`text/plain` are written. Runtime node attributes and view-only placeholders are
never included. Export requires a live selection inside this editor; a remembered
toolbar selection is not used when the native selection is outside it. Copy is
available in read-only mode; Cut requires an editable, settled model. During IME
composition or pending native reconciliation neither operation exports stale data.

Extraction shares interval coverage with recursive deletion, but does not mutate
the model: fully selected subtrees are cloned, partially selected shells contain
only selected descendants, and unselected nodes are omitted. Selection direction
does not affect output. For a range from `A|BC` in a table cell through `DE|F` in a
list item, the HTML fragment contains a table/cell shell with `BC` and a list/item
shell with `DE`, not the unselected `A` and `F`. These wrappers make the fragment
self-contained; the selection is not expanded to whole cells or items.

Partial ordered lists adjust `start` to preserve the original first selected item's
number, including reversed lists. Partial tables are compact fragments of selected
cells: `rowspan` and `colspan` are removed within that partial table rather than
pulling unselected cells into the clipboard. Original grid geometry is not retained.
A completely selected table, including complete nested tables, retains its spans.
Plain text uses newlines for block/list boundaries and hard breaks, tabs between
table cells, and image alt text; preformatted text whitespace is preserved.

Cut writes both clipboard formats before applying one structural deletion transaction.
If clipboard data is unavailable or a write throws, the model, selection and history
are unchanged. A later native `deleteByCut` is blocked, preventing a second deletion.
Undo restores the cut content and directed selection, but does not revert the system
clipboard. Copy itself creates no history entry. Clipboard writes use the synchronous
event data API; no asynchronous clipboard permission request is needed.

The editor observes external DOM changes. Unannounced `input` and external text,
structural or attribute mutations are reverted to the model, without modifying
the draft or undo/redo history. Only explicitly permitted native edits can be
adopted. This is an editing policy, not a security boundary against scripts on the
same page. Reconciliation pauses the observer and updates the DOM using the existing
VNode renderer. Empty blocks use a view-only line-break filler, omitted from saved
HTML.

For the node and attribute representation used by imported fragments, see [Document model](?!=/components/html-editor/model). For editing inside tables, lists and layout containers, see [Editing behavior](?!=/components/html-editor/editing).
