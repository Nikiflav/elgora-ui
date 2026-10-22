---
id: value-editors
title: Value editors
navTitle: Overview
group: components
parent: editors
path: /components/value-editors
order: 10
description: Explore value editors and their shared validation and asynchronous acceptance lifecycle.
sectionRedirects:
  - shared-contract|/components/value-editors/lifecycle#shared-contract
  - keyboard-and-popup-behavior|/components/value-editors/lifecycle#keyboard-and-popup-behavior
  - resolve-external-text|/components/value-editors/lifecycle#resolve-external-text
  - api-reference|/components/value-editors/lifecycle#api-reference
---

# Value editors

Editors work with values, not rows or data sources. Use them in forms, dialogs
or grids. The external `onCommit` callback decides whether acceptance updates
a local model, applies a business operation or saves remotely.

## Try the editors

This small order form demonstrates all eight editor types without a code editor.
Change a field to see its accepted value below. Quantity must be positive;
callbacks simulate asynchronous acceptance. Enter confirms text, Escape restores
the accepted value, and checkbox/toggle changes confirm immediately.

<live-demo id="value-editors" mode="preview" height="640px" src="value-editors.md.ts"></live-demo>

## Choose an editor

- [Text](?!=/components/value-editors/text): strings and custom text conversion.
- [Number](?!=/components/value-editors/number): nullable numeric input and validation.
- [Checkbox](?!=/components/value-editors/checkbox): native boolean control.
- [Toggle](?!=/components/value-editors/toggle): compact switch control.
- [Lookup](?!=/components/lookup-editor): search and select an item from a virtualized list.
- [Date](?!=/components/date-editor): formatted date-only input and DatePicker picker.
- [Time and DateTime](?!=/components/time-editors): time slots and a combined calendar/time picker.

Each sub-topic contains an editable demo, configuration examples, keyboard
behavior and links to its API reference. [DatePicker](?!=/components/date-picker)
remains a standalone component and can be used without DateEditor.

## Related topics

- [Values, confirmation and callbacks](?!=/components/value-editors/lifecycle)
- [Validation and errors](?!=/components/value-editors/validation)
- [Time and DateTime demos](?!=/components/time-editors)
