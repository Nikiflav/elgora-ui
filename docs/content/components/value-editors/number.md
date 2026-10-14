---
id: editor-number
title: Number
group: components
parent: editors
path: /components/value-editors/number
order: 47
description: Nullable numbers with text conversion and asynchronous validation.
---

# Number editor

[NumberEditor](?!=/api-reference/NumberEditor) shares the
[editor lifecycle](?!=/components/value-editors) and produces `number | null`.

## Order quantity

Try `12,5`, `12.5`, zero or empty text. Use ArrowUp and ArrowDown to change the
draft by one step. Positive numbers are accepted; failed validation keeps the
input available for correction.

<live-demo id="editor-number" height="220px"></live-demo>

## Conversion and validation

```ts
const quantity = new NumberEditor({
    value: 2, label: "Quantity",
    step: 1, min: 0, max: 100,
    validate: value => value === null || value <= 0
        ? "Quantity must be positive." : undefined,
    onCommit: async value => { await updateQuantity(value); }
});
const value = await quantity.resolveText("12,5"); // 12.5, conversion only
```

The default parser accepts a decimal dot or comma, resolves empty input to `null`,
and rejects malformed/non-finite numbers. It does not interpret locale grouping
separators. Supply `parse`/`format` or `resolveText` for custom conversion.

The input is text-based with a decimal keyboard hint, not a native number spinner.
ArrowUp and ArrowDown change the draft by `step` and respect `min`/`max` without
committing. Enter confirms, Escape cancels, and blur confirms by default. Set
`commitOnBlur: false` when a containing form handles confirmation.

## API reference

[NumberEditor](?!=/api-reference/NumberEditor),
[TextEditorOptions](?!=/api-reference/TextEditorOptions),
[ValueEditor](?!=/api-reference/ValueEditor).
