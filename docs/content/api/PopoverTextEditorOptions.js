export default {
  "name": "PopoverTextEditorOptions",
  "kind": "interface",
  "type": "PopoverTextEditorOptions<T>",
  "description": "Input, inset trigger and picker lifecycle shared by concrete popover editors.",
  "tags": [],
  "topics": [],
  "group": "types",
  "namespace": "Components.Editors",
  "path": "/api-reference/PopoverTextEditorOptions",
  "source": "src/components/editors/PopoverEditor.ts",
  "members": [
    {
      "name": "triggerIcon",
      "type": "string",
      "description": "Icon class for the inset button that opens or closes the picker.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/PopoverEditor.ts",
      "kind": "property"
    },
    {
      "name": "triggerLabel",
      "type": "string",
      "description": "Accessible name and tooltip for the picker trigger button.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/editors/PopoverEditor.ts",
      "kind": "property"
    },
    {
      "name": "triggerMessage",
      "type": "\"htmlEditorToolbar.label\" | \"htmlEditorToolbar.bold\" | \"htmlEditorToolbar.italic\" | \"htmlEditorToolbar.undo\" | \"htmlEditorToolbar.redo\" | \"htmlEditorInspector.label\" | \"htmlEditorInspector.chooseElement\" | \"htmlEditorInspector.elements\" | \"htmlEditorInspector.properties\" | \"htmlEditorInspector.advanced\" | \"htmlEditorInspector.propertiesHint\" | \"htmlEditorInspector.advancedHint\" | \"htmlEditorInspector.empty\" | \"htmlEditorInspector.ancestors\" | \"htmlEditorInspector.moreAncestors\" | \"htmlEditorInspector.inspectAncestor\" | \"htmlEditorInspector.mixed\" | \"htmlEditorInspector.fullySelected\" | \"htmlEditorInspector.partiallySelected\" | \"htmlEditorInspector.notSelected\" | \"htmlEditorInspector.keyboardFocus\" | \"htmlEditorInspector.selectElement\" | \"htmlEditorInspector.moreActions\" | \"htmlEditorInspector.notSelectedHint\" | \"htmlEditorInspector.partiallySelectedHint\" | \"treeView.loading\" | \"treeView.loadError\" | \"treeView.retry\" | \"datePicker.today\" | \"datePicker.selectToday\" | \"datePicker.chooseMonth\" | \"datePicker.chooseYear\" | \"datePicker.previousPeriod\" | \"datePicker.nextPeriod\" | \"datePicker.chooseDate\" | \"datePicker.invalidDate\" | \"datePicker.outOfRange\" | \"valueEditor.required\" | \"valueEditor.validationError\" | \"numberEditor.invalidNumber\" | \"numberEditor.finiteNumber\" | \"booleanEditor.invalidBoolean\" | \"toggleEditor.label\" | \"dateEditor.open\" | \"dateEditor.popup\" | \"dateEditor.label\" | \"dateEditor.outOfRange\" | \"dateFormatter.invalidDate\" | \"dateFormatter.invalidValue\" | \"timeEditor.open\" | \"timeEditor.label\" | \"timeEditor.popup\" | \"timeFormatter.invalidTime\" | \"timeFormatter.invalidValue\" | \"dateTimeEditor.open\" | \"dateTimeEditor.label\" | \"dateTimeEditor.popup\" | \"dateTimeEditor.invalidInput\" | \"dateTimeEditor.invalidValue\" | \"lookupEditor.open\" | \"lookupEditor.label\" | \"lookupEditor.popup\" | \"lookupEditor.loading\" | \"lookupEditor.noResults\" | \"lookupEditor.matches.one\" | \"lookupEditor.matches.other\" | \"lookupEditor.loadFailed\" | \"lookupEditor.notFound\" | \"lookupEditor.ambiguous\" | \"lookupEditor.missingItem\" | \"dataGrid.newRow\" | \"dataGrid.groupPanelEmpty\" | \"dataGrid.sortAscending\" | \"dataGrid.sortDescending\" | \"dataGrid.clearSorting\" | \"dataGrid.pinColumn\" | \"dataGrid.noPin\" | \"dataGrid.pinLeft\" | \"dataGrid.pinRight\" | \"dataGrid.autosizeColumn\" | \"dataGrid.autosizeAll\" | \"dataGrid.groupBy\" | \"dataGrid.ungroup\" | \"dataGrid.grouping\" | \"dataGrid.interval\" | \"dataGrid.exactValue\" | \"dataGrid.expandToLevel\" | \"dataGrid.collapseLevel\" | \"dataGrid.summary\" | \"dataGrid.summary.none\" | \"dataGrid.summary.count\" | \"dataGrid.summary.sum\" | \"dataGrid.summary.avg\" | \"dataGrid.summary.min\" | \"dataGrid.summary.max\" | \"dataGrid.summary.distinct\" | \"dataGrid.cancelNewRow\" | \"dataGrid.copy\" | \"dataGrid.copyWithHeaders\" | \"dataGrid.paste\" | \"dataGrid.selectRow\" | \"dataGrid.clearSelection\" | \"dataGrid.sortPriority\" | \"dataGrid.sortedAscending\" | \"dataGrid.sortedDescending\" | \"dataGrid.editFilter\" | \"dataGrid.addFilter\" | \"dataGrid.editFilterExpression\" | \"dataGrid.filterColumn\" | \"dataGrid.clearColumnFilter\" | \"dataGrid.acceptFailed\" | \"dataGrid.displayValueFailed\" | \"dataGrid.clipboardUnavailable\" | \"dataGrid.clipboardFailed\" | \"dataGrid.pastePrompt\" | \"dataGrid.pasteText\" | \"dataGrid.cancel\" | \"dataGrid.interval.year\" | \"dataGrid.interval.yearQuarter\" | \"dataGrid.interval.quarter\" | \"dataGrid.interval.yearMonth\" | \"dataGrid.interval.month\" | \"dataGrid.interval.week\" | \"dataGrid.interval.day\" | \"dataGrid.interval.dayOfWeek\" | \"dataGrid.interval.hour\" | \"dataGrid.interval.minute\" | \"dataGrid.interval.second\" | \"dataGrid.interval.firstChar\" | \"filterEditor.apply\" | \"filterEditor.clear\" | \"filterEditor.and\" | \"filterEditor.or\" | \"filterEditor.addCondition\" | \"filterEditor.addGroup\" | \"filterEditor.removeCondition\" | \"filterEditor.removeGroup\" | \"filterEditor.empty\" | \"filterEditor.value\" | \"filterEditor.operator.contains\" | \"filterEditor.operator.notcontains\" | \"filterEditor.operator.startswith\" | \"filterEditor.operator.endswith\" | \"numberFormatter.invalidNumber\" | \"dataGrid.clipboardHint\" | \"dataGrid.clipboardMalformed\" | \"dataGrid.pasteBlocked\" | \"dataGrid.pasteEditInProgress\" | \"dataGrid.pasteReadOnlyRow\" | \"dataGrid.pasteCreateUnavailable\" | \"dataGrid.newRowOperationInProgress\" | \"dataGrid.newRowUnavailable\" | \"dataGrid.newRowCreationInProgress\" | \"dataGrid.pasteRowFailed\" | \"dataGrid.summaryLabel.count\" | \"dataGrid.summaryLabel.sum\" | \"dataGrid.summaryLabel.avg\" | \"dataGrid.summaryLabel.min\" | \"dataGrid.summaryLabel.max\" | \"dataGrid.summaryLabel.distinct\" | undefined",
      "description": "Optional built-in message key; custom triggerLabel is otherwise retained verbatim.",
      "tags": [],
      "topics": [],
      "optional": true,
      "source": "src/components/editors/PopoverEditor.ts",
      "kind": "property"
    }
  ]
};
