---
id: editor-validation
title: Validation and errors
group: components
parent: editors
path: /components/value-editors/validation
order: 12
description: Validation feedback shared by all value editors.
---

# Editor validation

Every value editor accepts a `validate` callback. It may return an error message
or a promise that resolves to one. A failed validation keeps the draft value and
marks the editor as invalid. The compact error icon at the start of an input
shows the message in a tooltip without changing the form layout.

## Try invalid values

Each editor starts with an invalid draft so the validation UI is visible
immediately. Correct a value and press Enter, or toggle a boolean back on, to
clear its error. The lookup demonstrates a failed text resolution, while the
date editor demonstrates a syntactically invalid calendar date.

<live-demo id="editor-validation" height="520px" src="validation.md.ts"></live-demo>

The `validate` option is configured per editor. It may be synchronous or
asynchronous and returns an error message when the current value is not
accepted. Text and number editors validate typed values, checkbox and toggle
editors validate boolean values, and lookup/date editors can report errors
from text resolution before the value is accepted.

## Shared contract

```ts
const editor = new TextEditor({
    value: "Order reference",
    validate: value => value.trim()
        ? undefined
        : "Order reference is required."
});
```

Validation runs after text conversion and before `onCommit`. It can be
synchronous or asynchronous. While it runs, the editor is busy and unavailable.
The error is exposed through `editor.error`, the control receives
`aria-invalid="true"`, and the validation icon exposes the same message through
its tooltip and accessible description.

Use `editor.cancel()` to restore the last accepted value, or correct the draft
and call `editor.commit()` again. Validation does not write to a data source.

## API reference

[ValueEditor](?!=/api-reference/ValueEditor),
[ValueEditorOptions](?!=/api-reference/ValueEditorOptions),
[TextEditor](?!=/api-reference/TextEditor),
[NumberEditor](?!=/api-reference/NumberEditor),
[CheckboxEditor](?!=/api-reference/CheckboxEditor),
[ToggleEditor](?!=/api-reference/ToggleEditor),
[LookupEditor](?!=/api-reference/LookupEditor),
[DateEditor](?!=/api-reference/DateEditor).
