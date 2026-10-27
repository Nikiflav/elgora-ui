---
id: data-form-editing
title: Editing and actions
group: components
parent: forms
path: /components/data-form/editing
order: 30
description: Data binding, keyboard navigation, validation and action buttons in DataForm.
---

# Editing and actions

DataForm reuses `DataViewField` and the DataGrid editor factory. Click a value
or press Enter/F2 to edit. Typing in a focused value replaces its text.
Enter and Tab accept the edit and enter the next editable field; Shift+Tab
moves backwards. Escape cancels. Open picker popups handle their own keys first.
Navigation follows layout order and skips readonly and button fields.

## Values and validation

A plain object is edited as a shallow draft available through `form.value`.
A DataRow writes accepted values through `setValue`, preserving business rules
and change tracking. Validation runs at commit. Rejected input keeps the editor
and error visible. Use an explicit adapter for domain-specific storage, and
`onCommit` for notification after acceptance.

## Action fields

Declare `type: "buttons"` and a `buttons` collection. Buttons support icons,
text, tooltips, custom UI styles, visibility, disabled and pressed states,
and an optional content renderer. The host supplies `row`, `field` and `owner`
to callbacks. Buttons remain individual keyboard targets.

```ts
{ name: "actions", type: "buttons", hideLabel: true, buttons: [
    { id: "accept", text: "Accept", icon: "ri-check-line", onClick: ({ owner }) => {
        save((owner as DataForm<Order>).value);
    } }
] }
```

See the [Overview demo](?!=/components/data-form) for plain-object and DataRow
adapters, lookup and date editors, validation and actions.
