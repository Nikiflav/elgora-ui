---
id: html-editor-providers
title: Property providers
group: html-editor
path: /components/html-editor/providers
order: 45
description: Configure reusable providers for text color and size.
toc: true
api:
  - HtmlEditorOptions
  - HtmlEditorPropertyProvider
  - HtmlEditorPropertyDefinition
keywords:
  - providers
  - palette
  - class
  - text color
  - font size
---

# Property providers

Providers describe how a property is read and saved. The editor presents their
controls in a shared popover; it clears the configured providers' recognized
settings from selected content before applying the chosen value. Each edit is
one undoable transaction.

Each provider tab also has **Clear**. It removes only that provider's recognized
settings from the selection. At a collapsed caret it clears that provider's
pending typing choice without changing existing content.

## Try providers

Select text and open Text color or Text size. The size control demonstrates an
inline percentage provider, a custom length provider and a class provider. The
demo supplies the CSS for its classes; an application supplies its own CSS.

<live-demo id="html-editor-providers-demo" height="650px" src="providers.md.ts"></live-demo>

## Configuration

Pass `properties` to `HtmlEditor`. Each definition identifies a command, its CSS
property and its providers. A supplied definition replaces that property's
defaults; other properties retain their defaults. `text.color` and
`element.backgroundColor` default to a palette and a free color field.
`text.size` defaults to percentage choices and a
numeric value with a unit selector.

`createHtmlEditorPaletteProvider` and `createHtmlEditorInlineStyleProvider` map
option IDs to CSS values. `createHtmlEditorClassProvider` maps IDs to classes.
`createHtmlEditorFreeStyleProvider` supports a color, length or text control.
Length controls accept a list of units and optional minimum and maximum values.
For other storage schemes, implement `HtmlEditorPropertyProvider`.

The tabs show authored provider values, not CSS precedence. The main field
shows the computed value at a caret or for one fully selected element; partial
or multiple selections show a dash. CSS conflicts are not currently reported.
