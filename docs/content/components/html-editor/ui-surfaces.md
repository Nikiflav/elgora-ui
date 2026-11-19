---
id: html-editor-ui-surfaces
title: Inspector and toolbar
group: html-editor
path: /components/html-editor/ui-surfaces
order: 70
description: Learn how the toolbar, inspector, tree and link dialog present shared editor state.
toc: true
api:
  - HtmlEditorToolbar
  - HtmlEditorInspector
  - HtmlEditorUiCommandFieldService
  - HtmlEditorUiCommandPresentation
  - HtmlEditorUiCommandPresentationKind
  - HtmlEditorUiCommandFormRow
keywords:
  - toolbar
  - inspector
  - DataForm
  - TreeView
  - link dialog
---

# Inspector and toolbar

The toolbar and inspector are different presentations of the same UI command
definitions. The command registry owns the fields and their behavior; each
presentation chooses which fields to show and how to lay them out.
The editor creates and owns the toolbar above the surface and the inspector on
the right because the demo enables `toolbar: true` and `inspector: true`.
Both options default to false, preserving the compact editor. They are construction
options; this first scaffold does not provide runtime visibility toggles.

The toolbar runs the existing Bold, Italic, Undo and Redo commands, with disabled
states and arrow-key navigation. The inspector's selector opens a virtualized
[TreeView](?!=/components/tree-view) showing tags and shortened descriptions. It
follows the text caret; choosing a tree item previews an inspection target without
changing the remembered caret, document or history. **Properties** contains compact
Basic commands such as Bold, Italic, block type, text color, text size and alignment.
Commands with choices use one shared Lookup editor and commit through the same model
transaction and Undo/Redo history as the editing surface. **Advanced** remains the
place for direct classes, attributes and styles in a later step.
On narrow screens this first layout stacks the inspector below the surface;
a responsive drawer and resizable panel are future work.

## Toolbar

The toolbar uses a compact horizontal DataForm. It selects an ordered subset
of fields and requests the toolbar presentation. The shared field service
converts command definitions into DataForm fields, including compact icons,
menus, current state and command activation.

## Inspector

The inspector combines a model-element selector, virtualized TreeView, TabView
categories and a vertical DataForm. It requests fields for the basic presentation.
Categories and layout belong to this surface; field captions, target resolution,
values and edit behavior come from the commands.

The inspector’s node preview does not replace the text selection. The text range
and node targets can coexist, and each command determines which is applicable.
See [Selection and focus](?!=/components/html-editor/selection).

## Link dialog uses a staged draft

The toolbar’s link button opens the internal link dialog. Its URL, target and
title fields are local DataForm fields over a temporary draft initialized from
the current link context. Choosing a value changes only that draft; Apply submits
the link change as one operation, while Cancel discards it. These fields are
separate from the inspector’s registry-backed field bindings.

## Shared field presentation contract

A command field can present data input or action buttons. Presentation metadata
can provide distinct visual settings per slot. The inspector can show a full
labeled value editor while the toolbar uses an icon button with the same options
and command state. Neither surface creates a second command definition or owns
target-resolution rules.

The contract includes a focused presentation slot. The link dialog uses its own
staged draft because it applies several properties together; it does not render
the registry’s focused field bindings.

See [Architecture and data flow](?!=/components/html-editor/architecture) and
[Commands and formatting](?!=/components/html-editor/commands).