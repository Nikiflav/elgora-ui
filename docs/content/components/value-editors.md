---
id: value-editors
title: Value editors
group: components
path: /components/value-editors
order: 45
description: Independent text, number, checkbox and toggle editors with asynchronous confirmation.
---

# Value editors

Editors work with values, not rows or data sources. Use the same controls in a
form, dialog or grid. The external `onCommit` callback decides what acceptance
means: updating a local model, applying a business operation or saving remotely.

## Try the editors

Edit the customer or quantity and press Enter or leave the input. Checkbox and
toggle changes confirm immediately. Each callback below simulates a short
asynchronous operation. Quantity must be positive; an invalid edit stays visible
until corrected or cancelled with Escape.

<live-demo id="value-editors" height="330px"></live-demo>

## Text and typed values

```ts
const quantity = new NumberEditor({
    value: 2,
    label: "Quantity",
    validate: value => value === null || value <= 0
        ? "Quantity must be positive." : undefined,
    onCommit: async value => { await updateQuantity(value); }
});
quantity.mount(container);
```

`TextEditor.text` is the raw input. Typing does not immediately change its typed
`value`: parsing happens during `commit()`. `confirmedValue` changes only after
validation and the callback succeed. `modified` includes unparsed text changes.
`NumberEditor` accepts decimal dot or comma, maps empty text to `null`, and rejects
malformed or non-finite numbers. Supply `parse` and `format` for custom conversion;
`TextEditor<T>` requires `parse` or `resolveText` when its initial value is not a string.

```ts
const reference = new TextEditor({
    value: "SO-1042",
    commitOnBlur: false,
    onCommit: value => { form.reference = value; }
});
if (await reference.commit()) closeDialog();
```

Enter confirms; Escape restores the last accepted value. Arrow keys remain native
input operations, and Enter during IME composition does not confirm. Disable blur
confirmation when the containing form controls when fields are accepted.

## Editors without text

```ts
const active = new CheckboxEditor({
    value: true, label: "Active",
    onCommit: value => { form.active = value; }
});
const priority = new ToggleEditor({
    value: false, label: "Priority",
    onCommit: async value => { await updatePriority(value); }
});
```

These controls produce boolean values directly. They share validation, confirmation,
error handling and cancellation with text editors; they do not parse text.
`ToggleEditor` renders a compact switch with a sliding thumb and thematic colors.
It uses `role="switch"` and `aria-checked`, supports native Space/Enter activation,
and disables animation when reduced motion is requested. Place a visible label
outside the track; the `label` option supplies its accessible name.

## Asynchronous confirmation and errors

`commit()` returns `Promise<boolean>`. While parsing, validating or awaiting
`onCommit`, `busy` is true and the native control is disabled. Concurrent calls
share the same operation. `cancel()` returns false while busy, and `setValue()`
throws to prevent an external refresh from overwriting an outstanding edit.

A validation message or rejected callback makes confirmation return false, keeps
the draft and exposes `error`. Correct the draft or call `commit()` to retry.
`cancel()` restores the latest accepted value. An unchanged value does not invoke
`onCommit`. `setValue()` loads an external value silently as a new baseline.

The `input`, `committed` and `cancelled` observable events report input and lifecycle
notifications. Use `onCommit` for work that must be awaited; event subscribers are
synchronous notifications, not part of the save operation.

Values are retained by reference, without cloning. Equality defaults to `Object.is`;
provide `equals` for another comparison. Editors do not roll back external side
effects: a failing callback must manage its own transaction or recovery.

## Resolving external text

Every editor provides `resolveText(text): T | Promise<T>`. Use it to convert external
text, such as a pasted grid cell, without editing the control or saving a value.
It throws or rejects when conversion fails. Resolution does not invoke validation,
callbacks or events, and does not change the draft, confirmation baseline, error
or busy state. The host must separately validate and apply the returned value.

```ts
const amount = await numberEditor.resolveText("12,5"); // 12.5
const enabled = await checkboxEditor.resolveText("yes"); // true
// Conversion only: neither editor nor any data source has been updated.
```

Text editors return unchanged text by default. Number editors use their configured
numeric parser, including empty text resolving to `null`. Checkbox and toggle
editors accept `true`/`false`, `yes`/`no` and `1`/`0`, ignoring case and surrounding
whitespace. They reject empty or unsupported text rather than silently returning false.

Supply the shared `resolveText` option for custom conversion, including asynchronous
lookup or localized boolean text. For text editors it takes precedence over `parse`,
and both interactive commit and external text resolution use the same function.

```ts
const active = new CheckboxEditor({
    value: false,
    resolveText: text => {
        if (text.trim() === "да") return true;
        if (text.trim() === "не") return false;
        throw new Error("Failed to resolve boolean text. Use да or не.");
    }
});
```

## API reference

For asynchronous value selection, see the [Lookup editor](?!=/components/lookup-editor)
with a resizable multi-column result grid.

[ValueEditor](?!=/api-reference/ValueEditor), [TextEditor](?!=/api-reference/TextEditor),
[NumberEditor](?!=/api-reference/NumberEditor), [CheckboxEditor](?!=/api-reference/CheckboxEditor),
[ToggleEditor](?!=/api-reference/ToggleEditor).
