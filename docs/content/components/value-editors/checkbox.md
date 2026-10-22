---
id: editor-checkbox
title: Checkbox
group: components
parent: editors
path: /components/value-editors/checkbox
order: 15
description: Native checkbox editing with boolean conversion and asynchronous acceptance.
---

# Checkbox editor

[CheckboxEditor](?!=/api-reference/CheckboxEditor) produces boolean values using
a native checkbox. It uses the same [validation and acceptance contract](?!=/components/value-editors)
as text-based editors.

## Shipping confirmation

Click the checkbox or focus it and press Space. Each change is accepted
asynchronously; the control is unavailable until the callback completes.

<live-demo id="editor-checkbox" height="180px" src="checkbox.md.ts"></live-demo>

## Boolean values and external text

```ts
const shipped = new CheckboxEditor({
    value: false, label: "Shipped",
    onCommit: async value => { await updateShipping(value); }
});
const value = await shipped.resolveText("yes"); // true, no saving
```

The `label` option gives the control an accessible name; add a visible label in
the surrounding form. User changes confirm immediately rather than waiting for
Enter or blur. Failed validation or acceptance retains an unaccepted draft.

`resolveText()` accepts `true`/`false`, `yes`/`no`, and `1`/`0`, ignoring case and
surrounding whitespace. Empty or unsupported text throws. For localized text,
provide your own converter:

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

[CheckboxEditor](?!=/api-reference/CheckboxEditor),
[ValueEditorOptions](?!=/api-reference/ValueEditorOptions),
[ValueEditor](?!=/api-reference/ValueEditor).
