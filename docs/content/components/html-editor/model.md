---
id: html-editor-model
title: Document model
group: html-editor
path: /components/html-editor/model
order: 30
description: Learn how HTML nodes, authored styles and editor identities are represented.
toc: true
api:
  - HtmlEditorDocument
  - HtmlEditorNode
  - HtmlEditorNodeId
  - HtmlEditorText
  - HtmlEditorElement
  - HtmlEditorStyle
  - getHtmlEditorStyle
  - setHtmlEditorStyle
  - removeHtmlEditorStyle
  - getHtmlEditorElementBehavior
keywords:
  - model
  - nodes
  - HTML
  - styles
  - attributes
---

# Document model

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

For how the model is edited and rendered, see [Architecture](?!=/components/html-editor/architecture) and [Editing behavior](?!=/components/html-editor/editing).
