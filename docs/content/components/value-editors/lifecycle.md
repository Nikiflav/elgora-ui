---
id: editor-lifecycle
title: Values, confirmation and callbacks
group: components
parent: editors
path: /components/value-editors/lifecycle
order: 11
description: Separate draft input, conversion, validation, asynchronous acceptance and cancellation.
api:
  - ValueEditor
  - ValueEditorOptions
  - TextEditorOptions
  - PopoverEditorOptions
---

# Values, confirmation and callbacks

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
