---
id: value-editors
title: Overview
group: components
parent: editors
path: /components/value-editors
order: 45
description: Explore value editors and their shared validation and asynchronous acceptance lifecycle.
---

# Value editors

Editors work with values, not rows or data sources. Use them in forms, dialogs
or grids. The external `onCommit` callback decides whether acceptance updates
a local model, applies a business operation or saves remotely.

## Try the editors

This small order form demonstrates all six editors without a code editor.
Change a field to see its accepted value below. Quantity must be positive;
callbacks simulate asynchronous acceptance. Enter confirms text, Escape restores
the accepted value, and checkbox/toggle changes confirm immediately.

<live-demo id="value-editors" mode="preview" height="500px"></live-demo>

## Choose an editor

- [Text](?!=/components/value-editors/text): strings and custom text conversion.
- [Number](?!=/components/value-editors/number): nullable numeric input and validation.
- [Checkbox](?!=/components/value-editors/checkbox): native boolean control.
- [Toggle](?!=/components/value-editors/toggle): compact switch control.
- [Lookup](?!=/components/lookup-editor): search and select an item from a virtualized list.
- [Date](?!=/components/date-editor): formatted date-only input and Calendar picker.

Each sub-topic contains an editable demo, configuration examples, keyboard
behavior and links to its API reference. [Calendar](?!=/components/calendar)
remains a standalone component and can be used without DateEditor.

## Shared contract

```ts
const editor = new TextEditor({
    value: "SO-1042",
    label: "Order reference",
    validate: value => value.trim() ? undefined : "Reference is required.",
    onCommit: async value => { await updateReference(value); }
});
editor.mount(container);
```

Typing changes a draft; `confirmedValue` changes only after parsing, validation
and `onCommit` succeed. `modified` includes unparsed text changes.
`commit()` returns `Promise<boolean>`; a failure retains the draft and exposes
`error`. Correct it or retry. `cancel()` restores the last accepted value.
`setValue()` silently loads an external value as a new baseline.

`validate` and `onCommit` can be asynchronous. While either runs, `busy` is true
and the control is unavailable. Concurrent commits share one operation;
`cancel()` returns false while busy, and `setValue()` throws. An unchanged value
does not call `onCommit`. Invalid fields have a danger-colored border.

`input`, `committed` and `cancelled` are synchronous notification events.
Use `onCommit` for work that must be awaited. Values are retained by reference;
equality defaults to `Object.is`, or supply `equals`. Editors do not undo external
side effects: callbacks must manage their own recovery or transaction.

## Keyboard and popup behavior

Text and number editors accept Enter or leaving the field by default; use
`commitOnBlur: false` when the form controls confirmation. Escape cancels.
IME Enter does not confirm. Native text-navigation keys remain available.

Popup trigger buttons do not add a Tab stop. Alt+Down opens a picker.
`openOnFocus` defaults to false. When enabled, DateEditor focuses Calendar;
LookupEditor retains input focus for searching. Escape returns to text editing
without reopening Calendar. See each editor's topic for picker navigation.

## Resolve external text

Every editor exposes `resolveText(text): T | Promise<T>` for clipboard/import
conversion without editing, validation, saving or events. Failed conversion
throws or rejects. The host separately validates and applies the result.

Text editors use `resolveText`, then `parse`, then their default conversion.
Number editors support decimal dot/comma; boolean editors accept true/false,
yes/no and 1/0. Lookup requires a unique match; Date uses its configured pattern.

## API reference

[ValueEditor](?!=/api-reference/ValueEditor),
[ValueEditorOptions](?!=/api-reference/ValueEditorOptions),
[TextEditorOptions](?!=/api-reference/TextEditorOptions),
[PopoverEditorOptions](?!=/api-reference/PopoverEditorOptions).
