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
      "type": "(name: string) => DataColumn<TRow> | undefined",
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
        "type": "DataColumn<TRow> | undefined",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string) => DataColumn<TRow> | undefined"
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
      "type": "(name: string, patch: Partial<DataColumn<TRow>>) => void",
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
          "type": "Partial<DataColumn<TRow>>",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(name: string, patch: Partial<DataColumn<TRow>>) => void"
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
      "name": "getVisibleColumns",
      "type": "() => DataColumn<TRow>[]",
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
        "type": "DataColumn<TRow>[]",
        "description": "Array of visible columns"
      },
      "kind": "method",
      "signature": "() => DataColumn<TRow>[]"
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
