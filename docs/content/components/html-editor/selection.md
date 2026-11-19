---
id: html-editor-selection
title: Selection and focus
group: html-editor
path: /components/html-editor/selection
order: 60
description: Understand the remembered text range, node targets, focus and selection visualization.
toc: true
api:
  - HtmlEditorSelectionRange
  - HtmlEditorNodeCoverage
  - HtmlEditorSurface
keywords:
  - selection
  - focus
  - overlay
  - inspector
  - range
---

# Selection and focus

The editor keeps the text range and inspector node targets as separate, simultaneous
pieces of intent. A tree preview can change the target node without moving the
remembered caret or widening the text range. Commands resolve applicable targets
from both pieces according to their own semantics.

## Text selection, node targets and focus
For a non-collapsed range, the selector displays **Mixed** when selected content
belongs to multiple text/atomic elements. Enclosing shells alone do not make a
single text owner mixed. The tree uses the same interval coverage as Copy/Delete:
fully and partially covered nodes share the same blue background. A circular
indicator after the tag shows coverage: empty for unselected, half-filled for
partial, filled for full, with a localized tooltip. These are decorative status
indicators, not checkboxes. A right-arrow icon (tooltip: "Keyboard focus") in a fixed gutter at the start of the focused row, before indentation and the disclosure chevron, replaces
the dotted focus outline in this HTML tree only; the tree viewport retains its
focus frame. Empty elements and images count only when their own interval is covered.
Opening the tree reveals partial endpoint containers; fully selected subtrees can
remain collapsed and show their coverage on the parent. Their descendants receive
the same marks when expanded. A caret alone has no range-coverage marks.

Coverage is separate from the tree's keyboard focus and single inspection-preview
choice. Choosing a preview may replace the Mixed label until the next text-selection
change, but never changes the range or its highlights. Coverage is also announced
in the accessible row labels. Only this HTML tree uses a monospace font, gray tag
badges and muted descriptions; the selector uses the same label rendering in a
transparent, borderless-looking ghost button, with standard hover and keyboard-focus
feedback. Ordinary TreeView appearance is unchanged.

The breadcrumb above the selector lists only the three nearest **parents**, not
the current element (already shown in the selector). A leading **…** opens earlier
ancestors in document order. Every ancestor can be previewed without moving the
text selection or adding an undo entry; keyboard activation uses native buttons,
and Escape closes the overflow popup and returns focus to its trigger.
For **Mixed**, the path includes the nearest common ancestor of the selected
content owners. If no authored element contains the whole range, the path is hidden:
the virtual document root is not shown as an invented `body` element. Root-level
inspection targets also have no parent breadcrumb. The path remains single-line.

`selection` returns a detached snapshot of the last selection inside the editor.
Each endpoint contains a `nodeId` and an `offset`. Text offsets count UTF-16 units;
element offsets count supported child nodes. The content root also has its own
identity, allowing ranges between top-level blocks. `nativeSelection` exposes the
live browser selection only while both endpoints belong to this editor.

```ts
const savedSelection = content.selection;
// A toolbar or inspector may receive focus here.
if (savedSelection) content.restoreSelection(savedSelection);
```

`selectionChanged` emits detached snapshots when the remembered range changes.
Moving focus or selecting text outside the editor retains the last editor range.
`restoreSelection()` without an argument restores that remembered range and focuses
the editing surface. Forward and backward ranges retain their direction.

Identities survive native input while the same DOM nodes survive. Commands map their
resulting selection to the updated model. Removed endpoints
invalidate the remembered range; offsets are clamped when text becomes shorter.
`setHtml()`, cancellation and a successful modified commit rebuild the content and
invalidate saved identities. Snapshots are local to one editor and document scope;
they are not persistent bookmarks across document replacements. Use `execute()`
to edit content; restoring a selection alone does not change the document.

## Selection overlay

The overlay visualizes the active command target rather than a generic hover over
the editor chrome. Text-flow ranges are drawn by line, while structural containers
such as cells and layout items retain separate geometry outlines. A
command-specific preview asks the registry for that command’s resolved targets.

See [Inspector and toolbar](?!=/components/html-editor/ui-surfaces) for tree
selection and [Commands and formatting](?!=/components/html-editor/commands) for
command target resolution.