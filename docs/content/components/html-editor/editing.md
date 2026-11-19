---
id: html-editor-editing
title: Editing behavior
group: html-editor
path: /components/html-editor/editing
order: 50
description: Explore structural editing rules, keyboard behavior, lists, quotes and history.
toc: true
api:
  - HtmlEditor
  - HtmlEditorCommand
  - HtmlEditorElementBehavior
  - HtmlEditorElementKind
keywords:
  - editing
  - keyboard
  - Enter
  - Backspace
  - lists
  - undo
---

# Editing behavior

These rules describe the supported editing behavior for the current HTML subset. They follow document semantics; CSS display does not change the editing role of an element.

## Structural editing rules

The built-in rules classify supported elements as inline content, text blocks,
list containers/items, layout containers, table structure/cells or atomic content.
`getHtmlEditorElementBehavior(element)` returns the read-only built-in behavior
(`kind` and optional `splitTag`); it does not register custom behaviors.

| Content | Behavior |
| --- | --- |
| Text and inline wrappers | Insertion and replacement preserve surrounding formatting. Equivalent inline boundaries share one logical offset. |
| Paragraphs and headings | Enter splits; Backspace/Delete joins compatible siblings at their shared boundary. The right half of a heading becomes a paragraph. |
| Lists | Enter splits an item; an empty item exits or moves up one level. A paragraph inside a structured item splits the item and transfers its following content. |
| Containers, including flex/grid | Editing stays inside the container. Enter on direct inline content creates paragraphs inside it, preserving the shell and its presentation. |
| Table cells | Text, formatting, paragraph splitting and supported HTML paste work inside a cell. Its row/cell identity and attributes remain intact. |
| Images, video, hard breaks and dividers | Atomic content is deleted as a unit from the adjacent boundary. Media descendants are not rich-text editing areas. |

Inline runs beside nested blocks are wrapped in a paragraph when edited. For
example, editing the direct `A` in `<div>A<p>B</p>C</div>` creates a paragraph
around `A` and preserves the outer `div` and the other children. This structural
preparation belongs to the same undo step as the edit.

At a collapsed caret, Backspace/Delete never merge across a table cell or layout
container boundary. An empty flex/grid item retains its container and its final
empty paragraph; an extra empty paragraph can still join the preceding paragraph
inside that same item. Figure captions, details summaries and preformatted blocks
also retain their outer boundary. Ordinary paragraph joins ignore ASCII formatting
whitespace between sibling blocks, but do not skip authored nonbreaking spaces.
These caret rules do not prevent an explicit range from removing fully selected
elements under the coverage rules below.

Within text, Backspace/Delete remove complete graphemes using `Intl.Segmenter`,
including emoji sequences and combining marks split across inline formatting.
A restored caret inside a grapheme deletes that entire grapheme. Atomic elements
have their own boundaries: a combining mark after an image cannot cause the image
to be deleted together with the mark. Without `Intl.Segmenter`, deletion falls
back to Unicode code points, preserving surrogate pairs but not guaranteeing
complete multi-code-point grapheme deletion.

Selected ranges use a shared recursive removal operation, including ranges across
table cells, list items and different layout containers. Partially covered elements
retain their shell, identity, attributes and unselected children. Fully covered
elements are removed with their whole subtree, up to the highest fully covered
ancestor; the document root itself is never removed. This is different from
Backspace/Delete at a collapsed caret, which still respects structural join barriers.

For example, selecting from `A|BC` in a table cell through `DE|F` in a list item
and typing `X` leaves `AX` in that cell and `F` in that list item. Fully selected
elements between them disappear. The partial cell and item are not merged. Selecting
all content of a table removes the table, not just its text. Images and other atoms
participate in coverage; selecting text alone does not select an adjacent image.
Empty elements also require coverage by the range: they are not automatically
removed just because they contain no text.

After range deletion, table rows, sections and tables emptied by that operation
are removed even if source indentation remains. Pre-existing empty rows, surviving
cells, captions and other unselected authored content are retained. The insertion
bookmark follows the surviving parent gap when an emptied shell disappears.
Ranges can extend from a nested table into an outer cell without merging those
cells. Partially covered merged cells retain their authored `rowspan`/`colspan`.
Range deletion follows document order; it does not perform rectangular spreadsheet
selection or recalculate the spans of surviving cells after structural removal.

Replacement inserts at the surviving start position, independent of selection
direction. If the starting subtree was removed, its former position in the surviving
parent becomes the insertion gap. If insertion is not legal there, the editor tries
positions after successive enclosing elements. For example, text replacing a removed
cell can be placed after the remaining table, while a cell fragment can use the row
gap directly. Removal and insertion form one undo step. Invalid HTML replacement
leaves both the document and history unchanged.

