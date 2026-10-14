---
id: editor-text
title: Text
group: components
parent: editors
path: /components/value-editors/text
order: 46
description: Text input with draft text, validation and custom typed conversion.
---

# Text editor

[TextEditor](?!=/api-reference/TextEditor) edits strings or typed values through
text. See the [overview](?!=/components/value-editors) for the shared lifecycle.

## Order reference

Enter a reference, press Enter or leave the field to accept it. Empty text fails
validation; Escape restores the last accepted reference.

<live-demo id="editor-text" height="220px"></live-demo>

## Text and typed values

```ts
const reference = new TextEditor({
    value: "SO-1042", label: "Order reference",
    commitOnBlur: false,
    onCommit: value => { form.reference = value; }
});
if (await reference.commit()) closeDialog();
```

`text` is raw input; `value` is parsed during confirmation. For non-string initial
values, provide `parse` or `resolveText`, and normally a matching `format`:

```ts
const tags = new TextEditor<string[]>({
    value: ["office", "priority"],
    parse: text => text.split(",").map(tag => tag.trim()).filter(Boolean),
    format: value => value.join(", ")
});
```

Enter confirms; Escape cancels. Arrow keys remain native caret operations.
IME Enter does not confirm. Blur confirms unless `commitOnBlur` is false.
`resolveText` takes precedence over `parse`; both may be asynchronous.
External `resolveText()` only converts text and does not save or validate.

## API reference

[TextEditor](?!=/api-reference/TextEditor),
[TextEditorOptions](?!=/api-reference/TextEditorOptions),
[ValueEditor](?!=/api-reference/ValueEditor).
