---
id: html-editor-commands
title: Commands and formatting
group: html-editor
path: /components/html-editor/commands
order: 40
description: Understand command definitions, target resolution, formatting and command execution.
toc: true
api:
  - HtmlEditorCommand
  - HtmlEditorUiCommand
  - HtmlEditorCommandRegistry
  - HtmlEditorUiCommandField
  - HtmlEditorUiCommandTargets
  - HtmlEditorUiCommandTargetContext
  - HtmlEditorUiCommandResolution
  - HtmlEditorResolvedUiCommandField
keywords:
  - commands
  - formatting
  - targets
  - bold
  - text style
---

# Commands and formatting

The editor has two related command layers. HtmlEditorCommand describes an
editing operation applied to the model, such as inserting text, applying a mark
or undoing a transaction. HtmlEditorUiCommand describes an application-facing
command: its label, visibility, enabled state, current state, optional field
definition and execute handler.

## Field definitions and target resolution

A command can contribute a DataForm field. The definition owns its field type,
caption, options, target resolver and value reader. visibleIn identifies the
presentation slots that can show it: basic, advanced, toolbar or focused.
Presentation metadata controls visual differences without duplicating the
command or field definition.

The captured HtmlEditorUiCommandTargetContext may contain both the remembered
text range and selected-node metadata. Each field resolves the application units
it needs: text ranges, enclosing blocks or selected elements. A command can
report incomplete targets; the inspector can omit it while a compact surface
keeps it visible but disabled.

The registry builds an HtmlEditorResolvedUiCommandField with the command,
resolved context, current aggregate value and enabled state. It is a snapshot
for one presentation/edit and is rejected after a document generation change
or command replacement. Selection and focus changes alone do not invalidate it.

## Applying inline formatting and styles

Formatting commands and style fields use the same selection intent. For partial
text, fragmentSelection splits the selected portion into a wrapper such as
<strong>, <em> or <span>, then returns an updated selection over those fragments.
Style commands apply the authored property to the fragment roots. A fully
selected element can remain a target itself and receive the property without
wrapping descendants.

The fragmentation step creates complete element targets; the property step edits
those targets without recursively applying the property to every descendant.
Normalization merges adjacent text nodes and equivalent neighboring inline marks
where possible. With a collapsed caret, inline formatting and text styles update
the typing override for subsequent input.

Clear Formatting uses the resolved selection or full-element target and removes
supported inline marks and authored text styles. Built-in fields include text
marks, paragraph type and alignment, text size, text color, background color,
link actions and history commands. The view does not decide whether a command
acts on text, a block or an element.

See [Inspector and toolbar](?!=/components/html-editor/ui-surfaces) for field
presentation and [Selection](?!=/components/html-editor/selection) for text and
node target behavior.

## Core operations and history
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