Unsupported operations return `false`; commands do not fall through to native browser
editing. Dedicated table row/column commands, custom element behavior registration
and drag/drop remain future work.

## Preformatted text and quotes

Inside one `pre` area, Enter and Shift+Enter insert literal newline characters
without splitting the preformatted block. Text input and plain-text paste retain
newlines rather than introducing `br` elements. Replacing text within that area
keeps its `pre` shell. Inline `code` outside `pre` follows ordinary paragraph rules.

Tab indents the current line or selected lines with one tab character; Shift+Tab
removes one leading tab or up to four leading spaces. A selection ending exactly
at the next line's start excludes that next line. Selection direction and caret
positions follow the indentation edits. `indent`/`outdent` are supported only
inside one preformatted area; elsewhere Tab keeps its normal focus navigation.
Each changed command is one undo step; outdenting an unindented line adds no
history entry. Navigation and IME composition retain their existing behavior.

In a `blockquote`, Enter in an empty final paragraph lifts that paragraph out of
the quote. Backspace at the beginning of its first direct text block lifts that
block before the remaining quote. Both operations remove only one quote level,
retain formatting and preserve the remaining quoted content. Direct inline quote
content becomes a paragraph when lifted. These rules do not cross an intervening
layout, list or table-cell boundary. Enter in a nonfinal empty paragraph stays
inside the quote; Shift+Enter inserts a hard break without exiting it.

## List shortcuts and boundaries

At the end of a paragraph beginning with `* `, `- ` or a number followed by `. `,
Enter converts the paragraph to a list and starts the next item. For example,
`- First` becomes a bullet item followed by an empty item ready for typing.
A marker alone creates one empty item. Numbered markers preserve their starting
number (`5. First` starts at 5). Conversion preserves inline formatting and is one
undoable command. It does not trigger on Space, Shift+Enter, in the middle of a
paragraph, inside code/preformatted content or inside an existing list.

In a nonempty list item, Enter splits the item. In an empty item, Enter exits the
list into a paragraph; in a nested list it lifts the item one level instead.
Following items are preserved in a trailing list when necessary. These changes
and their caret positions participate in Undo/Redo just like other commands.
Backspace in an empty list item removes it and returns the caret to the end of
the preceding item. For the first item it exits the list, or lifts it one level
when nested. Empty inline wrappers, paragraphs and a single break are supported.
Backspace at the first editable position of the first nonempty item also exits
the list, or lifts the item one level when nested. Inline content becomes a
paragraph; a structured item retains its content in a flow container. Formatting,
authored presentation and following items are retained. On a nested lift, following
nested items and content after the nested list move with the lifted item. A later
paragraph inside the same item joins locally instead of exiting the list; a table
or layout boundary is not crossed. Ordered lists retain the remaining numbering,
including reversed lists and HTML with whitespace between items.
Backspace at the beginning of a paragraph immediately following a list joins its
content to the final editable list item, preserving inline formatting. The caret
stays at the join point; Undo restores the separate paragraph and its selection.
Backspace at the start of a structured list item and Delete at the preceding item's
end share the same boundary operation. Only the touching text blocks merge; following
paragraphs and nested lists are preserved. A table or layout shell at that boundary
is not implicitly entered or merged.

The editor intercepts supported cancelable `beforeinput` operations and applies
the resulting model and selection to the DOM. `keydown` handles Ctrl/⌘+B,
Ctrl/⌘+I, Ctrl/⌘+Z, Ctrl/⌘+Shift+Z and Ctrl+Y. Events continue bubbling.
All cancelable non-composition input is prevented, including unknown input types
and commands that cannot be applied at the current selection. There is no general
browser-editing fallback. Consequently, operations such as native underline or word
deletion are blocked until dedicated commands support them. Plain caret movement
and mouse/touch text selection remain native and synchronize the remembered selection.

IME is allowed to update its composition DOM without rerendering, then reconciled
after composition and its final input have finished. Noncancelable `beforeinput`
also permits a bounded native edit, read back through the parser and normalization
into one undoable transaction. Permission is consumed by `input` or settled at the
next task boundary; it does not authorize unrelated future input. A task rather
than a microtask lets browser default actions finish before reconciliation. On platforms that
omit `compositionstart`, a composing `beforeinput` uses this bounded path.

History retains up to 100 document/selection snapshots, with one entry per changed
command or permitted native transaction. `canUndo` and `canRedo` expose availability.
Typing is not yet coalesced into word-sized undo groups. `setHtml()`, cancellation
and a successful modified commit start a new history scope. Returning to the
initial document with undo also clears `modified`.

For command target resolution and formatting fragmentation, see [Commands and formatting](?!=/components/html-editor/commands).
