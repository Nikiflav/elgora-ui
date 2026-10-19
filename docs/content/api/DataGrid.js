export default {
  "name": "DataGrid",
  "kind": "class",
  "type": "DataGrid<TRow>",
  "description": "Virtualized, selectable, and optionally grouped data grid component.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/DataGrid",
  "source": "src/components/datagrid/DataGrid.ts",
  "members": [
    {
      "name": "cellNavigating",
      "type": "ObservableEvent<DataGridCellNavigatingEvent>",
      "description": "Raised before keyboard navigation changes selection, after a cell edit has\r\nsuccessfully saved. Does not fire for pointer/programmatic selection or\r\nfailed edits. Handlers run synchronously; cancel prevents movement only.",
      "tags": [
        {
          "name": "example",
          "text": "grid.cellNavigating.subscribe(event => { if (event.key === \"Enter\") event.cancel = true; });"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "beginEdit",
      "type": "(rowIndex?: number, columnName?: string, initialText?: string) => Promise<boolean>",
      "description": "Opens the active cell, or an explicit visible row/column. Returns false for\r\nread-only fields, synthetic rows and sources without update.\r\nSupplying initialText replaces the displayed text and lets arrows confirm\r\nand navigate; without it, arrows remain available to the editor.",
      "tags": [
        {
          "name": "example",
          "text": "await grid.beginEdit(0, \"quantity\");"
        },
        {
          "name": "example",
          "text": "await grid.beginEdit(0, \"quantity\", \"7\");"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "columnName",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        },
        {
          "name": "initialText",
          "type": "string | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex?: number, columnName?: string, initialText?: string) => Promise<boolean>"
    },
    {
      "name": "endEdit",
      "type": "() => Promise<boolean>",
      "description": "Confirms the current cell and closes only after parsing, validation and saving succeed.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "cancelEdit",
      "type": "() => boolean",
      "description": "Discards the unaccepted draft. A running source update cannot be cancelled.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "() => boolean"
    },
    {
      "name": "editing",
      "type": "boolean",
      "description": "True while a cell editor is being created or is active.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "newRowError",
      "type": "string | undefined",
      "description": "Last new-row creation/insertion/cancellation error; undefined after a successful retry.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "hasPendingNewRow",
      "type": "boolean",
      "description": "True after input-row editing has created a source-owned pending session.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "endRowEdit",
      "type": "() => Promise<boolean>",
      "description": "Confirms the active cell, then inserts the pending row. Failure retains its values for correction.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "cancelNewRow",
      "type": "() => Promise<boolean>",
      "description": "Discards the whole pending row, not just the current cell draft. Cannot interrupt an in-flight command.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => Promise<boolean>"
    },
    {
      "name": "copySelection",
      "type": "(addHeaders?: boolean) => Promise<boolean>",
      "description": "Copies the currently selected data cells to the system clipboard.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "addHeaders",
          "type": "boolean",
          "optional": true,
          "defaultValue": "false",
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<boolean>",
        "description": ""
      },
      "kind": "method",
      "signature": "(addHeaders?: boolean) => Promise<boolean>"
    },
    {
      "name": "groupBy",
      "type": "(columnName: string, direction?: \"asc\" | \"desc\") => void",
      "description": "Adds a column to grouping and makes it the primary sort criterion.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "ensureCellVisible",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Scrolls only as far as needed to show a cell, leaving visible rows in place.\r\nColumn indices refer to data columns, excluding the optional row header.\r\nUses current row measurements; this method does not load or select a row.",
      "tags": [
        {
          "name": "example",
          "text": "grid.ensureCellVisible(12, 0);"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => void"
    },
    {
      "name": "setOptions",
      "type": "(options: Partial<DataGridOptions<TRow>>) => void",
      "description": "Sets (patches) the grid's options. Only the provided keys are changed; everything else is\r\nleft as-is. This is the single path for both the constructor's initial options and every\r\nlater change - fires an \"optionChanged\" DOM event on this.dom with the applied patch as detail.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "getOptions",
      "type": "() => DataGridOptions<TRow>",
      "description": "Returns a shallow copy of the grid's current, fully-resolved options.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "DataGridOptions<TRow>",
        "description": ""
      },
      "kind": "method",
      "signature": "() => DataGridOptions<TRow>"
    },
    {
      "name": "getColumn",
      "type": "(name: string) => DataGridColumn<TRow> | undefined",
      "description": "Returns the column definition for the given name, or undefined if no such column exists.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "DataGridColumn<TRow> | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string) => DataGridColumn<TRow> | undefined"
    },
    {
      "name": "getSelectionManager",
      "type": "() => SelectionManager",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "SelectionManager",
        "description": ""
      },
      "kind": "method",
      "signature": "() => SelectionManager"
    },
    {
      "name": "getSelectedRanges",
      "type": "() => import(\"D:/Dev/github/elgora-ui/src/index\").SelectionRange[]",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => import(\"D:/Dev/github/elgora-ui/src/index\").SelectionRange[]"
    },
    {
      "name": "getActiveSelectionCell",
      "type": "() => import(\"D:/Dev/github/elgora-ui/src/index\").SelectionCell | null",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => import(\"D:/Dev/github/elgora-ui/src/index\").SelectionCell | null"
    },
    {
      "name": "clearSelection",
      "type": "() => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    },
    {
      "name": "setColumnOptions",
      "type": "(name: string, patch: Partial<DataGridColumn<TRow>>) => void",
      "description": "Patches an existing column's definition in place and updates the grid's layout accordingly.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        },
        {
          "name": "patch",
          "type": "Partial<DataGridColumn<TRow>>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string, patch: Partial<DataGridColumn<TRow>>) => void"
    },
    {
      "name": "autoSizeColumn",
      "type": "(name: string) => void",
      "description": "Clears a column's configured width and puts it back into the auto-width pool. getGridColumns()\r\nalready treats any column with no configured width as auto-width and unmeasured, so the next\r\nlayoutChanged()/render picks it up and re-measures it against the currently visible rows'\r\ncontent (see measureAndAdjustScroll()) - same as a column that was never given a fixed width.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string) => void"
    },
    {
      "name": "tryGetRowIndexByKey",
      "type": "(key: RowIdentity) => Promise<number>",
      "description": "Tries to find the row index that corresponds to the given key, or -1 if not found.\r\nThe method traverses the currently loaded visible rows plus a few rows around the viewport.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "key",
          "type": "RowIdentity",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<number>",
        "description": ""
      },
      "kind": "method",
      "signature": "(key: RowIdentity) => Promise<number>"
    },
    {
      "name": "scrollToRow",
      "type": "(rowIndex: number) => Promise<void>",
      "description": "Scrolls the grid to the row at the given visible index.\r\nResolves after internal layout adjustments (and their rAF frames) have stabilized.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number) => Promise<void>"
    },
    {
      "name": "scrollToColumn",
      "type": "(colIndex: number) => void",
      "description": "Scrolls horizontally only when a data column is outside the usable viewport.\r\nThe index is relative to data columns, matching SelectionManager's cell index.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "colIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(colIndex: number) => void"
    },
    {
      "name": "expandAllGroups",
      "type": "(groupIndex?: number) => Promise<void>",
      "description": "Expands every group, or one zero-based grouping level. Other levels retain\r\ntheir state; expanding a hidden child does not open its parent. Loads nested\r\ngroup metadata through loadData(groupBy), not all data rows. Tree mode is unchanged.\r\nFailed loading leaves the previous expansion state intact.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "groupIndex",
          "type": "number | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(groupIndex?: number) => Promise<void>"
    },
    {
      "name": "collapseAllGroups",
      "type": "(groupIndex?: number) => Promise<void>",
      "description": "Collapses all groups or one grouping level, without loading additional group metadata.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [
        {
          "name": "groupIndex",
          "type": "number | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "Promise<void>",
        "description": ""
      },
      "kind": "method",
      "signature": "(groupIndex?: number) => Promise<void>"
    },
    {
      "name": "getVisibleColumns",
      "type": "() => DataGridColumn<TRow>[]",
      "description": "Returns the currently visible columns",
      "tags": [
        {
          "name": "returns",
          "text": "Array of visible columns"
        }
      ],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "DataGridColumn<TRow>[]",
        "description": "Array of visible columns"
      },
      "kind": "method",
      "signature": "() => DataGridColumn<TRow>[]"
    },
    {
      "name": "layoutChanged",
      "type": "() => Promise<void>",
      "description": "Tells the grid to update internal cache and redraw",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "kind": "property"
    },
    {
      "name": "dispose",
      "type": "() => void",
      "description": "Releases grid-owned interaction controllers and active gestures.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/DataGrid.ts",
      "parameters": [],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "() => void"
    }
  ]
};
