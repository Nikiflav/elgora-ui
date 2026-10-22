---
id: filter-editor
title: FilterEditor
group: components
path: /components/filter-editor
order: 21
description: Build visual AND/OR filters independently of DataGrid and distinguish editor drafts from applied queries.
api:
  - FilterEditor
  - FilterEditorOptions
  - DataFilter
---

# FilterEditor

FilterEditor edits a structured filter. It is not a ValueEditor and does not save row values. Supply field metadata, then apply its filter to your chosen source.

## Product filter playground

Click a preset, then edit its conditions using **FilterEditor** and click
**Apply Filter**. The table and readable summary show the applied filter, not
unapplied editor changes. **Clear** removes the filter.
**Apply Filter** is gray when the filter has not changed and primary-colored while
there are unapplied edits. It remains clickable in either state, allowing the
current filter to be applied again. Returning to the applied values makes it gray.

Try the numeric expression input with `20..100`, `100..` or `..50`.
It replaces the complete filter with a price condition. Expand **Filter JSON and
filter-row expressions** to see the structure and the reverse conversion.
The displayed evalFilter count is calculated separately from the ArrayDataSource
query over the same records.

<live-demo id="data-filter-playground" height="680px" src="../data/filter.md.ts"></live-demo>

FilterEditor currently edits binary conditions and explicit AND/OR groups,
including nested groups. It does not provide a NOT node. The NOT preset is
evaluated and displayed without loading it into the visual editor.
Do not assume that every DataFilter structure can be round-tripped through
FilterEditor.

API: [FilterEditor](?!=/api-reference/FilterEditor),
[setFilter](?!=/api-reference/FilterEditor#setFilter),
[FilterEditorOptions.onApply](?!=/api-reference/FilterEditorOptions#onApply),
[DataFilter](?!=/api-reference/DataFilter).
