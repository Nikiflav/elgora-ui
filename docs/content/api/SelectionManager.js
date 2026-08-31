export default {
  "name": "SelectionManager",
  "kind": "class",
  "type": "SelectionManager",
  "description": "Manages keyboard, pointer, and range-based grid selection state.",
  "tags": [],
  "topics": [],
  "group": "components",
  "namespace": "Components.DataGrid",
  "path": "/api-reference/SelectionManager",
  "source": "src/components/datagrid/SelectionManager.ts",
  "members": [
    {
      "name": "selectSingleCell",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Sets a single range, clearing all existing ranges.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
      "name": "selectSingleRow",
      "type": "(rowIndex: number) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
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
      "signature": "(rowIndex: number) => void"
    },
    {
      "name": "addRowRange",
      "type": "(rowIndex: number) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
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
      "signature": "(rowIndex: number) => void"
    },
    {
      "name": "extendRowSelection",
      "type": "(rowIndex: number) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
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
      "signature": "(rowIndex: number) => void"
    },
    {
      "name": "addRange",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Appends a new disjoint range (Ctrl / Cmd + Click).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
      "name": "extendSelection",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Extends the focus edge of the current (last added) range (Shift + Click / Drag).",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
      "name": "setActiveCell",
      "type": "(rowIndex: number, colIndex: number) => void",
      "description": "Moves ONLY the activeCell inside existing selection ranges (e.g., Tab / Enter navigation).\r\nDoes not alter anchor or focus boundaries of any range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
      "name": "handleCellClick",
      "type": "(rowIndex: number, colIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void",
      "description": "Handles MouseDown or Click events on a cell.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
        },
        {
          "name": "event",
          "type": "{ shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void"
    },
    {
      "name": "handleRowHeaderClick",
      "type": "(rowIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        },
        {
          "name": "event",
          "type": "{ shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, event: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; }) => void"
    },
    {
      "name": "handleCellMouseEnter",
      "type": "(rowIndex: number, colIndex: number, isMouseDown: boolean) => void",
      "description": "Handles MouseMove events when dragging to extend the selection range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
        },
        {
          "name": "isMouseDown",
          "type": "boolean",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "void",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number, isMouseDown: boolean) => void"
    },
    {
      "name": "handleKeyDown",
      "type": "(event: KeyboardEvent, ctx: GridContext) => boolean",
      "description": "Handles Keyboard Navigation (Arrow Keys, Shift+Arrows, Tab, Enter).\r\nReturns true if the key event was handled by selection.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "event",
          "type": "KeyboardEvent",
          "optional": false,
          "description": ""
        },
        {
          "name": "ctx",
          "type": "GridContext",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(event: KeyboardEvent, ctx: GridContext) => boolean"
    },
    {
      "name": "isActive",
      "type": "(rowIndex: number, colIndex: number) => boolean",
      "description": "Checks if a cell is the single active focus cell receiving keyboard input & editing.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => boolean"
    },
    {
      "name": "isSelected",
      "type": "(rowIndex: number, colIndex: number) => boolean",
      "description": "2D hit test checking if a cell at (rowIndex, colIndex) falls inside ANY active range.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number) => boolean"
    },
    {
      "name": "getSelectionState",
      "type": "(rowIndex: number, colIndex: number, ctx?: GridContext) => CellSelectionState",
      "description": "2D hit test that also reports which selection-box sides the cell sits on.\r\nA selected cell is marked with every edge it touches (top/right/bottom/left),\r\nso thin selections (single row/column/single cell) still get a full border.\r\n`ctx` is required to resolve the full column span of whole-row ranges.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
        },
        {
          "name": "ctx",
          "type": "GridContext | undefined",
          "optional": true,
          "description": ""
        }
      ],
      "returns": {
        "type": "CellSelectionState",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number, colIndex: number, ctx?: GridContext) => CellSelectionState"
    },
    {
      "name": "getActiveCell",
      "type": "() => SelectionCell | null",
      "description": "Returns the single active cell receiving keyboard focus and editing.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [],
      "returns": {
        "type": "SelectionCell | null",
        "description": ""
      },
      "kind": "method",
      "signature": "() => SelectionCell | null"
    },
    {
      "name": "getRanges",
      "type": "() => SelectionRange[]",
      "description": "Returns all currently active selection ranges.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [],
      "returns": {
        "type": "SelectionRange[]",
        "description": ""
      },
      "kind": "method",
      "signature": "() => SelectionRange[]"
    },
    {
      "name": "isWholeRowSelected",
      "type": "(rowIndex: number) => boolean",
      "description": "",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
      "parameters": [
        {
          "name": "rowIndex",
          "type": "number",
          "optional": false,
          "description": ""
        }
      ],
      "returns": {
        "type": "boolean",
        "description": ""
      },
      "kind": "method",
      "signature": "(rowIndex: number) => boolean"
    },
    {
      "name": "clear",
      "type": "() => void",
      "description": "Clears all current ranges and active cell states.",
      "tags": [],
      "topics": [],
      "optional": false,
      "source": "src/components/datagrid/SelectionManager.ts",
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
