---
id: html-editor
title: HTML
group: components
parent: editors
path: /components/html-editor
order: 20
description: Edit rich-text HTML as a draft and let the host accept or discard it.
api:
  - HtmlEditor
  - HtmlEditorOptions
  - HtmlEditorSurface
  - HtmlEditorSurfaceOptions
  - HtmlEditorToolbar
  - HtmlEditorInspector
  - ValueEditor
keywords:
  - html
  - rich text
  - contenteditable
  - cms
---

# HTML editor

`HtmlEditor` provides an editable rich-text surface for content stored as HTML.
It follows the shared [value-editor lifecycle](?!=/components/value-editors/lifecycle):
the editor keeps a draft, while the host decides when that draft is accepted or
persisted.

## Edit and accept content

Edit the sample, select text and try the formatting buttons or keyboard shortcuts
(Ctrl+B or ⌘B). **Save** calls `commit()` and updates the saved HTML shown below;
**Discard** calls `cancel()` and restores the last accepted content. The example
simulates an asynchronous save callback.

<live-demo id="html-editor-basic" height="1400px" src="html-editor.md.ts"></live-demo>

The demo's buttons call the editor's command API. Typing, deletion, Enter,
Shift+Enter, bold and italic use model transactions. Undo and redo restore both the
document and selection. A selected-element inspector and more advanced structural
commands are still under development; dropped content is blocked.

Use **Sample** to switch between rich text, layout containers with media, and a
table. Changing the sample replaces the current draft. Try Enter in the middle
of a card or cell, Backspace/Delete at a paragraph boundary, then Undo and Redo.
Place the caret in text and use **Insert HTML** to try an inline fragment, list,
table or layout card. This uses the same insertion command as HTML paste.

The editor creates and owns the toolbar above the surface and the inspector on
the right because the demo enables `toolbar: true` and `inspector: true`.
Both options default to false, preserving the compact editor. They are construction
options; this first scaffold does not provide runtime visibility toggles.

The toolbar runs the existing Bold, Italic, Undo and Redo commands, with disabled
states and arrow-key navigation. The inspector's selector opens a virtualized
[TreeView](?!=/components/tree-view) showing tags and shortened descriptions. It
follows the text caret; choosing a tree item previews an inspection target without
changing the remembered caret, document or history. **Properties** and **Advanced**
are explicitly placeholder panels, not working property editors or structural selection.
On narrow screens this first layout stacks the inspector below the surface;
a responsive drawer and resizable panel are future work.

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

## Surface and orchestration

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

## Use in a host form

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

`html` and `getHtml()` return the editor's current serialized draft. The `document`
property returns a detached snapshot; changing that object does not change the
editor. `setHtml(html)` replaces the content and establishes a new accepted
baseline. Use `cancel()` to return to that baseline.

## HTML node model

The document contains two node types: a text leaf `{ id, type: "text", text }`
and an HTML element `{ id, type: "element", tag, classes, styles, attributes, children }`.
Images, video and table cells are ordinary elements identified by their tag.
Their properties live only in `attributes`: for example `src`, `alt`, `rowspan`
and `colspan` remain HTML strings. Boolean attributes use presence with an empty
string, such as `controls: ""`; absence means the attribute is not set. Rendering
does not add media attributes such as `controls` or `alt` automatically.

`id` is the editor's internal identity. An authored HTML ID such as `id="intro"`
lives in `attributes.id`. `classes` stores unique tokens in authored order;
`class` and `style` are never duplicated inside `attributes`.

`styles` is an ordered array of `{ name, value, important? }` declarations. It
retains duplicate declarations, shorthand/longhand order, fallback values and
`!important`. Standard names use CSS notation, for example `background-color`;
custom-property names such as `--Card-gap` are case-sensitive. The model stores
authored inline CSS; computed styles from a stylesheet are not copied into it.
Structural editing rules are independent of an element's CSS `display` value.

```ts
const gap = getHtmlEditorStyle(element.styles, "gap");
const updatedStyles = setHtmlEditorStyle(element.styles, "gap", "16px");
const withoutGap = removeHtmlEditorStyle(updatedStyles, "gap");
```

These helpers prepare declaration lists without mutating the input array and share
unmodified declarations. Setting a property removes its previous exact-name
declarations and appends the replacement; other shorthand/longhand declarations
retain their order. Lookup respects priority for the exact property name, but
does not compute shorthand expansion or stylesheet inheritance. The helpers do
not apply property edits to the live editor themselves.

## Commands and history

```ts
content.execute({ type: "insertText", text: "Hello" });
content.execute({ type: "bold" });
content.execute({ type: "insertParagraph" });
content.execute({ type: "undo" });
```

`execute()` returns false when an operation cannot be applied to the current
selection or the editor is unavailable. Commands use the last editor selection,
so a host toolbar can receive focus before invoking them. Bold and italic apply
to a selected range across supported sibling text blocks, or change the format of subsequently
typed text at a collapsed caret. Moving the selection clears that typing override.

Supported operations are `insertText`, `insertHtml`, `deleteBackward`,
`deleteForward`, `insertParagraph`, `insertLineBreak`, `indent`, `outdent`, `bold`, `italic`, `undo`
and `redo`. Commands use shared structural operations for positions, inline
ranges, splitting, merging and replacement. Their behavior follows the HTML
element's semantics, independently of CSS display.

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

## HTML fragment insertion and clipboard

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

## Selection and focus

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

## API reference

[HtmlEditor](?!=/api-reference/HtmlEditor),
[HtmlEditorOptions](?!=/api-reference/HtmlEditorOptions),
[HtmlEditorNode](?!=/api-reference/HtmlEditorNode),
[HtmlEditorElement](?!=/api-reference/HtmlEditorElement),
[HtmlEditorText](?!=/api-reference/HtmlEditorText),
[HtmlEditorStyle](?!=/api-reference/HtmlEditorStyle),
[ValueEditor](?!=/api-reference/ValueEditor).
