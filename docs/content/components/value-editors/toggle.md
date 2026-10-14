---
id: editor-toggle
title: Toggle
group: components
parent: editors
path: /components/value-editors/toggle
order: 49
description: Compact switch editing for boolean values.
---

# Toggle editor

[ToggleEditor](?!=/api-reference/ToggleEditor) is a compact switch with a sliding
thumb and theme colors. It shares the [editor lifecycle](?!=/components/value-editors)
and boolean conversion of [CheckboxEditor](?!=/components/value-editors/checkbox).

## Priority order

Click the switch or use Space/Enter. Its state is accepted asynchronously.

<live-demo id="editor-toggle" height="180px"></live-demo>

## Configure a switch

```ts
const priority = new ToggleEditor({
    value: false, label: "Priority order",
    onCommit: async value => { await updatePriority(value); }
});
```

The track uses `role="switch"` and `aria-checked`. Place a visible label beside
it; `label` supplies the accessible name. Native Space/Enter activation toggles
and confirms the value. Animation respects reduced-motion preferences.

Validation, busy state, errors, `cancel()` and `setValue()` work as for other
editors. `resolveText()` accepts true/false, yes/no and 1/0, or a custom converter,
without changing the switch or calling the external callback.

## API reference

[ToggleEditor](?!=/api-reference/ToggleEditor),
[ValueEditorOptions](?!=/api-reference/ValueEditorOptions),
[ValueEditor](?!=/api-reference/ValueEditor).
